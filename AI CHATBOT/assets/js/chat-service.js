// === CHAT SERVICE: Single Chat per gebruiker ===

// Deze versie ondersteunt maar één chatdocument ("singleChat") per gebruiker.

const ChatService = {
  CHAT_DOC: "singleChat",
  chatListener: null,
  chatMessages: [],
  currentUserId: null,

  // Initialiseer bij login
  init: function (userId) {
    this.currentUserId = userId;
    this.listenToChat();
  },

  // Voeg bericht toe aan chat
  async addMessage(content, role = "user", fileData = null) {
    const chatRef = FirebaseService.getUserCollection(this.currentUserId, "chats").doc(this.CHAT_DOC);

    // Use client-side timestamp, NOT serverTimestamp() inside arrayUnion!
    const msg = {
      content,
      role,
      fileData: fileData || null,
      timestamp: new Date().toISOString()
    };

    await chatRef.set(
      {
        messages: firebase.firestore.FieldValue.arrayUnion(msg),
        updatedAt: FirebaseService.serverTimestamp()
      },
      { merge: true }
    );
  },

  // Real-time listener voor de enige chat
  listenToChat: function () {
    if (this.chatListener) {
      this.chatListener();
    }
    const chatRef = FirebaseService.getUserCollection(this.currentUserId, "chats").doc(this.CHAT_DOC);
    this.chatListener = chatRef.onSnapshot((doc) => {
      const data = doc.exists ? doc.data() : { messages: [] };
      this.chatMessages = data.messages || [];
      UIManager.loadChatMessages(this.chatMessages);
    });
  },

  // Haal alle berichten op (optioneel)
  getMessages: function () {
    return this.chatMessages;
  },

  // Reset chat (verwijder alle berichten)
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

  // Cleanup listener bij uitloggen
  cleanup: function () {
    if (this.chatListener) {
      this.chatListener();
      this.chatListener = null;
    }
    this.chatMessages = [];
  }
};

window.ChatService = ChatService;