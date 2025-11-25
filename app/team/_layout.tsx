import { Stack } from "expo-router";

export default function TeamLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Equipo",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Equipo",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
