import * as base64 from "base64-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { BleManager, Device } from "react-native-ble-plx";
import { ExerciseConfig } from "../constants/exercises";
import { RepetitionDetector } from "../utils/RepetitionDetector";
import { requestPermissions } from "./useBLE";

// UUIDs específicos de Movesense
const MOVESENSE_SERVICE_UUID = "34802252-7185-4d5d-b431-630e7050e8f0";
const MOVESENSE_COMMAND_CHAR = "34800001-7185-4d5d-b431-630e7050e8f0"; // Para escribir comandos
const MOVESENSE_DATA_CHAR = "34800002-7185-4d5d-b431-630e7050e8f0"; // Para recibir datos

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

interface UseMovesenseReturn {
  isScanning: boolean;
  isConnected: boolean;
  devices: Device[];
  data: MovesenseData | null;
  error: string | null;
  startScan: () => void;
  stopScan: () => void;
  connectToDevice: (device: Device) => Promise<void>;
  disconnect: () => Promise<void>;
  startDataCollection: (exercise: ExerciseConfig) => Promise<void>;
  stopDataCollection: () => Promise<void>;
  monitorAllCharacteristics: () => Promise<void>;
  resetRepetitions: () => void;
}

export const useMovesense = (): UseMovesenseReturn => {
  const [manager] = useState(() => new BleManager());
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [data, setData] = useState<MovesenseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [repetitionCount, setRepetitionCount] = useState(0);
  const [imuSubscription, setImuSubscription] = useState<any>(null);
  const detectorRef = useRef<RepetitionDetector | null>(null);

  useEffect(() => {
    const subscription = manager.onStateChange((state) => {
      if (state === "PoweredOn") {
        console.log("Bluetooth está encendido");
      }
    }, true);

    return () => {
      subscription.remove();
      manager.destroy();
    };
  }, [manager]);

  const startScan = useCallback(async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        setError("Permisos Bluetooth no concedidos");
        return;
      }

      setIsScanning(true);
      setDevices([]);
      setError(null);

      console.log("🔍 Iniciando búsqueda de TODOS los dispositivos BLE...");

      manager.startDeviceScan(
        null, // Sin filtro - escanea TODOS los dispositivos
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.error("❌ Error en el escaneo:", error);
            setError(error.message);
            setIsScanning(false);
            return;
          }

          if (device && device.name) {
            console.log(
              "📱 Dispositivo encontrado:",
              device.name,
              "RSSI:",
              device.rssi
            );
            setDevices((prevDevices) => {
              const existingDevice = prevDevices.find(
                (d) => d.id === device.id
              );
              if (!existingDevice) {
                return [...prevDevices, device];
              }
              return prevDevices;
            });
          }
        }
      );

      // Detener escaneo después de 15 segundos
      setTimeout(() => {
        stopScan();
      }, 15000);
    } catch (err) {
      console.error("❌ Error iniciando escaneo:", err);
      setError("Error iniciando búsqueda");
      setIsScanning(false);
    }
  }, [manager]);

  const stopScan = useCallback(() => {
    manager.stopDeviceScan();
    setIsScanning(false);
    console.log("Escaneo detenido");
  }, [manager]);

  const connectToDevice = useCallback(
    async (device: Device) => {
      try {
        setError(null);
        console.log("🔗 Conectando a:", device.name, "ID:", device.id);

        // Detener escaneo primero
        manager.stopDeviceScan();
        setIsScanning(false);

        const connectedDevice = await manager.connectToDevice(device.id, {
          timeout: 10000,
        });
        console.log("✅ Dispositivo conectado:", connectedDevice.name);

        await connectedDevice.discoverAllServicesAndCharacteristics();
        console.log("✅ Servicios y características descubiertas");

        // ====== DESCUBRIR TODOS LOS SERVICIOS Y CARACTERÍSTICAS ======
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

            // Intentar leer características legibles
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

        setConnectedDevice(connectedDevice);
        setIsConnected(true);
      } catch (err: any) {
        console.error("❌ Error conectando:", err);
        setError(`Error conectando: ${err.message || "Desconocido"}`);
        setIsConnected(false);
      }
    },
    [manager]
  );

  const disconnect = useCallback(async () => {
    try {
      if (connectedDevice) {
        await manager.cancelDeviceConnection(connectedDevice.id);
        console.log("Dispositivo desconectado");
      }
      setConnectedDevice(null);
      setIsConnected(false);
      setData(null);
      setRepetitionCount(0);
    } catch (err) {
      console.error("Error desconectando:", err);
      setError("Error desconectando");
    }
  }, [manager, connectedDevice]);

  // Función para enviar comandos al Movesense
  const sendMovesenseCommand = useCallback(
    async (command: object) => {
      if (!connectedDevice) {
        console.error("❌ No hay dispositivo conectado");
        return false;
      }

      try {
        const commandStr = JSON.stringify(command);
        const commandBytes = new TextEncoder().encode(commandStr);
        const commandBase64 = base64.fromByteArray(commandBytes);

        console.log(`📤 Enviando comando: ${commandStr}`);

        await connectedDevice.writeCharacteristicWithResponseForService(
          MOVESENSE_SERVICE_UUID,
          MOVESENSE_COMMAND_CHAR,
          commandBase64
        );

        console.log("✅ Comando enviado exitosamente");
        return true;
      } catch (err) {
        console.error("❌ Error enviando comando:", err);
        return false;
      }
    },
    [connectedDevice]
  );

  const startDataCollection = useCallback(
    async (exercise: ExerciseConfig) => {
      if (!connectedDevice) {
        setError("No hay dispositivo conectado");
        return;
      }

      try {
        console.log(`📊 Iniciando recolección para: ${exercise.nameEs}`);

        // Inicializar detector de repeticiones
        detectorRef.current = new RepetitionDetector(exercise);

        // Suscribirse al canal de notificaciones
        const subscription = connectedDevice.monitorCharacteristicForService(
          MOVESENSE_SERVICE_UUID,
          MOVESENSE_DATA_CHAR,
          (error, characteristic) => {
            if (error) {
              console.error("❌ Error monitoreando IMU:", error);
              return;
            }

            if (characteristic?.value) {
              try {
                const bytes = base64.toByteArray(characteristic.value);

                // Intentar parsear como JSON (respuesta a comandos)
                try {
                  const text = new TextDecoder("utf-8").decode(
                    new Uint8Array(bytes)
                  );
                  const json = JSON.parse(text);
                  console.log("📋 Respuesta comando:", json);
                  return; // No procesar como datos de sensor
                } catch {
                  // Es dato binario de sensor, continuar procesando
                }

                // Parsear datos IMU (formato Movesense: timestamp + 3 floats)
                if (bytes.length >= 16) {
                  const view = new DataView(bytes.buffer);
                  const timestamp = view.getUint32(0, true);
                  const x = view.getFloat32(4, true);
                  const y = view.getFloat32(8, true);
                  const z = view.getFloat32(12, true);

                  // Determinar si es acelerómetro o giroscopio
                  // (necesitaremos distinguirlos por contexto o header)
                  const imuSample = {
                    timestamp: Date.now(),
                    accelerometer: { x, y, z },
                    gyroscope: { x: 0, y: 0, z: 0 }, // TODO: parsear correctamente
                  };

                  // Procesar con detector de repeticiones
                  if (detectorRef.current) {
                    const result = detectorRef.current.processSample(imuSample);
                    setRepetitionCount(result.count);

                    setData({
                      imu: {
                        accelerometer: { x, y, z },
                        gyroscope: { x: 0, y: 0, z: 0 },
                        magnetometer: { x: 0, y: 0, z: 0 },
                      },
                      repetitionCount: result.count,
                      timestamp: Date.now(),
                    });
                  }
                }
              } catch (err) {
                console.error("❌ Error procesando datos:", err);
              }
            }
          }
        );

        setImuSubscription(subscription);
        console.log("✅ Suscripción activa");

        // Esperar sincronización
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Activar sensores
        console.log("\n🎯 Activando sensores IMU...");

        await sendMovesenseCommand({
          Op: 2,
          Path: "Meas/Acc/52",
        });

        await new Promise((resolve) => setTimeout(resolve, 200));

        await sendMovesenseCommand({
          Op: 2,
          Path: "Meas/Gyro/52",
        });

        console.log("✅ Sensores activados");
      } catch (err) {
        console.error("Error iniciando recolección:", err);
        setError("Error iniciando monitoreo");
      }
    },
    [connectedDevice, sendMovesenseCommand]
  );

  const stopDataCollection = useCallback(async () => {
    try {
      console.log("\n🛑 Deteniendo recolección de datos...");

      // Desuscribirse de sensores
      await sendMovesenseCommand({
        Op: 3, // Unsubscribe
        Path: "Meas/Acc/52",
      });

      await sendMovesenseCommand({
        Op: 3,
        Path: "Meas/Gyro/52",
      });

      await sendMovesenseCommand({
        Op: 3,
        Path: "Meas/Magn/52",
      });

      // Detener suscripción de notificaciones
      if (imuSubscription) {
        imuSubscription.remove();
        setImuSubscription(null);
      }

      console.log("✅ Recolección detenida");
    } catch (err) {
      console.error("Error deteniendo recolección:", err);
    }
  }, [imuSubscription, sendMovesenseCommand]);

  const monitorAllCharacteristics = useCallback(async () => {
    if (!connectedDevice) {
      console.log("❌ No hay dispositivo conectado");
      return;
    }

    try {
      console.log(
        "\n🎧 ========== MONITOREANDO TODAS LAS CARACTERÍSTICAS =========="
      );
      const services = await connectedDevice.services();

      for (const service of services) {
        const characteristics = await service.characteristics();

        for (const char of characteristics) {
          if (char.isNotifiable) {
            console.log(`\n👂 Escuchando: ${service.uuid} / ${char.uuid}`);

            connectedDevice.monitorCharacteristicForService(
              service.uuid,
              char.uuid,
              (error, characteristic) => {
                if (error) {
                  console.error(`❌ Error en ${char.uuid}:`, error.message);
                  return;
                }

                if (characteristic?.value) {
                  const bytes = base64.toByteArray(characteristic.value);
                  const hexString = Array.from(bytes)
                    .map((b) => b.toString(16).padStart(2, "0"))
                    .join("");

                  console.log(`\n📊 DATOS RECIBIDOS de ${char.uuid}:`);
                  console.log(`   📦 HEX: ${hexString}`);
                  console.log(`   🔢 Bytes: [${bytes.join(", ")}]`);
                  console.log(`   📏 Length: ${bytes.length} bytes`);

                  // Intentar interpretar como texto
                  try {
                    const text = new TextDecoder("utf-8").decode(
                      new Uint8Array(bytes)
                    );
                    if (text.match(/^[\x20-\x7E]+$/)) {
                      console.log(`   📝 Texto: "${text}"`);
                    }
                  } catch (e) {
                    // No es texto válido
                  }
                }
              }
            );
          }
        }
      }

      console.log("\n✅ Monitoreando todas las características notificables");
      console.log("🔄 Los datos aparecerán en tiempo real a continuación...\n");
    } catch (err) {
      console.error("❌ Error monitoreando características:", err);
    }
  }, [connectedDevice]);

  const resetRepetitions = useCallback(() => {
    if (detectorRef.current) {
      detectorRef.current.reset();
    }
    setRepetitionCount(0);
    console.log("🔄 Contador de repeticiones reseteado");
  }, []);

  return {
    isScanning,
    isConnected,
    devices,
    data,
    error,
    startScan,
    stopScan,
    connectToDevice,
    disconnect,
    startDataCollection,
    stopDataCollection,
    monitorAllCharacteristics,
    resetRepetitions,
  };
};
