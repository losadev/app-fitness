import * as base64 from "base64-js";
import { BleManager, Device } from "react-native-ble-plx";
import { ExerciseConfig } from "../constants/exercises";
import { RepetitionDetector } from "../utils/RepetitionDetector";
import { requestPermissions } from "./useBLE";

// UUIDs específicos de Movesense
const MOVESENSE_SERVICE_UUID = "34802252-7185-4d5d-b431-630e7050e8f0";
const MOVESENSE_COMMAND_CHAR = "34800001-7185-4d5d-b431-630e7050e8f0";
const MOVESENSE_DATA_CHAR = "34800002-7185-4d5d-b431-630e7050e8f0";

interface IMUData {
  accelerometer: { x: number; y: number; z: number };
  gyroscope: { x: number; y: number; z: number };
  magnetometer: { x: number; y: number; z: number };
}

interface MovesenseData {
  imu: IMUData | null;
  repetitionCount: number;
  timestamp: number;
}

type StateChangeListener = () => void;

/**
 * Singleton para gestionar la conexión con Movesense
 * Asegura que solo exista una instancia del BleManager y la conexión
 */
class MovesenseManager {
  private static instance: MovesenseManager;
  private manager: BleManager;
  private connectedDevice: Device | null = null;
  private isScanning: boolean = false;
  private isConnected: boolean = false;
  private devices: Device[] = [];
  private data: MovesenseData | null = null;
  private error: string | null = null;
  private repetitionCount: number = 0;
  private imuSubscription: any = null;
  private detector: RepetitionDetector | null = null;
  private listeners: Set<StateChangeListener> = new Set();
  private scanTimeout: ReturnType<typeof setTimeout> | null = null;

  private constructor() {
    this.manager = new BleManager();
    this.initBluetooth();
  }

  public static getInstance(): MovesenseManager {
    if (!MovesenseManager.instance) {
      MovesenseManager.instance = new MovesenseManager();
    }
    return MovesenseManager.instance;
  }

  private initBluetooth() {
    this.manager.onStateChange((state) => {
      if (state === "PoweredOn") {
        console.log("Bluetooth está encendido");
      }
    }, true);
  }

  public subscribe(listener: StateChangeListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }

  public getState() {
    return {
      isScanning: this.isScanning,
      isConnected: this.isConnected,
      devices: this.devices,
      data: this.data,
      error: this.error,
      connectedDevice: this.connectedDevice,
    };
  }

  public async startScan() {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        this.error = "Permisos Bluetooth no concedidos";
        this.notifyListeners();
        return;
      }

      this.isScanning = true;
      this.devices = [];
      this.error = null;
      this.notifyListeners();

      console.log("🔍 Iniciando búsqueda de TODOS los dispositivos BLE...");

      this.manager.startDeviceScan(
        null,
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.error("❌ Error en el escaneo:", error);
            this.error = error.message;
            this.isScanning = false;
            this.notifyListeners();
            return;
          }

