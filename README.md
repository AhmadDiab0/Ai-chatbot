# Project: AI Chat Website

## Projectomschrijving

Deze website is ontwikkeld als een side-project waarbij gebruikers kunnen chatten met een AI, ondersteund door de Google Gemini API. De site is volledig responsive en biedt extra functionaliteiten zoals het uploaden van foto's en het gebruik van emojis. Het doel is om een moderne, toegankelijke en interactieve ervaring te creëren.

## Doel van het Project

Het project richt zich op het demonstreren van:

- **Innovatieve technologie:** Integratie van AI via de Google Gemini API.
- **Gebruiksvriendelijkheid:** Een responsive design met extra functies (foto-upload, emojis).
- **Interactiviteit:** Directe chatmogelijkheden die zowel op desktop als mobiel werken.

## Technologieën en Tools

- **Frontend:** HTML, CSS, JavaScript
- **API:** Google Gemini API
- **Versiebeheer:** Git
- **Projectmanagement:** Gebruik van een visueel bord (zie backlog hieronder)

---

## Installatie / Gebruik

1. Clone de repo
2. Open `index.html` in je browser
3. Klaar! Je kunt direct de chatbot gebruiken (voor AI-functionaliteit is een API key vereist)
---

## Uitwerking van User Stories

| US-id | Wie| Wat (user-story)| Waarom (waarde)| Realistisch? (haalbaarheids-check vóór start)| Definition of Done (DoD)| Acceptatie­criteria (tests)| Prioriteit | Tijds­insch. |
|-------|---------------|--------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|-----------|--------------|
| US-01 | Als gebruiker  | wil ik de chatbot met één knop openen/sluiten|zodat ik zelf bepaal wanneer hij in beeld is| **Ja –** simpele JS-toggle; kennis aanwezig; ±2 u| Toggle-knop zichtbaar<br> Venster opent/sluit zonder errors<br> Staat blijft behouden|  Knop zichtbaar<br> 1e klik opent, 2e sluit<br> Geen console-errors| Must| 2 u |
| US-02 | Als gebruiker  | wil ik AI-gegenereerde antwoorden ontvangen|zodat ik direct nuttige info krijg| **Ja –** Google Gemini API beschikbaar; documentatie doorgenomen; ±4 u implementatie| User-input naar API<br> Antwoord binnen 3 s|  200-response in Network tab<br> Antwoord <=3 s zichtbaar<br> Foutmelding bij API-error| Must| 4 u |
| US-03 | Als gebruiker  | wil ik afbeeldingen kunnen uploaden tijdens het chatten| zodat ik visuele context kan delen| **Ja –** standaard `<input type="file">` + FileReader; eerder mee gewerkt; ±3 u| JPG/PNG ≤1 MB selecteerbaar<br> Inline preview<br> Base64 of blob mee in API-payload|  File-input accepteert JPG/PNG<br> Preview vóór verzenden<br> Duidelijke foutmelding bij te groot of verkeerd bestand| Must| 3 u |
| US-04 | Als gebruiker  | wil ik emoji’s kunnen toevoegen via een picker| zodat ik emoties kan uitdrukken| **Ja –** EmojiMart library; straightforward integratie; ±2 u| Picker opent/sluit via knop<br> Emoji op cursor-positie in textarea|  Klik emoji-knop opent picker<br> Klik buiten sluit picker<br> Emoji verschijnt in tekstveld| Should | 2 u |
| US-05 | Als gebruiker  | wil ik dat de chatbot volledig responsive is op mobiel, tablet en desktop| zodat ik hem overal prettig kan gebruiken| **Ja –** CSS media-queries/Bootstrap; ervaring mee; ±2 u| Layout <768 px zonder horizontale scroll<br> Buttons bruikbaar<br>  Geen elementen buiten viewport<br> Chat bruikbaar op 320 px breed scherm| Must| 2 u |
| US-06 | Als beheerder | wil ik basis­statistieken zien (aantal chats, gemiddelde reactietijd) in een simpel dashboard (later)| zodat ik in de toekomst inzicht krijg in gebruik| **Nee –** vereist backend logging; buiten scope sprint 1 → gepland voor latere iteratie| — Wordt nu niet ontwikkeld| — N.v.t. in deze sprint| Won’t| — |

---

## Reflectie

Alle geplande user stories voor deze sprint zijn succesvol uitgevoerd.
De backlog en de voortgang zijn zichtbaar gemaakt via een visueel bord.
Ik ben tevreden met het resultaat en de structuur van dit project.
