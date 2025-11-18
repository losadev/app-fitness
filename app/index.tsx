import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 bg-gray-100 p-5">
      <View className="items-center mt-16 mb-10">
        <Ionicons name="fitness" size={60} color="#007AFF" />
        <Text className="text-3xl font-bold text-gray-800 mt-5">
          App Fitness
        </Text>
        <Text className="text-base text-gray-600 mt-2">
          Gestiona tu equipo deportivo
        </Text>
      </View>

      <View className="flex-1 justify-center">
        <Text className="text-2xl font-semibold text-gray-800 text-center mb-5">
          ¡Bienvenido!
        </Text>
        <Text className="text-base text-gray-600 text-center mb-8">
          Usa la navegación inferior para acceder a:
        </Text>
        <View className="bg-white rounded-xl p-5 shadow-lg">
          <Text className="text-base text-gray-800 mb-3 py-1">
            🏠 Inicio - Panel principal
          </Text>
          <Text className="text-base text-gray-800 mb-3 py-1">
            👥 Equipos - Gestión de equipos
          </Text>
          <Text className="text-base text-gray-800 mb-3 py-1">
            🏃 Jugadores - Perfiles de jugadores
          </Text>
        </View>
      </View>
    </View>
  );
}
