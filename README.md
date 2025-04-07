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
- **Projectmanagement:** Gebruik een tool als Jira of Pivotal (zie hieronder een screenshot van je backlog)

## Backlog Screenshot

([Backlog](https://imgur.com/a/UtaHpH9))

## Uitwerking van User Stories

| US-id | Wie| Wat| Waarom| Realistisch?| Prioriteit |
| ----- | ------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ | ---------- |
| US-01 | Als gebruiker | Wil ik de chatbot kunnen openen en sluiten door op een knop te klikken| Zodat ik zelf de interface kan activeren wanneer ik een gesprek wil starten en minimaliseer als ik klaar ben | Ja, de toggle functionaliteit is reeds geïmplementeerd |Hoog|
| US-02 | Als gebruiker | Wil ik een chat starten met de AI door een bericht te typen en op versturen te klikken| Zodat ik mijn vragen kan stellen en direct een antwoord van de AI kan ontvangen| Ja, dit vormt de kern van de applicatie| Hoog|
| US-03 | Als gebruiker | Wil ik foto's kunnen uploaden tijdens het chatten| Zodat ik visuele informatie kan delen en de context van mijn berichten kan verbeteren| Ja, de foto-upload functie is aanwezig| Medium|
| US-04 | Als gebruiker | Wil ik emojis kunnen toevoegen aan mijn berichten via een geïntegreerde emoji-picker| Zodat ik mijn emoties en toon kan verrijken tijdens het chatten| Ja, de emoji-picker is al geïntegreerd| Laag|
| US-05 | Als gebruiker | Wil ik een visuele 'thinking' indicator zien wanneer de AI bezig is met het genereren van een antwoord | Zodat ik weet dat mijn bericht in behandeling is en dat er een reactie komt| Ja, de indicator wordt getoond tijdens de verwerking|Medium|

# Sprint 1

| Dag| User Stories| Doing| Done|
| ---------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Day 1 & 2**   | - **US-01 (MUST)**: Chatbot openen/sluiten<br>- **US-02 (MUST)**: Chat starten met de AI| - **US-02** Berichten versturen/ontvangen| - **US-01** Knop voor openen/sluiten toevoegen|
| **Day 3 & 4**   | - **US-01 (MUST)**: Chatbot openen/sluiten<br>- **US-02 (MUST)**: Chat starten met de AI| - **US-01** Animaties en styling voor openen/sluiten| - **US-02** Integratie met AI-API|
| **Day 5 & 6** | - **US-03 (SHOULD)**: Foto uploaden<br>- **US-04 (SHOULD)**: Emojis toevoegen<br>- **US-05 (SHOULD)**: 'Thinking' indicator | - **US-03** Bestanden selecteren en uploaden<br>- **US-03** Preview tonen in de chat | **US-01** Knop voor openen/sluiten toevoegen|
| **Day 7**     | - **US-03 (SHOULD)**: Foto uploaden<br>- **US-04 (SHOULD)**: Emojis toevoegen<br>- **US-05 (SHOULD)**: 'Thinking' indicator | _(niets in Doing)_| - **US-04** Emojis correct weergeven<br>- **US-05** Visuele indicator tonen tijdens verwerking<br>- **US-05 (SHOULD)** Indicator verbergen zodra antwoord |
