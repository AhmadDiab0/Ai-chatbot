// === UI MANAGER ===

const UIManager = {
  // DOM elements cache
  elements: {},

  // Initialize DOM elements
  initElements: () => {
    UIManager.elements = {
      // Auth
      authModal: document.getElementById('auth-modal'),
      app: document.getElementById('app'),
      loadingScreen: document.getElementById('loading-screen'),

      // User info
      userAvatar: document.getElementById('user-avatar'),
      userName: document.getElementById('user-name'),

      // Chat
      chatBody: document.querySelector('.chat-body'),
      currentChatTitle: document.getElementById('current-chat-title'),
      chatListContainer: document.getElementById('chat-list-container'),

      // Input
      messageInput: document.querySelector('.message-input'),
      fileUploadWrapper: document.querySelector('.file-upload-wrapper'),

      // Mobile
      sidebar: document.querySelector('.sidebar'),
      mobileOverlay: document.getElementById('mobile-overlay')
    };
  },

  // Utility functions
  svgPath: "M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5-53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z",

  // Create bot avatar
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

  // Create message element
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

  // Show error message
  showErrorMessage: (message) => {
    if (!UIManager.elements.chatBody) return;

    const errorDiv = UIManager.createMessageElement(`❌ ${message}`, false);
    errorDiv.querySelector('.message-text').style.color = "#ff4444";
    UIManager.elements.chatBody.appendChild(errorDiv);
    UIManager.scrollToBottom();
  },

  // Show success message
  showSuccessMessage: (message) => {
    if (!UIManager.elements.chatBody) return;

    const successDiv = UIManager.createMessageElement(`✅ ${message}`, false);
    successDiv.querySelector('.message-text').style.color = "#28a745";
    UIManager.elements.chatBody.appendChild(successDiv);
    UIManager.scrollToBottom();
    setTimeout(() => successDiv.remove(), 3000);
  },

  // Show welcome message
  showWelcomeMessage: () => {
    if (!UIManager.elements.chatBody) return;

    const welcomeDiv = UIManager.createMessageElement("Hello there 👋 How can I assist you today?", false);
    UIManager.elements.chatBody.appendChild(welcomeDiv);
  },

  // Load chat messages
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

  // Scroll to bottom
  scrollToBottom: () => {
    if (UIManager.elements.chatBody) {
      UIManager.elements.chatBody.scrollTo({
        top: UIManager.elements.chatBody.scrollHeight,
        behavior: "smooth"
      });
    }
  },

  // Set current chat title
  setCurrentChatTitle: (title) => {
    if (UIManager.elements.currentChatTitle) {
      UIManager.elements.currentChatTitle.textContent = title;
    }
  },

  // Update active chat item
  updateActiveChatItem: (chatId) => {
    document.querySelectorAll('.chat-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-chat-id="${chatId}"]`)?.classList.add('active');
  },

  // Clear chat
  clearChat: () => {
    if (UIManager.elements.chatBody) {
      UIManager.elements.chatBody.innerHTML = '';
    }
    if (UIManager.elements.currentChatTitle) {
      UIManager.elements.currentChatTitle.textContent = 'AI Chatbot';
    }
  },

  // Create chat item
  createChatItem: (chat) => {
    const div = document.createElement('div');
    div.classList.add('chat-item');
    div.dataset.chatId = chat.id;

    if (chat.id === ChatService.getCurrentChatId()) {
      div.classList.add('active');
    }

    const createdAt = chat.createdAt?.toDate?.() || new Date();
    const formattedDate = createdAt.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short'
    });

    div.innerHTML = `
      <div class="chat-item-title">${chat.title}</div>
      <div class="chat-item-preview">${chat.lastMessage || 'Nieuwe chat'}</div>
      <div class="chat-item-date">${formattedDate}</div>
      <div class="chat-item-actions">
        <button class="chat-action-btn rename-btn" title="Hernoemen">✏️</button>
        <button class="chat-action-btn delete-btn" title="Verwijderen">🗑️</button>
      </div>
    `;

    // Add event listeners
    div.addEventListener('click', (e) => {
      if (!e.target.closest('.chat-action-btn')) {
        ChatService.switchToChat(chat.id, chat.title);
      }
    });

    // Rename functionality
    const renameBtn = div.querySelector('.rename-btn');
    renameBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const newTitle = prompt('Nieuwe naam voor de chat:', chat.title);
      if (newTitle && newTitle !== chat.title) {
        ChatService.updateChatTitle(chat.id, newTitle)
          .then(() => {
            if (chat.id === ChatService.getCurrentChatId()) {
              UIManager.setCurrentChatTitle(newTitle);
            }
          })
          .catch(error => {
            console.error('Error renaming chat:', error);
            UIManager.showErrorMessage('Kon chat niet hernoemen.');
          });
      }
    });

    // Delete functionality
    const deleteBtn = div.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Weet je zeker dat je deze chat wilt verwijderen?')) {
        ChatService.deleteChat(chat.id);
      }
    });

    return div;
  },

  // Update chat list
  updateChatList: (chats) => {
    if (!UIManager.elements.chatListContainer) return;

    UIManager.elements.chatListContainer.innerHTML = '';

    if (chats.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.classList.add('empty-chat-list');
      emptyState.innerHTML = `
        <div class="empty-state-icon">💬</div>
        <p>Nog geen chats</p>
        <small>Klik op "Nieuwe Chat" om te beginnen</small>
      `;
      UIManager.elements.chatListContainer.appendChild(emptyState);
      return;
    }

    chats.forEach(chat => {
      const chatItem = UIManager.createChatItem(chat);
      UIManager.elements.chatListContainer.appendChild(chatItem);
    });
  },

  // Update user info
  updateUserInfo: (user) => {
    if (UIManager.elements.userName) {
      UIManager.elements.userName.textContent = user.displayName || user.email.split('@')[0];
    }

    if (UIManager.elements.userAvatar) {
      UIManager.elements.userAvatar.src = user.photoURL ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=007bff&color=fff&size=128`;
    }
  },

  // Show/hide app
  showApp: () => {
    UIManager.elements.authModal?.classList.remove('show');
    UIManager.elements.app?.classList.remove('hidden');
  },

  showAuth: () => {
    UIManager.elements.app?.classList.add('hidden');
    UIManager.elements.authModal?.classList.add('show');
  },

  // Loading screen
  showLoading: () => {
    UIManager.elements.loadingScreen?.classList.remove('hidden');
  },

  hideLoading: () => {
    UIManager.elements.loadingScreen?.classList.add('hidden');
  },

  // Mobile sidebar
  openMobileSidebar: () => {
    UIManager.elements.sidebar?.classList.add('mobile-open');
    UIManager.elements.mobileOverlay?.classList.add('show');
    document.body.classList.add('mobile-sidebar-open');
  },

  closeMobileSidebar: () => {
    UIManager.elements.sidebar?.classList.remove('mobile-open');
    UIManager.elements.mobileOverlay?.classList.remove('show');
    document.body.classList.remove('mobile-sidebar-open');
  },

  toggleMobileSidebar: () => {
    if (UIManager.elements.sidebar?.classList.contains('mobile-open')) {
      UIManager.closeMobileSidebar();
    } else {
      UIManager.openMobileSidebar();
    }
  },

  // File upload UI
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

  // Create thinking indicator
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

  // Update thinking message with response
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

// Export for global use
window.UIManager = UIManager;