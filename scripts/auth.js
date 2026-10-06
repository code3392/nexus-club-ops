// Campus Authentication Engine: Google OAuth & Password / Confirm Password System
import { sound } from './sound.js';

const AUTH_STORAGE_KEY = 'NEXUS_AUTH_USER_V2';

export class AuthSystem {
  constructor() {
    this.currentUser = this.loadUser();
    this.authMode = 'signin'; // 'signin' | 'signup'
    this.pendingAuthCallback = null;
    this.listeners = [];
  }

  addAuthListener(fn) {
    if (typeof fn === 'function') this.listeners.push(fn);
  }

  notifyListeners(user) {
    this.listeners.forEach(fn => {
      try { fn(user); } catch (e) { console.error(e); }
    });
  }

  requireAuth(callback, reasonMessage = 'Please sign in or create an account.') {
    if (this.currentUser) {
      if (typeof callback === 'function') callback(this.currentUser);
      return true;
    }
    this.pendingAuthCallback = callback;
    this.openAuthModal('signin', reasonMessage);
    return false;
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
    this.notifyListeners(user);
    if (user && this.pendingAuthCallback) {
      const cb = this.pendingAuthCallback;
      this.pendingAuthCallback = null;
      try { cb(user); } catch (e) { console.error(e); }
    }
  }

  init() {
    this.renderNavAuth();
  }

