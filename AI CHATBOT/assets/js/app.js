// Dit is het 'hoofdprogramma' van de chat-app.
// Hier wordt alles gestart en worden alle onderdelen aan elkaar geknoopt.

class ChatApp {
  constructor() {
    // Hier onthouden we tijdelijk het bericht en een eventueel bestand dat je toevoegt.
    this.userData = {
      message: null,
      file: { data: null, mime_type: null }
    };
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;

    console.log('🚀 Initializing Clean AI Chatbot...');
    UIManager.initElements();

    // Zet dark mode aan of uit, afhankelijk van de voorkeur.
    Utils.darkMode.initialize();

    UIManager.showLoading();
    this.setupEventListeners();
    this.setupAuthStateListener();

    setTimeout(() => this.setupEmojiPicker(), 1000);

    this.isInitialized = true;
  }

  setupEventListeners() {
    this.setupAuthListeners();

    document.getElementById('dark-mode-toggle')?.addEventListener('click', Utils.darkMode.toggle);
    document.getElementById('dark-mode-toggle-app')?.addEventListener('click', Utils.darkMode.toggle);

    // Bericht-invoer automatisch groter maken als je veel typt. Enter verzendt het bericht.
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

    // Bestand uploaden (afbeelding).
    this.setupFileUpload();

    // Verzend-knop koppelen.
    document.getElementById('send-message')?.addEventListener('click', this.handleSendMessage.bind(this));
  }

  setupAuthListeners() {
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

    document.getElementById('google-login')?.addEventListener('click', async () => {
      Utils.message.showAuthLoading(true);
      const result = await AuthService.loginWithGoogle();
      if (!result.success) {
        Utils.message.showAuthError(result.error);
      }
      Utils.message.showAuthLoading(false);
    });

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

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      if (confirm('Weet je zeker dat je wilt uitloggen?')) {
        await AuthService.logout();
      }
    });

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
        Utils.file.validateFile(file);
        const dataUrl = await Utils.file.readAsDataURL(file);
        UIManager.showFilePreview(dataUrl);
        this.userData.file = Utils.file.processFileData(dataUrl, file.type);
        fileInput.value = "";
      } catch (error) {
        console.error("Error processing file:", error);
        UIManager.showErrorMessage(error.message);
        fileInput.value = "";
      }
    });

    document.getElementById('file-cancel')?.addEventListener("click", () => {
      this.userData.file = { data: null, mime_type: null };
      UIManager.clearFilePreview();
    });

    document.getElementById("file-upload")?.addEventListener("click", () => {
      fileInput.click();
    });
  }

  setupAuthStateListener() {
    AuthService.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('✅ User logged in:', user.displayName || user.email);
        UIManager.updateUserInfo(user);
        UIManager.showApp();

        try {
          await AuthService.ensureUserProfile(user);
          ChatService.init(user.uid);
        } catch (error) {
          console.error('❌ Error loading user data:', error);
          UIManager.showErrorMessage('Fout bij het laden van gebruikersgegevens.');
        }
      } else {
        console.log('👋 User logged out');
        UIManager.showAuth();
        ChatService.cleanup();
        document.getElementById('login-form')?.reset();
        document.getElementById('register-form')?.reset();
        document.getElementById('auth-error')?.classList.add('hidden');
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
      this.userData.message = message || "Wat zie je in deze afbeelding?";
      messageInput.value = "";
      UIManager.clearFilePreview();
      messageInput.dispatchEvent(new Event("input"));

      await ChatService.addMessage(
        this.userData.message,
        'user',
        this.userData.file.data ? this.userData.file : null
      );

      const userDiv = UIManager.createMessageElement(
        this.userData.message,
        true,
        this.userData.file
      );
      UIManager.elements.chatBody.appendChild(userDiv);
      UIManager.scrollToBottom();

      setTimeout(async () => {
        const thinkingDiv = UIManager.createThinkingMessage();
        UIManager.elements.chatBody.appendChild(thinkingDiv);
        UIManager.scrollToBottom();

        const result = await AIService.generateResponse(
          this.userData.message,
          this.userData.file
        );

        if (result.success) {
          UIManager.updateThinkingMessage(thinkingDiv, result.response);
          try {
            await ChatService.addMessage(result.response, 'assistant');
          } catch (error) {
            console.error("Error saving AI response:", error);
          }
        } else {
          UIManager.updateThinkingMessage(thinkingDiv, result.error, true);
        }

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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new ChatApp();
    window.ChatApp = app;
    app.init();
  });
} else {
  const app = new ChatApp();
  window.ChatApp = app;
  app.init();
}