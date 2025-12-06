import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { EXERCISES, ExerciseConfig } from "../constants/exercises";

interface ExerciseSelectorProps {
  onSelectExercise: (exercise: ExerciseConfig) => void;
  selectedExercise?: ExerciseConfig;
}

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  onSelectExercise,
  selectedExercise,
}) => {
  const lowerBodyExercises = Object.values(EXERCISES).filter(
    (ex) => ex.category === "lower"
  );
  const upperBodyExercises = Object.values(EXERCISES).filter(
    (ex) => ex.category === "upper"
  );

  const renderExercise = (exercise: ExerciseConfig) => {
    const isSelected = selectedExercise?.id === exercise.id;

    return (
      <TouchableOpacity
        key={exercise.id}
        className={`p-4 mb-3 rounded-lg border-2 ${
          isSelected
            ? "bg-blue-500 border-blue-600"
            : "bg-gray-800 border-gray-700"
        }`}
        onPress={() => onSelectExercise(exercise)}
      >
        <Text
          className={`text-lg font-bold ${
            isSelected ? "text-white" : "text-gray-100"
          }`}
        >
          {exercise.nameEs}
        </Text>
        <Text
          className={`text-sm ${
            isSelected ? "text-blue-100" : "text-gray-400"
          }`}
        >
          {exercise.name}
        </Text>
        <View className="flex-row mt-2 gap-2">
          <View className="bg-gray-700 px-2 py-1 rounded">
            <Text className="text-xs text-gray-300">
              {exercise.category === "lower"
                ? "Tren Inferior"
                : "Tren Superior"}
            </Text>
          </View>
          <View className="bg-gray-700 px-2 py-1 rounded">
            <Text className="text-xs text-gray-300">
              {exercise.imuDetection.primaryAxis.toUpperCase()} axis
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView className="flex-1">
      <View className="p-4">
        <Text className="text-2xl font-bold text-white mb-4">
          Selecciona Ejercicio
        </Text>

        {/* Tren Inferior */}
        <View className="mb-6">
          <Text className="text-xl font-semibold text-blue-400 mb-3">
            💪 Tren Inferior
          </Text>
          {lowerBodyExercises.map(renderExercise)}
        </View>

        {/* Tren Superior */}
        <View>
          <Text className="text-xl font-semibold text-orange-400 mb-3">
            🏋️ Tren Superior
          </Text>
          {upperBodyExercises.map(renderExercise)}
        </View>
      </View>
    </ScrollView>
  );
};
