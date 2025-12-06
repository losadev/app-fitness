import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { EXERCISES, ExerciseConfig } from "../../constants/exercises";
import { useMovesense } from "../../hooks/useMovesense";
import "../global.css";

export default function TrainingScreen() {
  const { id, exercise, playerName } = useLocalSearchParams<{
    id: string;
    exercise: string;
    playerName: string;
  }>();
  const router = useRouter();

  // Estados para los contadores
  const [weight, setWeight] = useState(50);
  const [targetReps, setTargetReps] = useState(1);
  const [isTraining, setIsTraining] = useState(false);
  const [weightInput, setWeightInput] = useState("50");
  const [isEditingWeight, setIsEditingWeight] = useState(false);

  // Estados para el contador y entrenamiento
  const [countdown, setCountdown] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [trainingPhase, setTrainingPhase] = useState<
    "setup" | "countdown" | "training" | "series"
  >("training");

  // Estados para el modal de ejercicios
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] =
    useState<ExerciseConfig | null>(null);

  // Hook de Movesense para datos en tiempo real
  const movesense = useMovesense();

  // Estado para el cronómetro de la serie
  const [seriesStartTime, setSeriesStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Obtener lista de ejercicios
  const exerciseList = Object.values(EXERCISES);

  // Funciones para manejar los contadores
  const incrementWeight = () => {
    const newWeight = weight + 5;
    setWeight(newWeight);
    setWeightInput(newWeight.toString());
  };

  const decrementWeight = () => {
    const newWeight = weight > 0 ? weight - 5 : 0;
    setWeight(newWeight);
    setWeightInput(newWeight.toString());
  };

  const handleWeightInputChange = (text: string) => {
    setWeightInput(text);
  };

  const handleWeightInputEnd = () => {
    const numericWeight = parseFloat(weightInput) || 0;
    const validWeight = Math.max(0, numericWeight);
    setWeight(validWeight);
    setWeightInput(validWeight.toString());
    setIsEditingWeight(false);
    Keyboard.dismiss(); // Cerrar el teclado
  };

  const dismissKeyboard = () => {
    if (isEditingWeight) {
      handleWeightInputEnd();
    }
    Keyboard.dismiss();
  };

  const incrementReps = () => setTargetReps((prev) => prev + 1);
  const decrementReps = () =>
    setTargetReps((prev) => (prev > 1 ? prev - 1 : 1));

  const handleStartTraining = () => {
    setTrainingPhase("countdown");
    setCountdown(5);
    setIsCountingDown(true);
  };

  const handleStartSeries = () => {
    setExerciseModalVisible(true);
  };

  const handleStartSeriesWithExercise = async () => {
    if (selectedExercise) {
      setExerciseModalVisible(false);
      setTrainingPhase("countdown");
      setCountdown(5);
      setIsCountingDown(true);
      console.log(
        `Iniciando serie: ${selectedExercise.name} - ${weight}kg - ${targetReps} repeticiones`
      );

      // NO resetear aquí, se hará cuando inicie realmente la serie
    }
  };

  const handleFinishTraining = () => {
    console.log("Finalizando entrenamiento");
    // Navegar de regreso a la página del jugador
    router.push({
      pathname: "/player/[id]" as const,
      params: { id },
    });
  };

  // Efecto para manejar el contador
  useEffect(() => {
    let interval: number;

    if (isCountingDown && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isCountingDown && countdown === 0) {
      setIsCountingDown(false);
      setTrainingPhase("series");
      setIsTraining(true);
      setSeriesStartTime(Date.now());

      console.log(
        `Serie iniciada: ${selectedExercise?.nameEs || exercise} - ${weight}kg - ${targetReps} repeticiones`
      );

      console.log(`🔍 DEBUG - movesense.isConnected: ${movesense.isConnected}`);
      console.log(`🔍 DEBUG - selectedExercise:`, selectedExercise);

      // Resetear contador JUSTO antes de iniciar
      if (movesense.isConnected) {
        console.log("🔄 Reseteando contador de repeticiones...");
        movesense.resetRepetitions();
      }

      // Iniciar recolección de datos si hay ejercicio seleccionado
      if (selectedExercise && movesense.isConnected) {
        console.log("🚀 Llamando a startDataCollection...");
        movesense
          .startDataCollection(selectedExercise)
          .then(() => {
            console.log("📊 Iniciando recolección de datos IMU...");
          })
          .catch((error) => {
            console.error("❌ Error al iniciar recolección:", error);
          });
      } else {
        if (!selectedExercise) {
          console.error("❌ No hay ejercicio seleccionado");
        }
        if (!movesense.isConnected) {
          console.warn("⚠️ Movesense no está conectado");
        }
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCountingDown, countdown]);

  // Efecto para cronómetro de la serie
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (trainingPhase === "series" && seriesStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - seriesStartTime) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [trainingPhase, seriesStartTime]);

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-green-600 pt-12 pb-6 px-4">
        <TouchableOpacity
          className="mb-4"
          onPress={() =>
            router.push({
              pathname: "/player/[id]" as const,
              params: { id },
            })
          }
        >
          <Text className="text-white font-semibold">← Volver al Jugador</Text>
        </TouchableOpacity>

        <Text className="text-3xl font-bold text-white mb-2">
          Página del entrenamiento
        </Text>

        {exercise && (
          <Text className="text-green-200 text-lg">Ejercicio: {exercise}</Text>
        )}

        {playerName && (
          <Text className="text-green-100 text-base">
            Jugador: {playerName}
          </Text>
        )}
      </View>

      {/* Contenido principal */}
      {trainingPhase === "setup" && (
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView className="flex-1">
            <View className="p-6">
              <View className="bg-white rounded-lg p-6 shadow-lg mb-6">
                <Text className="text-xl font-bold text-gray-800 mb-6 text-center">
                  Configuración del Entrenamiento
                </Text>

                {/* Contador de Peso */}
                <View className="mb-6">
                  <Text className="text-lg font-semibold text-gray-700 mb-3 text-center">
                    Peso (kg)
                  </Text>
                  <View className="flex-row justify-center items-center">
                    <TouchableOpacity
                      className="bg-red-500 w-12 h-12 rounded-full justify-center items-center"
                      onPress={decrementWeight}
                    >
                      <Text className="text-white font-bold text-xl">-</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="mx-8 bg-gray-100 px-6 py-3 rounded-lg min-w-24"
                      onPress={() => setIsEditingWeight(true)}
                    >
                      {isEditingWeight ? (
                        <TextInput
                          className="text-2xl font-bold text-center text-gray-800"
                          value={weightInput}
                          onChangeText={handleWeightInputChange}
                          onBlur={handleWeightInputEnd}
                          onSubmitEditing={handleWeightInputEnd}
                          keyboardType="numeric"
                          selectTextOnFocus={true}
                          autoFocus={true}
                        />
                      ) : (
                        <Text className="text-2xl font-bold text-center text-gray-800">
                          {weight}
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="bg-green-500 w-12 h-12 rounded-full justify-center items-center"
                      onPress={incrementWeight}
                    >
                      <Text className="text-white font-bold text-xl">+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text className="text-xs text-gray-500 text-center mt-2">
                    Toca el número para editarlo manualmente
                  </Text>
                </View>

                {/* Contador de Repeticiones */}
                <View className="mb-8">
                  <Text className="text-lg font-semibold text-gray-700 mb-3 text-center">
                    Repeticiones Objetivo
                  </Text>
                  <View className="flex-row justify-center items-center">
                    <TouchableOpacity
                      className="bg-red-500 w-12 h-12 rounded-full justify-center items-center"
                      onPress={decrementReps}
                    >
                      <Text className="text-white font-bold text-xl">-</Text>
                    </TouchableOpacity>

                    <View className="mx-8 bg-gray-100 px-6 py-3 rounded-lg min-w-20">
                      <Text className="text-2xl font-bold text-center text-gray-800">
                        {targetReps}
                      </Text>
                    </View>

                    <TouchableOpacity
                      className="bg-green-500 w-12 h-12 rounded-full justify-center items-center"
                      onPress={incrementReps}
                    >
                      <Text className="text-white font-bold text-xl">+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Botón de Iniciar */}
                <TouchableOpacity
                  className={`py-4 rounded-lg flex-row justify-center items-center ${
                    isTraining ? "bg-orange-500" : "bg-green-600"
                  }`}
                  onPress={handleStartTraining}
                  disabled={weight === 0}
                >
                  <Text className="text-white font-bold text-lg mr-2">
                    {isTraining ? "⏱️" : "🚀"}
                  </Text>
                  <Text className="text-white font-bold text-lg">
                    {isTraining
                      ? "Entrenamiento en Curso"
                      : "Iniciar Entrenamiento"}
                  </Text>
                </TouchableOpacity>

                {weight === 0 && (
                  <Text className="text-red-500 text-sm text-center mt-2">
                    Selecciona un peso mayor a 0kg para continuar
                  </Text>
                )}
              </View>

              {/* Resumen */}
              <View className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <Text className="text-blue-800 font-semibold text-center mb-2">
                  Resumen del Entrenamiento
                </Text>
                <Text className="text-blue-700 text-center">
                  <Text className="font-semibold">{exercise}</Text> • {weight}kg
                  • {targetReps} repeticiones
                </Text>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      )}

      {/* Fase de Countdown */}
      {trainingPhase === "countdown" && (
        <View className="flex-1 justify-center items-center p-6">
          <View className="bg-white rounded-lg p-8 shadow-lg items-center">
            <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Preparándose para el entrenamiento
            </Text>

            <View className="items-center mb-6">
              <Text className="text-6xl font-bold text-green-600 mb-4">
                {countdown}
              </Text>
              <ActivityIndicator size="large" color="#16a34a" />
            </View>

            <Text className="text-lg text-gray-600 text-center mb-2">
              <Text className="font-semibold">{exercise}</Text>
            </Text>
            <Text className="text-gray-500 text-center">
              {weight}kg • {targetReps} repeticiones
            </Text>
          </View>
        </View>
      )}

      {/* Fase de Entrenamiento */}
      {trainingPhase === "training" && (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        >
          <View className="bg-white rounded-lg p-6 shadow-lg mb-6">
            <Text className="text-2xl font-bold text-green-600 mb-4 text-center">
              🏋️ Entrenamiento en Curso
            </Text>

            <View className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
              <Text className="text-lg font-semibold text-green-800 text-center mb-2">
                {exercise}
              </Text>
              <Text className="text-green-700 text-center">
                Peso: {weight}kg • Objetivo: {targetReps} repeticiones
              </Text>
              <Text className="text-green-600 text-center mt-1">
                Jugador: {playerName}
              </Text>
            </View>

            <View className="bg-blue-50 rounded-lg p-6 border border-blue-200 mb-6">
              <Text className="text-xl font-bold text-blue-800 text-center mb-4">
                📊 Datos a tiempo real
              </Text>
              <Text className="text-blue-600 text-center">
                Aquí se mostrarán los datos del sensor Movesense en tiempo real
              </Text>
            </View>

            {/* Botones de control del entrenamiento */}
            <View className="space-y-4">
              <TouchableOpacity
                className="bg-green-600 py-4 rounded-lg flex-row justify-center items-center"
                onPress={handleStartSeries}
              >
                <Text className="text-white font-bold text-lg mr-2">🏃‍♂️</Text>
                <Text className="text-white font-bold text-lg">
                  Iniciar Serie
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-red-600 py-4 rounded-lg flex-row justify-center items-center mt-3"
                onPress={handleFinishTraining}
              >
                <Text className="text-white font-bold text-lg mr-2">🛑</Text>
                <Text className="text-white font-bold text-lg">
                  Finalizar Entrenamiento
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Fase de Serie en Curso (datos en tiempo real) */}
      {trainingPhase === "series" && (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        >
          <View className="bg-white rounded-lg p-6 shadow-lg mb-6">
            <Text className="text-2xl font-bold text-orange-600 mb-4 text-center">
              🔥 Serie en Curso
            </Text>

            <View className="bg-orange-50 rounded-lg p-4 mb-6 border border-orange-200">
              <Text className="text-lg font-semibold text-orange-800 text-center mb-2">
                {selectedExercise?.nameEs || exercise}
              </Text>
              <Text className="text-orange-700 text-center">
                Peso: {weight}kg • Objetivo: {targetReps} repeticiones
              </Text>
              <Text className="text-orange-600 text-center mt-1">
                Jugador: {playerName}
              </Text>
            </View>

            <View className="bg-purple-50 rounded-lg p-6 border border-purple-200 mb-6">
              <Text className="text-xl font-bold text-purple-800 text-center mb-4">
                📈 Monitoreo en Tiempo Real
              </Text>

              {!movesense.isConnected ? (
                <View className="bg-yellow-100 rounded-lg p-4 border border-yellow-300 mb-3">
                  <Text className="text-yellow-800 text-center font-semibold">
                    ⚠️ Movesense no conectado
                  </Text>
                  <Text className="text-yellow-700 text-center text-sm mt-1">
                    Conecta el dispositivo desde la pantalla principal
                  </Text>
                </View>
              ) : (
                <Text className="text-purple-600 text-center mb-3">
                  ✅ Sensor Movesense activo
                </Text>
              )}

              <View className="bg-white rounded-lg p-4 border border-purple-100">
                {/* Repeticiones */}
                <View className="mb-3">
                  <Text className="text-purple-800 font-semibold text-center text-lg">
                    Repeticiones
                  </Text>
                  <Text className="text-purple-600 text-center text-3xl font-bold">
                    {movesense.data?.repetitionCount ?? 0} / {targetReps}
                  </Text>
                </View>

                {/* Separador */}
                <View className="border-t border-purple-200 my-3" />

                {/* Tiempo transcurrido */}
                <View className="mb-3">
                  <Text className="text-purple-700 text-center font-mono">
                    ⏱️ Tiempo: {elapsedTime}s
                  </Text>
                </View>

                {/* Datos IMU */}
                {movesense.data?.imu && (
                  <>
                    <View className="border-t border-purple-200 my-3" />
                    <Text className="text-purple-800 font-semibold text-center mb-2">
                      Datos IMU
                    </Text>

                    {/* Acelerómetro */}
                    <View className="mb-2">
                      <Text className="text-purple-700 text-xs font-semibold">
                        Acelerómetro (m/s²):
                      </Text>
                      <Text className="text-purple-600 font-mono text-xs">
                        X: {movesense.data.imu.accelerometer.x.toFixed(2)} | Y:{" "}
                        {movesense.data.imu.accelerometer.y.toFixed(2)} | Z:{" "}
                        {movesense.data.imu.accelerometer.z.toFixed(2)}
                      </Text>
                    </View>

                    {/* Giroscopio */}
                    <View className="mb-2">
                      <Text className="text-purple-700 text-xs font-semibold">
                        Giroscopio (deg/s):
                      </Text>
                      <Text className="text-purple-600 font-mono text-xs">
                        X: {movesense.data.imu.gyroscope.x.toFixed(2)} | Y:{" "}
                        {movesense.data.imu.gyroscope.y.toFixed(2)} | Z:{" "}
                        {movesense.data.imu.gyroscope.z.toFixed(2)}
                      </Text>
                    </View>

                    {/* Magnetómetro */}
                    <View>
                      <Text className="text-purple-700 text-xs font-semibold">
                        Magnetómetro (μT):
                      </Text>
                      <Text className="text-purple-600 font-mono text-xs">
                        X: {movesense.data.imu.magnetometer.x.toFixed(2)} | Y:{" "}
                        {movesense.data.imu.magnetometer.y.toFixed(2)} | Z:{" "}
                        {movesense.data.imu.magnetometer.z.toFixed(2)}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            <TouchableOpacity
              className="bg-orange-600 py-4 rounded-lg flex-row justify-center items-center"
              onPress={async () => {
                console.log("🛑 Botón Finalizar Serie presionado");
                try {
                  await movesense.stopDataCollection();
                  console.log("✅ Datos detenidos correctamente");
                } catch (error) {
                  console.error("❌ Error deteniendo datos:", error);
                }
                setTrainingPhase("training");
                setSeriesStartTime(null);
              }}
            >
              <Text className="text-white font-bold text-lg mr-2">✅</Text>
              <Text className="text-white font-bold text-lg">
                Finalizar Serie
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Modal de selección de ejercicio */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={exerciseModalVisible}
        onRequestClose={() => setExerciseModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white p-6 rounded-lg w-11/12 max-h-[80%]">
            <Text className="text-2xl font-bold mb-4 text-center text-gray-800">
              Seleccionar Ejercicio
            </Text>

            {/* Tren Inferior */}
            <Text className="text-lg font-semibold text-blue-600 mb-2 mt-2">
              💪 Tren Inferior
            </Text>
            <FlatList
              data={exerciseList.filter((ex) => ex.category === "lower")}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`p-4 mb-2 rounded-lg border-2 ${
                    selectedExercise?.id === item.id
                      ? "bg-blue-500 border-blue-600"
                      : "bg-gray-100 border-gray-300"
                  }`}
                  onPress={() => setSelectedExercise(item)}
                >
                  <Text
                    className={`font-bold text-base ${
                      selectedExercise?.id === item.id
                        ? "text-white"
                        : "text-gray-800"
                    }`}
                  >
                    {item.nameEs}
                  </Text>
                  <Text
                    className={`text-sm mt-1 ${
                      selectedExercise?.id === item.id
                        ? "text-blue-100"
                        : "text-gray-600"
                    }`}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              className="mb-4"
            />

            {/* Tren Superior */}
            <Text className="text-lg font-semibold text-orange-600 mb-2">
              🏋️ Tren Superior
            </Text>
            <FlatList
              data={exerciseList.filter((ex) => ex.category === "upper")}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`p-4 mb-2 rounded-lg border-2 ${
                    selectedExercise?.id === item.id
                      ? "bg-orange-500 border-orange-600"
                      : "bg-gray-100 border-gray-300"
                  }`}
                  onPress={() => setSelectedExercise(item)}
                >
                  <Text
                    className={`font-bold text-base ${
                      selectedExercise?.id === item.id
                        ? "text-white"
                        : "text-gray-800"
                    }`}
                  >
                    {item.nameEs}
                  </Text>
                  <Text
                    className={`text-sm mt-1 ${
                      selectedExercise?.id === item.id
                        ? "text-orange-100"
                        : "text-gray-600"
                    }`}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />

            <View className="flex-row justify-between mt-4">
              <TouchableOpacity
                className="bg-gray-500 py-3 px-6 rounded-lg flex-1 mr-2"
                onPress={() => setExerciseModalVisible(false)}
              >
                <Text className="text-white text-center font-semibold">
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`py-3 px-6 rounded-lg flex-1 ml-2 ${
                  selectedExercise ? "bg-green-600" : "bg-gray-300"
                }`}
                onPress={handleStartSeriesWithExercise}
                disabled={!selectedExercise}
              >
                <Text
                  className={`text-center font-semibold ${
                    selectedExercise ? "text-white" : "text-gray-500"
                  }`}
                >
                  Iniciar Serie
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
