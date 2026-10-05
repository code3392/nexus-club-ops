// Main Application Controller & Coordinator
import { db } from './data.js';
import { sound } from './sound.js';
import { NetworkCanvas } from './canvas.js';
import { FormBuilderStudio } from './formBuilder.js';
import { GateScannerTerminal } from './scanner.js';
import { AdminCommandCenter } from './analytics.js';
import { renderHolographicBadge } from './badges.js';
import { auth } from './auth.js';

class NexusApp {
  constructor() {
    this.currentTab = 'arena';
    this.activeFilter = 'all';
    this.searchQuery = '';
    this.currentRegEvent = null;
    this.regStep = 1;
    this.registrationDraft = {
      leadName: '',
      leadEmail: '',
      leadPhone: '',
      collegeRoll: '',
      teamName: '',
      teamMembers: [],
      answers: {}
    };
  }

  init() {
    // Canvas background
    this.canvas = new NetworkCanvas('networkCanvas');

    // Sub-modules
    window.authSystem = auth;
    window.formStudio = new FormBuilderStudio('fbStudioContainer', 'fbPhonePreview');
    window.gateScanner = new GateScannerTerminal('scannerContainer');
    window.adminCenter = new AdminCommandCenter('adminContainer');

    this.bindEvents();
    this.renderFestArena();
    this.updateHeroStats();

    // Init submodules
    window.authSystem.init();
    window.formStudio.init();
    window.gateScanner.init();
    window.adminCenter.init();
  }

