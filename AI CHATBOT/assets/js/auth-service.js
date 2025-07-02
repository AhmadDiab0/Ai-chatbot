// === AUTHENTICATION SERVICE ===

const AuthService = {
  currentUser: null,

  // Error message mapping
  getErrorMessage: (error) => {
    const messages = {
      'auth/user-not-found': 'Geen account gevonden met dit e-mailadres.',
      'auth/wrong-password': 'Onjuist wachtwoord.',
      'auth/email-already-in-use': 'Dit e-mailadres is al in gebruik.',
      'auth/weak-password': 'Wachtwoord moet minimaal 6 karakters bevatten.',
      'auth/invalid-email': 'Ongeldig e-mailadres.',
      'auth/popup-closed-by-user': 'Login geannuleerd.'
    };
    return messages[error.code] || error.message || 'Er is een fout opgetreden.';
  },

  // Register new user
  register: async (email, password, displayName) => {
    try {
      const result = await FirebaseService.auth.createUserWithEmailAndPassword(email, password);
      await result.user.updateProfile({ displayName });
      await AuthService.createUserProfile(result.user, { displayName });
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: AuthService.getErrorMessage(error) };
    }
  },

  // Login with email/password
  login: async (email, password) => {
    try {
      const result = await FirebaseService.auth.signInWithEmailAndPassword(email, password);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: AuthService.getErrorMessage(error) };
    }
  },

  // Login with Google
  loginWithGoogle: async () => {
    try {
      const result = await FirebaseService.auth.signInWithPopup(FirebaseService.googleProvider);
      await AuthService.ensureUserProfile(result.user);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: AuthService.getErrorMessage(error) };
    }
  },

  // Logout
  logout: async () => {
    try {
      await FirebaseService.auth.signOut();
      return { success: true };
    } catch (error) {
      return { success: false, error: AuthService.getErrorMessage(error) };
    }
  },

  // Reset password
  resetPassword: async (email) => {
    try {
      await FirebaseService.auth.sendPasswordResetEmail(email);
      return { success: true, message: 'Reset link verzonden naar je email!' };
    } catch (error) {
      return { success: false, error: AuthService.getErrorMessage(error) };
    }
  },

  // Create user profile in Firestore
  createUserProfile: async (user, additionalData) => {
    if (!user) return;

    const userRef = FirebaseService.db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      try {
        await userRef.set({
          displayName: user.displayName || additionalData?.displayName || '',
          email: user.email,
          createdAt: FirebaseService.serverTimestamp(),
          photoURL: user.photoURL || null
        });
      } catch (error) {
        console.error('Error creating user profile:', error);
        throw error;
      }
    }
  },

  // Ensure user profile exists
  ensureUserProfile: async (user) => {
    if (!user) return;
    await AuthService.createUserProfile(user);
  },

  // Set up auth state listener
  onAuthStateChanged: (callback) => {
    return FirebaseService.auth.onAuthStateChanged((user) => {
      AuthService.currentUser = user;
      callback(user);
    });
  },

  // Get current user
  getCurrentUser: () => AuthService.currentUser
};

// Export for global use
window.AuthService = AuthService;