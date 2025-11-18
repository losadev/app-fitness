import { Text, View } from "react-native";
import "../global.css";

export default function PlayerScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-gray-100 p-5">
      <Text className="text-2xl font-bold mb-3 text-center text-gray-800">
        Perfil del Jugador
      </Text>
      <Text className="text-lg text-gray-600 text-center">
        Gestiona tu información personal y estadísticas
      </Text>
    </View>
  );
}
