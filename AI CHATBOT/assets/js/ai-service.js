// === AI SERVICE ===

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

  // Check rate limit
  checkRateLimit: () => {
    const now = Date.now();
    if (now - AIService.lastRequestTime < AIService.MIN_REQUEST_INTERVAL) {
      const waitTime = Math.ceil((AIService.MIN_REQUEST_INTERVAL - (now - AIService.lastRequestTime)) / 1000);
      throw new Error(`⏱️ Wacht nog ${waitTime} seconden voor het volgende bericht.`);
    }
    AIService.lastRequestTime = now;
  },

  // Generate AI response
  generateResponse: async (message, fileData = null) => {
    try {
      AIService.checkRateLimit();
      AIService.trackApiUsage();

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

      const response = await fetch(`${AIService.API_URL}?key=${AIService.API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(AIService.getErrorMessage(response.status, errorData));
      }

      const data = await response.json();

      if (!data.candidates?.[0]?.content) {
        throw new Error("Ongeldig antwoord van de AI. Probeer opnieuw.");
      }

      const reply = data.candidates[0].content.parts[0].text;
      if (!reply) throw new Error("Geen antwoord ontvangen van de AI.");

      // Format the reply (remove markdown bold formatting)
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

  // Get error message based on status code
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

  // Get usage stats
  getUsageStats: () => ({
    dailyRequests: AIService.dailyRequests,
    lastResetDate: AIService.lastResetDate,
    requestsRemaining: Math.max(0, 100 - AIService.dailyRequests) // Assuming 100 daily limit
  })
};

// Export for global use
window.AIService = AIService;