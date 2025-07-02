// === CHAT SERVICE ===

const ChatService = {
  currentChatId: null,
  chats: [],
  allChats: [],
  currentChatUnsubscribe: null,
  chatListUnsubscribe: null,

  // Create new chat
  createChat: async (title = null) => {
    const user = AuthService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    try {
      const chatData = {
        title: title || `Nieuwe Chat ${new Date().toLocaleDateString('nl-NL')}`,
        createdAt: FirebaseService.serverTimestamp(),
        updatedAt: FirebaseService.serverTimestamp(),
        userId: user.uid,
        messageCount: 0
      };

      const chatRef = await FirebaseService.getUserCollection(user.uid, 'chats').add(chatData);
      ChatService.currentChatId = chatRef.id;
      await ChatService.loadChats();

      return { id: chatRef.id, ...chatData };
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  },

  // Load all chats for current user
  loadChats: async () => {
    const user = AuthService.getCurrentUser();
    if (!user) return [];

    try {
      const chatsRef = FirebaseService.getUserCollection(user.uid, 'chats');
      const q = chatsRef.orderBy('updatedAt', 'desc');
      const querySnapshot = await q.get();

      ChatService.chats = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      ChatService.allChats = [...ChatService.chats];

      return ChatService.chats;
    } catch (error) {
      console.error('Error loading chats:', error);
      return [];
    }
  },

  // Add message to chat
  addMessage: async (content, role = 'user', fileData = null) => {
    const user = AuthService.getCurrentUser();
    if (!user || !ChatService.currentChatId) return;

    try {
      const messageData = {
        content,
        role,
        timestamp: FirebaseService.serverTimestamp(),
        userId: user.uid,
        ...(fileData && { fileData })
      };

      const messagesRef = FirebaseService.getChatCollection(user.uid, ChatService.currentChatId, 'messages');
      await messagesRef.add(messageData);

      // Update chat last message
      const chatRef = FirebaseService.getUserCollection(user.uid, 'chats').doc(ChatService.currentChatId);
      await chatRef.update({
        updatedAt: FirebaseService.serverTimestamp(),
        lastMessage: content.substring(0, 100) + (content.length > 100 ? '...' : '')
      });
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  },

  // Load messages for specific chat
  loadMessages: async (chatId) => {
    const user = AuthService.getCurrentUser();
    if (!user) return [];

    try {
      const messagesRef = FirebaseService.getChatCollection(user.uid, chatId, 'messages');
      const q = messagesRef.orderBy('timestamp', 'asc');
      const querySnapshot = await q.get();

      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  },

  // Switch to different chat
  switchToChat: async (chatId, title) => {
    const user = AuthService.getCurrentUser();
    try {
      // Cleanup previous listener
      if (ChatService.currentChatUnsubscribe) {
        ChatService.currentChatUnsubscribe();
      }

      ChatService.currentChatId = chatId;
      const messages = await ChatService.loadMessages(chatId);

      // Update UI
      UIManager.loadChatMessages(messages);
      UIManager.setCurrentChatTitle(title);
      UIManager.updateActiveChatItem(chatId);

      // Set up real-time listener
      const messagesRef = FirebaseService.getChatCollection(user.uid, chatId, 'messages');
      const q = messagesRef.orderBy('timestamp', 'asc');

      ChatService.currentChatUnsubscribe = q.onSnapshot((snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        UIManager.loadChatMessages(messages);
      });
    } catch (error) {
      console.error('Error switching to chat:', error);
      UIManager.showErrorMessage('Kon chat niet laden.');
    }
  },

  // Update chat title
  updateChatTitle: async (chatId, newTitle) => {
    const user = AuthService.getCurrentUser();
    if (!user) return;

    try {
      const chatRef = FirebaseService.getUserCollection(user.uid, 'chats').doc(chatId);
      await chatRef.update({
        title: newTitle,
        updatedAt: FirebaseService.serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating chat title:', error);
      throw error;
    }
  },

  // Delete chat
  deleteChat: async (chatId) => {
    const user = AuthService.getCurrentUser();
    if (!user) return;

    try {
      // Delete all messages first
      const messagesRef = FirebaseService.getChatCollection(user.uid, chatId, 'messages');
      const messages = await messagesRef.get();

      const deletePromises = messages.docs.map(doc => doc.ref.delete());
      await Promise.all(deletePromises);

      // Delete chat document
      const chatRef = FirebaseService.getUserCollection(user.uid, 'chats').doc(chatId);
      await chatRef.delete();

      // Handle UI cleanup
      if (ChatService.currentChatId === chatId) {
        ChatService.currentChatId = null;
        UIManager.clearChat();
        if (ChatService.currentChatUnsubscribe) {
          ChatService.currentChatUnsubscribe();
        }
        UIManager.showWelcomeMessage();
      }

      await ChatService.loadChats();
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  },

  // Search chats
  searchChats: (query) => {
    if (!query.trim()) {
      ChatService.chats = [...ChatService.allChats];
    } else {
      ChatService.chats = ChatService.allChats.filter(chat =>
        chat.title.toLowerCase().includes(query.toLowerCase()) ||
        chat.lastMessage?.toLowerCase().includes(query.toLowerCase())
      );
    }
    return ChatService.chats;
  },

  // Export chat data
  exportChat: async () => {
    if (!ChatService.currentChatId) {
      throw new Error('Geen chat geselecteerd om te exporteren.');
    }

    try {
      const messages = await ChatService.loadMessages(ChatService.currentChatId);
      const chat = ChatService.allChats.find(c => c.id === ChatService.currentChatId);

      const exportData = {
        chatTitle: chat?.title || 'Untitled Chat',
        exportDate: new Date().toISOString(),
        totalMessages: messages.length,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
        }))
      };

      return exportData;
    } catch (error) {
      console.error('Error exporting chat:', error);
      throw error;
    }
  },

  // Set up real-time chat list listener
  setupChatListListener: () => {
    const user = AuthService.getCurrentUser();
    if (!user) return;

    const chatsRef = FirebaseService.getUserCollection(user.uid, 'chats');
    const q = chatsRef.orderBy('updatedAt', 'desc');

    ChatService.chatListUnsubscribe = q.onSnapshot((snapshot) => {
      ChatService.chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      ChatService.allChats = [...ChatService.chats];
      UIManager.updateChatList(ChatService.chats);
    });
  },

  // Cleanup listeners
  cleanup: () => {
    if (ChatService.currentChatUnsubscribe) {
      ChatService.currentChatUnsubscribe();
      ChatService.currentChatUnsubscribe = null;
    }
    if (ChatService.chatListUnsubscribe) {
      ChatService.chatListUnsubscribe();
      ChatService.chatListUnsubscribe = null;
    }
  },

  // Getters
  getCurrentChatId: () => ChatService.currentChatId,
  getChats: () => ChatService.chats,
  getAllChats: () => ChatService.allChats
};

// Export for global use
window.ChatService = ChatService;