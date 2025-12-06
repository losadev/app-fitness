# 🏋️ Sistema de Detección de Repeticiones - Resumen

## ✅ Archivos Creados

### 1. `constants/exercises.ts`

Configuración de los 6 ejercicios soportados:

**Tren Inferior:**

- ✅ Squat (Sentadilla)
- ✅ Hip Thrust (Empuje de Cadera)
- ✅ Deadlift (Peso Muerto)
- ✅ Romanian Deadlift (Peso Muerto Rumano)

**Tren Superior:**

- ✅ Bench Press (Press de Banca)
- ✅ Shoulder Press (Press de Hombro)

Cada ejercicio incluye:

- Eje principal de movimiento (x, y, z)
- Umbral de detección (m/s² o deg/s)
- Duración mínima de repetición
- Rangos de movimiento (ROM)

### 2. `utils/RepetitionDetector.ts`

Clase inteligente para detectar repeticiones automáticamente:

**Características:**

- Máquina de estados (reposo → concéntrica → excéntrica)
- Usa acelerómetro O giroscopio según tipo de ejercicio
- Buffer de últimas 10 muestras
- Validación de duración mínima
- Estadísticas en tiempo real

**Fases detectadas:**

- 🟢 **Concentric**: Fase positiva (levantar peso)
- 🔵 **Eccentric**: Fase negativa (bajar peso)
- ⚪ **Rest**: Reposo entre repeticiones

### 3. `components/ExerciseSelector.tsx`

Componente UI para seleccionar ejercicio:

- Agrupación por tren superior/inferior
- Muestra eje principal y categoría
- Indicador visual de selección

## 🔄 Archivos Actualizados

### `hooks/useMovesense.ts`

**Nuevos cambios:**

- ✅ Import de `RepetitionDetector` y `ExerciseConfig`
- ✅ `startDataCollection(exercise)` ahora recibe el ejercicio
- ✅ Inicializa detector con configuración del ejercicio
- ✅ Parsea datos IMU (timestamp + x, y, z)
- ✅ Procesa cada muestra con el detector
- ✅ Actualiza contador automáticamente
- ✅ Nueva función `resetRepetitions()`

**Flujo de datos:**

1. Usuario selecciona ejercicio
2. Se inicia `startDataCollection(exercise)`
3. Se crea `RepetitionDetector` con parámetros del ejercicio
4. Movesense envía datos IMU a 52Hz
5. Cada muestra se procesa con el detector
6. Contador se actualiza automáticamente

## 📊 Cómo Usar

### En una pantalla de entrenamiento:

```typescript
import { useState } from "react";
import { useMovesense } from "../hooks/useMovesense";
import { ExerciseSelector } from "../components";
import { EXERCISES, ExerciseConfig } from "../constants/exercises";

export default function TrainingScreen() {
  const {
    data,
    startDataCollection,
    stopDataCollection,
    resetRepetitions
  } = useMovesense();

  const [selectedExercise, setSelectedExercise] = useState<ExerciseConfig>();

  const handleStartSet = async () => {
    if (selectedExercise) {
      await startDataCollection(selectedExercise);
    }
  };

  const handleStopSet = async () => {
    await stopDataCollection();
  };

  const handleNewSet = () => {
    resetRepetitions();
  };

  return (
    <View>
      <ExerciseSelector
        onSelectExercise={setSelectedExercise}
        selectedExercise={selectedExercise}
      />

      <Text>Repeticiones: {data?.repetitionCount || 0}</Text>

      <Button onPress={handleStartSet}>Iniciar Serie</Button>
      <Button onPress={handleStopSet}>Detener</Button>
      <Button onPress={handleNewSet}>Nueva Serie</Button>
    </View>
  );
}
```

## 🎯 Próximos Pasos

1. **Probar con datos reales** del Movesense
2. **Ajustar umbrales** según comportamiento real
3. **Mejorar parseo** para distinguir Acc vs Gyro
4. **Validar detección** en cada ejercicio
5. **Guardar series** en Firebase con repeticiones detectadas

## 📝 Notas Técnicas

### Umbrales actuales (pueden necesitar ajuste):

- **Squat**: 9.0 m/s² en eje Z
- **Hip Thrust**: 45.0 deg/s en eje Y
- **Deadlift**: 8.0 m/s² en eje Z
- **Romanian Deadlift**: 40.0 deg/s en eje Y
- **Bench Press**: 7.0 m/s² en eje Z
- **Shoulder Press**: 6.5 m/s² en eje Z

### Frecuencia de muestreo:

- 52 Hz para Acelerómetro
- 52 Hz para Giroscopio
- ~19ms entre muestras

### Parseo binario actual:

```
Bytes 0-3:   Timestamp (uint32, little-endian)
Bytes 4-7:   X (float32, little-endian)
Bytes 8-11:  Y (float32, little-endian)
Bytes 12-15: Z (float32, little-endian)
```

⚠️ **IMPORTANTE**: El formato exacto puede variar. Revisar logs para confirmar.
