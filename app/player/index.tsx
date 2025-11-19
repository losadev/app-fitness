import { AddUser } from "@/components";
import { database } from "@/FirebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { FlatList, Modal, Text, TouchableOpacity, View } from "react-native";
import "../global.css";

interface Player {
  id: string;
  name: string;
  lastName: string;
  age: string;
  height: number;
  weight: number;
  position: string;
}

export default function PlayerScreen() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(database, "players"),
      (querySnapshot) => {
        const playersData: Player[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();

          playersData.push({
            id: doc.id,
            ...data,
          } as Player);
        });

        setPlayers(playersData);
      }
    );

    return () => unsubscribe();
  }, []);

  const renderPlayer = ({ item }: { item: Player }) => (
    <View className="bg-white rounded-lg p-4 mb-3 mx-2 shadow-sm">
      <Text className="text-lg font-bold text-gray-800">
        {item.name || "Sin nombre"} {item.lastName || "Sin apellido"}
      </Text>
      <Text className="text-gray-600">
        Posición: {item.position || "No especificada"}
      </Text>
      <Text className="text-gray-600">
        Altura: {item.height || 0}cm | Peso: {item.weight || 0}kg
      </Text>
      <Text className="text-gray-600">
        Fecha: {typeof item.age === "string" ? item.age : "No especificada"}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-100">
      <View className="p-5">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold text-gray-800">
            Jugadores ({players.length})
          </Text>
          <TouchableOpacity
            className="bg-blue-600 px-4 py-2 rounded-lg"
            onPress={() => setModalVisible(true)}
          >
            <Text className="text-white font-semibold">Crear Jugador</Text>
          </TouchableOpacity>
        </View>

        {players.length > 0 ? (
          <FlatList
            data={players}
            keyExtractor={(item) => item.id}
            renderItem={renderPlayer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <Text className="text-gray-600 text-center mt-10">
            No hay jugadores registrados
          </Text>
        )}
      </View>

      {/* Modal para crear jugador */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 20,
              width: "90%",
              maxHeight: "80%",
            }}
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-800">
                Crear Nuevo Jugador
              </Text>
              <TouchableOpacity
                className="bg-gray-500 px-3 py-1 rounded"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-white font-semibold">Cerrar</Text>
              </TouchableOpacity>
            </View>
            <AddUser
              modalVisible={modalVisible}
              setModalVisible={setModalVisible}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
