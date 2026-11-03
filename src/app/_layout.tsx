import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GamesProvider } from "@/game/store";
import { useTheme } from "@/ui/theme";

export default function RootLayout() {
  const t = useTheme();
  return (
    <GamesProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.bg },
          headerTintColor: t.accent,
          headerTitleStyle: { color: t.text },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: t.bg },
          headerBackButtonDisplayMode: "minimal",
        }}
      >
        <Stack.Screen name="index" options={{ title: "Whist Regnskab" }} />
        <Stack.Screen name="new" options={{ title: "Nyt spil" }} />
        <Stack.Screen name="stats" options={{ title: "Statistik" }} />
        <Stack.Screen name="backup" options={{ title: "Backup" }} />
        <Stack.Screen name="game/[id]/index" options={{ title: "Stilling" }} />
        <Stack.Screen name="game/[id]/round" options={{ title: "Runde", presentation: "modal" }} />
        <Stack.Screen name="game/[id]/settle" options={{ title: "Afregning" }} />
        <Stack.Screen name="game/[id]/stats" options={{ title: "Statistik for spillet" }} />
        <Stack.Screen name="game/[id]/rules" options={{ title: "Regler for spillet", presentation: "modal" }} />
        <Stack.Screen name="rules/[id]" options={{ title: "Regelsæt", presentation: "modal" }} />
      </Stack>
    </GamesProvider>
  );
}
