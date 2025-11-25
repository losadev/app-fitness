import { useLocalSearchParams, useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import "../global.css";

export default function TrainingScreen() {
  const { id, exercise, playerName } = useLocalSearchParams<{
    id: string;
    exercise: string;
    playerName: string;
  }>();
  const router = useRouter();

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
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-2xl font-bold text-gray-800 text-center">
          Página del entrenamiento
        </Text>
      </View>
    </View>
  );
}
