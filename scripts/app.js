// Main Application Controller & Coordinator
import { db } from './data.js';
import { sound } from './sound.js';
import { NetworkCanvas } from './canvas.js';
import { FormBuilderStudio } from './formBuilder.js';
import { GateScannerTerminal } from './scanner.js';
import { AdminCommandCenter } from './analytics.js';
import { renderHolographicBadge } from './badges.js';

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
    window.formStudio = new FormBuilderStudio('fbStudioContainer', 'fbPhonePreview');
    window.gateScanner = new GateScannerTerminal('scannerContainer');
    window.adminCenter = new AdminCommandCenter('adminContainer');

    this.bindEvents();
    this.renderFestArena();
    this.updateAnnouncementTicker();
    this.updateHeroStats();

    // Init submodules
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
    const totalRegs = registrations.length;
    const checkedIn = registrations.filter(r => r.checkedIn).length;

    const statRegEl = document.getElementById('heroStatRegs');
    const statEventsEl = document.getElementById('heroStatEvents');
    const statRateEl = document.getElementById('heroStatRate');

    if (statRegEl) statRegEl.textContent = totalRegs.toLocaleString();
    if (statEventsEl) statEventsEl.textContent = events.length.toString();
    if (statRateEl) {
      const rate = totalRegs > 0 ? Math.round((checkedIn / totalRegs) * 100) : 0;
      statRateEl.textContent = `${rate}%`;
    }
  }

  updateAnnouncementTicker() {
    const ticker = document.getElementById('heroAnnouncementTicker');
    if (!ticker) return;
    const anns = db.state.announcements || [];
    if (anns.length === 0) return;

    ticker.innerHTML = anns.map(a => `
      <div class="ticker-item">
        <span class="ticker-badge" style="color: ${a.color}; border-color: ${a.color}44;">● ${a.tag}</span>
        <strong>${a.title}</strong>: ${a.message}
      </div>
    `).join(' • ');
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

    this.currentRegEvent = event;
    this.regStep = 1;
    this.registrationDraft = {
      leadName: '',
      leadEmail: '',
      leadPhone: '',
      collegeRoll: '',
      teamName: '',
      teamMembers: [{ name: '', role: 'Team Captain / Lead' }],
      answers: {}
    };

    this.renderRegistrationModal();
  }

  renderRegistrationModal() {
    const modal = document.getElementById('globalModalContainer');
    if (!modal) return;
    const evt = this.currentRegEvent;

    let stepContent = '';

    if (this.regStep === 1) {
      // Step 1: Attendee / Team Lead Info
      stepContent = `
        <div class="reg-step-box">
          <div class="step-indicator">Step 1 of 4: Primary Attendee Information</div>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Full Name <span class="req">*</span></label>
              <input type="text" id="regName" class="form-input" value="${this.registrationDraft.leadName}" placeholder="e.g. Alex Morgan" required />
            </div>
            <div class="form-group">
              <label class="form-label">Campus Email Address <span class="req">*</span></label>
              <input type="email" id="regEmail" class="form-input" value="${this.registrationDraft.leadEmail}" placeholder="alex@campus.edu" required />
            </div>
            <div class="form-group">
              <label class="form-label">Student Roll / ID Number <span class="req">*</span></label>
              <input type="text" id="regRoll" class="form-input" value="${this.registrationDraft.collegeRoll}" placeholder="2024-CS-042" required />
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number (SMS Gate Pass) <span class="req">*</span></label>
              <input type="tel" id="regPhone" class="form-input" value="${this.registrationDraft.leadPhone}" placeholder="+1 (555) 019-2834" required />
            </div>
          </div>
        </div>
      `;
    } else if (this.regStep === 2) {
      // Step 2: Team Roster (or skip if solo)
      if (evt.isTeam) {
        const membersHtml = this.registrationDraft.teamMembers.map((m, idx) => `
          <div class="team-member-row">
            <div class="tm-num">#${idx + 1}</div>
            <input type="text" class="form-input tm-name" placeholder="Teammate Full Name" value="${m.name}"
              onchange="window.nexusApp.updateTeammate(${idx}, 'name', this.value)" />
            <input type="text" class="form-input tm-role" placeholder="Role (e.g. Frontend, Driver, Pitcher)" value="${m.role}"
              onchange="window.nexusApp.updateTeammate(${idx}, 'role', this.value)" />
            ${idx > 0 ? `<button class="btn-remove-tm" onclick="window.nexusApp.removeTeammate(${idx})">✕</button>` : ''}
          </div>
        `).join('');

        stepContent = `
          <div class="reg-step-box">
            <div class="step-indicator">Step 2 of 4: Dynamic Team Roster Engine</div>
            <p class="step-subtext">Eliminates Google Forms teammate chaos. Team lead generates ticket and assigns roster seats.</p>

            <div class="form-group">
              <label class="form-label">Team Codename / Organization <span class="req">*</span></label>
              <input type="text" id="regTeamName" class="form-input" value="${this.registrationDraft.teamName}" placeholder="e.g. CyberValkyrie" required />
            </div>

            <div class="team-members-header">
              <label class="form-label">Teammate Roster (${this.registrationDraft.teamMembers.length} / max ${evt.maxTeam})</label>
              ${this.registrationDraft.teamMembers.length < evt.maxTeam ? `
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.nexusApp.addTeammate()">+ Add Teammate</button>
              ` : ''}
            </div>

            <div class="team-members-list">
              ${membersHtml}
            </div>
          </div>
        `;
      } else {
        // Solo event notice
        stepContent = `
          <div class="reg-step-box">
            <div class="step-indicator">Step 2 of 4: Solo Entry Confirmation</div>
            <div class="solo-confirmation-card">
              <div class="sc-icon">👤</div>
              <h4>Individual Participation Confirmed</h4>
              <p>This event is designed for individual solo creators. Your entry badge will be issued directly to your primary student ID.</p>
            </div>
          </div>
        `;
      }
    } else if (this.regStep === 3) {
      // Step 3: Event-specific custom fields from the dynamic schema
      const customInputs = (evt.customFields || []).map(f => {
        let inputEl = '';
        const savedVal = this.registrationDraft.answers[f.id] || '';

        if (f.type === 'select') {
          inputEl = `
            <select id="${f.id}" class="form-input" onchange="window.nexusApp.updateAnswer('${f.id}', this.value)">
              <option value="">Select an option...</option>
              ${(f.options || []).map(opt => `<option value="${opt}" ${savedVal === opt ? 'selected' : ''}>${opt}</option>`).join('')}
            </select>
          `;
        } else if (f.type === 'radio') {
          inputEl = `
            <div class="form-radios">
              ${(f.options || []).map(opt => `
                <label class="radio-label">
                  <input type="radio" name="${f.id}" value="${opt}" ${savedVal === opt ? 'checked' : ''}
                    onchange="window.nexusApp.updateAnswer('${f.id}', this.value)" />
                  <span>${opt}</span>
                </label>
              `).join('')}
            </div>
          `;
        } else {
          inputEl = `
            <input type="${f.type === 'url' ? 'url' : 'text'}" id="${f.id}" class="form-input" 
              placeholder="${f.placeholder || ''}" value="${savedVal}"
              oninput="window.nexusApp.updateAnswer('${f.id}', this.value)" />
          `;
        }

        return `
          <div class="form-group">
            <label class="form-label">${f.label} ${f.required ? '<span class="req">*</span>' : ''}</label>
            ${inputEl}
          </div>
        `;
      }).join('');

      stepContent = `
        <div class="reg-step-box">
          <div class="step-indicator">Step 3 of 4: Event-Specific Requirements</div>
          <p class="step-subtext">Dynamic questions powered by Nexus Form Engine.</p>
          <div class="custom-fields-stack">
            ${customInputs}
          </div>
        </div>
      `;
    } else if (this.regStep === 4) {
      // Step 4: Verification & Payment (if paid) / Instant Confirmation
      if (evt.fee > 0) {
        stepContent = `
          <div class="reg-step-box">
            <div class="step-indicator">Step 4 of 4: Anti-Fraud Automated Payment</div>
            <div class="payment-mock-container">
              <div class="pm-qr-col">
                <div class="pm-qr-placeholder">
                  <div class="pm-qr-symbol">⚡</div>
                  <div class="pm-upi-id">campus-ops@upi</div>
                  <div class="pm-amount">$${evt.fee}.00 USD</div>
                </div>
              </div>
              <div class="pm-info-col">
                <div class="pm-badge">ZERO SCREENSHOT FRAUD</div>
                <h4>Instant Gateway Simulation</h4>
                <p>Google Forms forces treasurers to manually verify hundreds of blurry payment screenshots. Nexus Ops simulates immediate webhook verification.</p>
                <div class="pm-action-box">
                  <button type="button" class="btn btn-primary btn-glow btn-block" onclick="window.nexusApp.simulatePaymentSuccess()">
                    💳 Authorize Demo Payment ($${evt.fee})
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      } else {
        stepContent = `
          <div class="reg-step-box">
            <div class="step-indicator">Step 4 of 4: Free Admission Tier</div>
            <div class="free-tier-card">
              <div class="ft-icon">🎟️</div>
              <h4>Complimentary Student Pass</h4>
              <p>This event is fully sponsored by <strong>${evt.clubName}</strong>. Zero payment required. Your cryptographic pass is ready to mint!</p>
              <button type="button" class="btn btn-primary btn-glow btn-block" onclick="window.nexusApp.finishRegistration()">
                ✨ Mint My Holographic E-Pass
              </button>
            </div>
          </div>
        `;
      }
    }

    modal.innerHTML = `
      <div class="modal-backdrop" onclick="if(event.target===this) window.nexusApp.closeModal()">
        <div class="modal-dialog modal-md">
          <div class="modal-header">
            <div>
              <span class="modal-club-tag">${evt.title}</span>
              <h2 class="modal-title">Smart Registration</h2>
            </div>
            <button class="modal-close-btn" onclick="window.nexusApp.closeModal()">✕</button>
          </div>

          <div class="modal-body">
            <!-- Step Progress Track -->
            <div class="step-progress-track">
              <div class="step-node ${this.regStep >= 1 ? 'active' : ''}">1. Details</div>
              <div class="step-node ${this.regStep >= 2 ? 'active' : ''}">2. Team</div>
              <div class="step-node ${this.regStep >= 3 ? 'active' : ''}">3. Custom</div>
              <div class="step-node ${this.regStep >= 4 ? 'active' : ''}">4. Mint Pass</div>
            </div>

            ${stepContent}
          </div>

          <div class="modal-footer">
            ${this.regStep > 1 && this.regStep < 4 ? `
              <button class="btn btn-secondary" onclick="window.nexusApp.prevStep()">&larr; Back</button>
            ` : `
              <button class="btn btn-secondary" onclick="window.nexusApp.closeModal()">Cancel</button>
            `}
            ${this.regStep < 4 ? `
              <button class="btn btn-primary" onclick="window.nexusApp.nextStep()">Next Step &rarr;</button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  nextStep() {
    sound.playClick();
    if (this.regStep === 1) {
      const name = document.getElementById('regName')?.value.trim();
      const email = document.getElementById('regEmail')?.value.trim();
      const roll = document.getElementById('regRoll')?.value.trim();
      const phone = document.getElementById('regPhone')?.value.trim();

      if (!name || !email || !roll) {
        alert('Please fill in required fields: Name, Campus Email, and Student ID.');
        return;
      }
      this.registrationDraft.leadName = name;
      this.registrationDraft.leadEmail = email;
      this.registrationDraft.collegeRoll = roll;
      this.registrationDraft.leadPhone = phone;
      if (this.registrationDraft.teamMembers[0]) {
        this.registrationDraft.teamMembers[0].name = name;
      }
    } else if (this.regStep === 2) {
      if (this.currentRegEvent.isTeam) {
        const teamName = document.getElementById('regTeamName')?.value.trim();
        if (!teamName) {
          alert('Please provide a team codename.');
          return;
        }
        this.registrationDraft.teamName = teamName;
      }
    }

    this.regStep++;
    this.renderRegistrationModal();
  }

  prevStep() {
    sound.playClick();
    this.regStep--;
    this.renderRegistrationModal();
  }

  addTeammate() {
    sound.playClick();
    if (this.registrationDraft.teamMembers.length < this.currentRegEvent.maxTeam) {
      this.registrationDraft.teamMembers.push({ name: '', role: 'Engineer / Member' });
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
