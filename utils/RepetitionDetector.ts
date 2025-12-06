/**
 * Detector de repeticiones usando datos IMU
 * Analiza acelerómetro y giroscopio para contar repeticiones automáticamente
 */

import { ExerciseConfig } from "../constants/exercises";

interface IMUSample {
  timestamp: number;
  accelerometer: { x: number; y: number; z: number };
  gyroscope: { x: number; y: number; z: number };
}

interface RepetitionState {
  count: number;
  phase: "rest" | "concentric" | "eccentric"; // reposo | fase positiva | fase negativa
  lastPeakTime: number;
  currentMagnitude: number;
  buffer: IMUSample[]; // Buffer de últimas muestras
}

export class RepetitionDetector {
  private exercise: ExerciseConfig;
  private state: RepetitionState;
  private readonly BUFFER_SIZE = 10; // Mantener últimas 10 muestras

  constructor(exercise: ExerciseConfig) {
    this.exercise = exercise;
    this.state = {
      count: 0,
      phase: "rest",
      lastPeakTime: 0,
      currentMagnitude: 0,
      buffer: [],
    };
  }

  /**
   * Procesa una nueva muestra de IMU y actualiza el contador de repeticiones
   */
  processSample(sample: IMUSample): { count: number; phase: string } {
    // Agregar muestra al buffer
    this.state.buffer.push(sample);
    if (this.state.buffer.length > this.BUFFER_SIZE) {
      this.state.buffer.shift();
    }

    const { primaryAxis, threshold, minDuration, restThreshold } =
      this.exercise.imuDetection;

    // Determinar si usamos acelerómetro o giroscopio
    let magnitude: number;

    if (this.exercise.primaryMovement === "angular") {
      // Usar giroscopio para movimientos angulares
      magnitude = Math.abs(sample.gyroscope[primaryAxis]);
    } else {
      // Usar acelerómetro para movimientos lineales
      magnitude = Math.abs(sample.accelerometer[primaryAxis]);
    }

    this.state.currentMagnitude = magnitude;

    // Máquina de estados para detección de repeticiones
    const now = sample.timestamp;

    switch (this.state.phase) {
      case "rest":
        // Esperando inicio de movimiento
        if (magnitude > threshold) {
          this.state.phase = "concentric";
          this.state.lastPeakTime = now;
          console.log(`🟢 Iniciando repetición ${this.state.count + 1}`);
        }
        break;

      case "concentric":
        // En fase concéntrica (positiva)
        if (magnitude < restThreshold) {
          // Volver a reposo (posible transición)
          const duration = now - this.state.lastPeakTime;
          if (duration > minDuration / 2) {
            this.state.phase = "eccentric";
            console.log("🔵 Fase excéntrica");
          }
        }
        break;

      case "eccentric":
        // En fase excéntrica (negativa)
        if (magnitude < restThreshold) {
          const duration = now - this.state.lastPeakTime;

          // Repetición completa: duración mínima cumplida
          if (duration >= minDuration) {
            this.state.count++;
            this.state.phase = "rest";
            console.log(`✅ Repetición ${this.state.count} completada!`);
          }
        } else if (magnitude > threshold) {
          // Si vuelve a subir, es parte de la misma rep (oscilación)
          // Mantener en eccentric
        }
        break;
    }

    return {
      count: this.state.count,
      phase: this.state.phase,
    };
  }

  /**
   * Calcula la magnitud total (vector resultante) del acelerómetro
   */
  private getAccelerationMagnitude(acc: {
    x: number;
    y: number;
    z: number;
  }): number {
    return Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
  }

  /**
   * Calcula la velocidad angular total del giroscopio
   */
  private getAngularVelocity(gyro: {
    x: number;
    y: number;
    z: number;
  }): number {
    return Math.sqrt(gyro.x * gyro.x + gyro.y * gyro.y + gyro.z * gyro.z);
  }

  /**
   * Resetea el contador de repeticiones
   */
  reset(): void {
    this.state.count = 0;
    this.state.phase = "rest";
    this.state.lastPeakTime = 0;
    this.state.buffer = [];
    console.log("🔄 Detector de repeticiones reseteado");
  }

  /**
   * Obtiene el estado actual
   */
  getState(): RepetitionState {
    return { ...this.state };
  }

  /**
   * Obtiene estadísticas del buffer (últimas N muestras)
   */
  getBufferStats(): {
    avgAcceleration: number;
    avgAngularVelocity: number;
    peakAcceleration: number;
  } {
    if (this.state.buffer.length === 0) {
      return { avgAcceleration: 0, avgAngularVelocity: 0, peakAcceleration: 0 };
    }

    const accMagnitudes = this.state.buffer.map((s) =>
      this.getAccelerationMagnitude(s.accelerometer)
    );
    const gyroMagnitudes = this.state.buffer.map((s) =>
      this.getAngularVelocity(s.gyroscope)
    );

    return {
      avgAcceleration:
        accMagnitudes.reduce((a, b) => a + b, 0) / accMagnitudes.length,
      avgAngularVelocity:
        gyroMagnitudes.reduce((a, b) => a + b, 0) / gyroMagnitudes.length,
      peakAcceleration: Math.max(...accMagnitudes),
    };
  }
}
