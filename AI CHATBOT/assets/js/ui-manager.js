// UIManager: regelt updates aan de interface zoals het tonen van de sidebar op mobiel/desktop.

const UIManager = {
  elements: {},

  // Sla alle belangrijke DOM-elementen op voor makkelijk gebruik en zet direct de mobile listeners.
  initElements: () => {
    UIManager.elements = {
      authModal: document.getElementById('auth-modal'),
      app: document.getElementById('app'),
      loadingScreen: document.getElementById('loading-screen'),
      userAvatar: document.getElementById('user-avatar'),
      userName: document.getElementById('user-name'),
      chatBody: document.querySelector('.chat-body'),
      currentChatTitle: document.getElementById('current-chat-title'),
      messageInput: document.querySelector('.message-input'),
      fileUploadWrapper: document.querySelector('.file-upload-wrapper'),
      sidebar: document.querySelector('.sidebar'),
      mobileOverlay: document.getElementById('mobile-overlay'),
      mobileMenuToggle: document.getElementById('mobile-menu-toggle'),
    };
    UIManager.setupMobileSidebarEvents();
  },

  svgPath: "M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5-53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z",

  createBotAvatar: () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "bot-avatar");
    svg.setAttribute("width", "50");
    svg.setAttribute("height", "50");
    svg.setAttribute("viewBox", "0 0 1024 1024");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", UIManager.svgPath);
    svg.appendChild(path);
    return svg;
  },

  createMessageElement: (content, isUser, fileData) => {
    const div = document.createElement("div");
    div.classList.add("message", isUser ? "user-message" : "bot-message");
    if (!isUser) div.appendChild(UIManager.createBotAvatar());

    const msgText = document.createElement("div");
    msgText.classList.add("message-text");
    msgText.textContent = content;
    div.appendChild(msgText);

    if (fileData?.data) {
      const img = document.createElement("img");
      img.src = `data:${fileData.mime_type};base64,${fileData.data}`;
      img.classList.add("attachment");
      div.appendChild(img);
    }

    return div;
  },

  showErrorMessage: (message) => {
    if (!UIManager.elements.chatBody) return;
    const errorDiv = UIManager.createMessageElement(`❌ ${message}`, false);
    errorDiv.querySelector('.message-text').style.color = "#ff4444";
    UIManager.elements.chatBody.appendChild(errorDiv);
    UIManager.scrollToBottom();
  },

  showSuccessMessage: (message) => {
    if (!UIManager.elements.chatBody) return;
    const successDiv = UIManager.createMessageElement(`✅ ${message}`, false);
    successDiv.querySelector('.message-text').style.color = "#28a745";
    UIManager.elements.chatBody.appendChild(successDiv);
    UIManager.scrollToBottom();
    setTimeout(() => successDiv.remove(), 3000);
  },

  showWelcomeMessage: () => {
    if (!UIManager.elements.chatBody) return;
    Array.from(UIManager.elements.chatBody.children).forEach(child => {
      if (
        child.classList.contains('bot-message') &&
        child.querySelector('.message-text') &&
        child.querySelector('.message-text').textContent.includes("Hello there")
      ) {
        child.remove();
      }
    });
    const welcomeDiv = UIManager.createMessageElement("Hello there 👋 How can I assist you today?", false);
    UIManager.elements.chatBody.appendChild(welcomeDiv);
  },

  loadChatMessages: (messages) => {
    if (!UIManager.elements.chatBody) return;
    UIManager.elements.chatBody.innerHTML = '';
    if (messages.length === 0) {
      UIManager.showWelcomeMessage();
    } else {
      messages.forEach(message => {
        const messageDiv = UIManager.createMessageElement(
          message.content,
          message.role === 'user',
          message.fileData
        );
        UIManager.elements.chatBody.appendChild(messageDiv);
      });
    }
    UIManager.scrollToBottom();
  },

  scrollToBottom: () => {
    if (UIManager.elements.chatBody) {
      UIManager.elements.chatBody.scrollTo({
        top: UIManager.elements.chatBody.scrollHeight,
        behavior: "smooth"
      });
    }
  },

  setCurrentChatTitle: (title) => {
    if (UIManager.elements.currentChatTitle) {
      UIManager.elements.currentChatTitle.textContent = title;
    }
  },

  clearChat: () => {
    if (UIManager.elements.chatBody) {
      UIManager.elements.chatBody.innerHTML = '';
    }
    if (UIManager.elements.currentChatTitle) {
      UIManager.elements.currentChatTitle.textContent = 'AI Chatbot';
    }
  },

  updateUserInfo: (user) => {
    if (UIManager.elements.userName) {
      UIManager.elements.userName.textContent = user.displayName || user.email.split('@')[0];
    }
    if (UIManager.elements.userAvatar) {
      UIManager.elements.userAvatar.src = user.photoURL ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=007bff&color=fff&size=128`;
    }
  },

  showApp: () => {
    UIManager.elements.authModal?.classList.remove('show');
    UIManager.elements.app?.classList.remove('hidden');
  },

  showAuth: () => {
    UIManager.elements.app?.classList.add('hidden');
    UIManager.elements.authModal?.classList.add('show');
  },

  showLoading: () => {
    UIManager.elements.loadingScreen?.classList.remove('hidden');
  },

  hideLoading: () => {
    UIManager.elements.loadingScreen?.classList.add('hidden');
  },

  // ----- SIDEBAR MOBIEL -----
  openMobileSidebar: () => {
    UIManager.elements.sidebar?.classList.add('mobile-open');
    UIManager.elements.mobileOverlay?.classList.add('show');
  },
  closeMobileSidebar: () => {
    UIManager.elements.sidebar?.classList.remove('mobile-open');
    UIManager.elements.mobileOverlay?.classList.remove('show');
  },
  toggleMobileSidebar: () => {
    if (UIManager.elements.sidebar?.classList.contains('mobile-open')) {
      UIManager.closeMobileSidebar();
    } else {
      UIManager.openMobileSidebar();
    }
  },
  setupMobileSidebarEvents: () => {
    UIManager.elements.mobileMenuToggle?.addEventListener('click', UIManager.openMobileSidebar);
    UIManager.elements.mobileOverlay?.addEventListener('click', UIManager.closeMobileSidebar);
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) {
        UIManager.closeMobileSidebar();
      }
    });
  },

  showFilePreview: (dataUrl) => {
    if (UIManager.elements.fileUploadWrapper) {
      const img = UIManager.elements.fileUploadWrapper.querySelector("img");
      if (img) {
        img.src = dataUrl;
        UIManager.elements.fileUploadWrapper.classList.add("file-uploaded");
      }
    }
  },

  clearFilePreview: () => {
    if (UIManager.elements.fileUploadWrapper) {
      UIManager.elements.fileUploadWrapper.classList.remove("file-uploaded");
    }
  },

  createThinkingMessage: () => {
    const botDiv = document.createElement("div");
    botDiv.classList.add("message", "bot-message", "thinking");
    botDiv.appendChild(UIManager.createBotAvatar());

    const msgText = document.createElement("div");
    msgText.classList.add("message-text");

    const indicator = document.createElement("div");
    indicator.classList.add("thinking-indicator");

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("div");
      dot.classList.add("dot");
      indicator.appendChild(dot);
    }

    msgText.appendChild(indicator);
    botDiv.appendChild(msgText);

    return botDiv;
  },

  updateThinkingMessage: (thinkingDiv, content, isError = false) => {
    const messageElement = thinkingDiv.querySelector(".message-text");
    messageElement.textContent = content;

    if (isError) {
      messageElement.style.color = "#ff4444";
      messageElement.style.background = "#fee";
      messageElement.style.padding = "10px";
      messageElement.style.borderRadius = "8px";
      messageElement.style.border = "1px solid #fcc";
    }

    thinkingDiv.classList.remove("thinking");
  }
};

window.UIManager = UIManager;