// === UTILITY FUNCTIONS ===

const Utils = {
  // Dark mode management
  darkMode: {
    toggle: () => {
      document.body.classList.toggle('dark-mode');
      localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
      Utils.darkMode.updateIcons();
    },

    initialize: () => {
      const savedMode = localStorage.getItem('darkMode');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

      if (savedMode === 'true' || (savedMode === null && prefersDark)) {
        document.body.classList.add('dark-mode');
      }

      Utils.darkMode.updateIcons();
    },

    updateIcons: () => {
      const updateIcon = (element) => {
        const icon = element?.querySelector('.material-symbols-rounded');
        if (icon) {
          icon.textContent = document.body.classList.contains('dark-mode') ? 'light_mode' : 'dark_mode';
        }
      };

      updateIcon(document.getElementById('dark-mode-toggle'));
      updateIcon(document.getElementById('dark-mode-toggle-app'));
    }
  },

  // File handling
  file: {
    validateFile: (file) => {
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
      const maxSize = 4 * 1024 * 1024; // 4MB

      if (!allowedTypes.includes(file.type)) {
        throw new Error("Alleen PNG, JPG, JPEG of WEBP afbeeldingen zijn toegestaan.");
      }

      if (file.size > maxSize) {
        throw new Error("Bestand is te groot. Maximaal 4 MB toegestaan.");
      }

      return true;
    },

    readAsDataURL: (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    },

    processFileData: (dataUrl, mimeType) => {
      // Normalize JPEG mime type
      if (mimeType === "image/jpg") {
        mimeType = "image/jpeg";
      }

      return {
        data: dataUrl.split(",")[1], 
        mime_type: mimeType
      };
    }
  },

  // Form validation
  validation: {
    email: (email) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    },

    password: (password) => {
      return password && password.length >= 6;
    },

    required: (value) => {
      return value && value.trim().length > 0;
    }
  },

  // Message utilities
  message: {
    showAuthError: (message, type = 'error') => {
      const authError = document.getElementById('auth-error');
      if (!authError) return;

      authError.textContent = message;
      authError.classList.remove('hidden');
      authError.style.background = type === 'success' ? '#d4edda' : '#f8d7da';
      authError.style.color = type === 'success' ? '#155724' : '#721c24';
      setTimeout(() => authError.classList.add('hidden'), 5000);
    },

    showAuthLoading: (show) => {
      document.querySelectorAll('.auth-btn').forEach(btn => {
        btn.disabled = show;
        if (show) {
          if (!btn.dataset.originalText) {
            btn.dataset.originalText = btn.textContent;
          }
          btn.innerHTML = '<span class="loading-spinner-small"></span>Laden...';
        } else {
          btn.textContent = btn.dataset.originalText || btn.textContent;
        }
      });
    }
  },

  // Input utilities
  input: {
    setupAutoResize: (textarea) => {
      const initialHeight = textarea.scrollHeight || 40;

      textarea.addEventListener('input', () => {
        textarea.style.height = `${initialHeight}px`;
        textarea.style.height = `${textarea.scrollHeight}px`;

        const chatForm = document.querySelector(".chat-form");
        if (chatForm) {
          chatForm.style.borderRadius = textarea.scrollHeight > initialHeight ? "15px" : "32px";
        }
      });
    }
  },

  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  formatDate: (date, locale = 'nl-NL') => {
    if (!date) return 'Onbekend';

    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
};

// Export for global use
window.Utils = Utils;