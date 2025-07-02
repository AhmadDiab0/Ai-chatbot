// === MAIN APPLICATION ===

class ChatApp {
  constructor() {
    this.userData = {
      message: null,
      file: { data: null, mime_type: null }
    };

    this.isInitialized = false;
  }

  // Initialize the application
  async init() {
    if (this.isInitialized) return;

    console.log('🚀 Initializing Clean AI Chatbot...');

    // Initialize UI elements
    UIManager.initElements();

    // Initialize dark mode
    Utils.darkMode.initialize();

    // Show loading screen
    UIManager.showLoading();

    // Setup event listeners
    this.setupEventListeners();

    // Setup authentication state listener
    this.setupAuthStateListener();

    // Setup keyboard shortcuts
    Utils.keyboard.setupShortcuts();

    // Setup emoji picker (delayed)
    setTimeout(() => this.setupEmojiPicker(), 1000);

    this.isInitialized = true;
  }

  // Setup all event listeners
  setupEventListeners() {
    // Authentication
    this.setupAuthListeners();

    // Dark mode
    document.getElementById('dark-mode-toggle')?.addEventListener('click', Utils.darkMode.toggle);
    document.getElementById('dark-mode-toggle-app')?.addEventListener('click', Utils.darkMode.toggle);

    // Mobile sidebar
    document.getElementById('mobile-menu-toggle')?.addEventListener('click', UIManager.toggleMobileSidebar);
    document.getElementById('sidebar-close-btn')?.addEventListener('click', UIManager.closeMobileSidebar);
    document.getElementById('mobile-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'mobile-overlay') UIManager.closeMobileSidebar();
    });

