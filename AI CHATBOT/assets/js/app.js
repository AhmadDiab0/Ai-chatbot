// === FIREBASE CONFIG ===
const firebaseConfig = {
  apiKey: "AIzaSyDw_zgeu2ZzVf-GaqdlKhqzOgh_oZO0Sl4",
  authDomain: "ai-chatbot-9b46e.firebaseapp.com",
  projectId: "ai-chatbot-9b46e",
  storageBucket: "ai-chatbot-9b46e.firebasestorage.app",
  messagingSenderId: "613195099685",
  appId: "1:613195099685:web:16239bc3d7e90dcefdd9cc"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// === GEMINI API ===
const API_KEY = "AIzaSyD_VXIB9bCRw9FebI2UgE5cRQEBdWm54uA";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// === DOM ELEMENTS ===
const authModal = document.getElementById('auth-modal');
const app = document.getElementById('app');
const loadingScreen = document.getElementById('loading-screen');

// Auth
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authError = document.getElementById('auth-error');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const registerName = document.getElementById('register-name');
const registerEmail = document.getElementById('register-email');
const registerPassword = document.getElementById('register-password');
const googleLoginBtn = document.getElementById('google-login');
const showRegisterBtn = document.getElementById('show-register');
const showLoginBtn = document.getElementById('show-login');
const logoutBtn = document.getElementById('logout-btn');
const passwordResetBtn = document.getElementById('password-reset-btn');

// Dark mode
const darkModeToggle = document.getElementById('dark-mode-toggle');
const darkModeToggleApp = document.getElementById('dark-mode-toggle-app');

// App
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const newChatBtn = document.getElementById('new-chat-btn');
const chatListContainer = document.getElementById('chat-list-container');
const currentChatTitle = document.getElementById('current-chat-title');
const chatSearchInput = document.getElementById('chat-search-input');
const exportChatBtn = document.getElementById('export-chat-btn');

// Mobile
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
const mobileOverlay = document.getElementById('mobile-overlay');

// Chat
const chatBody = document.querySelector('.chat-body');
const messageInput = document.querySelector('.message-input');
const sendMessageButton = document.getElementById('send-message');
const fileInput = document.getElementById('file-input');
const fileUploadWrapper = document.querySelector('.file-upload-wrapper');
const fileCancelButton = document.getElementById('file-cancel');

// === STATE ===
let currentUser = null;
let currentChatId = null;
let chats = [];
let allChats = [];
let currentChatUnsubscribe = null;
let chatListUnsubscribe = null;
let lastRequestTime = 0;
let dailyRequests = parseInt(localStorage.getItem('dailyApiRequests') || '0');
let lastResetDate = localStorage.getItem('lastApiResetDate') || new Date().toDateString();

const userData = {
  message: null,
  file: { data: null, mime_type: null }
};

const initialInputHeight = messageInput?.scrollHeight || 40;
const MIN_REQUEST_INTERVAL = 5000; // 5 seconden tussen requests
// === UTILITY FUNCTIONS ===
const svgPath = "M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5-53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z";

const createBotAvatar = () => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "bot-avatar");
  svg.setAttribute("width", "50");
  svg.setAttribute("height", "50");
  svg.setAttribute("viewBox", "0 0 1024 1024");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", svgPath);
  svg.appendChild(path);
  return svg;
};

const createMessageElement = (content, isUser, fileData) => {
  const div = document.createElement("div");
  div.classList.add("message", isUser ? "user-message" : "bot-message");

  if (!isUser) div.appendChild(createBotAvatar());

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
};

