// Campus Authentication Engine: Google OAuth & Password / Confirm Password System
import { sound } from './sound.js';

const AUTH_STORAGE_KEY = 'NEXUS_AUTH_USER_V2';

export class AuthSystem {
  constructor() {
    this.currentUser = this.loadUser();
    this.authMode = 'signin'; // 'signin' | 'signup'
  }

  loadUser() {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Could not read auth state', e);
    }
    return null;
  }

  saveUser(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    this.renderNavAuth();
  }

  init() {
    this.renderNavAuth();
  }

  renderNavAuth() {
    const slot = document.getElementById('navAuthSlot');
    if (!slot) return;

    if (this.currentUser) {
      slot.innerHTML = `
        <div class="auth-user-dropdown-wrap">
          <button class="nav-user-pill" onclick="window.authSystem.toggleUserDropdown()">
            <div class="user-avatar-small">${this.currentUser.avatar || this.currentUser.name.charAt(0)}</div>
            <div class="user-info-text">
              <span class="user-name">${this.currentUser.name}</span>
              <span class="user-role-badge">${this.currentUser.provider === 'google' ? 'Google Verified' : 'Campus Member'}</span>
            </div>
            <span class="user-caret">▾</span>
          </button>

          <div id="userDropdownMenu" class="user-dropdown-menu hidden">
            <div class="dropdown-header">
              <div class="dd-name">${this.currentUser.name}</div>
              <div class="dd-email">${this.currentUser.email}</div>
              <div class="dd-roll">${this.currentUser.rollNo || 'ID: 2024-CAMPUS-991'}</div>
            </div>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" onclick="window.nexusApp.switchTab('arena'); window.authSystem.toggleUserDropdown()">
              🎫 My Registered Fests
            </button>
            <button class="dropdown-item" onclick="window.nexusApp.switchTab('admin'); window.authSystem.toggleUserDropdown()">
              📊 Organizer Portal
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item text-danger" onclick="window.authSystem.logout()">
              🚪 Sign Out
            </button>
          </div>
        </div>
      `;
    } else {
      slot.innerHTML = `
        <button class="btn btn-sm btn-primary btn-glow" onclick="window.authSystem.openAuthModal('signin')">
          <span>👤 Sign In / Join</span>
        </button>
      `;
    }
  }

  toggleUserDropdown() {
    sound.playClick();
    const menu = document.getElementById('userDropdownMenu');
    if (menu) {
      menu.classList.toggle('hidden');
    }
  }

  openAuthModal(mode = 'signin') {
    sound.playClick();
    this.authMode = mode;
    const modalContainer = document.getElementById('globalModalContainer');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal-backdrop" onclick="if(event.target === this) window.authSystem.closeModal()">
        <div class="modal-dialog modal-auth-dialog">
          
          <div class="auth-dialog-header">
            <div class="auth-tabs">
              <button class="auth-tab-btn ${this.authMode === 'signin' ? 'active' : ''}" 
                onclick="window.authSystem.switchAuthMode('signin')">
                Sign In
              </button>
              <button class="auth-tab-btn ${this.authMode === 'signup' ? 'active' : ''}" 
                onclick="window.authSystem.switchAuthMode('signup')">
                Create Account
              </button>
            </div>
            <button class="modal-close-btn" onclick="window.authSystem.closeModal()">✕</button>
          </div>

          <div class="auth-dialog-body" id="authDialogBody">
            ${this.renderAuthForm()}
          </div>

        </div>
      </div>
    `;
  }

  switchAuthMode(mode) {
    sound.playClick();
    this.authMode = mode;
    const tabs = document.querySelectorAll('.auth-tab-btn');
    tabs.forEach((tab, i) => {
      tab.classList.toggle('active', (i === 0 && mode === 'signin') || (i === 1 && mode === 'signup'));
    });
    const body = document.getElementById('authDialogBody');
    if (body) {
      body.innerHTML = this.renderAuthForm();
    }
  }

  renderAuthForm() {
    return `
      <!-- 1. Sign In With Google Button -->
      <div class="google-auth-section">
        <button class="btn-google-auth" onclick="window.authSystem.handleGoogleSignIn()">
          <svg class="google-logo" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>

      <div class="auth-divider">
        <span>OR WITH EMAIL & PASSWORD</span>
      </div>

      <!-- 2. Email & Password Form -->
      <form class="auth-form" onsubmit="event.preventDefault(); window.authSystem.handleAuthSubmit();">
        ${this.authMode === 'signup' ? `
          <div class="form-group">
            <label class="form-label">Full Name <span class="req">*</span></label>
            <input type="text" id="authFullName" class="form-input" placeholder="e.g. Maya Chen" required />
          </div>

          <div class="form-group">
            <label class="form-label">Campus Student Roll / ID <span class="req">*</span></label>
            <input type="text" id="authRollNo" class="form-input" placeholder="e.g. 2024-CS-088" required />
          </div>
        ` : ''}

        <div class="form-group">
          <label class="form-label">Campus Email Address <span class="req">*</span></label>
          <input type="email" id="authEmail" class="form-input" placeholder="student@campus.edu" required />
        </div>

        <div class="form-group">
          <div class="label-with-action">
            <label class="form-label">Password <span class="req">*</span></label>
            ${this.authMode === 'signin' ? `
              <a href="#" class="forgot-link" onclick="event.preventDefault(); alert('Password reset link sent to registered email!')">Forgot?</a>
            ` : ''}
          </div>
          <div class="password-input-wrap">
            <input type="password" id="authPassword" class="form-input" placeholder="Enter password (min 6 chars)" minlength="6" required 
              oninput="window.authSystem.checkPasswordMatch()" />
            <button type="button" class="btn-toggle-pw" aria-label="Toggle password visibility" onclick="window.authSystem.togglePwVisibility('authPassword', this)">${this.renderEyeIcon(false)}</button>
          </div>
        </div>

        ${this.authMode === 'signup' ? `
          <div class="form-group">
            <label class="form-label">Confirm Password <span class="req">*</span></label>
            <div class="password-input-wrap">
              <input type="password" id="authConfirmPassword" class="form-input" placeholder="Re-enter password" minlength="6" required 
                oninput="window.authSystem.checkPasswordMatch()" />
              <button type="button" class="btn-toggle-pw" aria-label="Toggle password visibility" onclick="window.authSystem.togglePwVisibility('authConfirmPassword', this)">${this.renderEyeIcon(false)}</button>
            </div>
            <div id="pwMatchMessage" class="pw-match-msg"></div>
          </div>

          <div class="terms-check-group">
            <label class="custom-checkbox-label">
              <input type="checkbox" id="authTerms" required checked />
              <span>I agree to the Campus Smart Club Operations & Anti-Fraud Pass Policy</span>
            </label>
          </div>
        ` : ''}

        <button type="submit" class="btn btn-primary btn-glow btn-block btn-lg mt-3">
          ${this.authMode === 'signin' ? 'Sign In to Nexus Ops &rarr;' : 'Create Campus Account &rarr;'}
        </button>
      </form>

      <div class="auth-footer-prompt">
        ${this.authMode === 'signin' ? `
          <span>Don't have an account yet?</span>
          <button class="link-btn" onclick="window.authSystem.switchAuthMode('signup')">Create Account</button>
        ` : `
          <span>Already registered?</span>
          <button class="link-btn" onclick="window.authSystem.switchAuthMode('signin')">Sign In</button>
        `}
      </div>
    `;
  }

  renderEyeIcon(isVisible = false) {
    if (isVisible) {
      return `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-eye">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      `;
    }
    return `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-eye">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    `;
  }

  togglePwVisibility(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isNowText = input.type === 'password';
    input.type = isNowText ? 'text' : 'password';
    if (btnEl) {
      btnEl.innerHTML = this.renderEyeIcon(isNowText);
      btnEl.setAttribute('aria-label', isNowText ? 'Hide password' : 'Show password');
    }
  }

  checkPasswordMatch() {
    if (this.authMode !== 'signup') return;
    const pw = document.getElementById('authPassword')?.value || '';
    const confirm = document.getElementById('authConfirmPassword')?.value || '';
    const msgEl = document.getElementById('pwMatchMessage');
    if (!msgEl) return;

    if (!confirm) {
      msgEl.textContent = '';
      msgEl.className = 'pw-match-msg';
      return;
    }

    if (pw === confirm) {
      msgEl.textContent = '✓ Passwords match successfully';
      msgEl.className = 'pw-match-msg match-success';
    } else {
      msgEl.textContent = '✕ Passwords do not match';
      msgEl.className = 'pw-match-msg match-error';
    }
  }

  handleGoogleSignIn() {
    sound.playPassUnlocked();

    // Simulated Instant Google OAuth 2.0 flow
    const googleUser = {
      name: 'Alex Chen',
      email: 'alex.chen@campus.edu',
      rollNo: '2023-CS-104',
      avatar: '👨‍💻',
      provider: 'google',
      verified: true,
      role: 'Convenor & Tech Lead'
    };

    this.saveUser(googleUser);
    this.closeModal();
    this.showAuthToast(`Signed in with Google as ${googleUser.name}`);
  }

  handleAuthSubmit() {
    sound.playClick();
    const email = document.getElementById('authEmail')?.value.trim();
    const pw = document.getElementById('authPassword')?.value;

    if (this.authMode === 'signup') {
      const name = document.getElementById('authFullName')?.value.trim();
      const roll = document.getElementById('authRollNo')?.value.trim();
      const confirmPw = document.getElementById('authConfirmPassword')?.value;

      if (!name || !roll || !email || !pw) {
        alert('Please fill out all mandatory fields.');
        return;
      }

      if (pw !== confirmPw) {
        alert('Password and Confirm Password must match!');
        return;
      }

      if (pw.length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
      }

      const newUser = {
        name,
        email,
        rollNo: roll,
        avatar: name.charAt(0).toUpperCase(),
        provider: 'email',
        verified: true,
        role: 'Club Participant'
      };

      sound.playPassUnlocked();
      this.saveUser(newUser);
      this.closeModal();
      this.showAuthToast(`Account created! Welcome, ${newUser.name}.`);

    } else {
      // Sign in mode
      if (!email || !pw) {
        alert('Please enter your email and password.');
        return;
      }

      const nameCandidate = email.split('@')[0].replace(/[._]/g, ' ');
      const cleanName = nameCandidate.charAt(0).toUpperCase() + nameCandidate.slice(1);

      const user = {
        name: cleanName || 'Campus Member',
        email,
        rollNo: '2024-ID-' + Math.floor(100 + Math.random() * 900),
        avatar: (cleanName || 'U').charAt(0).toUpperCase(),
        provider: 'email',
        verified: true,
        role: 'Registered Attendee'
      };

      sound.playPassUnlocked();
      this.saveUser(user);
      this.closeModal();
      this.showAuthToast(`Welcome back, ${user.name}!`);
    }
  }

  logout() {
    sound.playClick();
    this.saveUser(null);
    this.showAuthToast('Successfully signed out of Nexus Ops.');
  }

  closeModal() {
    const modal = document.getElementById('globalModalContainer');
    if (modal) modal.innerHTML = '';
  }

  showAuthToast(message) {
    const toast = document.createElement('div');
    toast.className = 'nexus-toast toast-success visible';
    toast.innerHTML = `
      <div class="toast-icon">🔐</div>
      <div class="toast-content">
        <div class="toast-title">Authentication Verified</div>
        <div class="toast-desc">${message}</div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }
}

export const auth = new AuthSystem();