    // Auto-close mobile sidebar when chat is selected
    document.getElementById('chat-list-container')?.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && e.target.closest('.chat-item')) {
        setTimeout(UIManager.closeMobileSidebar, 300);
      }
    });

    // Window resize handler
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) UIManager.closeMobileSidebar();
    });

    // Chat functionality
    document.getElementById('chat-search-input')?.addEventListener('input', (e) => {
      const results = ChatService.searchChats(e.target.value);
      UIManager.updateChatList(results);
    });

    document.getElementById('export-chat-btn')?.addEventListener('click', this.handleExportChat.bind(this));
    document.getElementById('new-chat-btn')?.addEventListener('click', this.handleNewChat.bind(this));

    // Message input
    const messageInput = document.querySelector('.message-input');
    if (messageInput) {
      Utils.input.setupAutoResize(messageInput);

      messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 768) {
          if (messageInput.value.trim() || this.userData.file.data) {
            this.handleSendMessage(e);
          }
        }
      });
    }

    // File upload
    this.setupFileUpload();

    // Send message button
    document.getElementById('send-message')?.addEventListener('click', this.handleSendMessage.bind(this));
  }

  // Setup authentication event listeners
  setupAuthListeners() {
    // Login form
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      Utils.message.showAuthLoading(true);

      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      if (!Utils.validation.required(email) || !Utils.validation.required(password)) {
        Utils.message.showAuthError('Vul alle velden in.');
        Utils.message.showAuthLoading(false);
        return;
      }

      const result = await AuthService.login(email, password);
      if (!result.success) {
        Utils.message.showAuthError(result.error);
      }
      Utils.message.showAuthLoading(false);
    });

    // Register form
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      Utils.message.showAuthLoading(true);

      const name = document.getElementById('register-name').value.trim();
      const email = document.getElementById('register-email').value.trim();
      const password = document.getElementById('register-password').value;

      if (!Utils.validation.required(name) || !Utils.validation.required(email) || !Utils.validation.required(password)) {
        Utils.message.showAuthError('Vul alle velden in.');
        Utils.message.showAuthLoading(false);
        return;
      }

      const result = await AuthService.register(email, password, name);
      if (!result.success) {
        Utils.message.showAuthError(result.error);
      }
      Utils.message.showAuthLoading(false);
    });

    // Google login
    document.getElementById('google-login')?.addEventListener('click', async () => {
      Utils.message.showAuthLoading(true);
      const result = await AuthService.loginWithGoogle();
      if (!result.success) {
        Utils.message.showAuthError(result.error);
      }
      Utils.message.showAuthLoading(false);
    });

    // Form toggles
    document.getElementById('show-register')?.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('login-form').classList.add('hidden');
      document.getElementById('register-form').classList.remove('hidden');
      document.getElementById('auth-title').textContent = 'Registreren';
    });

    document.getElementById('show-login')?.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('register-form').classList.add('hidden');
      document.getElementById('login-form').classList.remove('hidden');
      document.getElementById('auth-title').textContent = 'Inloggen';
    });

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      if (confirm('Weet je zeker dat je wilt uitloggen?')) {
        await AuthService.logout();
      }
    });

    // Password reset
    document.getElementById('password-reset-btn')?.addEventListener('click', async () => {
      const email = document.getElementById('login-email').value.trim();
      if (!email) {
        Utils.message.showAuthError('Voer eerst je e-mailadres in.');
        return;
      }

      const result = await AuthService.resetPassword(email);
      Utils.message.showAuthError(result.message || result.error, result.success ? 'success' : 'error');
    });
  }

  // Setup file upload functionality
  setupFileUpload() {
    const fileInput = document.getElementById('file-input');
    if (!fileInput) return;

    fileInput.addEventListener("change", async () => {
      const file = fileInput.files[0];
      if (!file) return;

      try {
        // Validate file
        Utils.file.validateFile(file);

        // Read file as data URL
        const dataUrl = await Utils.file.readAsDataURL(file);

        // Show preview
        UIManager.showFilePreview(dataUrl);

        // Store file data
        this.userData.file = Utils.file.processFileData(dataUrl, file.type);

        // Clear input
        fileInput.value = "";

      } catch (error) {
        console.error("Error processing file:", error);
        UIManager.showErrorMessage(error.message);
        fileInput.value = "";
      }
    });

    // File cancel button
    document.getElementById('file-cancel')?.addEventListener("click", () => {
      this.userData.file = { data: null, mime_type: null };
      UIManager.clearFilePreview();
    });

    // File upload trigger
    document.getElementById("file-upload")?.addEventListener("click", () => {
      fileInput.click();
    });
  }

  // Setup authentication state listener
  setupAuthStateListener() {
    AuthService.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('✅ User logged in:', user.displayName || user.email);

        // Update UI with user info
        UIManager.updateUserInfo(user);
        UIManager.showApp();

        try {
          // Ensure user profile exists
          await AuthService.ensureUserProfile(user);

          // Load chats
          await ChatService.loadChats();

          // Setup real-time chat list listener
          ChatService.setupChatListListener();

          // Create first chat if none exist
          if (ChatService.getChats().length === 0) {
            const newChat = await ChatService.createChat();
            await ChatService.switchToChat(newChat.id, newChat.title);
          } else {
            UIManager.showWelcomeMessage();
          }

        } catch (error) {
          console.error('❌ Error loading user data:', error);
          UIManager.showErrorMessage('Fout bij het laden van gebruikersgegevens.');
        }

      } else {
        console.log('👋 User logged out');

        // Show auth UI
        UIManager.showAuth();

        // Cleanup
        ChatService.cleanup();

        // Reset forms
        document.getElementById('login-form')?.reset();
        document.getElementById('register-form')?.reset();
        document.getElementById('auth-error')?.classList.add('hidden');

        // Clear UI
        UIManager.clearChat();
      }

      UIManager.hideLoading();
    });
  }

  // Handle new chat creation
  async handleNewChat() {
    try {
      const newChat = await ChatService.createChat();
      await ChatService.switchToChat(newChat.id, newChat.title);
    } catch (error) {
      console.error('Error creating new chat:', error);
      UIManager.showErrorMessage('Kon geen nieuwe chat aanmaken.');
    }
  }

  // Handle chat export
  async handleExportChat() {
    try {
      const exportData = await ChatService.exportChat();
      const filename = `${exportData.chatTitle}-export-${new Date().toISOString().split('T')[0]}.json`;
      Utils.export.downloadJSON(exportData, filename);
      UIManager.showSuccessMessage('Chat succesvol geëxporteerd!');
    } catch (error) {
      console.error('Error exporting chat:', error);
      UIManager.showErrorMessage(error.message || 'Fout bij exporteren van chat.');
    }
  }

  // Handle sending message
  async handleSendMessage(e) {
    e.preventDefault();

    const messageInput = document.querySelector('.message-input');
    const message = messageInput.value.trim();

    if (!message && !this.userData.file.data) {
      UIManager.showErrorMessage("Voer een bericht in of upload een bestand.");
      return;
    }

    try {
      // Set message content
      this.userData.message = message || "Wat zie je in deze afbeelding?";

      // Clear input
      messageInput.value = "";
      UIManager.clearFilePreview();
      messageInput.dispatchEvent(new Event("input"));

      // Create chat if needed
      if (!ChatService.getCurrentChatId()) {
        await ChatService.createChat();
      }

      // Save user message
      try {
        await ChatService.addMessage(
          this.userData.message,
          'user',
          this.userData.file.data ? this.userData.file : null
        );
      } catch (error) {
        console.error("Error saving message:", error);
      }

      // Show user message in UI
      const userDiv = UIManager.createMessageElement(
        this.userData.message,
        true,
        this.userData.file
      );
      UIManager.elements.chatBody.appendChild(userDiv);
      UIManager.scrollToBottom();

      // Show thinking indicator and get AI response
      setTimeout(async () => {
        const thinkingDiv = UIManager.createThinkingMessage();
        UIManager.elements.chatBody.appendChild(thinkingDiv);
        UIManager.scrollToBottom();

        // Get AI response
        const result = await AIService.generateResponse(
          this.userData.message,
          this.userData.file
        );

        if (result.success) {
          // Update thinking message with response
          UIManager.updateThinkingMessage(thinkingDiv, result.response);

          // Save AI response
          try {
            await ChatService.addMessage(result.response, 'assistant');
          } catch (error) {
            console.error("Error saving AI response:", error);
          }
        } else {
          // Show error
          UIManager.updateThinkingMessage(thinkingDiv, result.error, true);
        }

        // Clear file data
        this.userData.file = { data: null, mime_type: null };
        UIManager.scrollToBottom();

      }, 600);

    } catch (error) {
      console.error('Error handling message:', error);
      UIManager.showErrorMessage('Fout bij het verwerken van je bericht.');
    }
  }

  // Setup emoji picker
  setupEmojiPicker() {
    if (typeof EmojiMart !== 'undefined' && document.querySelector('.chat-form')) {
      const picker = new EmojiMart.Picker({
        theme: "light",
        skinTonePosition: "none",
        previewPosition: "none",
        onEmojiSelect: (emoji) => {
          const messageInput = document.querySelector('.message-input');
          if (messageInput) {
            const { selectionStart, selectionEnd } = messageInput;
            messageInput.setRangeText(emoji.native, selectionStart, selectionEnd, "end");
            messageInput.setSelectionRange(
              selectionStart + emoji.native.length,
              selectionStart + emoji.native.length
            );
            messageInput.focus();
          }
        },
        onClickOutside: (e) => {
          document.body.classList.toggle("show-emoji-picker", e.target.id === "emoji-picker");
        },
      });
      document.querySelector(".chat-form").appendChild(picker);
    }
  }
}

// Initialize the application
const app = new ChatApp();

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// Export for debugging
window.ChatApp = app;