import { addDoc, collection } from "firebase/firestore";
import React, { useState } from "react";
import {
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

const AddUser: React.FC<AddUserProps> = ({ setModalVisible }) => {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [altura, setAltura] = useState("");
  const [peso, setPeso] = useState("");
  const [posicion, setPosicion] = useState("");
  const [equipo, setEquipo] = useState("");

  const handleAddUser = async () => {
    try {
      await addDoc(collection(database, "players"), {
        name: nombre,
        lastName: apellido,
        age: fechaNacimiento,
        height: parseFloat(altura),
        weight: parseFloat(peso),
        position: posicion,
        //team: equipo,
      });
      // Reset form
      setNombre("");
      setApellido("");
      setFechaNacimiento("");
      setAltura("");
      setPeso("");
      setPosicion("");
      setEquipo("");
      alert("Jugador añadido exitosamente");
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
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800"
            placeholder="Real Madrid"
            value={equipo}
            onChangeText={setEquipo}
          />
        </View>

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
