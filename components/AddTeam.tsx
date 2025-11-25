import { addDoc, collection } from "firebase/firestore";
import React, { useState } from "react";
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

interface AddTeamProps {
  modalVisible?: boolean;
  setModalVisible?: (visible: boolean) => void;
}

interface CategoryItem {
  label: string;
  value: string;
}

const AddTeam: React.FC<AddTeamProps> = ({ setModalVisible }) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [modalCategoryVisible, setModalCategoryVisible] = useState(false);

  const categories: CategoryItem[] = [
    { label: "Seleccionar categoría", value: "" },
    { label: "Primer Equipo", value: "primer_equipo" },
    { label: "Segundo Equipo", value: "segundo_equipo" },
    { label: "Juvenil", value: "juvenil" },
    { label: "Cadete", value: "cadete" },
    { label: "Infantil", value: "infantil" },
    { label: "Alevín", value: "alevin" },
    { label: "Benjamín", value: "benjamin" },
    { label: "Prebenjamín", value: "prebenjamin" },
    { label: "Femenino", value: "femenino" },
    { label: "Veteranos", value: "veteranos" },
  ];

  const handleAddTeam = async () => {
    if (!name.trim() || !category) {
      alert("Por favor completa todos los campos");
      return;
    }

    try {
      const teamData = {
        name: name.trim(),
        category,
        createdAt: new Date(),
        players: [], // Array de IDs de jugadores
      };

      await addDoc(collection(database, "teams"), teamData);

      // Reset form
      setName("");
      setCategory("");
      alert("Equipo creado exitosamente");

      // Cerrar modal si está disponible
      if (setModalVisible) {
        setModalVisible(false);
      }
    } catch (error) {
      console.error("Error añadiendo equipo: ", error);
      alert("Hubo un error al crear el equipo");
    }
  };

  return (
    <ScrollView style={{ maxHeight: 400 }}>
      <View className="p-2">
        <Text className="text-xl font-bold text-gray-800 mb-4 text-center">
          Nuevo Equipo
        </Text>

        {/* Nombre del equipo */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-gray-700 mb-2">
            Nombre del Equipo
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800"
            placeholder="Real Madrid CF"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Categoría */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-gray-700 mb-2">
            Categoría
          </Text>
          <TouchableOpacity
            className="bg-gray-50 border border-gray-200 rounded-lg p-3"
            onPress={() => setModalCategoryVisible(true)}
          >
            <Text className="text-gray-800">
              {category
                ? categories.find((c) => c.value === category)?.label
                : "Seleccionar categoría"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Modal para seleccionar categoría */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalCategoryVisible}
          onRequestClose={() => setModalCategoryVisible(false)}
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
                Seleccionar Categoría
              </Text>
              <FlatList
                data={categories}
                keyExtractor={(item: CategoryItem) => item.value}
                renderItem={({ item }: { item: CategoryItem }) => (
                  <TouchableOpacity
                    className="p-3 border-b border-gray-200"
                    onPress={() => {
                      setCategory(item.value);
                      setModalCategoryVisible(false);
                    }}
                  >
                    <Text className="text-gray-800 text-base">
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                className="mt-4 bg-gray-500 rounded-lg p-3"
                onPress={() => setModalCategoryVisible(false)}
              >
                <Text className="text-white text-center font-semibold">
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Botón Submit */}
        <TouchableOpacity
          className="bg-blue-600 rounded-lg p-4 items-center shadow-md mt-4"
          onPress={handleAddTeam}
        >
          <Text className="text-white font-bold text-lg">Crear Equipo</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default AddTeam;
