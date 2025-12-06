import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useMovesense } from "../hooks/useMovesense";
import "./global.css";

export default function Index() {
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
    monitorAllCharacteristics,
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
    <View className="flex-1 bg-gray-100 p-5">
      <View className="items-center mt-16 mb-10">
        <Ionicons name="fitness" size={60} color="#007AFF" />
        <Text className="text-3xl font-bold text-gray-800 mt-5">
          App Fitness Pablo
        </Text>
        <Text className="text-base text-gray-600 mt-2">
          Gestiona tu equipo deportivo
        </Text>
      </View>

      {/* Estado del dispositivo Movesense */}
      <View className="bg-white rounded-lg p-6 shadow-lg mb-6">
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
          <View>
            <TouchableOpacity
              className="bg-purple-600 py-3 px-6 rounded-lg mb-3"
              onPress={() => {
                monitorAllCharacteristics();
                Alert.alert(
                  "Monitoreo Activo",
                  "Revisa la consola en tu PC para ver todos los datos en tiempo real"
                );
              }}
            >
              <Text className="text-white font-bold text-center">
                📊 Ver Todos los Datos (Consola)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-red-600 py-3 px-6 rounded-lg"
              onPress={handleDisconnect}
            >
              <Text className="text-white font-bold text-center">
                ❌ Desconectar
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Navegación */}
      <View className="flex-1 justify-center">
        <Text className="text-2xl font-semibold text-gray-800 text-center mb-5">
          ¡Bienvenido!
        </Text>
        <Text className="text-base text-gray-600 text-center mb-8">
          Usa la navegación inferior para acceder a:
        </Text>
        <View className="bg-white rounded-xl p-5 shadow-lg">
          <Text className="text-base text-gray-800 mb-3 py-1">
            👥 Equipos - Gestión de equipos
          </Text>
          <Text className="text-base text-gray-800 mb-3 py-1">
            🏃 Jugadores - Perfiles de jugadores
          </Text>
        </View>
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
              Seleccionar Dispositivo BLE
            </Text>

            {isScanning && (
              <Text className="text-center text-blue-600 mb-4">
                🔄 Buscando dispositivos... ({devices.length} encontrados)
              </Text>
            )}

            <FlatList
              data={devices}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="bg-gray-100 p-4 rounded-lg mb-2 border border-gray-200"
                  onPress={() => handleDeviceSelect(item)}
                >
                  <Text className="font-bold text-gray-800 text-base">
                    {item.name || "Sin nombre"}
                  </Text>
                  <Text className="text-gray-600 text-xs mt-1">
                    ID: {item.id.substring(0, 20)}...
                  </Text>
                  {item.rssi && (
                    <Text className="text-blue-600 text-xs mt-1">
                      📶 Señal: {item.rssi} dBm
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <Text className="text-center text-gray-500 py-4">
                  {isScanning
                    ? "Buscando dispositivos..."
                    : "No se encontraron dispositivos. Asegúrate de tener Bluetooth activo."}
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
