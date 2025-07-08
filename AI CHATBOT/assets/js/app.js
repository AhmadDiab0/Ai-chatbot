// === MAIN APPLICATION - Single Chat versie ===

class ChatApp {
  constructor() {
    this.userData = {
      message: null,
      file: { data: null, mime_type: null }
    };

    this.isInitialized = false;
  }

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

    // Setup emoji picker (delayed, want webcomponent laadt soms traag)
    setTimeout(() => this.setupEmojiPicker(), 1000);

    this.isInitialized = true;
  }

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

    // Window resize handler
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) UIManager.closeMobileSidebar();
    });

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

          // Init single chat
          ChatService.init(user.uid);

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

      // Save user message (direct naar singleChat array)
      await ChatService.addMessage(
        this.userData.message,
        'user',
        this.userData.file.data ? this.userData.file : null
      );

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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}


window.ChatApp = app;