const showErrorMessage = (message) => {
  const errorDiv = createMessageElement(`❌ ${message}`, false);
  errorDiv.querySelector('.message-text').style.color = "#ff4444";
  chatBody.appendChild(errorDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
};

const showSuccessMessage = (message) => {
  const successDiv = createMessageElement(`✅ ${message}`, false);
  successDiv.querySelector('.message-text').style.color = "#28a745";
  chatBody.appendChild(successDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  setTimeout(() => successDiv.remove(), 3000);
};

const showAuthError = (message, type = 'error') => {
  authError.textContent = message;
  authError.classList.remove('hidden');
  authError.style.background = type === 'success' ? '#d4edda' : '#f8d7da';
  authError.style.color = type === 'success' ? '#155724' : '#721c24';
  setTimeout(() => authError.classList.add('hidden'), 5000);
};

// === DARK MODE ===
const toggleDarkMode = () => {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));

  const updateIcon = (element) => {
    const icon = element?.querySelector('.material-symbols-rounded');
    if (icon) {
      icon.textContent = document.body.classList.contains('dark-mode') ? 'light_mode' : 'dark_mode';
    }
  };

  updateIcon(darkModeToggle);
  updateIcon(darkModeToggleApp);
};

const initializeDarkMode = () => {
  const savedMode = localStorage.getItem('darkMode');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedMode === 'true' || (savedMode === null && prefersDark)) {
    document.body.classList.add('dark-mode');
  }

  const updateIcon = (element) => {
    const icon = element?.querySelector('.material-symbols-rounded');
    if (icon) {
      icon.textContent = document.body.classList.contains('dark-mode') ? 'light_mode' : 'dark_mode';
    }
  };

  updateIcon(darkModeToggle);
  updateIcon(darkModeToggleApp);
};

// === MOBILE SIDEBAR ===
const openMobileSidebar = () => {
  document.querySelector('.sidebar')?.classList.add('mobile-open');
  mobileOverlay?.classList.add('show');
  document.body.classList.add('mobile-sidebar-open');
};

const closeMobileSidebar = () => {
  document.querySelector('.sidebar')?.classList.remove('mobile-open');
  mobileOverlay?.classList.remove('show');
  document.body.classList.remove('mobile-sidebar-open');
};

const toggleMobileSidebar = () => {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar?.classList.contains('mobile-open')) {
    closeMobileSidebar();
  } else {
    openMobileSidebar();
  }
};

// === AUTH FUNCTIONS ===
const showAuthLoading = (show) => {
  document.querySelectorAll('.auth-btn').forEach(btn => {
    btn.disabled = show;
    if (show) {
      if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;
      btn.innerHTML = show ? '<span class="loading-spinner-small"></span>Laden...' : btn.dataset.originalText;
    } else {
      btn.textContent = btn.dataset.originalText || btn.textContent;
    }
  });
};

const getErrorMessage = (error) => {
  const messages = {
    'auth/user-not-found': 'Geen account gevonden met dit e-mailadres.',
    'auth/wrong-password': 'Onjuist wachtwoord.',
    'auth/email-already-in-use': 'Dit e-mailadres is al in gebruik.',
    'auth/weak-password': 'Wachtwoord moet minimaal 6 karakters bevatten.',
    'auth/invalid-email': 'Ongeldig e-mailadres.',
    'auth/popup-closed-by-user': 'Login geannuleerd.'
  };
  return messages[error.code] || error.message || 'Er is een fout opgetreden.';
};

