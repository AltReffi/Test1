import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Round } from "@/scoring";
import type { Game } from "./model";

const STORAGE_KEY = "whist:games:v1";

interface GamesContextValue {
  loaded: boolean;
  games: Game[];
  getGame: (id: string) => Game | undefined;
  createGame: (game: Game) => void;
  deleteGame: (id: string) => void;
  addRound: (gameId: string, round: Round) => void;
  updateRound: (gameId: string, index: number, round: Round) => void;
  deleteRound: (gameId: string, index: number) => void;
}

const GamesContext = createContext<GamesContextValue | null>(null);

export function GamesProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<Game[]>([]);
  const [loaded, setLoaded] = useState(false);
  const skipNextSave = useRef(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setGames(JSON.parse(raw) as Game[]);
      })
      .catch((e) => console.warn("Kunne ikke indlæse spil", e))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(games)).catch((e) => console.warn("Kunne ikke gemme spil", e));
  }, [games, loaded]);

  const mutateGame = useCallback((id: string, fn: (g: Game) => Game) => {
    setGames((prev) => prev.map((g) => (g.id === id ? { ...fn(g), updatedAt: Date.now() } : g)));
  }, []);

  const value = useMemo<GamesContextValue>(
    () => ({
      loaded,
      games,
      getGame: (id) => games.find((g) => g.id === id),
      createGame: (game) => setGames((prev) => [game, ...prev]),
      deleteGame: (id) => setGames((prev) => prev.filter((g) => g.id !== id)),
      addRound: (id, round) => mutateGame(id, (g) => ({ ...g, rounds: [...g.rounds, round] })),
      updateRound: (id, index, round) =>
        mutateGame(id, (g) => ({ ...g, rounds: g.rounds.map((r, i) => (i === index ? round : r)) })),
      deleteRound: (id, index) => mutateGame(id, (g) => ({ ...g, rounds: g.rounds.filter((_, i) => i !== index) })),
    }),
    [games, loaded, mutateGame],
  );

  return <GamesContext.Provider value={value}>{children}</GamesContext.Provider>;
}

export function useGames(): GamesContextValue {
  const ctx = useContext(GamesContext);
  if (!ctx) throw new Error("useGames skal bruges inden i <GamesProvider>");
  return ctx;
}
