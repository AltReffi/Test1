# Whist-regnskab

Pointtæller til dansk es-makker whist, bygget med Expo (React Native) til iPhone og Android.

## Kør appen på din telefon (Expo Go)

1. Installer **Expo Go** fra App Store på din iPhone.
2. På din Mac (kræver Node.js 20 eller nyere):

```bash
git clone https://github.com/AltReffi/Test1.git whist && cd whist
```

```bash
git checkout claude/gallant-rubin-hje8da && npm install
```

```bash
npx expo start
```

3. Scan QR-koden med iPhonens kamera. Mac og telefon skal være på samme wifi.
   Tryk `i` i terminalen for at åbne appen i iOS-simulatoren i stedet, eller `w` for browseren.

## Det kan appen
- 4 spillere, som i es-makker whist.
- Valg af regelsæt (se nedenfor). Tryk "Tilpas regler" for at lave jeres egne: grundtakst, faktorer, tabt melding, stor slem og hvilke solmeldinger der bruges og hvad de giver. Egne regelsæt gemmes til næste spil.
- Ret reglerne i et igangværende spil via "Regler" øverst på stillingstavlen. Alle runder regnes om, og appen stopper dig, hvis en solmelding, der allerede er brugt, slås fra.
- Kroner kan slås til og fra, både ved nyt spil og under afregningen (1 øre – 1 kr. pr. point). Indsatsen huskes, når kroner er slået fra.
- Indtastning af en runde: melder, melding og påhæng, makker eller selvmakker, og antal stik. Pointene vises, mens du vælger.
- Sol, ren sol, bordlægger og ren bordlægger, også flere solmeldinger i samme spil.
- Stillingstavle med alle runder. Tryk på en runde for at rette eller slette den.
- Afregning i kroner med færrest mulige overførsler.
- Statistik over alle spil (altid, i år, 30 dage): samlet stilling, sejre, hvor ofte meldinger går hjem, om man melder for højt eller lavt, selvmakker, sol, bedste og værste runde og de bedste makkerpar. Spillere genkendes på navnet.
- Alt gemmes lokalt på telefonen. Ingen konto og ingen server.

## Struktur
- `src/scoring/` — pointmotoren (ren TypeScript, testet)
- `src/game/` — spilmodel og lagring
- `src/app/` — skærme (Expo Router)
- `src/ui/` — knapper, chips og farvetema (lyst og mørkt)

## Valgbare regelsæt

| System | Trumfmeldinger | Tabt melding | Sol / ren sol / bordlægger / ren bordlægger |
|---|---|---|---|
| **whist.dk** (standard) | 7=10, fordobles pr. stik. Påhæng ×2 | Dobbelt takst | 50 / 100 / 150 / 200 |
| **Hjerteres.dk** | Som whist.dk | Dobbelt takst* | 50 / 100 / 200 / – |
| **Klassisk takst (jeberg.eu)** | Grundtakst fordobles for stik, gode/sans, halve og hver vip | Dobbelt pr. manglende stik + stor slem-bonus | S / 2S / 4S / – |

Fælles for alle tre:
- Hvert overstik giver meldingens værdi.
- Melder og makker får beløbet hver, og hver modspiller betaler det.
- Er melderen selvmakker, betaler alle tre modspillere, så melderen får tre gange beløbet.
- En tabt sol koster dobbelt til hver modspiller.

Ethvert system kan tilpasses med `customizeSystem(base, { ... })`, fx med en anden grundtakst, andre solværdier eller en anden bonus for stor slem.

\* *Antagelse:* Hjerteres.dk nævner kun dobbelt takst ved tabt sol. Her er dobbelt takst også brugt ved tabte trumfmeldinger.
Takster i jeberg-systemet (G=10, S=50, SS=200) er standardværdier. Ifølge reglerne aftales de ved bordet.

## API

```ts
import { WHIST_DK, scoreRound, totals, bidLadder, settle } from "./src/scoring";

scoreRound(WHIST_DK, { type: "trump", seated: ["A","B","C","D"], bidder: "A", partner: "C",
                       bid: { level: 8, pahaeng: "vip" }, tricks: 9 });
// → { A: 80, B: -80, C: 80, D: -80 }

bidLadder(WHIST_DK, { level: 9, pahaeng: "ingen" }); // meldestige: udfald for 0–13 stik
settle(totals(WHIST_DK, players, rounds), 1);       // hvem skylder hvem (1 øre pr. point)
```

Runder kan have 5+ spillere i spillet. De fire, der sidder med i runden, angives i `seated`.

## Kommandoer

```bash
npm test          # tests, inkl. regneeksemplerne fra jeberg.eu
npm run typecheck
npx expo-doctor   # tjek at pakkerne passer til Expo-versionen
```

## Kilder
- https://whist.dk/whist-regler
- https://hjerteres.dk/kortspil/es-makker-whist/
- https://www.jeberg.eu/whist/whist-regler/
