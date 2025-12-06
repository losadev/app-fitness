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
  private scanTimeout: NodeJS.Timeout | null = null;

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
      }, 15000) as NodeJS.Timeout;
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
      console.log("\n📡 ==========================================\n");

      this.connectedDevice = connectedDevice;
      this.isConnected = true;
      this.notifyListeners();
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
    if (!this.connectedDevice) {
      throw new Error("No hay dispositivo conectado");
    }

    try {
      console.log(`🎯 Iniciando recolección de datos para: ${exercise.name}`);

      this.detector = new RepetitionDetector(exercise);
      this.repetitionCount = 0;

      const accCommand = {
        Op: 2,
        Path: "Meas/Acc/52",
      };

      const gyroCommand = {
        Op: 2,
        Path: "Meas/Gyro/52",
      };

      await this.sendMovesenseCommand(accCommand);
      console.log("✅ Suscrito a acelerómetro (52Hz)");

      await this.sendMovesenseCommand(gyroCommand);
      console.log("✅ Suscrito a giroscopio (52Hz)");

      this.imuSubscription =
        this.connectedDevice.monitorCharacteristicForService(
          MOVESENSE_SERVICE_UUID,
          MOVESENSE_DATA_CHAR,
          (error, characteristic) => {
            if (error) {
              console.error("❌ Error monitoreando datos:", error);
              return;
            }

            if (characteristic?.value) {
              try {
                const bytes = base64.toByteArray(characteristic.value);
                const dataView = new DataView(bytes.buffer);

                if (bytes.length >= 16) {
                  const timestamp = dataView.getUint32(0, true);
                  const x = dataView.getFloat32(4, true);
                  const y = dataView.getFloat32(8, true);
                  const z = dataView.getFloat32(12, true);

                  console.log(
                    `📊 IMU - X: ${x.toFixed(2)}, Y: ${y.toFixed(2)}, Z: ${z.toFixed(2)}`
                  );

                  this.data = {
                    imu: {
                      accelerometer: { x, y, z },
                      gyroscope: { x: 0, y: 0, z: 0 },
                      magnetometer: { x: 0, y: 0, z: 0 },
                    },
                    repetitionCount: this.repetitionCount,
                    timestamp,
                  };

                  if (this.detector) {
                    const repDetected = this.detector.processSample({
                      x,
                      y,
                      z,
                    });
                    if (repDetected) {
                      this.repetitionCount++;
                      console.log(
                        `🎯 ¡Repetición detectada! Total: ${this.repetitionCount}`
                      );
                    }
                  }

                  this.notifyListeners();
                }
              } catch (error) {
                console.error("❌ Error procesando datos IMU:", error);
              }
            }
          }
        );

      console.log("✅ Monitoreo de datos IMU iniciado");
      this.notifyListeners();
    } catch (error) {
      console.error("❌ Error iniciando recolección de datos:", error);
      throw error;
    }
  }

  public async stopDataCollection() {
    if (!this.connectedDevice) return;

    try {
      console.log("🛑 Deteniendo recolección de datos...");

      if (this.imuSubscription) {
        this.imuSubscription.remove();
        this.imuSubscription = null;
      }

      const accUnsubscribe = {
        Op: 3,
        Path: "Meas/Acc/52",
      };

      const gyroUnsubscribe = {
        Op: 3,
        Path: "Meas/Gyro/52",
      };

      await this.sendMovesenseCommand(accUnsubscribe);
      await this.sendMovesenseCommand(gyroUnsubscribe);

      console.log("✅ Recolección de datos detenida");
      this.notifyListeners();
    } catch (error) {
      console.error("❌ Error deteniendo recolección de datos:", error);
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
