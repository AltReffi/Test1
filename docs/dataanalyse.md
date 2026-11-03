# Dataanalyse: Næste afgang ud fra lokation (Danmark)

*Udarbejdet 3. november 2026. Fund markeret **[verificeret]** er testet direkte; resten bygger på dokumentation og tredjepartskilder.*

## Konklusion

**Modellen holder: dataene findes, og de er gratis til ikke-kommerciel brug.** Tog, S-tog og metro (og bus, letbane og færge) dækkes af én kilde: Rejseplanen. Der er to forbehold, der former hele arkitekturen:

1. **Realtid kræver en gratis API-nøgle med et loft på 50.000 kald om måneden.** Det er rigeligt til en personlig app, men ikke til en offentlig app med mange brugere uden en kommerciel aftale (ca. 5.000 EUR/år for 100.000 kald/dag).
2. **Fly er ikke frit tilgængeligt.** Der er ingen åben API fra Københavns Lufthavn. Det kræver en kommerciel tredjepart med begrænsede gratis kvoter.

## Datakilder

| Kilde | Indhold | Adgang | Pris/licens | Egnet til appen? |
|---|---|---|---|---|
| **Rejseplanen GTFS (statisk)** | Alle køreplaner, stoppesteder og koordinater | Fri download, ingen nøgle **[verificeret]** | CC BY 4.0 | **Ja.** Grundlag for at finde de nærmeste stationer |
| **Rejseplanen API 2.0** (HAFAS ReST) | Afgangstavler med realtid, stoppesteder i nærheden, rejser, driftsmeddelelser, køretøjspositioner | Gratis nøgle (`accessId`) via Labs-kontaktformular, godkendes manuelt (et par hverdage) **[verificeret: nøgle påkrævet]** | Gratis til ikke-kommerciel brug, 50.000 kald/md. | **Ja.** Kilden til realtid |
| **SIRI-ET via Dataudveksleren** (NAP, Vejdirektoratet) | Realtid pr. operatør (DSB, S-tog, Movia, Lokaltog m.fl.) | Konto og servicekonto, push via AMQP 1.0 (Azure Service Bus) | Uklart, og andre udviklere har fravalgt det pga. omkostninger | Nej, ikke i første omgang. For tungt til en app |
| **NeTEx via Dataudveksleren** | Samme køreplaner som GTFS, EU-format | Konto påkrævet | Gratis efter oprettelse | Nej. GTFS er nemmere og indeholder det samme |
| **Banedanmark** | Kun geodata (spor, anlæg). Realtid foregår i et proprietært format og sendes videre til Rejseplanen | Ingen offentlig realtids-API fundet | – | Nej. Data kommer alligevel via Rejseplanen |
| **Metroselskabet** | Ingen egen åben API fundet | – | – | Nej. Metro findes i Rejseplanen |
| **Fly** (AviationStack, AirLabs, Aviation Edge, AeroDataBox) | Afgange og forsinkelser for CPH/BLL/AAR | API-nøgle | Kommercielt, med små gratis kvoter | Senere. Kun med en betalt eller meget begrænset kvote |

## Verificeret indhold i GTFS-feedet

Hentet 3. november 2026 fra `https://www.rejseplanen.info/labs/GTFS.zip` (55 MB zip, sidst opdateret 2. november 2026, gyldig til 27. januar 2027):

- **36.259 stoppesteder** med koordinater og **179.716 ture**
- **Tog (route_type 2):** DSB (IC, ICL, RE, RJ, ECE), DSB Vores Tog, Lokaltog, Midttrafik/NT-lokalbaner, Skånetrafiken (Øresundståg), Snälltåget
- **S-tog (109):** linjerne A, B, Bx, C, E, F og H
- **Metro (1):** M1, M2, M3 og M4, med 54.342 konkrete ture (ikke kun frekvensbaseret)
- **Letbane (0):** Hovedstadens Letbane, Aarhus Letbane (L1, L2) og Odense Letbane
- **Bus (3/700/715):** Movia, Midttrafik, FynBus, Sydtrafik, NT og BAT, i alt cirka 1.550 linjer
- **Færger (4):** Mols-Linien, Ærø, Samsø, Læsø, Fanø m.fl.

Bus er altså med fra start, og det koster ikke ekstra at få bus med.

## Realtid: hvad der er dækket

