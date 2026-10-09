// Campus Authentication Engine: Google OAuth & Password / Confirm Password System
import { sound } from './sound.js';

const AUTH_STORAGE_KEY = 'NEXUS_AUTH_USER_V2';
const GOOGLE_CLIENT_ID_KEY = 'NEXUS_GOOGLE_CLIENT_ID';
const USERS_STORAGE_KEY = 'NEXUS_REGISTERED_USERS_V2';

// Purge any legacy placeholder client ID from storage so Google never throws Error 401: invalid_client
try {
  const legacyId = localStorage.getItem(GOOGLE_CLIENT_ID_KEY);
  if (legacyId && (legacyId.includes('8qu3qgkh0t8d7f7i8kff7v442d7681u7') || legacyId.includes('1038165722284'))) {
    localStorage.removeItem(GOOGLE_CLIENT_ID_KEY);
  }
  // Purge any hardcoded demo accounts so no user ever sees another person's email
  const legacySaved = localStorage.getItem('NEXUS_SAVED_GOOGLE_ACCOUNTS');
  if (legacySaved) {
    const list = JSON.parse(legacySaved);
    if (Array.isArray(list)) {
      const filtered = list.filter(a => a && a.email && !['alex.rivera@campus.edu', 'priya.sharma@gmail.com', 'mdshahalam3392@gmail.com'].includes(a.email.toLowerCase()));
      localStorage.setItem('NEXUS_SAVED_GOOGLE_ACCOUNTS', JSON.stringify(filtered));
    }
  }
} catch (e) {}

export class AuthSystem {
  constructor() {
    this.currentUser = this.loadUser();
    this.authMode = 'signin'; // 'signin' | 'signup'
    this.pendingAuthCallback = null;
    this.listeners = [];
    this.serverGoogleClientId = '';
    this.setupCrossTabSync();
  }

