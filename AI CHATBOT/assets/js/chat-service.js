// Deze code zorgt ervoor dat alle berichten van de gebruiker worden opgeslagen en opgehaald uit de online database (Firestore).

const ChatService = {
  CHAT_DOC: "singleChat", // De naam van het chatdocument in de database
  chatListener: null,     // Hiermee houden we bij of we al 'luisteren' naar nieuwe berichten
  chatMessages: [],       // Hier bewaren we tijdelijk de chatberichten
  currentUserId: null,    // Het ID van de huidige gebruiker

  // Dit wordt uitgevoerd als je bent ingelogd. Hiermee start je de chat voor deze gebruiker.
  init: function (userId) {
    this.currentUserId = userId;
    this.listenToChat();
  },

  // Hiermee voeg je een nieuw bericht toe aan de chat in de database.
  async addMessage(content, role = "user", fileData = null) {
    const chatRef = FirebaseService.getUserCollection(this.currentUserId, "chats").doc(this.CHAT_DOC);

    // We maken een bericht-object met tekst, wie het stuurde, evt. bestand, en tijd.
    const msg = {
      content,                // Het bericht zelf (tekst)
      role,                   // Wie het is: 'user' of 'bot'
      fileData: fileData || null, // Een bestand (bijvoorbeeld afbeelding), of niks
      timestamp: new Date().toISOString() // Tijdstip van verzenden, als tekst
    };

    // Zet het bericht in de database. 'arrayUnion' zorgt dat het wordt toegevoegd aan de lijst met berichten.
    await chatRef.set(
      {
        messages: firebase.firestore.FieldValue.arrayUnion(msg),
        updatedAt: FirebaseService.serverTimestamp()
      },
      { merge: true }
    );
  },

  // Deze functie zorgt ervoor dat we automatisch nieuwe berichten ophalen als iemand iets stuurt.
  listenToChat: function () {
    // Als we al luisteren, stoppen we eerst.
    if (this.chatListener) {
      this.chatListener();
    }
    const chatRef = FirebaseService.getUserCollection(this.currentUserId, "chats").doc(this.CHAT_DOC);
    // We luisteren naar veranderingen in de chat (realtime updates).
    this.chatListener = chatRef.onSnapshot((doc) => {
      const data = doc.exists ? doc.data() : { messages: [] };
      this.chatMessages = data.messages || [];
      UIManager.loadChatMessages(this.chatMessages);
    });
  },

  // Met deze functie kun je alle berichten ophalen die nu in het geheugen staan.
  getMessages: function () {
    return this.chatMessages;
  },

  // Met deze functie kun je alle berichten uit de chat wissen.
  async clearChat() {
    const chatRef = FirebaseService.getUserCollection(this.currentUserId, "chats").doc(this.CHAT_DOC);
    await chatRef.set(
      {
        messages: [],
        updatedAt: FirebaseService.serverTimestamp()
      },
      { merge: true }
    );
    UIManager.clearChat();
  },

  // Deze functie wordt gebruikt als de gebruiker uitlogt. We stoppen dan met luisteren naar nieuwe berichten.
  cleanup: function () {
    if (this.chatListener) {
      this.chatListener();
      this.chatListener = null;
    }
    this.chatMessages = [];
  }
};

window.ChatService = ChatService;