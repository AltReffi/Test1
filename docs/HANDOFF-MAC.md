# Overdragelse: fra cloud-sessionen til Claude på Mac

Kopiér hele teksten i boksen herunder ind i en ny Claude Code-samtale på din Mac (Terminal: skriv `claude`, eller Claude-appens Code-fane). Claude klarer resten.

```text
Du overtager et projekt fra en Claude-session i skyen. Ejeren vil lave så lidt som muligt selv, skriver dansk og vibe-coder. Gør trinene selv og spørg kun, når du er nødt til det (højst ét spørgsmål ad gangen).

PROJEKTET
Dansk pointtæller til es-makker whist (Expo SDK 58, Expo Router, TypeScript). GitHub: AltReffi/Test1. Alt arbejde ligger på grenen claude/laughing-goldberg-0k5p6x (ikke main).

1. KLARGØR
- Tjek at git og Node.js (LTS, 20 eller nyere) findes: `git --version`, `node --version`. Mangler Node, så bed ejeren hente LTS-installeren fra nodejs.org og vent. Mangler git, så kør `xcode-select --install` og bed ejeren trykke Installér.
- Hvis den aktuelle mappe allerede er en klon af AltReffi/Test1, så brug den. Ellers klon til ~/Udvikling/Test1: `mkdir -p ~/Udvikling && git clone https://github.com/AltReffi/Test1.git ~/Udvikling/Test1`. Kræver GitHub login, så forklar ejeren præcis hvad der skal trykkes (fx `gh auth login`, hvis GitHub CLI findes, ellers et personligt adgangstoken eller GitHub Desktop).
- `git checkout claude/laughing-goldberg-0k5p6x && git pull`, derefter `npm install`.
- Kør `npm test` og `npm run typecheck`. Begge skal være grønne (53 tests).

2. LÆS
Læs CLAUDE.md, AGENTS.md, docs/STATUS.md og docs/appstore/README.md. STATUS.md er sandheden om mål, beslutninger, hvad der er færdigt og næste skridt. Opdater den, når noget væsentligt ændres.

3. START APPEN PÅ TELEFONEN
- Kør `npx expo start` i baggrunden og bed ejeren scanne QR-koden med iPhonens kamera (Expo Go skal være installeret fra App Store, og telefon og Mac skal være på samme Wi-Fi). Virker forbindelsen ikke, så prøv `npx expo start --tunnel`.
- Giv ejeren denne tjekliste til første test (fra STATUS.md), og bed om tilbagemelding på det, der ikke virker:
  1. Spil et par runder: melding, sol, alle pas. Står giveren rigtigt?
  2. Ret og slet en runde (bekræftelsesdialogen kunne ikke testes i browseren).
  3. Afregning med kroner til, og "Del resultat" til Beskeder.
  4. Backup: "Gem backup" til Filer, og "Hent backup" igen.
  5. Hold fingeren på et spil på forsiden for at slette det.

4. ÅBNE BESLUTNINGER (spørg ejeren én ad gangen, når det passer)
- Godkend bundle ID `dk.whistregnskab.app` og navnet "Whist Regnskab" (bundle ID kan ikke ændres efter første upload til Apple).
- Kontakt-e-mail til privatlivspolitikken (docs/appstore/privatlivspolitik.md har pladsholderen "[din e-mail]"), og hvor politikken skal ligge offentligt.
- Skal grenen flettes ind i main? Anbefaling: ja, via en pull request, når første test i Expo Go er god.

5. DEREFTER
Næste skridt står i docs/STATUS.md. Når ejeren har købt Apples udviklerkonto: følg docs/appstore/README.md (EAS Build, TestFlight, App Store Connect), og tag rigtige skærmbilleder i iOS-simulatoren i stedet for kladderne i docs/appstore/skaermbilleder/.

REGLER
- Al tekst i appen er på dansk. Kun pakker, der er "Included in Expo Go". Installer med `npx expo install`.
- Kør `npm test`, `npm run typecheck` og `npx expo lint`, før noget er færdigt. Commit med klare danske beskeder, og push til grenen.
```

## Hvis du hellere vil gøre det selv
Se trin 1–3 i boksen: klon, `git checkout claude/laughing-goldberg-0k5p6x`, `npm install`, `npx expo start`.
