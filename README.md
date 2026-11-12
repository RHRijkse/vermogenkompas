# VermogenKompas

Statische website. Open `index.html` via een lokale webserver; er is geen build of npm-installatie nodig. Publiceer alle HTML-, CSS- en JavaScriptbestanden uit de hoofdmap samen.

De startpagina begint met een compacte introductie, een directe uitnodiging voor kennismaken en drie gespreksingangen voor wonen en hypotheek, overwaarde en vermogen, en beleggen voor later. De onderwerpkaarten vullen het kennismakingsformulier vooraf in. Daarna volgen Woon & VermogenCheck, overwaarde, aanpak, diensten en het kennismakingsformulier. De hypotheekcalculator (`hypotheek.html`), woonwensen (`woonwensen.html`) en beleggen (`beleggen.html`) hebben eigen pagina’s. Alle menulinks blijven bereikbaar. Het formulier bereidt alleen een download voor en verstuurt geen aanvraag.

## Hypotheekcalculator

De calculator staat op `hypotheek.html#hypotheek` en gebruikt `mortgage-engine.js`, `mortgage-norms.js`, `mortgage-ui.js` en `mortgage.css`. De twee invoerstappen vragen naar inkomen, hypotheekrente, looptijd en financiële verplichtingen. Een concrete woning is niet nodig. Invoer blijft in de browser. Downloaden maakt lokaal een tekstbestand; de bestaande kennismakingsfunctie verstuurt nog geen aanvragen.

### Rekenen en toetsen

Voer de regressietests uit met Node.js 22 of hoger:

```sh
node --test --test-isolation=none mortgage-engine.test.cjs
```

De tests controleren de annuïteit, nulrente, AOW-tabellen, grenswaarden, alleenstaandenruimte, energielabels, DUO-brutering, inkomen na alimentatie, woningwaarde, eigen geld en toekomstige pensioenscenario's. Een onafhankelijk voorbeeld uit de ABN AMRO-calculator op 12 september 2026 is opgenomen: samen €40.000 + €0 inkomen, energielabel A, 4,33%, 30 jaar, 10 jaar rentevast, volledig aftrekbaar geeft €168.399 en €836,33 bruto per maand. Eén overeenkomst is geen certificering van alle bankscenario's.

### Aansluiting op het Excelmodel 2026

Het rekenalgoritme is vergeleken met `Schoolopdracht_LTI_2026.xlsx`, tabblad Rekentool. Alle 97 inkomensrijen en 12 rentekolommen van de reguliere tabel komen overeen. De rentekolom wordt gekozen na afronding op drie decimalen in procenten. De annuïteit blijft rekenen met de ongeronde toetsrente. Alleen de uiteindelijke leenbedragen worden naar beneden afgerond op hele euro's.

Vrijstellingen voor alleenstaanden, energielabel en maatregelen worden eerst gedeeld door de annuïteitenfactor bij dertig jaar. Deze extra maandruimte wordt samen met de resterende maandruimte gekapitaliseerd tegen de gekozen looptijd. Een kortere looptijd geeft daardoor minder extra lening. Negatieve maandruimte blijft behouden tot alle vrijstellingen zijn verwerkt. Daarna wordt het leenbedrag op minimaal nul begrensd.

De engine accepteert aanvullend `creditLimit` en `energyMeasures`, beide standaard nul. Een kredietlimiet veroorzaakt 2% maandelijkse toetslast. `monthlyDebt` bevat uitsluitend andere al getoetste maandlasten als daarnaast `creditLimit` wordt meegegeven. Het maatregelenbudget wordt begrensd op het maximum van het bestaande energielabel. `withoutMeasures` geeft de LTI-ruimte zonder maatregelen en `extraForMeasures` het verschil met de totale LTI-ruimte.

Het bestaande formulier, alle teksten en de vormgeving zijn ongewijzigd. Jaarinkomen wordt inclusief vakantiegeld en vaste extra's ingevuld. De kredietinvoer blijft een maandelijkse toetslast. Het formulier geeft geen label of maatregelenbudget door en rekent daarmee zonder energievrijstellingen.

