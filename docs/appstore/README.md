# App Store: klar til udgivelse

Alt, der kan forberedes uden Apples udviklerkonto. Tekster til App Store Connect står i [tekster.md](tekster.md), privatlivspolitikken i [privatlivspolitik.md](privatlivspolitik.md) og skærmbilleder (kladder) i `skaermbilleder/`.

## Skal besluttes før første build
- [x] **Bundle ID:** `dk.whistregnskab.app` (godkendt). Det kan **ikke ændres**, når appen er oprettet i App Store Connect.
- [x] **Navn:** "Whist Regnskab" (godkendt) (højst 30 tegn). Navnet skal være ledigt i App Store. Det kan ændres senere, men kun sammen med en ny version.
- [x] **App-ikon:** spar es på grønt filt (forslag A). Kilderne ligger i `assets/kilde/` og `scripts/icon/`.
- [x] **Kontakt-e-mail** i privatlivspolitikken (NorthdockTools@proton.me).
- [x] **Hvor privatlivspolitikken ligger:** offentlig GitHub Gist: https://gist.github.com/AltReffi/5addbfeccd0e037f622daeac9a81b320. Ændres `privatlivspolitik.md`, så opdater gisten med `gh gist edit 5addbfeccd0e037f622daeac9a81b320 docs/appstore/privatlivspolitik.md`.

## Valgt i konfigurationen
| Indstilling | Værdi | Hvorfor |
|---|---|---|
| `ios.supportsTablet` | `false` | Ellers kræver Apple iPad-skærmbilleder (13"), og appen har ingen iPad-visning endnu. iPad-brugere kan stadig køre iPhone-udgaven. Sæt til `true`, når bordvisningen til iPad er lavet. |
| `ios.config.usesNonExemptEncryption` | `false` | Appen bruger ingen kryptering ud over styresystemets egen. Så slipper man for eksportspørgsmålet ved hver upload. |
| `version` | `1.0.0` | Versionen brugerne ser. Byggenummeret styres af EAS (`appVersionSource: remote`, `autoIncrement`). |
| `android.package` | `dk.whistregnskab.app` | Til Google Play senere. |

## Når udviklerkontoen er købt
1. Køb Apple Developer Program (99 $ om året) og tilmeld dig **App Store Small Business Program**, så Apple tager 15 % i stedet for 30 %.
2. Log ind i EAS, og knyt projektet til din Expo-konto. `init` skriver et `projectId` ind i `app.json`:
   ```bash
   npx eas-cli@latest login
   ```
   ```bash
   npx eas-cli@latest init
   ```
3. Byg til App Store. EAS spørger efter dit Apple-login og laver certifikater selv:
   ```bash
   npx eas-cli@latest build --platform ios --profile production
   ```
4. Send bygget til App Store Connect. Første gang opretter EAS appen og spørger om navn og sprog:
   ```bash
   npx eas-cli@latest submit --platform ios --latest
   ```
   Skriv bagefter appens `ascAppId` ind under `submit.production.ios` i `eas.json`, så næste upload ikke spørger igen.
5. Test bygget i **TestFlight** ved et rigtigt bord.
6. Udfyld App Store Connect med teksterne fra [tekster.md](tekster.md):
   - pris: 29 kr. (vælg prisniveauet tættest på)
   - privatlivsoplysninger: "Data indsamles ikke"
   - aldersgrænse og kategori som beskrevet i tekster.md
   - skærmbilleder
7. Send til gennemgang.

## Skærmbilleder
`skaermbilleder/` har to sæt med fem billeder i de størrelser, Apple kræver:
- `6,9-*.jpg`: 1320 × 2868 (iPhone med Dynamic Island, stor skærm)
- `6,3-*.jpg`: 1206 × 2622 (iPhone med Dynamic Island, mellem skærm)

De er taget fra webudgaven med demodata (genereres med `scripts/appstore-screenshots.js`). Tilbage-pilen, kontakten og sidehovedet ser lidt anderledes ud end på en iPhone. **Erstat dem med billeder fra iOS-simulatoren** (Xcode på din Mac, ⌘S i simulatoren på en iPhone 17 Pro Max og iPhone 17 Pro), når appen kan bygges.
