/**
 * Configuración de ejercicios soportados en la app
 * Cada ejercicio tiene parámetros específicos para detección de repeticiones con IMU
 */

export interface ExerciseConfig {
  id: string;
  name: string;
  nameEs: string;
  category: "lower" | "upper";
  primaryMovement: "vertical" | "horizontal" | "angular";

  // Parámetros para detección de repeticiones
  imuDetection: {
    primaryAxis: "x" | "y" | "z"; // Eje principal de movimiento
    threshold: number; // Umbral de aceleración/giro (m/s² o deg/s)
    minDuration: number; // Duración mínima de una repetición (ms)
    restThreshold: number; // Umbral para detectar pausa entre reps
  };

  // Rangos de movimiento típicos
  romAngles?: {
    min: number; // Ángulo mínimo (grados)
    max: number; // Ángulo máximo (grados)
  };
}

export const EXERCISES: Record<string, ExerciseConfig> = {
  squat: {
    id: "squat",
    name: "Squat",
    nameEs: "Sentadilla",
    category: "lower",
    primaryMovement: "vertical",
    imuDetection: {
      primaryAxis: "z", // Movimiento vertical
      threshold: 1.5, // m/s² - MÁS SENSIBLE (era 2.5)
      minDuration: 600, // 0.6 segundos mínimo por rep (reducido)
      restThreshold: 0.8, // m/s² - casi estático entre reps
    },
    romAngles: {
      min: 90, // Rodilla a 90° (paralelo)
      max: 180, // Rodilla extendida
    },
  },

  hipThrust: {
    id: "hipThrust",
    name: "Hip Thrust",
    nameEs: "Empuje de Cadera",
    category: "lower",
    primaryMovement: "angular",
    imuDetection: {
      primaryAxis: "y", // Rotación de cadera
      threshold: 45.0, // deg/s - velocidad angular
      minDuration: 800,
      restThreshold: 10.0,
    },
    romAngles: {
      min: 0, // Cadera en suelo
      max: 180, // Cadera extendida (alineación completa)
    },
  },

  deadlift: {
    id: "deadlift",
    name: "Deadlift",
    nameEs: "Peso Muerto",
    category: "lower",
    primaryMovement: "vertical",
    imuDetection: {
      primaryAxis: "z",
      threshold: 3.0, // Reducido para mejor sensibilidad
      minDuration: 1000, // Movimiento más lento
      restThreshold: 1.2,
    },
    romAngles: {
      min: 0, // Barra en el suelo
      max: 180, // De pie completamente
    },
  },

  romanianDeadlift: {
    id: "romanianDeadlift",
    name: "Romanian Deadlift",
    nameEs: "Peso Muerto Rumano",
    category: "lower",
    primaryMovement: "angular",
    imuDetection: {
      primaryAxis: "y", // Inclinación hacia adelante
      threshold: 20.0, // deg/s (reducido)
      minDuration: 900,
      restThreshold: 8.0,
    },
    romAngles: {
      min: 45, // Inclinación hacia adelante
      max: 180, // De pie
    },
  },

  benchPress: {
    id: "benchPress",
    name: "Bench Press",
    nameEs: "Press de Banca",
    category: "upper",
    primaryMovement: "vertical",
    imuDetection: {
      primaryAxis: "z",
      threshold: 2.5, // Reducido para mejor sensibilidad
      minDuration: 700,
      restThreshold: 1.0,
    },
    romAngles: {
      min: 90, // Brazos doblados (barra en pecho)
      max: 180, // Brazos extendidos
    },
  },

  shoulderPress: {
    id: "shoulderPress",
    name: "Shoulder Press",
    nameEs: "Press de Hombro",
    category: "upper",
    primaryMovement: "vertical",
    imuDetection: {
      primaryAxis: "z",
      threshold: 2.5, // Reducido para mejor sensibilidad
      minDuration: 800,
      restThreshold: 1.0,
    },
    romAngles: {
      min: 90, // Brazos doblados (barra a altura de hombros)
      max: 180, // Brazos completamente extendidos arriba
    },
  },
};

// Helper: Obtener ejercicio por nombre
export const getExerciseByName = (name: string): ExerciseConfig | undefined => {
  const normalized = name.toLowerCase().replace(/\s+/g, "");
  return Object.values(EXERCISES).find(
    (ex) =>
      ex.name.toLowerCase().replace(/\s+/g, "") === normalized ||
      ex.nameEs.toLowerCase().replace(/\s+/g, "") === normalized
  );
};

// Helper: Obtener todos los nombres para UI
export const getExerciseNames = (lang: "en" | "es" = "es"): string[] => {
  return Object.values(EXERCISES).map((ex) =>
    lang === "es" ? ex.nameEs : ex.name
  );
};

// Helper: Filtrar por categoría
export const getExercisesByCategory = (
  category: "lower" | "upper"
): ExerciseConfig[] => {
  return Object.values(EXERCISES).filter((ex) => ex.category === category);
};
