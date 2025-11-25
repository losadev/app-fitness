import { addDoc, collection, doc, getDocs, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { database } from "../FirebaseConfig";

interface AddUserProps {
  modalVisible?: boolean;
  setModalVisible?: (visible: boolean) => void;
}

interface Team {
  id: string;
  name: string;
  category: string;
}

const AddUser: React.FC<AddUserProps> = ({ setModalVisible }) => {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [altura, setAltura] = useState("");
  const [peso, setPeso] = useState("");
  const [posicion, setPosicion] = useState("");
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<Team | null>(
    null
  );
  const [teams, setTeams] = useState<Team[]>([]);
  const [modalTeamVisible, setModalTeamVisible] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

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
      console.error("Error obteniendo equipos: ", error);
    }
  };

  const handleAddUser = async () => {
    if (!nombre.trim() || !apellido.trim()) {
      alert("Por favor completa al menos el nombre y apellido");
      return;
    }

    try {
      const playerData = {
        name: nombre.trim(),
        lastName: apellido.trim(),
        age: fechaNacimiento.trim() || "",
        height: altura ? parseFloat(altura) : 0,
        weight: peso ? parseFloat(peso) : 0,
        position: posicion.trim() || "",
        teamId: equipoSeleccionado
          ? doc(database, "teams", equipoSeleccionado.id)
          : null,
      };

      await addDoc(collection(database, "players"), playerData);

      // Reset form
      setNombre("");
      setApellido("");
      setFechaNacimiento("");
      setAltura("");
      setPeso("");
      setPosicion("");
      setEquipoSeleccionado(null);

      alert("Jugador añadido exitosamente");

      // Cerrar modal si está disponible
      if (setModalVisible) {
        setModalVisible(false);
      }
    } catch (error) {
      console.error("Error añadiendo jugador: ", error);
      alert("Hubo un error al añadir el jugador");
    }
  };

  return (
    <ScrollView style={{ maxHeight: 400 }}>
      <View className="p-2">
        <Text className="text-xl font-bold text-gray-800 mb-4 text-center">
          Formulario de Jugador
        </Text>

        {/* Nombre */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-gray-700 mb-2">
            Nombre *
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800"
            placeholder="Ingresa el nombre"
            value={nombre}
            onChangeText={setNombre}
          />
        </View>

        {/* Apellido */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-gray-700 mb-2">
            Apellido *
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800"
            placeholder="Ingresa el apellido"
            value={apellido}
            onChangeText={setApellido}
          />
        </View>

        {/* Fecha de Nacimiento */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-gray-700 mb-2">
            Fecha de Nacimiento * (YYYY-MM-DD)
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800"
            placeholder="1995-03-15"
            value={fechaNacimiento}
            onChangeText={setFechaNacimiento}
          />
        </View>

        {/* Altura */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-gray-700 mb-2">
            Altura (cm) *
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800"
            placeholder="175"
            value={altura}
            onChangeText={setAltura}
            keyboardType="numeric"
          />
        </View>

        {/* Peso */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-gray-700 mb-2">
            Peso (kg) *
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800"
            placeholder="70"
            value={peso}
            onChangeText={setPeso}
            keyboardType="numeric"
          />
        </View>

        {/* Posición */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-gray-700 mb-2">
            Posición
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800"
            placeholder="Mediocentro, Delantero, Portero..."
            value={posicion}
            onChangeText={setPosicion}
          />
        </View>

        {/* Equipo */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-gray-700 mb-2">
            Equipo
          </Text>
          <TouchableOpacity
            className="bg-gray-50 border border-gray-200 rounded-lg p-3"
            onPress={() => setModalTeamVisible(true)}
          >
            <Text className="text-gray-800">
              {equipoSeleccionado
                ? equipoSeleccionado.name
                : "Seleccionar equipo"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Modal para seleccionar equipo */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalTeamVisible}
          onRequestClose={() => setModalTeamVisible(false)}
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
                width: "80%",
                maxHeight: "60%",
              }}
            >
              <Text className="text-xl font-bold text-center mb-4">
                Seleccionar Equipo
              </Text>
              <FlatList
                data={teams}
                keyExtractor={(item: Team) => item.id}
                renderItem={({ item }: { item: Team }) => (
                  <TouchableOpacity
                    className="p-3 border-b border-gray-200"
                    onPress={() => {
                      setEquipoSeleccionado(item);
                      setModalTeamVisible(false);
                    }}
                  >
                    <Text className="text-gray-800 text-base font-semibold">
                      {item.name}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {item.category}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <View className="p-4">
                    <Text className="text-gray-500 text-center">
                      No hay equipos disponibles
                    </Text>
                    <Text className="text-gray-400 text-center text-sm mt-2">
                      Crea un equipo primero en la sección de Equipos
                    </Text>
                  </View>
                )}
              />
              <TouchableOpacity
                className="mt-4 bg-gray-500 rounded-lg p-3"
                onPress={() => setModalTeamVisible(false)}
              >
                <Text className="text-white text-center font-semibold">
                  Cancelar
                </Text>
              </TouchableOpacity>
              {equipoSeleccionado && (
                <TouchableOpacity
                  className="mt-2 bg-red-500 rounded-lg p-3"
                  onPress={() => {
                    setEquipoSeleccionado(null);
                    setModalTeamVisible(false);
                  }}
                >
                  <Text className="text-white text-center font-semibold">
                    Quitar Equipo
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>

        {/* Botón Submit */}
        <TouchableOpacity
          className="bg-blue-600 rounded-lg p-4 items-center shadow-md mt-4"
          onPress={() => handleAddUser()}
        >
          <Text className="text-white font-bold text-lg">Crear Jugador</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default AddUser;
