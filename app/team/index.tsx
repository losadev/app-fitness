import { useRouter } from "expo-router";
import { collection, deleteDoc, doc, getDocs, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FlatList, Modal, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AddTeam } from "../../components";
import { database } from "../../FirebaseConfig";
import "../global.css";

interface Team {
  id: string;
  name: string;
  category: string;
  createdAt: any;
  players: string[];
}

export default function TeamScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);

  const categories = {
    primer_equipo: "Primer Equipo",
    segundo_equipo: "Segundo Equipo",
    juvenil: "Juvenil",
    cadete: "Cadete",
    infantil: "Infantil",
    alevin: "Alevín",
    benjamin: "Benjamín",
    prebenjamin: "Prebenjamín",
    femenino: "Femenino",
    veteranos: "Veteranos",
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const q = query(collection(database, "teams"));
      const querySnapshot = await getDocs(q);
      const teamsData: Team[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        teamsData.push({
          id: doc.id,
          name: data.name || "",
          category: data.category || "",
          createdAt: data.createdAt,
          players: data.players || [],
        });
      });

      // Ordenar por fecha de creación (más reciente primero)
      teamsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      setTeams(teamsData);
    } catch (error) {
      console.error("Error obteniendo equipos: ", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTeam = async (teamId: string) => {
    try {
      await deleteDoc(doc(database, "teams", teamId));
      await fetchTeams(); // Refrescar la lista
      alert("Equipo eliminado exitosamente");
    } catch (error) {
      console.error("Error eliminando equipo: ", error);
      alert("Error al eliminar el equipo");
    }
  };

  const renderTeam = ({ item }: { item: Team }) => (
    <TouchableOpacity
      className="bg-white rounded-lg p-4 mx-4 my-2 shadow-md border border-gray-200"
      onPress={() =>
        router.push({ pathname: "/team/[id]", params: { id: item.id } })
      }
    >
      <Text className="text-lg font-bold text-gray-800 mb-1">{item.name}</Text>
      <Text className="text-sm text-blue-600 mb-2">
        {categories[item.category as keyof typeof categories] || item.category}
      </Text>
      <Text className="text-xs text-gray-500 mb-3">
        Jugadores: {item.players?.length || 0}
      </Text>
      <View className="flex-row justify-between items-center">
        <TouchableOpacity
          className="bg-blue-500 rounded-lg px-4 py-2"
          onPress={(e) => {
            e.stopPropagation(); // Evitar que se ejecute la navegación
            router.push({ pathname: "/team/[id]", params: { id: item.id } });
          }}
        >
          <Text className="text-white text-center font-semibold text-sm">
            Ver Jugadores
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-red-500 rounded-lg px-4 py-2"
          onPress={(e) => {
            e.stopPropagation(); // Evitar que se ejecute la navegación
            deleteTeam(item.id);
          }}
        >
          <Text className="text-white text-center font-semibold text-sm">
            Eliminar
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-blue-100">
      <View className="p-4 bg-blue-600">
        <Text className="text-2xl font-bold text-white text-center">
          Gestión de Equipos
        </Text>
      </View>

      {/* Botón para crear nuevo equipo */}
      <View className="p-4">
        <TouchableOpacity
          className="bg-blue-600 rounded-lg p-4 items-center shadow-md"
          onPress={() => setModalVisible(true)}
        >
          <Text className="text-white font-bold text-lg">
            Crear Nuevo Equipo
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de equipos */}
      <View className="flex-1">
        {teams.length > 0 ? (
          <FlatList
            data={teams}
            keyExtractor={(item) => item.id}
            renderItem={renderTeam}
            refreshing={loading}
            onRefresh={fetchTeams}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View className="flex-1 justify-center items-center">
            <Text className="text-base text-gray-600 text-center px-6">
              No hay equipos creados aún.
            </Text>
            <Text className="text-sm text-gray-500 text-center px-6 mt-2">
              Toca "Crear Nuevo Equipo" para comenzar.
            </Text>
          </View>
        )}
      </View>

      {/* Modal para crear equipo */}
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
            <TouchableOpacity
              className="absolute top-4 right-4 z-10"
              onPress={() => setModalVisible(false)}
            >
              <Text className="text-gray-500 font-bold text-lg">✕</Text>
            </TouchableOpacity>
            <AddTeam
              modalVisible={modalVisible}
              setModalVisible={(visible) => {
                setModalVisible(visible);
                if (!visible) {
                  fetchTeams(); // Refrescar equipos al cerrar modal
                }
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
