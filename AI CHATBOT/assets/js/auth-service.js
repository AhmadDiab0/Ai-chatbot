// Regelt alles rondom inloggen, registreren, uitloggen en wachtwoord vergeten.

const AuthService = {
  currentUser: null, // Hier bewaren we de huidige gebruiker

  // Geeft een duidelijke foutmelding terug in het Nederlands.
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

  // Een nieuwe gebruiker registreren met e-mail en wachtwoord.
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

  // Inloggen met e-mail en wachtwoord.
  login: async (email, password) => {
    try {
      const result = await FirebaseService.auth.signInWithEmailAndPassword(email, password);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: AuthService.getErrorMessage(error) };
    }
  },

  // Inloggen met Google-account.
  loginWithGoogle: async () => {
    try {
      const result = await FirebaseService.auth.signInWithPopup(FirebaseService.googleProvider);
      await AuthService.ensureUserProfile(result.user);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: AuthService.getErrorMessage(error) };
    }
  },

  // Uitloggen van de app.
  logout: async () => {
    try {
      await FirebaseService.auth.signOut();
      return { success: true };
    } catch (error) {
      return { success: false, error: AuthService.getErrorMessage(error) };
    }
  },

  // Wachtwoord-reset per e-mail versturen.
  resetPassword: async (email) => {
    try {
      await FirebaseService.auth.sendPasswordResetEmail(email);
      return { success: true, message: 'Reset link verzonden naar je email!' };
    } catch (error) {
      return { success: false, error: AuthService.getErrorMessage(error) };
    }
  },

  // Een profiel aanmaken in de database voor een nieuwe gebruiker.
  createUserProfile: async (user, additionalData) => {
    if (!user) return;

    const userRef = FirebaseService.db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();

    // Alleen aanmaken als het profiel nog niet bestaat.
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

  // Zorg dat het profiel er is (voor o.a. Google login).
  ensureUserProfile: async (user) => {
    if (!user) return;
    await AuthService.createUserProfile(user);
  },

  // Zorgt dat we altijd weten wie is ingelogd (of niet).
  onAuthStateChanged: (callback) => {
    return FirebaseService.auth.onAuthStateChanged((user) => {
      AuthService.currentUser = user;
      callback(user);
    });
  },

  // Haal de huidige gebruiker op.
  getCurrentUser: () => AuthService.currentUser
};

window.AuthService = AuthService;