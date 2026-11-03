# Handoff: Afgangs-app (næste tog/S-tog/metro ud fra lokation)

*Overdraget fra cloud-session 3. november 2026. Fortsættes lokalt på MacBook.*

## Mål

En personlig app, der ud fra brugerens GPS-position viser, hvornår næste tog, S-tog og metro afgår fra de nærmeste stationer. Senere skal bus med, og måske fly.

- **Brugere:** Kun ejeren og den nærmeste familie. Appen er ikke-kommerciel og skal ikke udgives.
- **Sprog:** Dansk i samtale og UI.

## Status

| Punkt | Status |
|---|---|
| Dataanalyse | ✅ Færdig. Se `docs/dataanalyse.md` |
| Konklusion | ✅ Modellen holder. Rejseplanen dækker alt undtagen fly |
| Ansøgning om API 2.0-nøgle | ⏳ **Sendt via labs.rejseplan.dk som privat bruger, afventer svar på mail** |
| Kode | ❌ Ikke påbegyndt. Ejeren vil først have API-adgangen afklaret |

**Regel:** Byg ikke app-kode, før nøglen er modtaget og de tre testkald nedenfor er kørt og vurderet, medmindre ejeren selv beder om det.

## Datakilder (afgjort)

1. **Rejseplanen GTFS (statisk)**
   - URL: `https://www.rejseplanen.info/labs/GTFS.zip`
   - Kræver ingen nøgle (verificeret). Licens CC BY 4.0. Opdateres ca. dagligt.
   - Indeholder: DSB, Øresundståg, S-tog (A, B, Bx, C, E, F, H), Metro M1–M4 med konkrete ture, letbaner, ca. 1.550 buslinjer og færger.
   - **Bruges til:** Stationsindeks og find nærmeste station lokalt, så det ikke koster API-kald. Fallback med planlagte tider.
2. **Rejseplanen API 2.0** (HAFAS ReST, serverversion 2.53)
   - Base-URL: `https://www.rejseplanen.dk/api/`
   - Kræver parameteren `accessId` (verificeret: uden den svarer API'et `API_PARAM: Missing value for required param accessId`).
   - Gratis ikke-kommerciel kvote: **50.000 kald om måneden**, ca. 1.650 om dagen, delt af hele familien.
   - **Tjenester:**
     - `departureBoard` (kernen, giver `rtTime`, `rtTrack` og aflysninger)
     - `location.nearbystops`
     - `himsearch` (driftsforstyrrelser)
     - `journeyDetail`

**Fravalgt:** Dataudveksleren (SIRI-ET/NeTEx er for tungt og muligvis betalt), Banedanmark og Metroselskabet (ingen åbne API'er, deres data går via Rejseplanen) og fly (kun kommercielle udbydere, udskudt).

## Spørgsmål stillet til Labs i ansøgningen (afventer svar)

1. Må én privat nøgle deles af en lille husstand?
2. Leverer API 2.0 realtid for metroen, eller kun planlagte tider? En tredjepart påstår kun planlagte tider.

## Når nøglen kommer: første opgave

Gem nøglen i `.env` som `REJSEPLANEN_ACCESS_ID=...`. **Nøglen må aldrig committes**, og `.env` står i `.gitignore`.

Kør disse kald:

```bash
source .env
curl "https://www.rejseplanen.dk/api/departureBoard?accessId=$REJSEPLANEN_ACCESS_ID&id=8600626&format=json"
curl "https://www.rejseplanen.dk/api/location.nearbystops?accessId=$REJSEPLANEN_ACCESS_ID&originCoordLat=55.6833&originCoordLong=12.5717&format=json"
curl "https://www.rejseplanen.dk/api/himsearch?accessId=$REJSEPLANEN_ACCESS_ID&format=json"
```

- **Kald 1:** København H. Stop-id'et `8600626` er ikke bekræftet. Hvis kaldet fejler, så find id'et via `nearbystops`.
- **Kald 2:** Nørreport. Find metrostationens id i svaret, kør `departureBoard` mod det og tjek, om afgangene har `rtTime`. Det afgør spørgsmål 2.
- **Kald 3:** Driftsforstyrrelser.

**Vurder svarene:**
- Har tog og S-tog `rtTime` og `rtTrack`?
- Har metroen realtid?
- Understøtter `departureBoard` flere stop i ét kald? Det er usikkert, og det har stor betydning for kvoten.
- Matcher stop-id'erne i API'et `stop_id` i GTFS? En tredjepart nævner, at de matcher, når foranstillede nuller fjernes.

## Planlagt arkitektur (MVP, når API'et er bekræftet)

1. Et dagligt job henter GTFS-filen og bygger et lille stationsindeks (under 1 MB) med koordinater og transporttyper pr. station.
2. Klienten bruger GPS til at finde de 3–5 nærmeste stationer med tog, S-tog eller metro.
3. Klienten kalder `departureBoard` for hver station, men kun mens appen er åben og i forgrunden. Svar gemmes i 30–60 sekunder.
4. Hvis kvoten er brugt op eller nøglen mangler, vises planlagte tider fra GTFS.
5. Appen viser attributionen "Data: Rejseplanen (CC BY 4.0)".

**Ikke besluttet:** Platform (PWA, iOS eller andet) og om der skal være en lille backend. Med en backend kan familien dele cache og nøgle uden at nøglen ligger i klienten. Det er sandsynligvis den bedste løsning. Spørg ejeren.

## Arbejdsstil (ejerens præferencer)

- Vær direkte og kortfattet, og ros kun det, der er ekstraordinært.
- Giv altid et svar, og marker usikkerhed eksplicit.
- Stil højst ét afklarende spørgsmål ad gangen.
- Advar, hvis tråden bliver for lang.

## Repo

- Repository: `altreffi/test1`
- Branch: `claude/upbeat-hamilton-xj7zem`
