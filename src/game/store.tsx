import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Round, ScoringSystem } from "@/scoring";
import { mergeBackup, type Backup, type MergeResult } from "./backup";
import type { Game } from "./model";

const GAMES_KEY = "whist:games:v1";
const SYSTEMS_KEY = "whist:systems:v1";

interface GamesContextValue {
  loaded: boolean;
  games: Game[];
  /** Egne regelsæt, der kan vælges ved nyt spil. */
  customSystems: ScoringSystem[];
  getGame: (id: string) => Game | undefined;
  createGame: (game: Game) => void;
  deleteGame: (id: string) => void;
  updateGame: (id: string, patch: Partial<Omit<Game, "id" | "rounds">>) => void;
  addRound: (gameId: string, round: Round) => void;
  updateRound: (gameId: string, index: number, round: Round) => void;
  deleteRound: (gameId: string, index: number) => void;
  /** Opret eller opdater et eget regelsæt (matcher på id). */
  saveCustomSystem: (system: ScoringSystem) => void;
  deleteCustomSystem: (id: string) => void;
  /** Flet en backup ind uden at slette noget. */
  importBackup: (backup: Backup) => MergeResult;
}

const GamesContext = createContext<GamesContextValue | null>(null);

/** Gemmer `value` under `key`, men først når data er indlæst, og ikke lige efter indlæsningen. */
function usePersist<T>(key: string, value: T, loaded: boolean) {
  const skip = useRef(true);
  useEffect(() => {
    if (!loaded) return;
    if (skip.current) {
      skip.current = false;
      return;
    }
    AsyncStorage.setItem(key, JSON.stringify(value)).catch((e) => console.warn(`Kunne ikke gemme ${key}`, e));
  }, [key, value, loaded]);
}

export function GamesProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<Game[]>([]);
  const [customSystems, setCustomSystems] = useState<ScoringSystem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([GAMES_KEY, SYSTEMS_KEY])
      .then((entries) => {
        const map = Object.fromEntries(entries);
        if (map[GAMES_KEY]) setGames(JSON.parse(map[GAMES_KEY]) as Game[]);
        if (map[SYSTEMS_KEY]) setCustomSystems(JSON.parse(map[SYSTEMS_KEY]) as ScoringSystem[]);
      })
      .catch((e) => console.warn("Kunne ikke indlæse data", e))
      .finally(() => setLoaded(true));
  }, []);

  usePersist(GAMES_KEY, games, loaded);
  usePersist(SYSTEMS_KEY, customSystems, loaded);

  const mutateGame = useCallback((id: string, fn: (g: Game) => Game) => {
    setGames((prev) => prev.map((g) => (g.id === id ? { ...fn(g), updatedAt: Date.now() } : g)));
  }, []);

  const value = useMemo<GamesContextValue>(
    () => ({
      loaded,
      games,
      customSystems,
      getGame: (id) => games.find((g) => g.id === id),
      createGame: (game) => setGames((prev) => [game, ...prev]),
      deleteGame: (id) => setGames((prev) => prev.filter((g) => g.id !== id)),
      updateGame: (id, patch) => mutateGame(id, (g) => ({ ...g, ...patch })),
      addRound: (id, round) => mutateGame(id, (g) => ({ ...g, rounds: [...g.rounds, round] })),
      updateRound: (id, index, round) =>
        mutateGame(id, (g) => ({ ...g, rounds: g.rounds.map((r, i) => (i === index ? round : r)) })),
      deleteRound: (id, index) => mutateGame(id, (g) => ({ ...g, rounds: g.rounds.filter((_, i) => i !== index) })),
      saveCustomSystem: (system) =>
        setCustomSystems((prev) =>
          prev.some((s) => s.id === system.id) ? prev.map((s) => (s.id === system.id ? system : s)) : [...prev, system],
        ),
      deleteCustomSystem: (id) => setCustomSystems((prev) => prev.filter((s) => s.id !== id)),
      importBackup: (backup) => {
        const result = mergeBackup(games, customSystems, backup);
        setGames(result.games);
        setCustomSystems(result.customSystems);
        return result;
      },
    }),
    [games, customSystems, loaded, mutateGame],
  );

  return <GamesContext.Provider value={value}>{children}</GamesContext.Provider>;
}

export function useGames(): GamesContextValue {
  const ctx = useContext(GamesContext);
  if (!ctx) throw new Error("useGames skal bruges inden i <GamesProvider>");
  return ctx;
}