  bindEvents() {
    // Navigation tabs
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        sound.playClick();
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Sound toggle button
    const soundToggle = document.getElementById('soundToggleBtn');
    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        const isMuted = sound.toggleMute();
        soundToggle.innerHTML = isMuted ? '🔇 Muted' : '🔊 Sound FX';
        soundToggle.classList.toggle('muted', isMuted);
      });
    }

    // Reset data button
    const resetBtn = document.getElementById('resetDataBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset to initial campus demo state? All custom forms and mock registrations will be restored.')) {
          sound.playClick();
          db.resetToDefault();
          location.reload();
        }
      });
    }

    // Command palette shortcut (Ctrl+K or Cmd+K)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.toggleCommandPalette();
      }
      if (e.key === 'Escape') {
        this.closeModal();
        this.closeCommandPalette();
      }
    });

    // ROI Calculator input listeners
    const calcAttendees = document.getElementById('calcAttendees');
    const calcEvents = document.getElementById('calcEvents');
    if (calcAttendees && calcEvents) {
      [calcAttendees, calcEvents].forEach(input => {
        input.addEventListener('input', () => this.updateCalculator());
      });
    }
  }

  switchTab(tabId) {
    this.currentTab = tabId;
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    document.querySelectorAll('.tab-view-section').forEach(sec => {
      sec.classList.toggle('active', sec.id === `tabView-${tabId}`);
    });

    // Sub-view refresh
    if (tabId === 'arena') {
      this.renderFestArena();
    } else if (tabId === 'scanner') {
      window.gateScanner.render();
    } else if (tabId === 'admin') {
      window.adminCenter.render();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateHeroStats() {
    const registrations = db.getRegistrations();
    const events = db.getEvents();
    const clubs = db.getClubs();
    const totalRegs = registrations.length;
    const checkedIn = registrations.filter(r => r.checkedIn).length;

    const statRegEl = document.getElementById('heroStatRegs');
    const statEventsEl = document.getElementById('heroStatEvents');
    const statCheckedEl = document.getElementById('heroStatChecked');
    const statClubsEl = document.getElementById('heroStatClubs');

    if (statRegEl) statRegEl.textContent = totalRegs.toString();
    if (statEventsEl) statEventsEl.textContent = events.length.toString();
    if (statCheckedEl) statCheckedEl.textContent = checkedIn.toString();
    if (statClubsEl) statClubsEl.textContent = clubs.length.toString();
  }

  updateCalculator() {
    const attendeesEl = document.getElementById('calcAttendees');
    const eventsEl = document.getElementById('calcEvents');
    if (!attendeesEl || !eventsEl) return;

    const attendees = parseInt(attendeesEl.value) || 1200;
    const events = parseInt(eventsEl.value) || 12;

    const hoursSaved = Math.round((attendees * 0.08) * events * 0.5);
    const fraudPrevented = Math.round(attendees * 0.04);
    const queueMinutesSaved = Math.round(attendees * 0.12);
    const paperSavedDollars = Math.round(attendees * 0.25);

    document.getElementById('calcResultHours').textContent = `${hoursSaved} hrs`;
    document.getElementById('calcResultFraud').textContent = `${fraudPrevented} passes`;
    document.getElementById('calcResultQueue').textContent = `${queueMinutesSaved} mins`;
    document.getElementById('calcResultMoney').textContent = `$${paperSavedDollars}`;
  }

  // Render Fest Arena Event Showcase
  renderFestArena() {
    const container = document.getElementById('eventsGridContainer');
    if (!container) return;

    const events = db.getEvents();
    let filtered = events;

    if (this.activeFilter !== 'all') {
      filtered = filtered.filter(e => e.category === this.activeFilter);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.clubName.toLowerCase().includes(q) ||
        e.tagline.toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-icon">🔍</div>
          <h3>No events match your criteria</h3>
          <p>Try clearing filters or search keywords.</p>
          <button class="btn btn-secondary btn-sm" onclick="window.nexusApp.resetFilters()">Reset Filters</button>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(evt => {
      const pct = Math.min(100, Math.round((evt.registeredCount / evt.capacity) * 100));
      const isFull = evt.registeredCount >= evt.capacity;
      const slotsLeft = Math.max(0, evt.capacity - evt.registeredCount);

      return `
        <div class="event-card" data-id="${evt.id}">
          <div class="event-card-banner" style="background: ${evt.gradient};">
            <div class="banner-top-row">
              <span class="event-club-badge">${evt.clubName}</span>
              <span class="event-tier-badge">${evt.fee === 0 ? 'FREE TIER' : '$' + evt.fee + ' ENTRY'}</span>
            </div>
            <div class="event-banner-content">
              <span class="event-category-chip">${evt.category.toUpperCase()}</span>
              <h3 class="event-card-title">${evt.title}</h3>
            </div>
          </div>

          <div class="event-card-body">
            <p class="event-tagline">${evt.tagline}</p>

            <div class="event-details-grid">
              <div class="detail-item">
                <span class="d-icon">📅</span>
                <span>${evt.date}</span>
              </div>
              <div class="detail-item">
                <span class="d-icon">📍</span>
                <span>${evt.venue}</span>
              </div>
              <div class="detail-item">
                <span class="d-icon">🏆</span>
                <span>${evt.prizePool}</span>
              </div>
              <div class="detail-item">
                <span class="d-icon">👥</span>
                <span>${evt.isTeam ? `Teams (${evt.minTeam}-${evt.maxTeam} Hackers)` : 'Solo / Individual'}</span>
              </div>
            </div>

            <!-- Dynamic Capacity Quota Bar (Forms Killer Feature) -->
            <div class="capacity-meter-box">
              <div class="capacity-meter-header">
                <span>Slots Filled: <strong>${evt.registeredCount} / ${evt.capacity}</strong></span>
                <span class="slots-alert ${slotsLeft <= 5 ? 'text-rose' : 'text-emerald'}">
                  ${isFull ? '🔴 Capacity Reached' : `⚡ ${slotsLeft} slots remaining`}
                </span>
              </div>
              <div class="capacity-meter-track">
                <div class="capacity-meter-fill" style="width: ${pct}%; background: ${pct > 85 ? '#ef4444' : '#6366f1'};"></div>
              </div>
            </div>

            <div class="event-card-footer">
              <button class="btn btn-secondary btn-sm" onclick="window.nexusApp.openEventDetails('${evt.id}')">
                Details & Rules
              </button>
              <button class="btn btn-primary btn-sm ${isFull ? 'btn-disabled' : 'btn-glow'}" 
                onclick="window.nexusApp.startRegistration('${evt.id}')" ${isFull ? 'disabled' : ''}>
                ${isFull ? 'Waitlist Only' : 'Register Now &rarr;'}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  setFilter(category) {
    sound.playClick();
    this.activeFilter = category;
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.classList.toggle('active', pill.dataset.filter === category);
    });
    this.renderFestArena();
  }

  resetFilters() {
    this.activeFilter = 'all';
    this.searchQuery = '';
    const searchInput = document.getElementById('eventSearchInput');
    if (searchInput) searchInput.value = '';
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.classList.toggle('active', pill.dataset.filter === 'all');
    });
    this.renderFestArena();
  }

  handleSearch(query) {
    this.searchQuery = query;
    this.renderFestArena();
  }

  // Event Details Modal
  openEventDetails(eventId) {
    sound.playClick();
    const event = db.getEvents().find(e => e.id === eventId);
    if (!event) return;

    const modal = document.getElementById('globalModalContainer');
    if (!modal) return;

    modal.innerHTML = `
      <div class="modal-backdrop" onclick="if(event.target===this) window.nexusApp.closeModal()">
        <div class="modal-dialog modal-lg">
          <div class="modal-header">
            <div>
              <span class="modal-club-tag">${event.clubName}</span>
              <h2 class="modal-title">${event.title}</h2>
            </div>
            <button class="modal-close-btn" onclick="window.nexusApp.closeModal()">✕</button>
          </div>

          <div class="modal-body">
            <div class="modal-event-hero" style="background: ${event.gradient};">
              <div class="hero-details-row">
                <div class="hd-box">
                  <div class="hd-label">Prize Pool</div>
                  <div class="hd-val">${event.prizePool}</div>
                </div>
                <div class="hd-box">
                  <div class="hd-label">Registration Quota</div>
                  <div class="hd-val">${event.registeredCount} / ${event.capacity} Slots</div>
                </div>
                <div class="hd-box">
                  <div class="hd-label">Ticket Tier</div>
                  <div class="hd-val">${event.fee === 0 ? 'Free Attendance' : '$' + event.fee}</div>
                </div>
              </div>
            </div>

            <div class="modal-info-columns">
              <div class="mic-left">
                <h4>Event Description & Scope</h4>
                <p>${event.tagline}</p>
                <p>Equipped with instant holographic NFC/QR pass generation. Once registered, your team pass is cryptographically locked with zero manual spreadsheet reconciliation.</p>

                <h4>Schedule & Venue</h4>
                <p>📍 <strong>Location:</strong> ${event.venue}</p>
                <p>⏰ <strong>Time:</strong> ${event.date}</p>
              </div>

              <div class="mic-right">
                <div class="smart-features-card">
                  <h5>🛡️ Nexus Ops Protections</h5>
                  <ul>
                    <li>✓ Automatic seat lock at ${event.capacity} entries</li>
                    <li>✓ Anti-screenshot payment verification</li>
                    <li>✓ Dynamic teammate invite links</li>
                    <li>✓ 0.4s fast-lane gate check-in</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="window.nexusApp.closeModal()">Close</button>
            <button class="btn btn-primary btn-glow" onclick="window.nexusApp.startRegistration('${event.id}')">
              Proceed to Smart Registration &rarr;
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Multi-Step Smart Registration Flow
  startRegistration(eventId) {
    sound.playClick();
    const event = db.getEvents().find(e => e.id === eventId);
    if (!event) return;

    const user = auth.currentUser;
    this.currentRegEvent = event;
    this.registrationDraft = {
      leadName: user ? user.name : '',
      leadEmail: user ? user.email : '',
      leadPhone: '',
      collegeRoll: user ? (user.rollNo || '') : '',
      teamName: '',
      teamMembers: [{ name: user ? user.name : '', role: 'Leader' }],
      answers: {}
    };

    this.renderRegistrationModal();
  }

  renderRegistrationModal() {
    const modal = document.getElementById('globalModalContainer');
    if (!modal) return;
    const evt = this.currentRegEvent;

    // Custom dynamic questions
    const customFieldsHtml = (evt.customFields || []).map(f => {
      let inputEl = '';
      const savedVal = this.registrationDraft.answers[f.id] || '';

      if (f.type === 'select') {
        inputEl = `
          <select id="${f.id}" class="gform-input" onchange="window.nexusApp.updateAnswer('${f.id}', this.value)">
            <option value="">Choose</option>
            ${(f.options || []).map(opt => `<option value="${opt}" ${savedVal === opt ? 'selected' : ''}>${opt}</option>`).join('')}
          </select>
        `;
      } else if (f.type === 'radio') {
        inputEl = `
          <div class="gform-radios">
            ${(f.options || []).map(opt => `
              <label class="gform-radio-option">
                <input type="radio" name="${f.id}" value="${opt}" ${savedVal === opt ? 'checked' : ''}
                  onchange="window.nexusApp.updateAnswer('${f.id}', this.value)" />
                <span>${opt}</span>
              </label>
            `).join('')}
          </div>
        `;
      } else {
        inputEl = `
          <input type="${f.type === 'url' ? 'url' : 'text'}" id="${f.id}" class="gform-input" 
            placeholder="Your answer" value="${savedVal}"
            oninput="window.nexusApp.updateAnswer('${f.id}', this.value)" />
        `;
      }

      return `
        <div class="gform-card">
          <label class="gform-question-title">
            ${f.label} ${f.required ? '<span class="req">*</span>' : ''}
          </label>
          ${inputEl}
        </div>
      `;
    }).join('');

    // Team members if team event
    let teamSectionHtml = '';
    if (evt.isTeam) {
      const membersRows = this.registrationDraft.teamMembers.map((m, idx) => `
        <div class="gform-tm-row">
          <input type="text" class="gform-input tm-name" placeholder="Teammate ${idx + 1} Name" value="${m.name}"
            onchange="window.nexusApp.updateTeammate(${idx}, 'name', this.value)" />
          ${idx > 0 ? `<button type="button" class="btn-remove-tm" onclick="window.nexusApp.removeTeammate(${idx})">✕</button>` : ''}
        </div>
      `).join('');

      teamSectionHtml = `
        <div class="gform-card">
          <label class="gform-question-title">Team Name <span class="req">*</span></label>
          <input type="text" id="regTeamName" class="gform-input" value="${this.registrationDraft.teamName}" placeholder="Your answer" required />
        </div>

        <div class="gform-card">
          <div class="gform-card-header-flex">
            <label class="gform-question-title">Team Members (${this.registrationDraft.teamMembers.length}/${evt.maxTeam})</label>
            ${this.registrationDraft.teamMembers.length < evt.maxTeam ? `
              <button type="button" class="btn-text-action" onclick="window.nexusApp.addTeammate()">+ Add member</button>
            ` : ''}
          </div>
          <div class="gform-tm-list">
            ${membersRows}
          </div>
        </div>
      `;
    }

    modal.innerHTML = `
      <div class="modal-backdrop" onclick="if(event.target===this) window.nexusApp.closeModal()">
        <div class="gform-modal-dialog">
          
          <!-- Google Forms Style Header Card -->
          <div class="gform-header-card" style="border-top-color: ${evt.category === 'hackathon' ? '#6366f1' : '#ec4899'};">
            <div class="gform-header-badge">${evt.clubName}</div>
            <h2 class="gform-title">${evt.title}</h2>
            <p class="gform-desc">${evt.tagline || 'Please fill out this form to register for the event.'}</p>
            <div class="gform-meta-row">
              <span>📅 ${evt.date}</span>
              <span>📍 ${evt.venue}</span>
              <span>🎟️ ${evt.fee === 0 ? 'Free Entry' : '$' + evt.fee + ' Fee'}</span>
            </div>
            <div class="gform-req-notice">* Indicates required question</div>
          </div>

          <form id="eventRegistrationForm" onsubmit="event.preventDefault(); window.nexusApp.submitRegistrationForm();">
            <!-- Full Name -->
            <div class="gform-card">
              <label class="gform-question-title">Full Name <span class="req">*</span></label>
              <input type="text" id="regName" class="gform-input" value="${this.registrationDraft.leadName}" placeholder="Your answer" required />
            </div>

            <!-- Email -->
            <div class="gform-card">
              <label class="gform-question-title">Campus Email Address <span class="req">*</span></label>
              <input type="email" id="regEmail" class="gform-input" value="${this.registrationDraft.leadEmail}" placeholder="Your answer" required />
            </div>

            <!-- Student ID / Roll -->
            <div class="gform-card">
              <label class="gform-question-title">Student Roll / ID Number <span class="req">*</span></label>
              <input type="text" id="regRoll" class="gform-input" value="${this.registrationDraft.collegeRoll}" placeholder="Your answer" required />
            </div>

            <!-- Phone -->
            <div class="gform-card">
              <label class="gform-question-title">Phone Number</label>
              <input type="tel" id="regPhone" class="gform-input" value="${this.registrationDraft.leadPhone}" placeholder="Your answer" />
            </div>

            <!-- Team Section if applicable -->
            ${teamSectionHtml}

            <!-- Dynamic Custom Event Questions -->
            ${customFieldsHtml}

            <!-- Submit Action Card -->
            <div class="gform-actions-card">
              <div class="gform-actions-left">
                <button type="submit" class="btn btn-primary btn-glow btn-gform-submit">
                  ${evt.fee > 0 ? `Pay $${evt.fee} & Submit` : 'Submit'}
                </button>
                <button type="button" class="btn-text-clear" onclick="window.nexusApp.clearRegistrationForm()">
                  Clear form
                </button>
              </div>
              <button type="button" class="btn-text-cancel" onclick="window.nexusApp.closeModal()">
                Cancel
              </button>
            </div>
          </form>

        </div>
      </div>
    `;
  }

  clearRegistrationForm() {
    sound.playClick();
    this.registrationDraft = {
      leadName: '',
      leadEmail: '',
      leadPhone: '',
      collegeRoll: '',
      teamName: '',
      teamMembers: [{ name: '', role: 'Leader' }],
      answers: {}
    };
    this.renderRegistrationModal();
  }

  submitRegistrationForm() {
    sound.playClick();
    const evt = this.currentRegEvent;
    const name = document.getElementById('regName')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim();
    const roll = document.getElementById('regRoll')?.value.trim();
    const phone = document.getElementById('regPhone')?.value.trim();

    if (!name || !email || !roll) {
      alert('Please fill out all required fields.');
      return;
    }

    if (evt.isTeam) {
      const teamName = document.getElementById('regTeamName')?.value.trim();
      if (!teamName) {
        alert('Please enter your Team Name.');
        return;
      }
      this.registrationDraft.teamName = teamName;
    }

    this.registrationDraft.leadName = name;
    this.registrationDraft.leadEmail = email;
    this.registrationDraft.collegeRoll = roll;
    this.registrationDraft.leadPhone = phone;
    if (this.registrationDraft.teamMembers[0]) {
      this.registrationDraft.teamMembers[0].name = name;
    }

    // Check custom required fields
    for (const f of (evt.customFields || [])) {
      if (f.required && !this.registrationDraft.answers[f.id]) {
        const val = document.getElementById(f.id)?.value.trim();
        if (!val) {
          alert(`Please answer: "${f.label}"`);
          return;
        }
        this.registrationDraft.answers[f.id] = val;
      }
    }

    // Direct Pass Generation
    const txnId = evt.fee > 0 ? ('TXN-' + Math.floor(1000000000 + Math.random() * 9000000000)) : null;
    this.finishRegistration(txnId);
  }

  addTeammate() {
    sound.playClick();
    if (this.registrationDraft.teamMembers.length < this.currentRegEvent.maxTeam) {
      this.registrationDraft.teamMembers.push({ name: '', role: 'Member' });
      this.renderRegistrationModal();
    }
  }

  removeTeammate(idx) {
    sound.playClick();
    this.registrationDraft.teamMembers.splice(idx, 1);
    this.renderRegistrationModal();
  }

  updateTeammate(idx, field, value) {
    if (this.registrationDraft.teamMembers[idx]) {
      this.registrationDraft.teamMembers[idx][field] = value;
    }
  }

  updateAnswer(fieldId, value) {
    this.registrationDraft.answers[fieldId] = value;
  }

  simulatePaymentSuccess() {
    sound.playPassUnlocked();
    this.finishRegistration('TXN-' + Math.floor(1000000000 + Math.random() * 9000000000));
  }

  finishRegistration(txnId = null) {
    sound.playPassUnlocked();
    const evt = this.currentRegEvent;
    const ticketId = 'NX-' + evt.category.substring(0, 4).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);

    const newReg = {
      id: 'REG-' + Date.now().toString(36),
      ticketId,
      eventId: evt.id,
      eventTitle: evt.title,
      clubName: evt.clubName,
      leadName: this.registrationDraft.leadName,
      leadEmail: this.registrationDraft.leadEmail,
      leadPhone: this.registrationDraft.leadPhone,
      collegeRoll: this.registrationDraft.collegeRoll,
      teamName: evt.isTeam ? this.registrationDraft.teamName : null,
      teamMembers: evt.isTeam ? this.registrationDraft.teamMembers.filter(m => m.name.trim()) : [],
      answers: this.registrationDraft.answers,
      paymentStatus: evt.fee === 0 ? 'PAID_FREE' : 'VERIFIED',
      transactionId: txnId,
      amount: evt.fee,
      registeredAt: new Date().toISOString(),
      checkedIn: false,
      gate: null,
      passTier: evt.isTeam ? 'Team Pass' : 'VIP Pass'
    };

    db.addRegistration(newReg);
    this.updateHeroStats();

    // Show minted badge modal
    this.openBadgeModal(ticketId, true);
  }

  openBadgeModal(ticketId, isNewlyMinted = false) {
    sound.playPassUnlocked();
    const reg = db.getRegistrations().find(r => r.ticketId === ticketId);
    if (!reg) return;

    const modal = document.getElementById('globalModalContainer');
    if (!modal) return;

    modal.innerHTML = `
      <div class="modal-backdrop" onclick="if(event.target===this) window.nexusApp.closeModal()">
        <div class="modal-dialog modal-badge-dialog">
          <div class="badge-modal-top">
            <div>
              <h3>${isNewlyMinted ? '🎉 Registration Confirmed!' : '🎫 Holographic Campus Pass'}</h3>
              <p>${isNewlyMinted ? 'Your pass is cryptographically locked and ready for gate check-in.' : 'Official Attendee Credential'}</p>
            </div>
            <button class="modal-close-btn" onclick="window.nexusApp.closeModal()">✕</button>
          </div>

          <div class="badge-render-area">
            ${renderHolographicBadge(reg)}
          </div>

          <div class="badge-modal-controls">
            <button class="btn btn-primary" onclick="window.nexusApp.testGateScan('${reg.ticketId}')">
              ⚡ Test Check-in at Gate
            </button>
            <button class="btn btn-secondary" onclick="window.nexusApp.copyTicketId('${reg.ticketId}')">
              📋 Copy Pass ID
            </button>
            <button class="btn btn-secondary" onclick="window.print()">
              🖨️ Print / Save Pass
            </button>
          </div>
        </div>
      </div>
    `;
  }

  testGateScan(ticketId) {
    this.closeModal();
    this.switchTab('scanner');
    setTimeout(() => {
      window.gateScanner.processScan(ticketId);
    }, 400);
  }

  copyTicketId(ticketId) {
    sound.playClick();
    navigator.clipboard?.writeText(ticketId);
    alert(`Pass ID ${ticketId} copied to clipboard!`);
  }

  closeModal() {
    const modal = document.getElementById('globalModalContainer');
    if (modal) modal.innerHTML = '';
  }

  // Command Palette
  toggleCommandPalette() {
    sound.playClick();
    const cp = document.getElementById('commandPaletteModal');
    if (!cp) return;
    cp.classList.toggle('hidden');
    if (!cp.classList.contains('hidden')) {
      const input = document.getElementById('commandPaletteInput');
      if (input) {
        input.value = '';
        input.focus();
        this.renderCommandPaletteItems('');
      }
    }
  }

  closeCommandPalette() {
    const cp = document.getElementById('commandPaletteModal');
    if (cp) cp.classList.add('hidden');
  }

  renderCommandPaletteItems(query) {
    const list = document.getElementById('commandPaletteList');
    if (!list) return;

    const events = db.getEvents();
    const items = [
      { type: 'NAV', title: '🎪 Jump to Fest Arena', action: () => this.switchTab('arena') },
      { type: 'NAV', title: '🛠️ Open Form Studio ("Kill Google Forms")', action: () => this.switchTab('studio') },
      { type: 'NAV', title: '⚡ Open Gate Check-in Scanner', action: () => this.switchTab('scanner') },
      { type: 'NAV', title: '📊 Open Organizer Command Center', action: () => this.switchTab('admin') },
      ...events.map(e => ({
        type: 'EVENT',
        title: `Register: ${e.title} (${e.clubName})`,
        action: () => {
          this.switchTab('arena');
          this.startRegistration(e.id);
        }
      }))
    ];

    const q = query.toLowerCase();
    const filtered = items.filter(it => it.title.toLowerCase().includes(q));

    list.innerHTML = filtered.map((it, idx) => `
      <div class="cp-item" onclick="window.nexusApp.execPaletteAction(${idx})">
        <span class="cp-type">${it.type}</span>
        <span class="cp-title">${it.title}</span>
      </div>
    `).join('');

    this.currentPaletteItems = filtered;
  }

  execPaletteAction(idx) {
    sound.playClick();
    if (this.currentPaletteItems && this.currentPaletteItems[idx]) {
      this.closeCommandPalette();
      this.currentPaletteItems[idx].action();
    }
  }
}

// Global App Instance
window.addEventListener('DOMContentLoaded', () => {
  window.nexusApp = new NexusApp();
  window.nexusApp.init();
});
