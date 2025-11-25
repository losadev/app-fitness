import { useRouter } from "expo-router";
import { collection, getDocs, onSnapshot, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AddUser } from "../../components";
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

export default function PlayerScreen() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);

  useEffect(() => {
    // Cargar equipos primero
    fetchTeams();

    // Luego cargar jugadores
    const unsubscribe = onSnapshot(
      collection(database, "players"),
      (querySnapshot) => {
        const playersData: Player[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();

          // Extraer el teamId correctamente
          let teamId = "";
          if (data.teamId) {
            // Si teamId es una referencia de Firestore, extraer su id
            if (data.teamId.id) {
              teamId = data.teamId.id;
            }
            // Si teamId es un string, usarlo directamente (para compatibilidad)
            else if (typeof data.teamId === "string") {
              teamId = data.teamId;
            }
          }

          playersData.push({
            id: doc.id,
            name: data.name || "",
            lastName: data.lastName || "",
            age: data.age || "",
            height: data.height || 0,
            weight: data.weight || 0,
            position: data.position || "",
            teamId: teamId, // Ahora es siempre un string
          });
        });
        console.log("Jugadores cargados: ", playersData);

        setPlayers(playersData);
        setFilteredPlayers(playersData); // Inicialmente mostrar todos
      }
    );

    return () => unsubscribe();
  }, []);

  // Efecto para filtrar jugadores cuando cambia el texto de búsqueda
  useEffect(() => {
    filterPlayers();
  }, [searchText, players, teams]);

  const filterPlayers = () => {
    if (!searchText.trim()) {
      setFilteredPlayers(players);
      return;
    }

    const filtered = players.filter((player) => {
      const searchLower = searchText.toLowerCase();

      // Buscar por nombre
      const matchesName = player.name.toLowerCase().includes(searchLower);

      // Buscar por apellido
      const matchesLastName = player.lastName
        .toLowerCase()
        .includes(searchLower);

      // Buscar por equipo
      const team = teams.find((t) => t.id === player.teamId);
      const matchesTeam =
        team?.name.toLowerCase().includes(searchLower) || false;

      return matchesName || matchesLastName || matchesTeam;
    });

    setFilteredPlayers(filtered);
  };

  const fetchTeams = async () => {
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
        });
      });
      setTeams(teamsData);
    } catch (error) {
      console.error("Error cargando equipos: ", error);
    }
  };

  const renderPlayer = ({ item }: { item: Player }) => {
    // Asegurar que todos los valores sean strings o números válidos
    const playerName = String(item.name || "Sin nombre");
    const playerLastName = String(item.lastName || "Sin apellido");
    const playerPosition = String(item.position || "No especificada");
    const playerHeight = Number(item.height) || 0;
    const playerWeight = Number(item.weight) || 0;
    const playerAge = String(item.age || "No especificada");

    // Buscar el equipo por ID
    const team = teams.find((t) => t.id === item.teamId);
    const playerTeamName = team
      ? team.name
      : item.teamId
        ? "Equipo no encontrado"
        : "Sin equipo";

    return (
      <TouchableOpacity
        className="bg-white rounded-lg p-4 mb-3 mx-2 shadow-sm"
        onPress={() =>
          router.push({ pathname: "/player/[id]", params: { id: item.id } })
        }
      >
        <Text className="text-lg font-bold text-gray-800">
          {playerName} {playerLastName}
        </Text>
        <Text className="text-gray-600">Posición: {playerPosition}</Text>
        <Text className="text-gray-600">
          Altura: {playerHeight}cm | Peso: {playerWeight}kg
        </Text>
        <Text className="text-gray-600">Fecha: {playerAge}</Text>
        <Text className="text-gray-600">Equipo: {playerTeamName}</Text>
        <Text className="text-xs text-blue-500 mt-2">
          Toca para ver detalles →
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="p-4 bg-blue-600">
        <Text className="text-2xl font-bold text-white text-center">
          Gestión de Equipos
        </Text>
      </View>
      <View className="p-5">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold text-gray-800">
            Jugadores ({filteredPlayers.length}/{players.length})
          </Text>
          <TouchableOpacity
            className="bg-blue-600 px-4 py-2 rounded-lg"
            onPress={() => setModalVisible(true)}
          >
            <Text className="text-white font-semibold">Crear Jugador</Text>
          </TouchableOpacity>
        </View>

        {/* Campo de búsqueda */}
        <View className="mb-4">
          <TextInput
            className="bg-white px-4 py-3 rounded-lg border border-gray-300"
            placeholder="Buscar por nombre, apellido o equipo..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {players.length > 0 ? (
          filteredPlayers.length > 0 ? (
            <FlatList
              data={filteredPlayers}
              keyExtractor={(item) => item.id}
              renderItem={renderPlayer}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Text className="text-gray-600 text-center mt-10">
              No se encontraron jugadores que coincidan con la búsqueda
            </Text>
          )
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
    </SafeAreaView>
  );
}
