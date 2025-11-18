import { Text, View } from "react-native";
import "../global.css";

export default function HomeScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-gray-100 p-5">
      <Text className="text-2xl font-bold mb-3 text-center text-gray-800">
        Bienvenido a tu App de Fitness
      </Text>
      <Text className="text-lg text-gray-600 text-center">
        Página de Inicio
      </Text>
    </View>
  );
}
