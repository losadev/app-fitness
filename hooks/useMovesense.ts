import { useCallback, useEffect, useState } from "react";
import { Device } from "react-native-ble-plx";
import { ExerciseConfig } from "../constants/exercises";
import MovesenseManager from "./MovesenseManager";

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

/**
 * Hook para usar el MovesenseManager singleton
 * Mantiene el estado sincronizado con el manager global
 */
export const useMovesense = (): UseMovesenseReturn => {
  const [manager] = useState(() => MovesenseManager.getInstance());
  const [state, setState] = useState(manager.getState());

  // Suscribirse a cambios del manager singleton
  useEffect(() => {
    const unsubscribe = manager.subscribe(() => {
      setState(manager.getState());
    });

    return () => {
      unsubscribe();
    };
  }, [manager]);

  const startScan = useCallback(() => {
    manager.startScan();
  }, [manager]);

  const stopScan = useCallback(() => {
    manager.stopScan();
  }, [manager]);

  const connectToDevice = useCallback(
    async (device: Device) => {
      await manager.connectToDevice(device);
    },
    [manager]
  );

  const disconnect = useCallback(async () => {
    await manager.disconnect();
  }, [manager]);

  const startDataCollection = useCallback(
    async (exercise: ExerciseConfig) => {
      await manager.startDataCollection(exercise);
    },
    [manager]
  );

  const stopDataCollection = useCallback(async () => {
    await manager.stopDataCollection();
  }, [manager]);

  const monitorAllCharacteristics = useCallback(async () => {
    await manager.monitorAllCharacteristics();
  }, [manager]);

  const resetRepetitions = useCallback(() => {
    manager.resetRepetitions();
  }, [manager]);

  return {
    isScanning: state.isScanning,
    isConnected: state.isConnected,
    devices: state.devices,
    data: state.data,
    error: state.error,
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
