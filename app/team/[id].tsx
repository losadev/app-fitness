import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
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
  teamId: any; // Puede ser string o referencia
}

interface Team {
  id: string;
  name: string;
  category: string;
}

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);

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
    if (!id) return;

    fetchTeamDetails();
    fetchTeamPlayers();
  }, [id]);

  const fetchTeamDetails = async () => {
    try {
      const teamDoc = await getDoc(doc(database, "teams", id));
      if (teamDoc.exists()) {
        const data = teamDoc.data();
        setTeam({
          id: teamDoc.id,
          name: data.name || "",
          category: data.category || "",
        });
      }
    } catch (error) {
      console.error("Error obteniendo detalles del equipo:", error);
    }
  };

  const fetchTeamPlayers = () => {
    try {
      // Crear referencia al equipo
      const teamRef = doc(database, "teams", id);

      // Buscar jugadores que tengan esta referencia como teamId
      const unsubscribe = onSnapshot(
        collection(database, "players"),
        (querySnapshot) => {
          const playersData: Player[] = [];

          querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();

            // Verificar si el jugador pertenece a este equipo
            let belongsToTeam = false;

            if (data.teamId) {
              // Si teamId es una referencia de Firestore
              if (data.teamId.id === id) {
                belongsToTeam = true;
              }
              // Si teamId es un string (compatibilidad)
              else if (typeof data.teamId === "string" && data.teamId === id) {
                belongsToTeam = true;
              }
            }

            if (belongsToTeam) {
              playersData.push({
                id: docSnapshot.id,
                name: data.name || "",
                lastName: data.lastName || "",
                age: data.age || "",
                height: data.height || 0,
                weight: data.weight || 0,
                position: data.position || "",
                teamId: data.teamId,
              });
            }
          });

          // Ordenar jugadores por nombre
          playersData.sort((a, b) => a.name.localeCompare(b.name));
          setPlayers(playersData);
          setFilteredPlayers(playersData); // Inicializar lista filtrada
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("Error obteniendo jugadores del equipo:", error);
      setLoading(false);
    }
  };

  // Efecto para filtrar jugadores cuando cambia el texto de búsqueda
  useEffect(() => {
    filterPlayers();
  }, [searchText, players]);

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

      return matchesName || matchesLastName;
    });

    setFilteredPlayers(filtered);
  };
  const renderPlayer = ({ item }: { item: Player }) => (
    <View className="bg-white rounded-lg p-4 mx-4 my-2 shadow-md border border-gray-200">
      <Text className="text-lg font-bold text-gray-800 mb-1">
        {item.name} {item.lastName}
      </Text>
      <Text className="text-sm text-blue-600 mb-1">
        {item.position || "Sin posición"}
      </Text>
      <Text className="text-xs text-gray-500 mb-1">
        Altura: {item.height}cm | Peso: {item.weight}kg
      </Text>
      <Text className="text-xs text-gray-500">
        Fecha de nacimiento: {item.age || "No especificada"}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-blue-100 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-600 mt-2">Cargando equipo...</Text>
      </View>
    );
  }

  if (!team) {
    return (
      <View className="flex-1 bg-blue-100 justify-center items-center">
        <Text className="text-xl text-gray-800 mb-4">Equipo no encontrado</Text>
        <TouchableOpacity
          className="bg-blue-600 rounded-lg px-6 py-3"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-blue-100">
      {/* Header */}
      <View className="bg-blue-600 pt-4 pb-6 px-4">
        <TouchableOpacity className="mb-4" onPress={() => router.back()}>
          <Text className="text-white text-base">← Volver a Equipos</Text>
        </TouchableOpacity>

        <Text className="text-3xl font-bold text-white mb-2">{team.name}</Text>
        <Text className="text-blue-200 text-sm mb-4">
          {filteredPlayers.length}/{players.length}{" "}
          {players.length === 1 ? "jugador" : "jugadores"}
        </Text>

        {/* Campo de búsqueda */}
        <TextInput
          className="bg-white px-4 py-3 rounded-lg border border-blue-300"
          placeholder="Buscar jugador por nombre o apellido..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Lista de jugadores */}
      <View className="flex-1">
        {players.length > 0 ? (
          filteredPlayers.length > 0 ? (
            <FlatList
              data={filteredPlayers}
              keyExtractor={(item) => item.id}
              renderItem={renderPlayer}
              contentContainerStyle={{ paddingVertical: 16 }}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View className="flex-1 justify-center items-center px-6">
              <Text className="text-xl text-gray-600 text-center mb-2">
                No se encontraron jugadores que coincidan con la búsqueda
              </Text>
            </View>
          )
        ) : (
          <View className="flex-1 justify-center items-center px-6">
            <Text className="text-xl text-gray-600 text-center mb-2">
              No hay jugadores en este equipo
            </Text>
            <Text className="text-gray-500 text-center mb-6">
              Los jugadores aparecerán aquí cuando se asignen a este equipo
            </Text>
            <TouchableOpacity
              className="bg-blue-600 rounded-lg px-6 py-3"
              onPress={() => router.push("/player")}
            >
              <Text className="text-white font-semibold">Crear Jugador</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
