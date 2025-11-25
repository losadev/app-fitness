import { useLocalSearchParams, useRouter } from "expo-router";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { database } from "../../FirebaseConfig";
import "../global.css";

interface Player {
  id: string;
  name: string;
  lastName: string;
  age: string;
  height: number;
  weight: number;
  position: string;
  teamId: string;
}

interface Team {
  id: string;
  name: string;
  category: string;
}

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPlayerDetail();
    }
  }, [id]);

  const fetchPlayerDetail = async () => {
    try {
      setLoading(true);

      // Obtener datos del jugador
      const playerDoc = await getDoc(doc(database, "players", id!));

      if (!playerDoc.exists()) {
        setLoading(false);
        return;
      }

      const playerData = playerDoc.data();

      // Extraer teamId correctamente
      let teamId = "";
      if (playerData.teamId) {
        if (playerData.teamId.id) {
          teamId = playerData.teamId.id;
        } else if (typeof playerData.teamId === "string") {
          teamId = playerData.teamId;
        }
      }

      const player: Player = {
        id: playerDoc.id,
        name: playerData.name || "",
        lastName: playerData.lastName || "",
        age: playerData.age || "",
        height: playerData.height || 0,
        weight: playerData.weight || 0,
        position: playerData.position || "",
        teamId: teamId,
      };

      setPlayer(player);

      // Si tiene equipo, obtener datos del equipo
      if (teamId) {
        try {
          const teamDoc = await getDoc(doc(database, "teams", teamId));
          if (teamDoc.exists()) {
            const teamData = teamDoc.data();
            setTeam({
              id: teamDoc.id,
              name: teamData.name || "",
              category: teamData.category || "",
            });
          }
        } catch (error) {
          console.error("Error cargando equipo:", error);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error cargando jugador:", error);
      setLoading(false);
    }
  };

  const getCategoryInSpanish = (category: string) => {
    const categoryMap: { [key: string]: string } = {
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
    return categoryMap[category] || category;
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return "No especificada";

    try {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDifference = today.getMonth() - birth.getMonth();

      if (
        monthDifference < 0 ||
        (monthDifference === 0 && today.getDate() < birth.getDate())
      ) {
        age--;
      }

      return `${age} años`;
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const calculateIMC = (weight: number, height: number) => {
    if (height > 0 && weight > 0) {
      const imc = weight / Math.pow(height / 100, 2);
      return imc.toFixed(1);
    }
    return "No disponible";
  };

  const handleDeletePlayer = async () => {
    try {
      await deleteDoc(doc(database, "players", id!));
      setDeleteModalVisible(false);
      router.push("/player");
    } catch (error) {
      console.error("Error eliminando jugador:", error);
      alert("Error al eliminar el jugador");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-4 text-gray-600">Cargando jugador...</Text>
      </View>
    );
  }

  if (!player) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <Text className="text-xl text-gray-800 mb-4">
          Jugador no encontrado
        </Text>
        <TouchableOpacity
          className="bg-blue-600 px-6 py-3 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-blue-600 pt-4 pb-6 px-4">
        <TouchableOpacity className="mb-4" onPress={() => router.back()}>
          <Text className="text-white font-semibold">← Volver a Jugadores</Text>
        </TouchableOpacity>

        <Text className="text-3xl font-bold text-white mb-2">
          {player.name} {player.lastName}
        </Text>
      </View>

      {/* Información del jugador */}
      <ScrollView className="p-4">
        {/* Información básica */}
        <View className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Información Personal
          </Text>

          <View>
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600 font-medium">
                Nombre completo:
              </Text>
              <Text className="text-gray-800">
                {player.name} {player.lastName}
              </Text>
            </View>

            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600 font-medium">
                Fecha de nacimiento:
              </Text>
              <Text className="text-gray-800">
                {player.age || "No especificada"}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-600 font-medium">Edad:</Text>
              <Text className="text-gray-800">{calculateAge(player.age)}</Text>
            </View>
          </View>
        </View>

        {/* Información física */}
        <View className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Información Física
          </Text>

          <View>
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600 font-medium">Altura:</Text>
              <Text className="text-gray-800">{player.height} cm</Text>
            </View>

            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600 font-medium">Peso:</Text>
              <Text className="text-gray-800">{player.weight} kg</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-600 font-medium">IMC:</Text>
              <Text className="text-gray-800">
                {calculateIMC(player.weight, player.height)}
              </Text>
            </View>
          </View>
        </View>

        {/* Información deportiva */}
        <View className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Información Deportiva
          </Text>

          <View>
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600 font-medium">Posición:</Text>
              <Text className="text-gray-800">
                {player.position || "No especificada"}
              </Text>
            </View>

            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600 font-medium">Equipo:</Text>
              <Text className="text-gray-800">
                {team
                  ? team.name
                  : player.teamId
                    ? "Cargando..."
                    : "Sin equipo"}
              </Text>
            </View>

            {team && (
              <View className="flex-row justify-between">
                <Text className="text-gray-600 font-medium">Categoría:</Text>
                <Text className="text-gray-800">
                  {getCategoryInSpanish(team.category)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Botón de entrenamiento */}
        <View className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <TouchableOpacity
            className="bg-green-600 py-4 rounded-lg flex-row justify-center items-center mb-3"
            onPress={() => {
              // Navegar directamente a la página de entrenamiento
              router.push({
                pathname: "/training/[id]" as const,
                params: {
                  id: player.id,
                  exercise: "Entrenamiento General", // Ejercicio por defecto
                  playerName: `${player.name} ${player.lastName}`,
                },
              });
            }}
          >
            <Text className="text-white font-bold text-lg mr-2">🏃‍♂️</Text>
            <Text className="text-white font-bold text-lg">
              Iniciar Entrenamiento
            </Text>
          </TouchableOpacity>

          {/* Botón de eliminar jugador */}
          <TouchableOpacity
            className="bg-red-600 py-4 rounded-lg flex-row justify-center items-center"
            onPress={() => setDeleteModalVisible(true)}
          >
            <Text className="text-white font-bold text-lg mr-2">🗑️</Text>
            <Text className="text-white font-bold text-lg">
              Eliminar Jugador
            </Text>
          </TouchableOpacity>
        </View>

        {/* Información adicional */}
        <View className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
          <Text className="text-sm text-blue-800 text-center">
            Presiona "Iniciar Entrenamiento" para comenzar una sesión de
            monitoreo con Movesense
          </Text>
        </View>
      </ScrollView>

      {/* Modal de confirmación para eliminar */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white p-6 rounded-lg w-80">
            <Text className="text-xl font-bold mb-4 text-center text-red-600">
              ⚠️ Confirmar Eliminación
            </Text>

            <Text className="text-gray-700 text-center mb-6">
              ¿Estás seguro de que deseas eliminar a{" "}
              <Text className="font-bold">
                {player?.name} {player?.lastName}
              </Text>
              ?
            </Text>

            <Text className="text-sm text-gray-500 text-center mb-6">
              Esta acción no se puede deshacer.
            </Text>

            <View className="flex-row justify-between">
              <TouchableOpacity
                className="bg-gray-500 py-3 px-6 rounded-lg flex-1 mr-2"
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text className="text-white text-center font-semibold">
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-red-600 py-3 px-6 rounded-lg flex-1 ml-2"
                onPress={handleDeletePlayer}
              >
                <Text className="text-white text-center font-semibold">
                  Eliminar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