          if (device && device.name) {
            console.log(
              "📱 Dispositivo encontrado:",
              device.name,
              "RSSI:",
              device.rssi
            );
            const existingDevice = this.devices.find((d) => d.id === device.id);
            if (!existingDevice) {
              this.devices = [...this.devices, device];
              this.notifyListeners();
            }
          }
        }
      );

      // Detener escaneo después de 15 segundos
      if (this.scanTimeout) clearTimeout(this.scanTimeout);
      this.scanTimeout = setTimeout(() => {
        this.stopScan();
      }, 15000);
    } catch (err) {
      console.error("❌ Error iniciando escaneo:", err);
      this.error = "Error iniciando búsqueda";
      this.isScanning = false;
      this.notifyListeners();
    }
  }

  public stopScan() {
    this.manager.stopDeviceScan();
    this.isScanning = false;
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
    console.log("Escaneo detenido");
    this.notifyListeners();
  }

  public async connectToDevice(device: Device) {
    try {
      this.error = null;
      console.log("🔗 Conectando a:", device.name, "ID:", device.id);

      this.manager.stopDeviceScan();
      this.isScanning = false;

      const connectedDevice = await this.manager.connectToDevice(device.id, {
        timeout: 10000,
      });
      console.log("✅ Dispositivo conectado:", connectedDevice.name);

      await connectedDevice.discoverAllServicesAndCharacteristics();
      console.log("✅ Servicios y características descubiertas");

      console.log("\n📡 ========== SERVICIOS DISPONIBLES ==========");
      const services = await connectedDevice.services();

      for (const service of services) {
        console.log(`\n🔷 Servicio: ${service.uuid}`);

        const characteristics = await service.characteristics();
        for (const char of characteristics) {
          console.log(`  └─ 📋 Característica: ${char.uuid}`);
          console.log(`     ├─ Readable: ${char.isReadable}`);
          console.log(
            `     ├─ Writable: ${char.isWritableWithResponse || char.isWritableWithoutResponse}`
          );
          console.log(`     └─ Notifiable: ${char.isNotifiable}`);

          // Identificar características clave
          if (char.uuid.toLowerCase().includes("34800001")) {
            console.log(
              `     🎯 ← ESTA ES LA CARACTERÍSTICA DE COMANDO (WRITE)`
            );
          }
          if (char.uuid.toLowerCase().includes("34800002")) {
            console.log(
              `     🎯 ← ESTA ES LA CARACTERÍSTICA DE DATOS (NOTIFY)`
            );
          }

          if (char.isReadable) {
            try {
              const value = await char.read();
              if (value.value) {
                console.log(`     📊 Valor actual: ${value.value}`);
              }
            } catch (e) {
              console.log(`     ⚠️ No se pudo leer`);
            }
          }
        }
      }
      console.log("\n📡 ==========================================");

      // Resumen de UUIDs configurados
      console.log("\n⚙️ UUIDs CONFIGURADOS EN LA APP:");
      console.log(`   Service: ${MOVESENSE_SERVICE_UUID}`);
      console.log(`   Command: ${MOVESENSE_COMMAND_CHAR}`);
      console.log(`   Data:    ${MOVESENSE_DATA_CHAR}\n`);

      this.connectedDevice = connectedDevice;
      this.isConnected = true;
      this.error = null; // Limpiar cualquier error previo
      console.log("✅ Estado actualizado: isConnected = true");

      this.notifyListeners();
      console.log(`🔔 Notificando a ${this.listeners.size} listeners`);
    } catch (err: any) {
      console.error("❌ Error conectando:", err);
      this.error = `Error conectando: ${err.message || "Desconocido"}`;
      this.isConnected = false;
      this.notifyListeners();
    }
  }

  public async disconnect() {
    try {
      if (this.connectedDevice) {
        await this.manager.cancelDeviceConnection(this.connectedDevice.id);
        console.log("Dispositivo desconectado");
      }
      this.connectedDevice = null;
      this.isConnected = false;
      this.data = null;
      this.repetitionCount = 0;
      this.notifyListeners();
    } catch (err) {
      console.error("Error desconectando:", err);
      this.error = "Error desconectando";
      this.notifyListeners();
    }
  }

  private async sendMovesenseCommand(command: object) {
    if (!this.connectedDevice) {
      throw new Error("No hay dispositivo conectado");
    }

    try {
      const jsonCommand = JSON.stringify(command);
      console.log("📤 Enviando comando:", jsonCommand);

      const bytes = new TextEncoder().encode(jsonCommand);
      const base64Command = base64.fromByteArray(bytes);

      await this.connectedDevice.writeCharacteristicWithResponseForService(
        MOVESENSE_SERVICE_UUID,
        MOVESENSE_COMMAND_CHAR,
        base64Command
      );

      console.log("✅ Comando enviado exitosamente");
    } catch (error) {
      console.error("❌ Error enviando comando:", error);
      throw error;
    }
  }

  public async startDataCollection(exercise: ExerciseConfig) {
    console.log("🎯 startDataCollection llamado");
    console.log(`🔍 Estado actual - isConnected: ${this.isConnected}`);
    console.log(
      `🔍 connectedDevice:`,
      this.connectedDevice ? this.connectedDevice.name : "null"
    );

    if (!this.connectedDevice) {
      const errorMsg = "No hay dispositivo conectado";
      console.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    try {
      console.log(`🎯 Iniciando recolección de datos para: ${exercise.name}`);

      this.detector = new RepetitionDetector(exercise);
      this.repetitionCount = 0;

      // PRIMERO: Enviar comando de suscripción al acelerómetro
      console.log("\n🔷🔷🔷 PASO 1: ENVIAR COMANDO 🔷🔷🔷");
      console.log("📤 Enviando comando de suscripción al acelerómetro...");
      const accCommand = {
        Op: 2,
        Path: "Meas/Acc/52",
      };
      console.log("📋 Comando creado:", JSON.stringify(accCommand));

      await this.sendMovesenseCommand(accCommand);
      console.log("✅ sendMovesenseCommand completado");
      console.log("✅ Comando de suscripción enviado al dispositivo");

      // Esperar un poco para que el dispositivo procese el comando
      console.log("\n🔷🔷🔷 PASO 2: ESPERANDO 1000ms 🔷🔷🔷");
      console.log("⏰ Esperando 1 segundo para que el dispositivo procese...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("✅ Espera completada");

      // SEGUNDO: Iniciar el monitoreo DESPUÉS de enviar el comando
      console.log("\n🔷🔷🔷 PASO 3: INICIAR MONITOREO 🔷🔷🔷");
      console.log("📡 Iniciando monitoreo de característica de datos...");
      console.log(`   Service UUID: ${MOVESENSE_SERVICE_UUID}`);
      console.log(`   Char UUID: ${MOVESENSE_DATA_CHAR}`);

      this.imuSubscription =
        this.connectedDevice.monitorCharacteristicForService(
          MOVESENSE_SERVICE_UUID,
          MOVESENSE_DATA_CHAR,
          (error, characteristic) => {
            console.log("📨 Callback de monitoreo llamado");
            if (error) {
              console.error("❌ Error monitoreando datos:");
              console.error("   Código:", error.errorCode);
              console.error("   Mensaje:", error.message);
              console.error("   Razón:", error.reason);
              return;
            }

            console.log("✅ Sin errores en callback");

            if (characteristic?.value) {
              console.log(
                "📦 Datos recibidos (base64):",
                characteristic.value.substring(0, 50)
              );
              try {
                const bytes = base64.toByteArray(characteristic.value);
                console.log(`📊 Bytes decodificados: ${bytes.length} bytes`);
                const dataView = new DataView(bytes.buffer);

                // Formato: [messageID][timestamp][x][y][z] = 1 + 4 + 12 = 17 bytes mínimo
                if (bytes.length >= 17) {
                  const messageId = bytes[0];
                  const timestamp = dataView.getUint32(1, true); // Offset +1 por messageID
                  const x = dataView.getFloat32(5, true); // Offset +1
                  const y = dataView.getFloat32(9, true); // Offset +1
                  const z = dataView.getFloat32(13, true); // Offset +1

                  // Calcular magnitud del vector
                  const magnitude = Math.sqrt(x * x + y * y + z * z);

                  // Log cada muestra para debugging con colores
                  console.log(`\n🔵 ========== DATOS IMU ==========`);
                  console.log(
                    `📦 Message ID: ${messageId} | Timestamp: ${timestamp}`
                  );
                  console.log(`📊 Acelerómetro (m/s²):`);
                  console.log(`   X: ${x.toFixed(3)}`);
                  console.log(`   Y: ${y.toFixed(3)}`);
                  console.log(`   Z: ${z.toFixed(3)}`);
                  console.log(`📏 Magnitud: ${magnitude.toFixed(3)} m/s²`);
                  console.log(`🔵 ================================\n`);

                  // Crear muestra IMU completa
                  const imuSample = {
                    timestamp: Date.now(),
                    accelerometer: { x, y, z },
                    gyroscope: { x: 0, y: 0, z: 0 }, // TODO: parsear gyro correctamente
                  };

                  // Procesar con detector de repeticiones
                  if (this.detector) {
                    const result = this.detector.processSample(imuSample);
                    if (result.count !== this.repetitionCount) {
                      this.repetitionCount = result.count;
                      console.log(
                        `🎯 ¡REPETICIÓN ${this.repetitionCount} DETECTADA!`
                      );
                    }
                  }

                  this.data = {
                    imu: {
                      accelerometer: { x, y, z },
                      gyroscope: { x: 0, y: 0, z: 0 },
                      magnetometer: { x: 0, y: 0, z: 0 },
                    },
                    repetitionCount: this.repetitionCount,
                    timestamp,
                  };

                  this.notifyListeners();
                } else {
                  const hexString = Array.from(bytes)
                    .map((b) => b.toString(16).padStart(2, "0"))
                    .join(" ");
                  console.log(
                    `📦 Paquete corto (${bytes.length} bytes): ${hexString}`
                  );
                }
              } catch (error) {
                console.error("❌ Error procesando datos IMU:", error);
                console.error(
                  "Stack:",
                  error instanceof Error ? error.stack : error
                );
              }
            } else {
              console.warn("⚠️ Characteristic recibida sin valor");
            }
          }
        );

      console.log("✅ Objeto de monitoreo creado");

      this.error = null;
      this.notifyListeners();

      console.log("\n🔷🔷🔷 PASO 4: COMPLETADO 🔷🔷🔷");
      console.log("✅ startDataCollection completado");
      console.log(
        "⏳ AHORA MUEVE EL DISPOSITIVO Y ESPERA A VER '📨 Callback de monitoreo llamado'"
      );
      console.log("🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷\n");
    } catch (error) {
      console.error("❌ Error iniciando recolección de datos:", error);
      throw error;
    }
  }

  public async stopDataCollection() {
    console.log("🛑 stopDataCollection llamado");
    console.trace("📍 Stack trace:");

    if (!this.connectedDevice) {
      console.log("⚠️ No hay dispositivo conectado");
      return;
    }

    try {
      console.log("🛑 Deteniendo recolección de datos...");

      // 1. Primero remover la suscripción local con timeout
      if (this.imuSubscription) {
        try {
          await Promise.race([
            new Promise<void>((resolve) => {
              try {
                this.imuSubscription?.remove();
                resolve();
              } catch (e) {
                console.warn("⚠️ Error removiendo suscripción (ignorado):", e);
                resolve();
              }
            }),
            new Promise<void>((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), 2000)
            ),
          ]);
          console.log("✅ Suscripción removida");
        } catch (timeoutError) {
          console.warn("⚠️ Timeout removiendo suscripción (continuando...)");
        } finally {
          this.imuSubscription = null;
        }
      }

      // 2. Luego enviar comando de desuscripción
      try {
        const accUnsubscribe = {
          Op: 3,
          Path: "Meas/Acc/52",
        };
        await this.sendMovesenseCommand(accUnsubscribe);
        console.log("✅ Desuscrito del acelerómetro");
      } catch (cmdError) {
        console.warn(
          "⚠️ Error enviando comando unsubscribe (ignorado):",
          cmdError
        );
      }

      console.log("✅ Recolección de datos detenida");
      this.notifyListeners();
    } catch (error) {
      console.error("❌ Error deteniendo recolección:", error);
    }
  }

  public async monitorAllCharacteristics() {
    if (!this.connectedDevice) {
      throw new Error("No hay dispositivo conectado");
    }

    try {
      console.log("🔍 Monitoreando TODAS las características...");
      const services = await this.connectedDevice.services();

      for (const service of services) {
        const characteristics = await service.characteristics();

        for (const char of characteristics) {
          if (char.isNotifiable) {
            console.log(`👀 Monitoreando: ${char.uuid}`);

            this.connectedDevice.monitorCharacteristicForService(
              service.uuid,
              char.uuid,
              (error, characteristic) => {
                if (error) {
                  console.error(`❌ Error monitoreando ${char.uuid}:`, error);
                  return;
                }

                if (characteristic?.value) {
                  console.log(
                    `📨 [${char.uuid}] Datos recibidos:`,
                    characteristic.value.substring(0, 50)
                  );
                }
              }
            );
          }
        }
      }
    } catch (error) {
      console.error("❌ Error monitoreando características:", error);
      throw error;
    }
  }

  public resetRepetitions() {
    this.repetitionCount = 0;
    if (this.data) {
      this.data = {
        ...this.data,
        repetitionCount: 0,
      };
    }
    this.notifyListeners();
    console.log("🔄 Contador de repeticiones reiniciado");
  }
}

export default MovesenseManager;