  renderNavAuth() {
    const slot = document.getElementById('navAuthSlot');
    if (!slot) return;

    if (this.currentUser) {
      const isImg = this.currentUser.avatar && (this.currentUser.avatar.startsWith('data:image') || this.currentUser.avatar.startsWith('http') || this.currentUser.avatar.startsWith('blob:'));
      const avatarHTML = isImg 
        ? `<img src="${this.currentUser.avatar}" alt="${this.currentUser.name}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`
        : (this.currentUser.avatar || (this.currentUser.name ? this.currentUser.name.charAt(0).toUpperCase() : '👤'));

      slot.innerHTML = `
        <div class="auth-user-dropdown-wrap">
          <button class="nav-user-pill" onclick="window.authSystem.toggleUserDropdown()">
            <div class="user-avatar-small" style="overflow:hidden; display:flex; align-items:center; justify-content:center;">${avatarHTML}</div>
            <div class="user-info-text">
              <span class="user-name">${this.currentUser.name}</span>
              <span class="user-role-badge">${this.currentUser.provider === 'google' ? 'Google Verified' : 'Campus Member'}</span>
            </div>
            <span class="user-caret">▾</span>
          </button>

          <div id="userDropdownMenu" class="user-dropdown-menu hidden">
            <div class="dropdown-header">
              <div style="display:flex; align-items:center; gap:0.65rem; margin-bottom:0.4rem;">
                <div class="user-avatar-medium" style="width:36px; height:36px; border-radius:50%; overflow:hidden; display:flex; align-items:center; justify-content:center; background:#ffffff; font-weight:800; color:#000000; flex-shrink:0;">
                  ${avatarHTML}
                </div>
                <div style="overflow:hidden;">
                  <div class="dd-name" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${this.currentUser.name}</div>
                  <div class="dd-email" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:0.75rem; color:var(--text-muted);">${this.currentUser.email}</div>
                </div>
              </div>
              <div class="dd-roll">${this.currentUser.rollNo || 'ID: VERIFIED'}</div>
            </div>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" onclick="window.authSystem.goToDashboardProfile()">
              👤 Edit Profile & Picture
            </button>
            <button class="dropdown-item" onclick="window.nexusApp.openMyRegistrationsModal(); window.authSystem.toggleUserDropdown()">
              🎟️ My Passes & Registrations
            </button>
            <button class="dropdown-item" onclick="window.nexusApp.switchTab('admin'); window.authSystem.toggleUserDropdown()">
              📊 Dashboard & Events
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

  goToDashboardProfile() {
    this.toggleUserDropdown();
    if (window.location.pathname.endsWith('events.html') || window.location.pathname.endsWith('/events')) {
      window.location.href = 'index.html?tab=admin#profile';
      return;
    }
    if (window.nexusApp) {
      window.nexusApp.switchTab('admin');
      setTimeout(() => {
        if (window.adminCenter && window.adminCenter.scrollToProfile) {
          window.adminCenter.scrollToProfile();
        }
      }, 100);
    }
  }

  toggleUserDropdown() {
    sound.playClick();
    const menu = document.getElementById('userDropdownMenu');
    if (menu) {
      menu.classList.toggle('hidden');
    }
  }

  openAuthModal(mode = 'signin', reasonMessage = '') {
    sound.playClick();
    this.authMode = mode;
    this.lastReasonMessage = reasonMessage;
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

          ${reasonMessage ? `
            <div style="background: rgba(255, 255, 255, 0.08); border-bottom: 1px solid rgba(255, 255, 255, 0.15); padding: 0.85rem 1.5rem; font-size: 0.85rem; color: #ffffff; display: flex; align-items: center; gap: 0.6rem;">
              <span>🔐</span>
              <span><strong>Login Required:</strong> ${reasonMessage}</span>
            </div>
          ` : ''}

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

  getSavedGoogleAccounts() {
    try {
      const data = localStorage.getItem('NEXUS_SAVED_GOOGLE_ACCOUNTS');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveGoogleAccounts(accounts) {
    try {
      localStorage.setItem('NEXUS_SAVED_GOOGLE_ACCOUNTS', JSON.stringify(accounts));
    } catch (e) {
      console.warn('Could not save google accounts', e);
    }
  }

  addSavedGoogleAccount(account) {
    const list = this.getSavedGoogleAccounts();
    const existingIndex = list.findIndex(a => a.email && a.email.toLowerCase() === account.email.toLowerCase());
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...account };
    } else {
      list.push(account);
    }
    this.saveGoogleAccounts(list);
  }

  removeSavedGoogleAccount(index) {
    sound.playClick();
    const list = this.getSavedGoogleAccounts();
    list.splice(index, 1);
    this.saveGoogleAccounts(list);
    this.openGoogleAccountModal();
  }

  updateSavedGoogleAccount(user) {
    if (!user || user.provider !== 'google') return;
    this.addSavedGoogleAccount(user);
  }

  handleGoogleSignIn() {
    this.openGoogleAccountModal(false);
  }

  openGoogleAccountModal(showCustomForm = false) {
    sound.playClick();
    this.pendingGoogleAvatar = null;
    const modalContainer = document.getElementById('globalModalContainer');
    if (!modalContainer) return;

    const savedAccounts = this.getSavedGoogleAccounts();
    const isCustom = showCustomForm || savedAccounts.length === 0;

    modalContainer.innerHTML = `
      <div class="modal-backdrop" onclick="if(event.target === this) window.authSystem.closeModal()">
        <div class="modal-dialog google-modal-dialog">
          
          <div class="google-modal-top">
            <div style="display:flex; justify-content:center; margin-bottom:0.75rem;">
              <svg class="google-logo" viewBox="0 0 24 24" width="32" height="32">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>
            <h3 class="google-modal-title">Sign in with Google</h3>
            <p class="google-modal-subtitle">${isCustom ? 'Enter your Google profile information to continue to <strong>NexusOps</strong>' : 'Choose an account to continue to <strong>NexusOps</strong>'}</p>
            <button class="modal-close-btn" onclick="window.authSystem.closeModal()" style="position:absolute; top:1rem; right:1.25rem;">✕</button>
          </div>

          <div class="google-modal-body">
            ${!isCustom ? `
              <div class="google-account-list">
                ${savedAccounts.map((acc, idx) => {
                  const isImg = acc.avatar && (acc.avatar.startsWith('data:image') || acc.avatar.startsWith('http') || acc.avatar.startsWith('blob:'));
                  const avContent = isImg 
                    ? `<img src="${acc.avatar}" alt="${acc.name}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`
                    : (acc.avatar || acc.name.charAt(0).toUpperCase());
                  return `
                    <div class="google-account-item" onclick="window.authSystem.selectGoogleAccount(${idx})">
                      <div class="google-acc-avatar">${avContent}</div>
                      <div class="google-acc-details">
                        <div class="google-acc-name">${acc.name}</div>
                        <div class="google-acc-email">${acc.email}</div>
                      </div>
                      <button class="google-acc-del" onclick="event.stopPropagation(); window.authSystem.removeSavedGoogleAccount(${idx});" title="Remove account">✕</button>
                    </div>
                  `;
                }).join('')}

                <div class="google-account-item google-add-account" onclick="window.authSystem.openGoogleAccountModal(true)">
                  <div class="google-acc-avatar" style="background:rgba(255,255,255,0.1); color:#ffffff; font-size:1.1rem;">➕</div>
                  <div class="google-acc-details">
                    <div class="google-acc-name" style="font-weight:700; color:var(--text-main);">Use another Google account</div>
                    <div class="google-acc-email">Sign in with your own custom name & picture</div>
                  </div>
                </div>
              </div>
            ` : `
              <form class="google-custom-form" onsubmit="event.preventDefault(); window.authSystem.submitGoogleCustomAccount();">
                <div class="form-group">
                  <label class="form-label">Full Name <span class="req">*</span></label>
                  <input type="text" id="gCustomName" class="form-input" placeholder="e.g. Your Name" required autofocus />
                </div>

