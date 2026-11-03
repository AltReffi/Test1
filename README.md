# Whist-regnskab

Pointtæller til dansk es-makker whist. Denne første del er **pointmotoren**: ren TypeScript uden afhængigheder, så den kan bruges direkte i en Expo-app (React Native).

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
npm install
npm test          # tests, inkl. regneeksemplerne fra jeberg.eu
npm run typecheck
```

## Kilder
- https://whist.dk/whist-regler
- https://hjerteres.dk/kortspil/es-makker-whist/
- https://www.jeberg.eu/whist/whist-regler/
