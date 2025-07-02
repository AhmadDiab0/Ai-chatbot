// === FIREBASE CONFIGURATION & CORE SERVICES ===

const firebaseConfig = {
  apiKey: "AIzaSyDw_zgeu2ZzVf-GaqdlKhqzOgh_oZO0Sl4",
  authDomain: "ai-chatbot-9b46e.firebaseapp.com",
  projectId: "ai-chatbot-9b46e",
  storageBucket: "ai-chatbot-9b46e.firebasestorage.app",
  messagingSenderId: "613195099685",
  appId: "1:613195099685:web:16239bc3d7e90dcefdd9cc"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export Firebase services
const FirebaseService = {
  auth: firebase.auth(),
  db: firebase.firestore(),
  googleProvider: new firebase.auth.GoogleAuthProvider(),

  // Server timestamp utility
  serverTimestamp: () => firebase.firestore.FieldValue.serverTimestamp(),

  // Firestore utilities
  createDoc: (collection, data) => {
    return FirebaseService.db.collection(collection).add(data);
  },

  getDoc: (collection, docId) => {
    return FirebaseService.db.collection(collection).doc(docId).get();
  },

  updateDoc: (collection, docId, data) => {
    return FirebaseService.db.collection(collection).doc(docId).update(data);
  },

  deleteDoc: (collection, docId) => {
    return FirebaseService.db.collection(collection).doc(docId).delete();
  },

  // User-specific collection helpers
  getUserCollection: (userId, subcollection) => {
    return FirebaseService.db.collection('users').doc(userId).collection(subcollection);
  },

  getChatCollection: (userId, chatId, subcollection) => {
    return FirebaseService.db
      .collection('users').doc(userId)
      .collection('chats').doc(chatId)
      .collection(subcollection);
  }
};

// Export for use in other modules
window.FirebaseService = FirebaseService;