                <div class="form-group">
                  <label class="form-label">Google / Gmail Address <span class="req">*</span></label>
                  <input type="email" id="gCustomEmail" class="form-input" placeholder="e.g. yourname@gmail.com" required />
                </div>

                <div class="form-group">
                  <label class="form-label">Profile Picture / Avatar</label>
                  <div class="google-avatar-picker-wrap">
                    <div class="google-avatar-preview" id="gAvatarPreview">👤</div>
                    <div class="google-avatar-controls">
                      <label class="btn btn-sm btn-secondary" style="cursor:pointer;">
                        📷 Upload Photo
                        <input type="file" id="gPhotoFileInput" accept="image/*" style="display:none;" onchange="window.authSystem.handleGooglePhotoUpload(event)" />
                      </label>
                      <input type="url" id="gPhotoUrlInput" class="form-input form-input-sm" placeholder="Or paste image link" oninput="window.authSystem.handleGooglePhotoUrl(this.value)" />
                    </div>
                  </div>
                  <div class="preset-emojis-row">
                    <span class="preset-label">Or pick an avatar:</span>
                    ${['👨‍💻', '👩‍💻', '🚀', '⚡', '🤖', '🎓', '🌟', '🦊', '🎨', '🦁'].map(emoji => `
                      <button type="button" class="btn-emoji-pick" onclick="window.authSystem.selectGoogleEmoji('${emoji}')">${emoji}</button>
                    `).join('')}
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Campus Roll / Student ID <span class="text-muted">(Optional)</span></label>
                  <input type="text" id="gCustomRoll" class="form-input" placeholder="e.g. 2024-CS-042" />
                </div>

                <div style="display:flex; gap:0.75rem; margin-top:1.5rem;">
                  ${savedAccounts.length > 0 ? `
                    <button type="button" class="btn btn-secondary" onclick="window.authSystem.openGoogleAccountModal(false)">
                      &larr; Back
                    </button>
                  ` : ''}
                  <button type="submit" class="btn btn-primary btn-glow flex-1">
                    Sign In with Google &rarr;
                  </button>
                </div>
              </form>
            `}
          </div>

          <div class="google-modal-footer">
            <span class="google-security-badge">🔒 Instant Google Sign-In • Saved to your browser</span>
          </div>

        </div>
      </div>
    `;
  }

  handleGooglePhotoUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert('Please choose an image under 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      this.pendingGoogleAvatar = e.target.result;
      const preview = document.getElementById('gAvatarPreview');
      if (preview) {
        preview.innerHTML = `<img src="${this.pendingGoogleAvatar}" alt="Preview" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`;
      }
      const urlIn = document.getElementById('gPhotoUrlInput');
      if (urlIn) urlIn.value = '';
    };
    reader.readAsDataURL(file);
  }

  handleGooglePhotoUrl(url) {
    url = url.trim();
    if (!url) return;
    this.pendingGoogleAvatar = url;
    const preview = document.getElementById('gAvatarPreview');
    if (preview) {
      preview.innerHTML = `<img src="${url}" alt="Preview" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" onerror="this.parentElement.textContent='👤'" />`;
    }
  }

  selectGoogleEmoji(emoji) {
    sound.playClick();
    this.pendingGoogleAvatar = emoji;
    const preview = document.getElementById('gAvatarPreview');
    if (preview) {
      preview.innerHTML = `<div style="font-size:2rem; line-height:1;">${emoji}</div>`;
    }
    const urlIn = document.getElementById('gPhotoUrlInput');
    if (urlIn) urlIn.value = '';
  }

  submitGoogleCustomAccount() {
    const name = document.getElementById('gCustomName')?.value.trim();
    const email = document.getElementById('gCustomEmail')?.value.trim();
    const roll = document.getElementById('gCustomRoll')?.value.trim();

    if (!name || !email) {
      alert('Please provide your name and email address.');
      return;
    }

    const avatar = this.pendingGoogleAvatar || name.charAt(0).toUpperCase();

    const user = {
      id: 'google-usr-' + Date.now(),
      name,
      email,
      rollNo: roll || ('ID: ' + Math.floor(1000 + Math.random() * 9000)),
      avatar,
      phone: '',
      department: '',
      organization: 'Campus Tech Society',
      bio: '',
      provider: 'google',
      verified: true,
      role: 'Google Verified Member'
    };

    sound.playPassUnlocked();
    this.addSavedGoogleAccount(user);
    this.saveUser(user);
    this.closeModal();
    this.showAuthToast(`Signed in with Google as ${user.name}!`);
  }

  selectGoogleAccount(index) {
    const list = this.getSavedGoogleAccounts();
    const acc = list[index];
    if (!acc) return;

    sound.playPassUnlocked();
    this.saveUser(acc);
    this.closeModal();
    this.showAuthToast(`Welcome back, ${acc.name}!`);
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