const resetPassword = async (email) => {
  try {
    await auth.sendPasswordResetEmail(email);
    return { success: true, message: 'Reset link verzonden naar je email!' };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
};

const register = async (email, password, displayName) => {
  showAuthLoading(true);
  try {
    const result = await auth.createUserWithEmailAndPassword(email, password);
    await result.user.updateProfile({ displayName });
    await createUserProfile(result.user, { displayName });
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  } finally {
    showAuthLoading(false);
  }
};

const login = async (email, password) => {
  showAuthLoading(true);
  try {
    const result = await auth.signInWithEmailAndPassword(email, password);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  } finally {
    showAuthLoading(false);
  }
};

const loginWithGoogle = async () => {
  showAuthLoading(true);
  try {
    const result = await auth.signInWithPopup(googleProvider);
    await ensureUserProfile(result.user);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  } finally {
    showAuthLoading(false);
  }
};

const logout = async () => {
  try {
    await auth.signOut();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
};

const createUserProfile = async (user, additionalData) => {
  if (!user) return;

  const userRef = db.collection('users').doc(user.uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    try {
      await userRef.set({
        displayName: user.displayName || additionalData?.displayName || '',
        email: user.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        photoURL: user.photoURL || null
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  }
};

const ensureUserProfile = async (user) => {
  if (!user) return;
  await createUserProfile(user);
};

// === CHAT FUNCTIONS ===
const trackApiUsage = () => {
  const today = new Date().toDateString();

  if (today !== lastResetDate) {
    dailyRequests = 0;
    lastResetDate = today;
    localStorage.setItem('lastApiResetDate', today);
  }

  dailyRequests++;
  localStorage.setItem('dailyApiRequests', dailyRequests.toString());

  if (dailyRequests > 80) {
    showErrorMessage(`⚠️ Let op: Je hebt vandaag al ${dailyRequests} verzoeken gedaan.`);
  }
};

const createChat = async (title = null) => {
  if (!currentUser) throw new Error('User not authenticated');

  try {
    const chatData = {
      title: title || `Nieuwe Chat ${new Date().toLocaleDateString('nl-NL')}`,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      userId: currentUser.uid,
      messageCount: 0
    };

    const chatRef = await db.collection('users').doc(currentUser.uid).collection('chats').add(chatData);
    currentChatId = chatRef.id;
    await loadChats();

    return { id: chatRef.id, ...chatData };
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

const loadChats = async () => {
  if (!currentUser) return [];

  try {
    const chatsRef = db.collection('users').doc(currentUser.uid).collection('chats');
    const q = chatsRef.orderBy('updatedAt', 'desc');
    const querySnapshot = await q.get();

    chats = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    allChats = [...chats];
    updateChatList();
    return chats;
  } catch (error) {
    console.error('Error loading chats:', error);
    return [];
  }
};

const addMessage = async (content, role = 'user', fileData = null) => {
  if (!currentUser || !currentChatId) return;

  try {
    const messageData = {
      content,
      role,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      userId: currentUser.uid,
      ...(fileData && { fileData })
    };

    const messagesRef = db.collection('users').doc(currentUser.uid).collection('chats').doc(currentChatId).collection('messages');
    await messagesRef.add(messageData);

    const chatRef = db.collection('users').doc(currentUser.uid).collection('chats').doc(currentChatId);
    await chatRef.update({
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastMessage: content.substring(0, 100) + (content.length > 100 ? '...' : '')
    });
  } catch (error) {
    console.error('Error adding message:', error);
    throw error;
  }
};

const loadMessages = async (chatId) => {
  if (!currentUser) return [];

  try {
    const messagesRef = db.collection('users').doc(currentUser.uid).collection('chats').doc(chatId).collection('messages');
    const q = messagesRef.orderBy('timestamp', 'asc');
    const querySnapshot = await q.get();

    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error loading messages:', error);
    return [];
  }
};

const switchToChat = async (chatId, title) => {
  try {
    if (currentChatUnsubscribe) currentChatUnsubscribe();

    currentChatId = chatId;
    const messages = await loadMessages(chatId);
    loadChatMessages(messages);

    currentChatTitle.textContent = title;
    document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-chat-id="${chatId}"]`)?.classList.add('active');

    const messagesRef = db.collection('users').doc(currentUser.uid).collection('chats').doc(chatId).collection('messages');
    const q = messagesRef.orderBy('timestamp', 'asc');

    currentChatUnsubscribe = q.onSnapshot((snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      loadChatMessages(messages);
    });
  } catch (error) {
    console.error('Error switching to chat:', error);
    showErrorMessage('Kon chat niet laden.');
  }
};

const updateChatTitle = async (chatId, newTitle) => {
  if (!currentUser) return;

  try {
    const chatRef = db.collection('users').doc(currentUser.uid).collection('chats').doc(chatId);
    await chatRef.update({
      title: newTitle,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating chat title:', error);
    throw error;
  }
};

const deleteChat = async (chatId) => {
  if (!currentUser) return;

  try {
    const messagesRef = db.collection('users').doc(currentUser.uid).collection('chats').doc(chatId).collection('messages');
    const messages = await messagesRef.get();

    const deletePromises = messages.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);

    const chatRef = db.collection('users').doc(currentUser.uid).collection('chats').doc(chatId);
    await chatRef.delete();

    if (currentChatId === chatId) {
      currentChatId = null;
      chatBody.innerHTML = '';
      currentChatTitle.textContent = 'AI Chatbot';
      if (currentChatUnsubscribe) currentChatUnsubscribe();
      showWelcomeMessage();
    }

    await loadChats();
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw error;
  }
};

const searchChats = (query) => {
  if (!query.trim()) {
    chats = [...allChats];
  } else {
    chats = allChats.filter(chat =>
      chat.title.toLowerCase().includes(query.toLowerCase()) ||
      chat.lastMessage?.toLowerCase().includes(query.toLowerCase())
    );
  }
  updateChatList();
};

const exportChat = async () => {
  if (!currentChatId) {
    showErrorMessage('Geen chat geselecteerd om te exporteren.');
    return;
  }

  try {
    const messages = await loadMessages(currentChatId);
    const chat = allChats.find(c => c.id === currentChatId);

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

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chat?.title || 'chat'}-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showSuccessMessage('Chat succesvol geëxporteerd!');
  } catch (error) {
    console.error('Error exporting chat:', error);
    showErrorMessage('Fout bij exporteren van chat.');
  }
};

const showWelcomeMessage = () => {
  const welcomeDiv = createMessageElement("Hello there 👋 How can I assist you today?", false);
  chatBody.appendChild(welcomeDiv);
};

const loadChatMessages = (messages) => {
  chatBody.innerHTML = '';

  if (messages.length === 0) {
    showWelcomeMessage();
  } else {
    messages.forEach(message => {
      const messageDiv = createMessageElement(message.content, message.role === 'user', message.fileData);
      chatBody.appendChild(messageDiv);
    });
  }

  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
};

const createChatItem = (chat) => {
  const div = document.createElement('div');
  div.classList.add('chat-item');
  div.dataset.chatId = chat.id;

  if (chat.id === currentChatId) div.classList.add('active');

  const createdAt = chat.createdAt?.toDate?.() || new Date();
  const formattedDate = createdAt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });

  div.innerHTML = `
    <div class="chat-item-title">${chat.title}</div>
    <div class="chat-item-preview">${chat.lastMessage || 'Nieuwe chat'}</div>
    <div class="chat-item-date">${formattedDate}</div>
    <div class="chat-item-actions">
      <button class="chat-action-btn rename-btn" title="Hernoemen">✏️</button>
      <button class="chat-action-btn delete-btn" title="Verwijderen">🗑️</button>
    </div>
  `;

  div.addEventListener('click', (e) => {
    if (!e.target.closest('.chat-action-btn')) {
      switchToChat(chat.id, chat.title);
    }
  });

  const renameBtn = div.querySelector('.rename-btn');
  const deleteBtn = div.querySelector('.delete-btn');

  renameBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const newTitle = prompt('Nieuwe naam voor de chat:', chat.title);
    if (newTitle && newTitle !== chat.title) {
      updateChatTitle(chat.id, newTitle).then(() => {
        if (chat.id === currentChatId) currentChatTitle.textContent = newTitle;
        loadChats();
      }).catch(error => {
        console.error('Error renaming chat:', error);
        showErrorMessage('Kon chat niet hernoemen.');
      });
    }
  });

  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm('Weet je zeker dat je deze chat wilt verwijderen?')) {
      deleteChat(chat.id);
    }
  });

  return div;
};

const updateChatList = () => {
  chatListContainer.innerHTML = '';

  if (chats.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.classList.add('empty-chat-list');
    emptyState.innerHTML = `
      <div class="empty-state-icon">💬</div>
      <p>Nog geen chats</p>
      <small>Klik op "Nieuwe Chat" om te beginnen</small>
    `;
    chatListContainer.appendChild(emptyState);
    return;
  }

  chats.forEach(chat => {
    const chatItem = createChatItem(chat);
    chatListContainer.appendChild(chatItem);
  });
};

const generateBotResponse = async (incomingDiv, saveToFirebase = true) => {
  const messageElement = incomingDiv.querySelector(".message-text");

  try {
    trackApiUsage();

    const parts = [];
    if (userData.message) parts.push({ text: userData.message });
    if (userData.file.data) {
      parts.push({
        inline_data: {
          mime_type: userData.file.mime_type,
          data: userData.file.data
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

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));

      let errorMessage = "Er is een fout opgetreden bij het verwerken van je bericht.";

      if (res.status === 400 && errorData.error?.message) {
        if (errorData.error.message.includes("image")) {
          errorMessage = "Het afbeeldingsbestand wordt niet ondersteund.";
        } else if (errorData.error.message.includes("SAFETY")) {
          errorMessage = "Je bericht werd geblokkeerd door veiligheidsfilters. Probeer het anders te formuleren.";
        } else if (errorData.error.message.includes("quota")) {
          errorMessage = "API quota overschreden. Probeer later opnieuw.";
        } else {
          errorMessage = `API Fout: ${errorData.error.message}`;
        }
      } else if (res.status === 403) {
        errorMessage = "API toegang geweigerd. Mogelijk quota overschreden of billing probleem.";
      } else if (res.status === 429) {
        errorMessage = "Te veel verzoeken. Wacht 30 seconden en probeer opnieuw.";
      } else if ([500, 502, 503].includes(res.status)) {
        errorMessage = "Google servers zijn tijdelijk onbeschikbaar. Probeer over 1 minuut opnieuw.";
      }

      throw new Error(errorMessage);
    }

    const data = await res.json();

    if (!data.candidates?.[0]?.content) {
      throw new Error("Ongeldig antwoord van de AI. Probeer opnieuw.");
    }

    const reply = data.candidates[0].content.parts[0].text;
    if (!reply) throw new Error("Geen antwoord ontvangen van de AI.");

    const formattedReply = reply.replace(/\*\*(.*?)\*\*/g, "$1").trim();
    messageElement.textContent = formattedReply;

    if (saveToFirebase && currentChatId) {
      await addMessage(formattedReply, 'assistant');
    }

  } catch (error) {
    console.error("Error in generateBotResponse:", error);

    let displayMessage = error.message;
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      displayMessage = "Netwerkfout. Controleer je internetverbinding.";
    }

    messageElement.textContent = displayMessage;
    messageElement.style.color = "#ff4444";
    messageElement.style.background = "#fee";
    messageElement.style.padding = "10px";
    messageElement.style.borderRadius = "8px";
    messageElement.style.border = "1px solid #fcc";
  } finally {
    userData.file = { data: null, mime_type: null };
    incomingDiv.classList.remove("thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  }
};

const handleOutgoingMessage = async (e) => {
  e.preventDefault();

  const now = Date.now();
  if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
    const waitTime = Math.ceil((MIN_REQUEST_INTERVAL - (now - lastRequestTime)) / 1000);
    showErrorMessage(`⏱️ Wacht nog ${waitTime} seconden voor het volgende bericht.`);
    return;
  }

  const message = messageInput.value.trim();
  if (!message && !userData.file.data) {
    showErrorMessage("Voer een bericht in of upload een bestand.");
    return;
  }

  lastRequestTime = now;
  userData.message = message || "Wat zie je in deze afbeelding?";
  messageInput.value = "";
  fileUploadWrapper.classList.remove("file-uploaded");
  messageInput.dispatchEvent(new Event("input"));

  if (!currentChatId) {
    try {
      await createChat();
    } catch (error) {
      console.error("Error creating chat:", error);
      showErrorMessage("Kon geen nieuwe chat aanmaken.");
      return;
    }
  }

  try {
    await addMessage(userData.message, 'user', userData.file.data ? userData.file : null);
  } catch (error) {
    console.error("Error saving message:", error);
  }

  const userDiv = createMessageElement(userData.message, true, userData.file);
  chatBody.appendChild(userDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

  setTimeout(() => {
    const botDiv = document.createElement("div");
    botDiv.classList.add("message", "bot-message", "thinking");
    botDiv.appendChild(createBotAvatar());

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

    chatBody.appendChild(botDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

    generateBotResponse(botDiv);
  }, 600);
};

// === EVENT LISTENERS ===
const setupEventListeners = () => {
  // Auth events
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
      showAuthError('Vul alle velden in.');
      return;
    }

    const result = await login(email, password);
    if (!result.success) showAuthError(result.error);
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = registerName.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value;

    if (!name || !email || !password) {
      showAuthError('Vul alle velden in.');
      return;
    }

    const result = await register(email, password, name);
    if (!result.success) showAuthError(result.error);
  });

  googleLoginBtn?.addEventListener('click', async () => {
    const result = await loginWithGoogle();
    if (!result.success) showAuthError(result.error);
  });

  showRegisterBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    document.getElementById('auth-title').textContent = 'Registreren';
  });

  showLoginBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    document.getElementById('auth-title').textContent = 'Inloggen';
  });

  logoutBtn?.addEventListener('click', async () => {
    if (confirm('Weet je zeker dat je wilt uitloggen?')) await logout();
  });

  passwordResetBtn?.addEventListener('click', async () => {
    const email = loginEmail.value.trim();
    if (!email) {
      showAuthError('Voer eerst je e-mailadres in.');
      return;
    }

    const result = await resetPassword(email);
    showAuthError(result.message || result.error, result.success ? 'success' : 'error');
  });

  // Dark mode
  darkModeToggle?.addEventListener('click', toggleDarkMode);
  darkModeToggleApp?.addEventListener('click', toggleDarkMode);

  // Mobile sidebar
  mobileMenuToggle?.addEventListener('click', toggleMobileSidebar);
  sidebarCloseBtn?.addEventListener('click', closeMobileSidebar);
  mobileOverlay?.addEventListener('click', (e) => {
    if (e.target.id === 'mobile-overlay') closeMobileSidebar();
  });

  // Auto-close mobile sidebar when chat is selected
  chatListContainer?.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && e.target.closest('.chat-item')) {
      setTimeout(closeMobileSidebar, 300);
    }
  });

  // Window resize handler
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeMobileSidebar();
  });

  // Chat functionality
  chatSearchInput?.addEventListener('input', (e) => searchChats(e.target.value));
  exportChatBtn?.addEventListener('click', exportChat);

  newChatBtn?.addEventListener('click', async () => {
    try {
      const newChat = await createChat();
      await switchToChat(newChat.id, newChat.title);
    } catch (error) {
      console.error('Error creating new chat:', error);
      showErrorMessage('Kon geen nieuwe chat aanmaken.');
    }
  });

  // Message input
  messageInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.target.value.trim() || userData.file.data) && !e.shiftKey && window.innerWidth > 768) {
      handleOutgoingMessage(e);
    }
  });

  messageInput?.addEventListener("input", () => {
    messageInput.style.height = `${initialInputHeight}px`;
    messageInput.style.height = `${messageInput.scrollHeight}px`;
    const chatForm = document.querySelector(".chat-form");
    if (chatForm) {
      chatForm.style.borderRadius = messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
    }
  });

  // File upload
  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      showErrorMessage("Alleen PNG, JPG, JPEG of WEBP afbeeldingen zijn toegestaan.");
      fileInput.value = "";
      return;
    }

    const maxSize = 4 * 1024 * 1024;
    if (file.size > maxSize) {
      showErrorMessage("Bestand is te groot. Maximaal 4 MB toegestaan.");
      fileInput.value = "";
      return;
    }

    try {
      const reader = new FileReader();
      const dataUrl = await new Promise((resolve, reject) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });

      const img = fileUploadWrapper.querySelector("img");
      if (img) {
        img.src = dataUrl;
        fileUploadWrapper.classList.add("file-uploaded");
      }

      let mimeType = file.type;
      if (mimeType === "image/jpg") {
        mimeType = "image/jpeg";
      }

      userData.file = {
        data: dataUrl.split(",")[1],
        mime_type: mimeType
      };
      fileInput.value = "";
    } catch (error) {
      console.error("Error processing file:", error);
      showErrorMessage("Fout bij het verwerken van het bestand.");
      fileInput.value = "";
    }
  });

  fileCancelButton?.addEventListener("click", () => {
    userData.file = { data: null, mime_type: null };
    fileUploadWrapper.classList.remove("file-uploaded");
  });

  sendMessageButton?.addEventListener("click", handleOutgoingMessage);
  document.getElementById("file-upload")?.addEventListener("click", () => fileInput?.click());

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "n") {
      e.preventDefault();
      newChatBtn?.click();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "f") {
      e.preventDefault();
      chatSearchInput?.focus();
    }

    if (e.key === "Escape") {
      authModal?.classList.remove("show");
      if (window.innerWidth <= 768) closeMobileSidebar();
    }
  });
};

// === INITIALIZATION ===
const initializeApp = () => {
  console.log('🚀 Initializing Clean AI Chatbot...');

  initializeDarkMode();
  loadingScreen?.classList.remove('hidden');
  setupEventListeners();

  auth.onAuthStateChanged(async (user) => {
    currentUser = user;

    if (user) {
      console.log('✅ User logged in:', user.displayName || user.email);

      if (userName) userName.textContent = user.displayName || user.email.split('@')[0];
      if (userAvatar) {
        userAvatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=007bff&color=fff&size=128`;
      }

      authModal?.classList.remove('show');
      app?.classList.remove('hidden');

      try {
        await ensureUserProfile(user);
        await loadChats();

        if (chats.length === 0) {
          const newChat = await createChat();
          await switchToChat(newChat.id, newChat.title);
        } else {
          showWelcomeMessage();
        }

        // Real-time chat list listener
        const chatsRef = db.collection('users').doc(user.uid).collection('chats');
        const q = chatsRef.orderBy('updatedAt', 'desc');

        chatListUnsubscribe = q.onSnapshot((snapshot) => {
          chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          allChats = [...chats];
          updateChatList();
        });

      } catch (error) {
        console.error('❌ Error loading user data:', error);
        showErrorMessage('Fout bij het laden van gebruikersgegevens.');
      }

    } else {
      console.log('👋 User logged out');

      app?.classList.add('hidden');
      authModal?.classList.add('show');

      if (currentChatUnsubscribe) currentChatUnsubscribe();
      if (chatListUnsubscribe) chatListUnsubscribe();

      loginForm?.reset();
      registerForm?.reset();
      authError?.classList.add('hidden');

      currentChatId = null;
      chats = [];
      allChats = [];
      if (chatBody) chatBody.innerHTML = '';
      if (currentChatTitle) currentChatTitle.textContent = 'AI Chatbot';
    }

    loadingScreen?.classList.add('hidden');
  });

  // Setup emoji picker
  setTimeout(() => {
    if (typeof EmojiMart !== 'undefined' && document.querySelector('.chat-form')) {
      const picker = new EmojiMart.Picker({
        theme: "light",
        skinTonePosition: "none",
        previewPosition: "none",
        onEmojiSelect: (emoji) => {
          if (messageInput) {
            const { selectionStart, selectionEnd } = messageInput;
            messageInput.setRangeText(emoji.native, selectionStart, selectionEnd, "end");
            messageInput.setSelectionRange(selectionStart + emoji.native.length, selectionStart + emoji.native.length);
            messageInput.focus();
          }
        },
        onClickOutside: (e) => {
          document.body.classList.toggle("show-emoji-picker", e.target.id === "emoji-picker");
        },
      });
      document.querySelector(".chat-form").appendChild(picker);
    }
  }, 1000);
};

// Start the app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}