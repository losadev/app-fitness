import { Stack } from "expo-router";

export default function PlayerLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Jugador",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