- **API 2.0** er en HAFAS-proxy (serverversion 2.53, bekræftet via fejlsvar). De relevante tjenester er `location.nearbystops`, `departureBoard` (planlagt tid, `rtTime`, spor og aflysninger), `journeyDetail`, `himsearch` (driftsforstyrrelser) og `journeyPos`.
- **S-tog og DSB:** Realtid er dokumenteret i API'et. Et tredjepartsprojekt (rp-gtfsrt) matchede 44.276 af 44.319 daglige ture på tværs af alle transportformer.
- **Metro:** Metroen vises i API'et, men ifølge en anden udvikler (mylder-projektet) **kun med planlagte tider og uden reel realtid**. *Usikkert, skal testes med nøglen.* Det har begrænset betydning, fordi metroen kører hvert 2.–4. minut.
- **Begrænsning:** API'et returnerer intet køretøjs-id, men det er ikke nødvendigt for en afgangsoversigt.

## Hvad betyder kvoten i praksis?

50.000 kald/md. svarer til ca. 1.650 kald/døgn, eller ét kald i minuttet døgnet rundt.

| Scenarie | Forbrug | Holder det? |
|---|---|---|
| Personlig app, 3 stationer opdateret hvert 30. sek., 2 timer/dag | ~720 kald/dag | Ja |
| Personlig app, åben konstant | ~8.600 kald/dag | Nej. Kræver smartere opdatering |
| Offentlig app med 100+ brugere | Langt over loftet | Nej. Kræver en kommerciel aftale eller at hver bruger har sin egen nøgle |

**Afledt designkrav:** Find de nærmeste stationer lokalt ud fra GTFS (0 kald), og brug kun API'et til at hente afgangstavler, når appen er åben og i forgrunden. Cache i 30–60 sekunder.

## Anbefalet arkitektur (MVP)

1. **Daglig job:** Hent GTFS-zip og udtræk `stops.txt` med transporttype pr. stop til et lille indeks (under 1 MB).
2. **Klient:** Brug GPS-lokation, find de 3–5 nærmeste stationer for tog, S-tog og metro (og eventuelt bus) og beregn gåafstand.
3. **Realtid:** Kald `departureBoard` for hver station og vis planlagt og forventet tid, spor og aflysninger.
4. **Fallback:** Hvis kvoten er brugt op eller nøglen mangler, vis planlagte tider direkte fra GTFS.
5. **Attribution:** Vis "Data: Rejseplanen (CC BY 4.0)".

## Åbne spørgsmål og risici

- **Personlig eller offentlig app?** Det er det vigtigste spørgsmål, fordi det afgør, om den gratis kvote rækker.
- **Metro-realtid:** Skal bekræftes, når nøglen er modtaget.
- **Labs-vilkår:** Labs-siderne kunne ikke hentes automatisk (HTTP 403), så kvote og pris bygger på søgeresultater og tredjepartskilder fra 2026. Læs vilkårene, når nøglen bestilles.
- **Fly:** Ingen gratis og stabil kilde. Udskyd til efter MVP.

## Næste skridt

1. Bestil en API 2.0-nøgle via kontaktformularen på [labs.rejseplan.dk](https://labs.rejseplan.dk) og vælg "privat bruger".
2. Byg stationsindekset ud fra GTFS, hvilket kan gøres allerede nu uden nøgle.
3. Test `departureBoard` mod København H, Nørreport og en metrostation, når nøglen er modtaget.

## Kilder

- Rejseplanen Labs: [Om API 2.0](https://labs.rejseplanen.dk/hc/en-us/articles/21554723926557-Om-API-2-0), [Adgang til data](https://labs.rejseplanen.dk/hc/en-us/articles/21553113674909-Adgang-til-data-fra-Labs), [Oversigt over udstillede data](https://labs.rejseplanen.dk/hc/en-us/articles/24750139021341-Oversigt-over-udstillede-data), [Om SIRI-ET](https://labs.rejseplanen.dk/hc/en-us/articles/25407687677597-Om-SIRI-ET)
- [Dataudveksleren (NAP)](https://du-portal-ui.dataudveksler.app.vd.dk/guides?locale=en)
- [CoffeeIO/rp-gtfsrt](https://github.com/CoffeeIO/rp-gtfsrt) (dækning og matching)
- [mylder #4](https://github.com/marcin-sieradzki/mylder/issues/4) og [#10](https://github.com/marcin-sieradzki/mylder/issues/10) (kvotepraksis, SIRI-ET fravalgt, metro)
- [Banedanmarks åbne data](https://geodata-banedanmark.opendata.arcgis.com/) og [Region H-kortlægning af trafikinformation](https://edagsorden.regionh.dk/cms/HtmlPublication-7678/enclosures/31.pdf)
- Fly: [AirLabs](https://airlabs.co/copenhagen-airport-api), [Aviation Edge](https://aviation-edge.com/airports-data/copenhagen-kastrup-airport-api-departures-arrival-schedules/)