De aangeleverde werkboekformules zijn lokaal opnieuw berekend in artifact-tool en met de engine vergeleken. Het oorspronkelijke Excelbestand is niet aangepast en financiële casusgegevens worden niet in deze repository opgenomen. De openbare regressietests in `test/fixtures/lti-2026-synthetic.json` gebruiken uitsluitend verzonnen invoer en onafhankelijk met Python Decimal berekende uitkomsten. Zij controleren alle labels, kortere looptijden, rentegrenzen en negatieve maandruimte. De bestaande AOW-, DUO-, nulrente- en woningberekeningen blijven aanvullingen op het beperktere bereik van het Excelmodel.

De synthetische referentie-uitkomsten zijn reproduceerbaar met `python3 scripts/generate-lti-fixtures.py`. Dit script leest uitsluitend de al openbare normtabel en gebruikt geen werkboekgegevens of extra Pythonpakketten.

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

## Informatiepagina’s

De website bevat aparte pagina’s voor Over ons, missie en duurzaamheid, uitleg over de vergelijkingskaart van de AFM en de klachtenprocedure. De genoemde adresgegevens en contactgegevens zijn duidelijk gemarkeerde fictieve conceptgegevens voor het schoolproject.

## Wettelijke kaders

`wettelijke-kaders.html` geeft een onderbouwd overzicht voor het Nederlandse schoolconcept, onderzocht op 15 oktober 2026. De pagina is op alle pagina’s bereikbaar via een rustige footerlink. De veertien uitklapbare onderwerpen onderscheiden vergunningen, hypotheekadvies, beleggingsadvies, Wwft, privacy, beloning, duurzaamheid en overige relevante eisen. Bronnen staan bij ieder onderwerp.

De pagina bevestigt geen vergunningen of naleving. Echte bedrijfsgegevens, bevoegdheden en processen moeten voor ingebruikname worden vastgesteld. De uitlegpagina over de vergelijkingskaart vervangt geen eigen gestandaardiseerde kaart. Zie `docs/wettelijke-kaders-invoering.md` voor de nog benodigde besluiten en bewijsstukken.

## Uitgewerkte vergelijkingskaarten

Op `vergelijken.html` staan downloadbare kaarten voor Hypotheek en Vermogen opbouwen. Deze zijn op 15 oktober 2026 gemaakt met de publieke AFM-vergelijkingskaartapplicatie. De PDF’s in `downloads/` bevatten het standaardformat en een conceptvermelding op iedere pagina. Alle diensten, aanbiedersaantallen en prijzen zijn fictieve modelaannames. Er worden geen vergunningnummers of AFM-goedkeuring geclaimd.

Het concept vergelijkt hypotheken van 12 aanbieders en beleggingsfondsen van 8 aanbieders en claimt daarom geen advies op onafhankelijke basis. Hypotheekadvies en bemiddeling voor een volgende koopwoning in loondienst: gemiddeld € 2.950. Alleen advies: € 1.950. Particulier vermogensadvies: € 1.350. De webpagina bevat ook alle overige tariefcategorieën, uitsluitingen en optionele onderhoudstarieven. De voorbeeldgemiddelden zijn geen historische klantgemiddelden.


## Onze keuzes en navigatie

`onze-keuzes.html` legt per dienst uit hoe maatschappelijke betrokkenheid, Bad Press en duurzaamheidsbeleid worden beoordeeld. Het onderdeel Verantwoording bevat aparte selectiematrices voor hypotheek en beleggen met een gedeeld beoordelingskader voor een 4 en een 8. Aanbieders, producten, scores, weging, totaalscores, bronnen en onderbouwing worden ingevuld zodra het onderzoek is aangeleverd. Voeg zo nodig rijen toe en verwijder het tijdelijke `aria-label` zodra een cel is ingevuld.

Alle pagina’s gebruiken dezelfde headeropbouw, `navigation.css` en `navigation.js`. Het menu staat links, het logo met de link naar de startpagina staat in het midden en Kennismaken staat rechts. Het menu sluit met het icoon, Escape, een navigatielink of een klik buiten de header. Gesloten links zijn met `inert` uitgesloten van toetsenbordbediening. Bewegingsvoorkeuren worden gerespecteerd. Zonder JavaScript worden alle menulinks zichtbaar weergegeven. De startpagina behoudt haar eigen script voor de wooncheck en het kennismakingsformulier.
