# VermogenKompas

Statische website. Open `index.html` via een lokale webserver; er is geen build of npm-installatie nodig. Publiceer alle HTML-, CSS- en JavaScriptbestanden uit de hoofdmap samen.

## Hypotheekcalculator

De calculator staat op `#hypotheek` en gebruikt `mortgage-engine.js`, `mortgage-norms.js`, `mortgage-ui.js` en `mortgage.css`. De twee invoerstappen vragen naar inkomen, hypotheekrente, looptijd en financiële verplichtingen. Een concrete woning is niet nodig. Invoer blijft in de browser. Downloaden maakt lokaal een tekstbestand; de bestaande kennismakingsfunctie verstuurt nog geen aanvragen.

### Rekenen en toetsen

Voer de regressietests uit met Node.js 22 of hoger:

```sh
node --test --test-isolation=none mortgage-engine.test.cjs
```

De tests controleren de annuïteit, nulrente, AOW-tabellen, grenswaarden, alleenstaandenruimte, energielabels, DUO-brutering, inkomen na alimentatie, woningwaarde, eigen geld en toekomstige pensioenscenario's. Een onafhankelijk voorbeeld uit de ABN AMRO-calculator op 12 september 2026 is opgenomen: samen €40.000 + €0 inkomen, energielabel A, 4,33%, 30 jaar, 10 jaar rentevast, volledig aftrekbaar geeft €168.399 en €836,33 bruto per maand. Eén overeenkomst is geen certificering van alle bankscenario's.

### Bronnen en onderhoud

- [TRHK 2026, artikelen 2–5 en bijlage 1](https://wetten.overheid.nl/BWBR0032503/2026-01-01): vier volledige financieringslasttabellen. Gedownload op 12 september 2026; getallen automatisch uit HTML-tabellen geëxtraheerd.
- [Wijzigingsregeling 2026](https://zoek.officielebekendmakingen.nl/stcrt-2025-36471.html): energielabelbedragen en inkomensgrenzen.
- [AFM-toetsrente derde kwartaal 2026: 5%](https://www.afm.nl/nl-nl/sector/actueel/2026/jun/sb-toetstrente-q3-2026).
- [ABN AMRO-calculator](https://hypotheken.abnamro.nl/snelle-hypotheek-berekening/app): inspiratie voor de invoer, het resultatenpaneel en de uitleg; eigen vormgeving en implementatie.

**Onderhoud nodig:** controleer elk kwartaal de AFM-toetsrente en jaarlijks alle leennormen. Werk engine, tabellen, peildatum, uitleg en tests samen bij. De 4% in het formulier is een voorbeeldrente, geen actueel banktarief. Er is geen externe rente-API.

### Afbakening

Dit is een oriënterende annuïteitenberekening, geen acceptatie-engine van een bank. Tabellen: naast lagere inkomensrij, boven de hoogste grens de laatste rij. Bij gemengde AOW-statussen geldt de tabel van de hoogste verdiener; bij exact gelijke inkomens gebruiken we voorzichtig de laagste woonquote. Kredietlasten zijn door de gebruiker aangeleverde toetslasten. Partneralimentatie vermindert het jaarinkomen. DUO gebruikt het wettelijke termijnbedrag, inclusief toepasselijke brutering.

Voor AOW binnen tien jaar berekenen we alle combinaties van de opgegeven toekomstige pensioeninkomens. We kiezen de laagste leencapaciteit en rekenen voorzichtig met de oorspronkelijke hoofdsom en looptijd; toekomstige aflossing wordt niet meegenomen. Dit kan lager uitvallen dan een volledige toets bij de geldverstrekker. De aftrekkeuze geldt voor de volledige lening en looptijd. Gemengde leningdelen, een verstreken aftrektermijn en de bijleenregeling vereisen individueel advies.

De getoonde indicatie is de inkomensgebonden leencapaciteit (LTI): toetsinkomen maal de toepasselijke financieringslastquote, verminderd met verplichtingen en omgerekend naar een annuïtaire lening. Zonder een specifieke woning worden de woningwaarde (LTV), energielabelruimte, aankoopkosten, eigen geld en overwaarde niet meegenomen. Geen verduurzamingsdepots, seniorenmaatwerk, overbrugging, bestaande leningdelen, NHG-toelatingsbeslissing of netto-maandlastberekening. Het aflossingsschema veronderstelt dezelfde rente over de volledige looptijd.
