import { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useMovesense } from "../../hooks/useMovesense";
import "../global.css";

export default function HomeScreen() {
  const [deviceModalVisible, setDeviceModalVisible] = useState(false);

  // Hook de Movesense
  const {
    isScanning,
    isConnected,
    devices,
    error,
    startScan,
    stopScan,
    connectToDevice,
    disconnect,
  } = useMovesense();

  // Manejar errores
  if (error) {
    Alert.alert("Error Movesense", error);
  }

  const handleConnectDevice = () => {
    setDeviceModalVisible(true);
    startScan();
  };

  const handleDeviceSelect = async (device: any) => {
    try {
      await connectToDevice(device);
      setDeviceModalVisible(false);
      Alert.alert(
        "¡Conectado!",
        `Dispositivo ${device.name} conectado exitosamente`
      );
    } catch (err) {
      Alert.alert("Error", "No se pudo conectar al dispositivo");
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      Alert.alert("Desconectado", "Dispositivo desconectado exitosamente");
    } catch (err) {
      Alert.alert("Error", "No se pudo desconectar el dispositivo");
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-gray-100 p-5">
      <Text className="text-2xl font-bold mb-3 text-center text-gray-800">
        Bienvenido a tu App de Fitness
      </Text>
      <Text className="text-lg text-gray-600 text-center mb-8">
        Página de Inicio
      </Text>

      {/* Estado del dispositivo Movesense */}
      <View className="bg-white rounded-lg p-6 shadow-lg mb-6 w-full max-w-sm">
        <Text className="text-xl font-bold text-center mb-4 text-gray-800">
          📱 Dispositivo Movesense
        </Text>

        <View className="items-center mb-4">
          <Text
            className={`text-lg font-semibold ${isConnected ? "text-green-600" : "text-red-600"}`}
          >
            {isConnected ? "🟢 Conectado" : "🔴 Desconectado"}
          </Text>
        </View>

        {!isConnected ? (
          <TouchableOpacity
            className="bg-blue-600 py-3 px-6 rounded-lg"
            onPress={handleConnectDevice}
            disabled={isScanning}
          >
            <Text className="text-white font-bold text-center">
              {isScanning ? "🔄 Buscando..." : "🔍 Conectar Dispositivo"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="bg-red-600 py-3 px-6 rounded-lg"
            onPress={handleDisconnect}
          >
            <Text className="text-white font-bold text-center">
              ❌ Desconectar
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal para seleccionar dispositivo */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={deviceModalVisible}
        onRequestClose={() => {
          setDeviceModalVisible(false);
          stopScan();
        }}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-lg p-6 w-4/5 max-h-96">
            <Text className="text-xl font-bold text-center mb-4 text-gray-800">
              Seleccionar Dispositivo Movesense
            </Text>

            {isScanning && (
              <Text className="text-center text-blue-600 mb-4">
                🔄 Buscando dispositivos...
              </Text>
            )}

            <FlatList
              data={devices}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="bg-gray-100 p-4 rounded-lg mb-2"
                  onPress={() => handleDeviceSelect(item)}
                >
                  <Text className="font-semibold text-gray-800">
                    {item.name || "Dispositivo sin nombre"}
                  </Text>
                  <Text className="text-gray-600 text-sm">ID: {item.id}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <Text className="text-center text-gray-500 py-4">
                  {isScanning
                    ? "Buscando dispositivos..."
                    : "No se encontraron dispositivos"}
                </Text>
              )}
            />

            <TouchableOpacity
              className="bg-gray-600 py-3 px-6 rounded-lg mt-4"
              onPress={() => {
                setDeviceModalVisible(false);
                stopScan();
              }}
            >
              <Text className="text-white font-bold text-center">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
