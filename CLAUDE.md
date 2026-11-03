@AGENTS.md

## Projektet

- Pointtæller til dansk es-makker whist. Al tekst i appen er på dansk.
- `src/scoring/` er pointmotoren (ren TypeScript, ingen React). Ændringer her skal have tests i `engine.test.ts`.
- `src/game/` er spilmodel og lagring (AsyncStorage). `src/app/` er skærmene (Expo Router). `src/ui/` er fælles komponenter og tema.
- Kør `npm test` og `npm run typecheck`, før en opgave er færdig.
- Appen skal kunne køre i Expo Go: tilføj kun pakker, som Expo-dokumentationen markerer "Included in Expo Go".