  setupCrossTabSync() {
    if (typeof window === 'undefined') return;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.syncChannel = new BroadcastChannel('nexus_auth_channel');
        this.syncChannel.onmessage = (event) => {
          if (event.data && event.data.type === 'AUTH_SYNC') {
            const syncedUser = event.data.user;
            this.currentUser = syncedUser;
            if (syncedUser) {
              try { localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(syncedUser)); } catch (e) {}
            } else {
              try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch (e) {}
            }
            this.renderNavAuth();
            this.notifyListeners(syncedUser);
          }
        };
      }
    } catch (e) {
      // BroadcastChannel unavailable
    }

    try {
      window.addEventListener('storage', (e) => {
        if (e.key === AUTH_STORAGE_KEY) {
          try {
            this.currentUser = e.newValue ? JSON.parse(e.newValue) : null;
            this.renderNavAuth();
            this.notifyListeners(this.currentUser);
          } catch (err) {}
        }
      });
    } catch (e) {}
  }

  getLocalUsers() {
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      if (data) {
        const list = JSON.parse(data);
        if (Array.isArray(list)) return list;
      }
    } catch (e) {}
    return [];
  }

  saveLocalUsers(users) {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {}
  }

  async checkEmailExists(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) return { exists: false };
    try {
      const res = await fetch('/api/users/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {}

    // Offline / fallback local store
    const local = this.getLocalUsers();
    const found = local.find(u => u.email && u.email.toLowerCase() === cleanEmail);
    return {
      exists: !!found,
      name: found ? found.name : undefined,
      avatar: found ? found.avatar : undefined,
      provider: found ? found.provider : undefined
    };
  }

  async registerUserAccount({ name, email, password, rollNo = '', avatar = '', provider = 'email', role = 'Campus Member' }) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim();
    const cleanPass = password || '';

    if (!cleanName || !cleanEmail) {
      throw new Error('Name and email are required.');
    }
    if (!cleanPass || cleanPass.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    let serverUser = null;
    let serverResponded = false;
    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password: cleanPass,
          rollNo: rollNo ? rollNo.trim() : '',
          avatar: avatar || cleanName.charAt(0).toUpperCase(),
          provider,
          role
        })
      });
      const data = await res.json();
      serverResponded = true;
      if (res.status === 409) {
        throw new Error(data.error || 'An account with this email already exists. Please sign in with your password.');
      }
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }
      if (data.sessionToken) {
        try { sessionStorage.setItem('NEXUS_SESSION_TOKEN', data.sessionToken); } catch (e) {}
      }
      serverUser = data.user;
    } catch (err) {
      if (serverResponded || (err.message && err.message.toLowerCase().includes('already exists'))) {
        throw err;
      }
    }

    // Local check to enforce 1 email = 1 account
    const localUsers = this.getLocalUsers();
    if (localUsers.some(u => u.email && u.email.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this email already exists. Please sign in with your password.');
    }

    const newUserRecord = serverUser || {
      id: (provider === 'google' ? 'g-usr-' : 'usr-') + Date.now().toString(36) + '-' + Math.floor(1000 + Math.random() * 9000),
      name: cleanName,
      email: cleanEmail,
      rollNo: rollNo ? rollNo.trim() : ('ID: ' + Math.floor(1000 + Math.random() * 9000)),
      avatar: avatar || cleanName.charAt(0).toUpperCase(),
      provider,
      verified: true,
      role
    };

    localUsers.push({
      ...newUserRecord,
      password: cleanPass
    });
    this.saveLocalUsers(localUsers);

    return newUserRecord;
  }

  async loginUserAccount({ email, password }) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = password || '';

    if (!cleanEmail || !cleanPass) {
      throw new Error('Email and password are required.');
    }

    let serverResponded = false;
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: cleanEmail, password: cleanPass })
      });
      const data = await res.json();
      serverResponded = true;
      if (res.status === 401) {
        throw new Error(data.error || 'Incorrect password. Please enter the correct password.');
      }
      if (res.status === 404) {
        throw new Error(data.error || 'No account found with this email. Please register first.');
      }
      if (res.ok && data.user) {
        if (data.sessionToken) {
          try { sessionStorage.setItem('NEXUS_SESSION_TOKEN', data.sessionToken); } catch (e) {}
        }
        const local = this.getLocalUsers();
        const idx = local.findIndex(u => u.email && u.email.toLowerCase() === cleanEmail);
        if (idx >= 0) {
          local[idx] = { ...local[idx], ...data.user, password: cleanPass };
        } else {
          local.push({ ...data.user, password: cleanPass });
        }
        this.saveLocalUsers(local);
        return data.user;
      }
    } catch (err) {
      if (serverResponded || (err.message && (err.message.includes('Incorrect password') || err.message.includes('No account found')))) {
        throw err;
      }
    }

    // Local fallback
    const localUsers = this.getLocalUsers();
    const found = localUsers.find(u => u.email && u.email.toLowerCase() === cleanEmail);
    if (!found) {
      throw new Error('No account found with this email. Please register first.');
    }
    if (found.password && found.password !== cleanPass) {
      throw new Error('Incorrect password. Please enter the correct password.');
    }
    const safeUser = { ...found };
    delete safeUser.password;
    return safeUser;
  }

  showFormError(msg, targetId = 'authErrorMessage') {
    const el = document.getElementById(targetId);
    if (el) {
      el.textContent = msg;
      el.classList.remove('hidden');
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      alert(msg);
    }
  }

  hideFormError(targetId = 'authErrorMessage') {
    const el = document.getElementById(targetId);
    if (el) {
      el.textContent = '';
      el.classList.add('hidden');
    }
  }


  getGoogleClientId() {
    try {
      const stored = localStorage.getItem(GOOGLE_CLIENT_ID_KEY);
      if (stored && !stored.includes('8qu3qgkh0t8d7f7i8kff7v442d7681u7') && !stored.includes('1038165722284')) {
        return stored.trim();
      }
      return '';
    } catch (e) {
      return '';
    }
  }

  setGoogleClientId(id) {
    try {
      if (id && !id.includes('8qu3qgkh0t8d7f7i8kff7v442d7681u7')) {
        localStorage.setItem(GOOGLE_CLIENT_ID_KEY, id.trim());
      } else {
        localStorage.removeItem(GOOGLE_CLIENT_ID_KEY);
      }
    } catch (e) {
      console.warn('Could not store Google Client ID', e);
    }
  }

  decodeJwtResponse(token) {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.warn('Could not decode Google JWT credential', e);
      return null;
    }
  }

  getEffectiveGoogleClientId() {
    if (this.serverGoogleClientId) return this.serverGoogleClientId;
    return this.getGoogleClientId();
  }

  initGoogleIdentity() {
    if (typeof window === 'undefined') return false;
    const clientId = this.getEffectiveGoogleClientId();
    if (!clientId) return false;
    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      return false;
    }
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (res) => this.handleGoogleCredentialResponse(res),
        auto_select: false,
        cancel_on_tap_outside: true,
        itp_support: true
      });
      return true;
    } catch (err) {
      console.warn('Google Identity initialization error:', err);
      return false;
    }
  }

  initAndRenderGoogleButton() {
    setTimeout(() => {
      const clientId = this.getEffectiveGoogleClientId();
      const slot = document.getElementById('googleOfficialBtnSlot');
      const fallbackBtn = document.getElementById('googleCustomBtnFallback');

      if (clientId && window.google?.accounts?.id && slot) {
        const initialized = this.initGoogleIdentity();
        if (initialized) {
          try {
            slot.innerHTML = '';
            window.google.accounts.id.renderButton(slot, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              shape: 'rectangular',
              text: this.authMode === 'signin' ? 'signin_with' : 'signup_with',
              logo_alignment: 'left',
              width: 320
            });
            slot.style.display = 'flex';
            if (fallbackBtn) fallbackBtn.style.display = 'none';
            return;
          } catch (e) {
            console.warn('Google renderButton error:', e);
          }
        }
      }

      if (slot) slot.style.display = 'none';
      if (fallbackBtn) fallbackBtn.style.display = 'flex';
    }, 40);
  }

  showAuthLoading(isLoading, message = 'Verifying identity...') {
    const loadingEl = document.getElementById('authLoadingIndicator');
    const formEl = document.querySelector('.auth-form');
    const googleSec = document.querySelector('.google-auth-section');

    if (loadingEl) {
      if (isLoading) {
        loadingEl.textContent = message;
        loadingEl.classList.remove('hidden');
      } else {
        loadingEl.classList.add('hidden');
      }
    }
    if (formEl) {
      formEl.style.opacity = isLoading ? '0.4' : '1';
      formEl.style.pointerEvents = isLoading ? 'none' : 'auto';
    }
    if (googleSec) {
      googleSec.style.opacity = isLoading ? '0.4' : '1';
      googleSec.style.pointerEvents = isLoading ? 'none' : 'auto';
    }
  }

  async handleGoogleCredentialResponse(response) {
    if (!response || !response.credential) {
      this.showFormError('Google did not return authentication credentials.');
      return;
    }

    this.showAuthLoading(true, 'Verifying Google credentials with server...');

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken: response.credential })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Server rejected Google authentication.');
      }

      if (data.sessionToken) {
        try { sessionStorage.setItem('NEXUS_SESSION_TOKEN', data.sessionToken); } catch (e) {}
      }

      sound.playPassUnlocked();
      this.saveUser(data.user);
      this.closeModal();
      this.showAuthToast(`Welcome, ${data.user.name}! Authenticated via Google.`);
    } catch (err) {
      this.showAuthLoading(false);
      this.showFormError(err.message || 'Google authentication failed.');
    }
  }

  async applyGoogleUserData({ sub, name, email, picture }) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const check = await this.checkEmailExists(cleanEmail);
    if (check.exists) {
      this.openGooglePasswordPrompt({
        email: cleanEmail,
        name: name || check.name || cleanEmail.split('@')[0],
        avatar: picture || check.avatar || 'G',
        provider: 'google'
      });
      return;
    }
    this.openGoogleSetPasswordPrompt({
      sub,
      name: name || cleanEmail.split('@')[0],
      email: cleanEmail,
      picture: picture || 'G'
    });
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
    if (typeof localStorage === 'undefined') return null;
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
    try {
      if (this.syncChannel) {
        this.syncChannel.postMessage({ type: 'AUTH_SYNC', user });
      }
    } catch (e) {}
    if (user && this.pendingAuthCallback) {
      const cb = this.pendingAuthCallback;
      this.pendingAuthCallback = null;
      try { cb(user); } catch (e) { console.error(e); }
    }
  }

  async init() {
    this.renderNavAuth();
    await this.fetchAuthConfig();
    await this.checkServerSession();
    this.initGoogleIdentity();
  }

  async fetchAuthConfig() {
    try {
      const res = await fetch('/api/auth/config', { cache: 'no-store' });
      if (res.ok) {
        const config = await res.json();
        if (config && config.clientId) {
          this.serverGoogleClientId = config.clientId;
        }
      }
    } catch (e) {}
  }

  async checkServerSession() {
    try {
      const token = sessionStorage.getItem('NEXUS_SESSION_TOKEN');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/auth/me', {
        credentials: 'include',
        headers,
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          this.currentUser = data.user;
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
          this.renderNavAuth();
          this.notifyListeners(data.user);
          return;
        } else if (!data.authenticated && this.currentUser) {
          // If server says unauthenticated and we had local state, clear local state
          this.currentUser = null;
          localStorage.removeItem(AUTH_STORAGE_KEY);
          this.renderNavAuth();
          this.notifyListeners(null);
        }
      }
    } catch (e) {
      // Offline fallback: keep cached user
    }
  }

  renderNavAuth() {
    const slot = document.getElementById('navAuthSlot');
    if (!slot) return;

    if (this.currentUser) {
      const isImg = this.currentUser.avatar && (this.currentUser.avatar.startsWith('data:image') || this.currentUser.avatar.startsWith('http') || this.currentUser.avatar.startsWith('blob:'));
      const avatarHTML = isImg 
        ? `<img src="${this.currentUser.avatar}" alt="${this.currentUser.name}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`
        : (this.currentUser.avatar || (this.currentUser.name ? this.currentUser.name.charAt(0).toUpperCase() : 'U'));

      slot.innerHTML = `
        <div class="auth-user-dropdown-wrap">
          <button class="nav-user-pill" onclick="window.authSystem.toggleUserDropdown()">
            <div class="user-avatar-small" style="overflow:hidden; display:flex; align-items:center; justify-content:center;">${avatarHTML}</div>
            <span class="user-name">${this.currentUser.name}</span>
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
              Edit Profile & Picture
            </button>
            <button class="dropdown-item" onclick="window.nexusApp.openMyRegistrationsModal(); window.authSystem.toggleUserDropdown()">
              My Passes & Registrations
            </button>
            <button class="dropdown-item" onclick="window.nexusApp.switchTab('admin'); window.authSystem.toggleUserDropdown()">
              Dashboard & Events
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item text-danger" onclick="window.authSystem.logout()">
              Sign Out
            </button>
          </div>
        </div>
      `;
    } else {
      slot.innerHTML = `
        <button class="btn btn-sm btn-primary btn-glow" onclick="window.authSystem.openAuthModal('signin')">
          <span>Sign In / Join</span>
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
            <button class="modal-close-btn" onclick="window.authSystem.closeModal()">&times;</button>
          </div>

          ${reasonMessage ? `
            <div style="background: rgba(255, 255, 255, 0.08); border-bottom: 1px solid rgba(255, 255, 255, 0.15); padding: 0.85rem 1.5rem; font-size: 0.85rem; color: #ffffff; display: flex; align-items: center; gap: 0.6rem;">
              <span><strong>Login Required:</strong> ${reasonMessage}</span>
            </div>
          ` : ''}

          <div class="auth-dialog-body" id="authDialogBody">
            ${this.renderAuthForm()}
          </div>

        </div>
      </div>
    `;

    this.initAndRenderGoogleButton();
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
      this.initAndRenderGoogleButton();
    }
  }

  renderAuthForm() {
    return `
      <!-- 1. Sign In With Google Button -->
      <div class="google-auth-section">
        <div id="authLoadingIndicator" class="auth-loading-banner hidden"></div>
        <div id="googleOfficialBtnSlot" class="google-official-btn-slot"></div>
        <button id="googleCustomBtnFallback" class="btn-google-auth" onclick="window.authSystem.handleGoogleSignIn()">
          <svg class="google-logo" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>${this.authMode === 'signin' ? 'Continue with Google' : 'Sign up with Google'}</span>
        </button>

        <div class="google-auth-meta-row" style="justify-content:center;">
          <button type="button" class="btn-subtle-link" onclick="window.authSystem.promptGoogleClientIdConfig()">
            Google Cloud OAuth Client ID (Optional)
          </button>
        </div>
      </div>

      <div class="auth-divider">
        <span>OR WITH EMAIL & PASSWORD</span>
      </div>

      <!-- 2. Email & Password Form -->
      <form class="auth-form" onsubmit="event.preventDefault(); window.authSystem.handleAuthSubmit();">
        <div id="authErrorMessage" class="auth-error-banner hidden"></div>
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
      msgEl.textContent = 'Passwords match successfully';
      msgEl.className = 'pw-match-msg match-success';
    } else {
      msgEl.textContent = 'Passwords do not match';
      msgEl.className = 'pw-match-msg match-error';
    }
  }

  getSavedGoogleAccounts() {
    try {
      const data = localStorage.getItem('NEXUS_SAVED_GOOGLE_ACCOUNTS');
      if (data) {
        const list = JSON.parse(data);
        if (Array.isArray(list)) {
          return list.filter(a => a && a.email && !['alex.rivera@campus.edu', 'priya.sharma@gmail.com', 'mdshahalam3392@gmail.com'].includes(a.email.toLowerCase()));
        }
      }
    } catch (e) {}
    return [];
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
    sound.playClick();
    const effectiveClientId = this.getEffectiveGoogleClientId();

    if (effectiveClientId && window.google?.accounts?.id) {
      this.initGoogleIdentity();
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          const reason = notification.getNotDisplayedReason ? notification.getNotDisplayedReason() : '';
          console.log('Google prompt not displayed:', reason);
          this.openGoogleAccountModal(true);
        } else if (notification.isSkippedMoment()) {
          console.log('Google prompt skipped');
        } else if (notification.isDismissedMoment()) {
          console.log('Google prompt dismissed');
        }
      });
      return;
    }

    if (!effectiveClientId) {
      this.promptGoogleClientIdConfig();
      return;
    }

    const saved = this.getSavedGoogleAccounts();
    this.openGoogleAccountModal(saved.length === 0);
  }

  promptGoogleClientIdConfig() {
    sound.playClick();
    const currentId = this.getGoogleClientId();
    const modalContainer = document.getElementById('globalModalContainer');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal-backdrop" onclick="if(event.target === this) window.authSystem.closeModal()">
        <div class="modal-dialog modal-sm">
          <div class="modal-header">
            <div>
              <span class="modal-club-tag">Google Identity Services</span>
              <h3 class="modal-title">Google OAuth Client ID</h3>
            </div>
            <button class="modal-close-btn" onclick="window.authSystem.closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            <p style="font-size: 0.84rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.5;">
              Enter your Google Cloud Console OAuth 2.0 Web Client ID. Authorized JavaScript Origins in your Google Cloud project must include this domain (e.g. <code>http://localhost:3000</code>).
            </p>
            <div class="form-group mb-3">
              <label class="form-label">Client ID <span class="req">*</span></label>
              <input type="text" id="gConfigClientId" class="form-input mono" value="${currentId}" placeholder="xxxx.apps.googleusercontent.com" />
            </div>
            <div style="display: flex; gap: 0.65rem; justify-content: flex-end; margin-top: 1.25rem;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.authSystem.resetGoogleClientId()">Reset Default</button>
              <button type="button" class="btn btn-primary btn-sm" onclick="window.authSystem.saveGoogleClientIdFromInput()">Save Client ID</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  saveGoogleClientIdFromInput() {
    const input = document.getElementById('gConfigClientId');
    if (!input) return;
    const val = input.value.trim();
    if (!val) {
      alert('Please enter a valid Google Client ID or click Reset Default.');
      return;
    }
    this.setGoogleClientId(val);
    this.showAuthToast('Google Client ID updated successfully.');
    this.openAuthModal(this.authMode);
  }

  resetGoogleClientId() {
    this.setGoogleClientId('');
    this.showAuthToast('Google Client ID reset to default.');
    this.openAuthModal(this.authMode);
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
            <p class="google-modal-subtitle">${isCustom ? 'Register or sign in with your Google account. Accounts are protected by password.' : 'Select an account to enter password and sign in'}</p>
            <button class="modal-close-btn" onclick="window.authSystem.closeModal()" style="position:absolute; top:1rem; right:1.25rem;">&times;</button>
          </div>

          <div class="google-modal-body">
            <div id="googleModalError" class="auth-error-banner hidden"></div>

            ${!isCustom ? `
              <div class="google-account-list">
                ${savedAccounts.map((acc, idx) => {
                  const isImg = acc.avatar && (acc.avatar.startsWith('data:image') || acc.avatar.startsWith('http') || acc.avatar.startsWith('blob:'));
                  const avContent = isImg 
                    ? `<img src="${acc.avatar}" alt="${acc.name}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`
                    : (acc.avatar || acc.name.charAt(0).toUpperCase());
                  return `
                    <div class="google-account-item" onclick="window.authSystem.openGooglePasswordPrompt(window.authSystem.getSavedGoogleAccounts()[${idx}])">
                      <div class="google-acc-avatar">${avContent}</div>
                      <div class="google-acc-details">
                        <div class="google-acc-name">${acc.name}</div>
                        <div class="google-acc-email">${acc.email}</div>
                      </div>
                      <button class="google-acc-del" onclick="event.stopPropagation(); window.authSystem.removeSavedGoogleAccount(${idx});" title="Remove account">&times;</button>
                    </div>
                  `;
                }).join('')}

                <div class="google-account-item google-add-account" onclick="window.authSystem.openGoogleAccountModal(true)">
                  <div class="google-acc-avatar" style="background:rgba(255,255,255,0.1); color:#ffffff; font-size:1.1rem;">+</div>
                  <div class="google-acc-details">
                    <div class="google-acc-name" style="font-weight:700; color:var(--text-main);">Use another Google account</div>
                    <div class="google-acc-email">Sign in or register a new Google account</div>
                  </div>
                </div>
              </div>
            ` : `
              <form class="google-custom-form" onsubmit="event.preventDefault(); window.authSystem.submitGoogleCustomAccount();">
                <div class="form-group">
                  <label class="form-label">Full Name <span class="req">*</span></label>
                  <input type="text" id="gCustomName" class="form-input" placeholder="e.g. Your Full Name" required autofocus />
                </div>

                <div class="form-group">
                  <label class="form-label">Google / Gmail Address <span class="req">*</span></label>
                  <input type="email" id="gCustomEmail" class="form-input" placeholder="e.g. yourname@gmail.com" required onblur="window.authSystem.checkGoogleEmailField(this.value)" />
                  <div id="gEmailStatusNotice" style="font-size:0.75rem; color:var(--text-muted); margin-top:0.35rem;"></div>
                </div>

                <div class="form-group">
                  <label class="form-label">Password <span class="req">*</span></label>
                  <div class="password-input-wrap">
                    <input type="password" id="gCustomPassword" class="form-input" placeholder="Enter password (min 6 chars)" minlength="6" required />
                    <button type="button" class="btn-toggle-pw" aria-label="Toggle password visibility" onclick="window.authSystem.togglePwVisibility('gCustomPassword', this)">${this.renderEyeIcon(false)}</button>
                  </div>
                </div>

                <div class="form-group" id="gConfirmPwGroup">
                  <label class="form-label">Confirm Password <span class="req">*</span></label>
                  <div class="password-input-wrap">
                    <input type="password" id="gCustomConfirmPassword" class="form-input" placeholder="Re-enter password to confirm" minlength="6" required />
                    <button type="button" class="btn-toggle-pw" aria-label="Toggle password visibility" onclick="window.authSystem.togglePwVisibility('gCustomConfirmPassword', this)">${this.renderEyeIcon(false)}</button>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Profile Picture / Avatar</label>
                  <div class="google-avatar-picker-wrap">
                    <div class="google-avatar-preview" id="gAvatarPreview">G</div>
                    <div class="google-avatar-controls">
                      <label class="btn btn-sm btn-secondary" style="cursor:pointer;">
                        Upload Photo
                        <input type="file" id="gPhotoFileInput" accept="image/*" style="display:none;" onchange="window.authSystem.handleGooglePhotoUpload(event)" />
                      </label>
                      <input type="url" id="gPhotoUrlInput" class="form-input form-input-sm" placeholder="Or paste image link" oninput="window.authSystem.handleGooglePhotoUrl(this.value)" />
                    </div>
                  </div>
                  <div class="preset-badges-row">
                    <span class="preset-label">Or pick a badge:</span>
                    ${['DEV', 'LEAD', 'VIP', 'PRO', 'TECH', 'CORE', 'ORG', 'AI', 'CP', 'LAB'].map(badge => `
                      <button type="button" class="btn-badge-pick" style="font-size:0.75rem; font-weight:800; font-family:var(--font-mono);" onclick="window.authSystem.selectGoogleBadge('${badge}')">${badge}</button>
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
                  <button type="submit" id="gSubmitBtn" class="btn btn-primary btn-glow flex-1">
                    Create Google Account & Sign In &rarr;
                  </button>
                </div>
              </form>
            `}
          </div>

          <div class="google-modal-footer">
            <span class="google-security-badge">Google Authentication • 1 Account Per Email with Password Protection</span>
          </div>

        </div>
      </div>
    `;
  }

  async checkGoogleEmailField(email) {
    email = (email || '').trim().toLowerCase();
    const noticeEl = document.getElementById('gEmailStatusNotice');
    const confirmGroup = document.getElementById('gConfirmPwGroup');
    const submitBtn = document.getElementById('gSubmitBtn');
    if (!email || !email.includes('@')) {
      if (noticeEl) noticeEl.textContent = '';
      return;
    }

    const check = await this.checkEmailExists(email);
    if (check.exists) {
      if (noticeEl) {
        noticeEl.innerHTML = `<span style="color:#ffffff;">Account found for this email. Enter your password to sign in.</span>`;
      }
      if (confirmGroup) confirmGroup.style.display = 'none';
      const confirmInput = document.getElementById('gCustomConfirmPassword');
      if (confirmInput) confirmInput.required = false;
      if (submitBtn) submitBtn.innerHTML = `Sign In with Password &rarr;`;
      const nameInput = document.getElementById('gCustomName');
      if (nameInput && !nameInput.value && check.name) {
        nameInput.value = check.name;
      }
    } else {
      if (noticeEl) {
        noticeEl.innerHTML = `<span style="color:var(--text-muted);">New email address. Create account and set password.</span>`;
      }
      if (confirmGroup) confirmGroup.style.display = 'block';
      const confirmInput = document.getElementById('gCustomConfirmPassword');
      if (confirmInput) confirmInput.required = true;
      if (submitBtn) submitBtn.innerHTML = `Create Google Account & Sign In &rarr;`;
    }
  }

  openGooglePasswordPrompt(account) {
    sound.playClick();
    const modalContainer = document.getElementById('globalModalContainer');
    if (!modalContainer || !account) return;

    const isImg = account.avatar && (account.avatar.startsWith('data:image') || account.avatar.startsWith('http') || account.avatar.startsWith('blob:'));
    const avContent = isImg 
      ? `<img src="${account.avatar}" alt="${account.name}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`
      : (account.avatar || account.name?.charAt(0).toUpperCase() || 'G');

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
            <h3 class="google-modal-title">Enter Your Password</h3>
            <p class="google-modal-subtitle">To access account for <strong>${account.email}</strong></p>
            <button class="modal-close-btn" onclick="window.authSystem.closeModal()" style="position:absolute; top:1rem; right:1.25rem;">&times;</button>
          </div>

          <div class="google-modal-body">
            <div id="googlePasswordPromptError" class="auth-error-banner hidden"></div>

            <div style="display:flex; align-items:center; gap:0.75rem; background:rgba(255,255,255,0.05); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:0.75rem 1rem; margin-bottom:1.25rem;">
              <div class="google-acc-avatar" style="width:38px; height:38px;">${avContent}</div>
              <div style="flex:1; overflow:hidden;">
                <div style="font-weight:700; color:#ffffff; font-size:0.9rem;">${account.name}</div>
                <div style="font-size:0.78rem; color:var(--text-muted);">${account.email}</div>
              </div>
            </div>

            <form onsubmit="event.preventDefault(); window.authSystem.submitGooglePasswordLogin('${account.email}');">
              <div class="form-group mb-3">
                <label class="form-label">Password <span class="req">*</span></label>
                <div class="password-input-wrap">
                  <input type="password" id="gPromptPassword" class="form-input" placeholder="Enter your password" required autofocus />
                  <button type="button" class="btn-toggle-pw" aria-label="Toggle password visibility" onclick="window.authSystem.togglePwVisibility('gPromptPassword', this)">${this.renderEyeIcon(false)}</button>
                </div>
              </div>

              <div style="display:flex; gap:0.75rem; margin-top:1.5rem;">
                <button type="button" class="btn btn-secondary" onclick="window.authSystem.openGoogleAccountModal()">
                  &larr; Switch Account
                </button>
                <button type="submit" class="btn btn-primary btn-glow flex-1">
                  Access Account &rarr;
                </button>
              </div>
            </form>
          </div>

          <div class="google-modal-footer">
            <span class="google-security-badge">Protected by Nexus Secure Authentication</span>
          </div>

        </div>
      </div>
    `;
  }

  async submitGooglePasswordLogin(email) {
    const pw = document.getElementById('gPromptPassword')?.value;
    if (!pw) {
      this.showFormError('Please enter your password.', 'googlePasswordPromptError');
      return;
    }

    try {
      const user = await this.loginUserAccount({ email, password: pw });
      sound.playPassUnlocked();
      this.addSavedGoogleAccount(user);
      this.saveUser(user);
      this.closeModal();
      this.showAuthToast(`Welcome back, ${user.name}!`);
    } catch (err) {
      this.showFormError(err.message || 'Incorrect password.', 'googlePasswordPromptError');
    }
  }

  openGoogleSetPasswordPrompt({ sub, name, email, picture }) {
    sound.playClick();
    const modalContainer = document.getElementById('globalModalContainer');
    if (!modalContainer) return;

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
            <h3 class="google-modal-title">Set Account Password</h3>
            <p class="google-modal-subtitle">Secure your new account for <strong>${email}</strong></p>
            <button class="modal-close-btn" onclick="window.authSystem.closeModal()" style="position:absolute; top:1rem; right:1.25rem;">&times;</button>
          </div>

          <div class="google-modal-body">
            <div id="googleSetPwError" class="auth-error-banner hidden"></div>

            <form onsubmit="event.preventDefault(); window.authSystem.submitGoogleSetPassword('${email}', '${encodeURIComponent(name || 'Google User')}', '${encodeURIComponent(picture || '')}');">
              <div class="form-group mb-3">
                <label class="form-label">Create Password <span class="req">*</span></label>
                <div class="password-input-wrap">
                  <input type="password" id="gSetNewPassword" class="form-input" placeholder="Set password (min 6 chars)" minlength="6" required autofocus />
                  <button type="button" class="btn-toggle-pw" aria-label="Toggle password visibility" onclick="window.authSystem.togglePwVisibility('gSetNewPassword', this)">${this.renderEyeIcon(false)}</button>
                </div>
              </div>

              <div class="form-group mb-3">
                <label class="form-label">Confirm Password <span class="req">*</span></label>
                <div class="password-input-wrap">
                  <input type="password" id="gSetConfirmPassword" class="form-input" placeholder="Confirm password" minlength="6" required />
                  <button type="button" class="btn-toggle-pw" aria-label="Toggle password visibility" onclick="window.authSystem.togglePwVisibility('gSetConfirmPassword', this)">${this.renderEyeIcon(false)}</button>
                </div>
              </div>

              <div style="display:flex; gap:0.75rem; margin-top:1.5rem;">
                <button type="button" class="btn btn-secondary" onclick="window.authSystem.closeModal()">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary btn-glow flex-1">
                  Save Password & Sign In &rarr;
                </button>
              </div>
            </form>
          </div>

          <div class="google-modal-footer">
            <span class="google-security-badge">1 Email = 1 Account • Access with Password Anytime</span>
          </div>

        </div>
      </div>
    `;
  }

  async submitGoogleSetPassword(email, encName, encPicture) {
    const pw = document.getElementById('gSetNewPassword')?.value;
    const confirmPw = document.getElementById('gSetConfirmPassword')?.value;

    if (!pw || !confirmPw) {
      this.showFormError('Please enter and confirm your password.', 'googleSetPwError');
      return;
    }

    if (pw !== confirmPw) {
      this.showFormError('Passwords do not match.', 'googleSetPwError');
      return;
    }

    if (pw.length < 6) {
      this.showFormError('Password must be at least 6 characters long.', 'googleSetPwError');
      return;
    }

    const name = decodeURIComponent(encName || 'Google User');
    const picture = decodeURIComponent(encPicture || '');

    try {
      const user = await this.registerUserAccount({
        name,
        email,
        password: pw,
        avatar: picture || name.charAt(0).toUpperCase(),
        provider: 'google',
        role: 'Campus Member'
      });

      sound.playPassUnlocked();
      this.addSavedGoogleAccount(user);
      this.saveUser(user);
      this.closeModal();
      this.showAuthToast(`Account registered and verified as ${user.name}!`);
    } catch (err) {
      this.showFormError(err.message || 'Failed to complete registration.', 'googleSetPwError');
    }
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
      preview.innerHTML = `<img src="${url}" alt="Preview" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" onerror="this.parentElement.textContent='U'" />`;
    }
  }

  selectGoogleBadge(badge) {
    sound.playClick();
    this.pendingGoogleAvatar = badge;
    const preview = document.getElementById('gAvatarPreview');
    if (preview) {
      preview.innerHTML = `<div style="font-size:1.1rem; font-weight:900; line-height:1; font-family:var(--font-mono);">${badge}</div>`;
    }
    const urlIn = document.getElementById('gPhotoUrlInput');
    if (urlIn) urlIn.value = '';
  }

  selectGoogleEmoji(badge) {
    this.selectGoogleBadge(badge);
  }

  async submitGoogleCustomAccount() {
    const name = document.getElementById('gCustomName')?.value.trim();
    const email = document.getElementById('gCustomEmail')?.value.trim().toLowerCase();
    const pw = document.getElementById('gCustomPassword')?.value;
    const confirmPw = document.getElementById('gCustomConfirmPassword')?.value;
    const roll = document.getElementById('gCustomRoll')?.value.trim();

    if (!name || !email || !pw) {
      this.showFormError('Please fill out all mandatory fields.', 'googleModalError');
      return;
    }

    // Check if account already exists
    const check = await this.checkEmailExists(email);
    if (check.exists) {
      // 1 email = 1 account! The account already exists, so it MUST be accessed with password
      try {
        const user = await this.loginUserAccount({ email, password: pw });
        sound.playPassUnlocked();
        this.addSavedGoogleAccount(user);
        this.saveUser(user);
        this.closeModal();
        this.showAuthToast(`Welcome back, ${user.name}!`);
        return;
      } catch (err) {
        // If wrong password, open the clear password verification prompt for this account
        this.openGooglePasswordPrompt({
          email,
          name: check.name || name,
          avatar: check.avatar || name.charAt(0).toUpperCase()
        });
        setTimeout(() => {
          this.showFormError('An account with this email already exists. Please enter your correct password.', 'googlePasswordPromptError');
        }, 50);
        return;
      }
    }

    // New account creation
    if (pw !== confirmPw) {
      this.showFormError('Password and Confirm Password must match.', 'googleModalError');
      return;
    }

    if (pw.length < 6) {
      this.showFormError('Password must be at least 6 characters long.', 'googleModalError');
      return;
    }

    const avatar = this.pendingGoogleAvatar || name.charAt(0).toUpperCase();

    try {
      const user = await this.registerUserAccount({
        name,
        email,
        password: pw,
        rollNo: roll,
        avatar,
        provider: 'google',
        role: 'Campus Member'
      });

      sound.playPassUnlocked();
      this.addSavedGoogleAccount(user);
      this.saveUser(user);
      this.closeModal();
      this.showAuthToast(`Google account registered and verified as ${user.name}!`);
    } catch (err) {
      this.showFormError(err.message || 'Failed to register account.', 'googleModalError');
    }
  }

  selectGoogleAccount(index) {
    const list = this.getSavedGoogleAccounts();
    const acc = list[index];
    if (!acc) return;
    this.openGooglePasswordPrompt(acc);
  }

  async handleAuthSubmit() {
    sound.playClick();
    this.hideFormError('authErrorMessage');
    const email = document.getElementById('authEmail')?.value.trim();
    const pw = document.getElementById('authPassword')?.value;

    if (this.authMode === 'signup') {
      const name = document.getElementById('authFullName')?.value.trim();
      const roll = document.getElementById('authRollNo')?.value.trim();
      const confirmPw = document.getElementById('authConfirmPassword')?.value;

      if (!name || !roll || !email || !pw) {
        this.showFormError('Please fill out all mandatory fields.', 'authErrorMessage');
        return;
      }

      if (pw !== confirmPw) {
        this.showFormError('Password and Confirm Password must match.', 'authErrorMessage');
        return;
      }

      if (pw.length < 6) {
        this.showFormError('Password must be at least 6 characters long.', 'authErrorMessage');
        return;
      }

      try {
        const user = await this.registerUserAccount({
          name,
          email,
          password: pw,
          rollNo: roll,
          avatar: name.charAt(0).toUpperCase(),
          provider: 'email',
          role: 'Club Participant'
        });

        sound.playPassUnlocked();
        this.saveUser(user);
        this.closeModal();
        this.showAuthToast(`Account created! Welcome, ${user.name}.`);
      } catch (err) {
        if (err.message && err.message.toLowerCase().includes('already exists')) {
          this.switchAuthMode('signin');
          const emailInput = document.getElementById('authEmail');
          if (emailInput) emailInput.value = email;
          const pwInput = document.getElementById('authPassword');
          if (pwInput) pwInput.focus();
          this.showFormError('An account with this email already exists. Please enter your password to sign in.', 'authErrorMessage');
        } else {
          this.showFormError(err.message || 'Registration failed.', 'authErrorMessage');
        }
      }

    } else {
      // Sign in mode
      if (!email || !pw) {
        this.showFormError('Please enter your email and password.', 'authErrorMessage');
        return;
      }

      try {
        const user = await this.loginUserAccount({ email, password: pw });
        sound.playPassUnlocked();
        this.saveUser(user);
        this.closeModal();
        this.showAuthToast(`Welcome back, ${user.name}!`);
      } catch (err) {
        this.showFormError(err.message || 'Sign in failed.', 'authErrorMessage');
      }
    }
  }

  async logout() {
    sound.playClick();
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {}
    try {
      sessionStorage.removeItem('NEXUS_SESSION_TOKEN');
    } catch (e) {}
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
      <div class="toast-icon">OK</div>
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
