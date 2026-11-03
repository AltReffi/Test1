# Status og overdragelse

Senest opdateret: 3. november 2026. Læs denne fil først i en ny session.

## Mål
En dansk **pointtæller til es-makker whist** i App Store (og senere Google Play). Den skal mindst tjene Apples udviklerlicens på 99 $ hjem.
- **Forretningsmodel:** betalt app til ca. 29 kr. uden køb i appen og uden reklamer. Ca. 35 salg om året dækker licensen.
- **Målgruppe:** danske kortklubber og vennegrupper. Konkurrenterne er enten udenlandske (Whist Buddy, Whist Scorer), en forladt dansk app (Whist Numbers) eller et browserspil uden regnskab til rigtige kort (whist.dk).

## Ejeren
- Vibe-coder med Claude Code eller Codex, har en Mac og skriver på dansk.
- **Har endnu ikke Apples udviklerkonto.** Appen testes i Expo Go. EAS og TestFlight sættes op, når kontoen er købt.
- Gruppen spiller altid med 4 spillere og bruger whist.dk's regler som udgangspunkt.

## Teknik
- Expo SDK 58, Expo Router (`src/app/`), TypeScript strict, AsyncStorage. Kun pakker, der er med i Expo Go.
- Ingen server og ingen login. Alt gemmes lokalt på telefonen.
- Webunderstøttelse (`react-native-web`) er installeret, så appen kan testes i en browser.

| Mappe | Indhold |
|---|---|
| `src/scoring/` | Pointmotor (ren TS). Regelsæt i `systems.ts`, beregning i `engine.ts`, afregning i `settle.ts` |
| `src/game/` | Spilmodel (`model.ts`), statistik (`stats.ts`), lagring og context (`store.tsx`) |
| `src/app/` | Skærme: forside, nyt spil, stillingstavle, runde, afregning, regler for spillet, egne regelsæt, statistik |
| `src/ui/` | Chips, knapper, tema (lyst/mørkt), `RuleEditor`, `MoneyPicker` |

## Færdigt
1. Pointmotor med tre regelsæt: **whist.dk** (standard), **Hjerteres.dk** og **Klassisk takst (jeberg.eu)**. Testet mod regneeksemplerne fra kilderne.
2. Nyt spil med præcis 4 spillere, valg af regelsæt og kroner til/fra.
3. Indtastning af runder: melding/påhæng/makker/selvmakker/stik, sol (også flere samtidig) og alle pas. Pointene vises undervejs, og meldestigen viser hjemme / pr. overstik / ét bet.
4. Stillingstavle, hvor man kan rette og slette runder.
5. Afregning i kroner med færrest mulige overførsler. Kroner kan slås til og fra, og indsatsen går fra 1 øre til 1 kr. pr. point.
6. Statistik over tid (altid, i år, 30 dage):
   - stilling og sejre
   - hvor ofte meldinger går hjem, og om man melder for højt eller lavt
   - selvmakker, som makker og sol
   - bedste og værste runde
   - makkerpar
7. Egne regelsæt i appen, som gemmes til nye spil. Reglerne kan også rettes i et igangværende spil, hvorefter alle runder regnes om. Ændringer, der gør tidligere runder ugyldige, afvises.

## Vigtige beslutninger og antagelser
- **4 spillere:** Ingen af kilderne beskriver es-makker whist med 5 spillere, så muligheden er fjernet. Motoren understøtter stadig `seated` pr. runde.
- **whist.dk:** bordlægger giver 150 og ren bordlægger 200. Tallene er læst direkte fra https://whist.dk/whist-regler.
- **Hjerteres:** tabt trumfmelding koster dobbelt takst. Det er en antagelse, da siden kun siger det om sol.
- **jeberg.eu:** taksterne G=10, S=50 og SS=200 er valgte standardværdier. Ifølge reglerne aftales de ved bordet.
- **Regelsæt pr. spil:** hvert spil gemmer sin egen kopi i `game.system`. Ældre spil uden feltet bruger `systemId`, og ældre spil uden `moneyEnabled` regnes som "til", når `oerePerPoint > 0`. Brug altid `gameSystem(game)` og `stakeOere(game)`.
- **Spillere i statistikken** genkendes på navnet, uden forskel på store og små bogstaver. Den seneste stavemåde vises.
- **Ikke med endnu (husregler):** at gå med i en vip eller en sol, kvarte, stærke, jernhånd.

## Næste skridt (forslag)
1. **Test ved et rigtigt bord** i Expo Go og ret det, der føles langsomt eller forkert.
2. App-ikon, splash og endeligt navn. `assets/` indeholder stadig Expos standardbilleder.
3. Deling af resultatet, fx som billede eller tekst efter afregningen.
4. Backup/eksport af data (alt ligger kun på telefonen).
5. Bordvisning til iPad.
6. Husregler (se ovenfor), hvis gruppen bruger dem.
7. Når udviklerkontoen er købt:
   - `eas.json` og EAS Build
   - TestFlight
   - App Store-side med skærmbilleder og privatlivserklæring ("indsamler ingen data")
   - Small Business Program (Apple tager 15 % i stedet for 30 %)

## Sådan verificeres ændringer
```bash
npm test             # vitest: motor, model og statistik
npx expo start --web # genererer også rutetyper (.expo/types), som tsc skal bruge efter nye ruter
npx tsc --noEmit
npx expo lint
npx expo-doctor
```
Browsertest: start `npx expo start --web --port 8081` og kør Playwright med `devices['iPhone 13']`.

## Faldgruber
- **Skjulte skærme under modalvinduer:** skærmen bagved et modalvindue ligger stadig skjult i DOM'en på web. Brug `:visible` eller `getByRole`, når du vælger elementer i Playwright.
- **Lint (`react-hooks`):**
  - forbyder `Date.now()` under render. Læg det i model-funktioner.
  - forbyder `setState` i effects. Brug mønsteret, hvor tilstanden justeres under render (se `NumberField` i `RuleEditor.tsx`, som sammenligner med `Object.is` på grund af NaN).
- **`pkill -f "expo start"` kan dræbe den shell, der kører kommandoen.** Brug mønsteret `pkill -f "[e]xpo start --web"`.
