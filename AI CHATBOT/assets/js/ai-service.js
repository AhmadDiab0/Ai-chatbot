// Dit stuk code zorgt ervoor dat je een vraag naar de AI (Gemini) stuurt
// en het antwoord ophaalt. Ook houdt het bij hoeveel verzoeken je per dag doet.

const AIService = {
  API_KEY: "AIzaSyD_VXIB9bCRw9FebI2UgE5cRQEBdWm54uA",
  API_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",

  lastRequestTime: 0,
  MIN_REQUEST_INTERVAL: 5000, // 5 seconds
  dailyRequests: parseInt(localStorage.getItem('dailyApiRequests') || '0'),
  lastResetDate: localStorage.getItem('lastApiResetDate') || new Date().toDateString(),

  // Track API usage
  trackApiUsage: () => {
    const today = new Date().toDateString();

    if (today !== AIService.lastResetDate) {
      AIService.dailyRequests = 0;
      AIService.lastResetDate = today;
      localStorage.setItem('lastApiResetDate', today);
    }

    AIService.dailyRequests++;
    localStorage.setItem('dailyApiRequests', AIService.dailyRequests.toString());

    if (AIService.dailyRequests > 80) {
      UIManager.showErrorMessage(`⚠️ Let op: Je hebt vandaag al ${AIService.dailyRequests} verzoeken gedaan.`);
    }
  },

  // Controleert of je niet te snel achter elkaar berichten stuurt.
  checkRateLimit: () => {
    const now = Date.now();
    if (now - AIService.lastRequestTime < AIService.MIN_REQUEST_INTERVAL) {
      const waitTime = Math.ceil((AIService.MIN_REQUEST_INTERVAL - (now - AIService.lastRequestTime)) / 1000);
      throw new Error(`⏱️ Wacht nog ${waitTime} seconden voor het volgende bericht.`);
    }
    AIService.lastRequestTime = now;
  },

  // Stuurt het bericht (en evt. bestand) naar de AI en wacht op antwoord.
  generateResponse: async (message, fileData = null) => {
    try {
      AIService.checkRateLimit();
      AIService.trackApiUsage();

      // Zet het bericht en eventueel een bestand in het juiste formaat voor de API.
      const parts = [];
      if (message) parts.push({ text: message });
      if (fileData?.data) {
        parts.push({
          inline_data: {
            mime_type: fileData.mime_type,
            data: fileData.data
          }
        });
      }

      const requestPayload = {
        contents: [{ parts: parts }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      };

      // Stuur het verzoek naar de AI.
      const response = await fetch(`${AIService.API_URL}?key=${AIService.API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      // Als het antwoord niet goed is, maak een foutmelding.
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(AIService.getErrorMessage(response.status, errorData));
      }

      const data = await response.json();

      // Kijk of er een antwoord is, anders geef een foutmelding.
      if (!data.candidates?.[0]?.content) {
        throw new Error("Ongeldig antwoord van de AI. Probeer opnieuw.");
      }

      const reply = data.candidates[0].content.parts[0].text;
      if (!reply) throw new Error("Geen antwoord ontvangen van de AI.");

      // Eventueel opmaak weghalen uit het antwoord.
      const formattedReply = reply.replace(/\*\*(.*?)\*\*/g, "$1").trim();

      return {
        success: true,
        response: formattedReply
      };

    } catch (error) {
      console.error("Error in AI service:", error);

      let displayMessage = error.message;
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        displayMessage = "Netwerkfout. Controleer je internetverbinding.";
      }

      return {
        success: false,
        error: displayMessage
      };
    }
  },

  // Maakt de foutmeldingen duidelijker voor de gebruiker.
  getErrorMessage: (status, errorData) => {
    if (status === 400 && errorData.error?.message) {
      if (errorData.error.message.includes("image")) {
        return "Het afbeeldingsbestand wordt niet ondersteund.";
      } else if (errorData.error.message.includes("SAFETY")) {
        return "Je bericht werd geblokkeerd door veiligheidsfilters. Probeer het anders te formuleren.";
      } else if (errorData.error.message.includes("quota")) {
        return "API quota overschreden. Probeer later opnieuw.";
      } else {
        return `API Fout: ${errorData.error.message}`;
      }
    } else if (status === 403) {
      return "API toegang geweigerd. Mogelijk quota overschreden of billing probleem.";
    } else if (status === 429) {
      return "Te veel verzoeken. Wacht 30 seconden en probeer opnieuw.";
    } else if ([500, 502, 503].includes(status)) {
      return "Google servers zijn tijdelijk onbeschikbaar. Probeer over 1 minuut opnieuw.";
    }
    return "Er is een fout opgetreden bij het verwerken van je bericht.";
  },

  // Geeft terug hoeveel verzoeken je vandaag al hebt gedaan.
  getUsageStats: () => ({
    dailyRequests: AIService.dailyRequests,
    lastResetDate: AIService.lastResetDate,
    requestsRemaining: Math.max(0, 100 - AIService.dailyRequests) // Stel, max 100 per dag
  })
};

window.AIService = AIService;