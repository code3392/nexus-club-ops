// Dynamic Form Builder Studio ("Google Forms Killer")
import { db } from './data.js';
import { sound } from './sound.js';
import { auth } from './auth.js';

export class FormBuilderStudio {
  constructor(containerId, previewPhoneId) {
    this.container = document.getElementById(containerId);
    this.phonePreview = document.getElementById(previewPhoneId);
    this.editingEventId = null;

    this.defaultSchema = {
      eventTitle: 'Annual Campus Hackathon 2026',
      headline: 'Annual Campus Hackathon 2026 Registration',
      description: 'Join the premier 24-hour innovation sprint. Build AI agents, smart tools, or creative prototypes with fellow innovators.',
      festId: 'fest-techcarnival-2026',
      category: 'hackathon',
      clubName: 'Campus Tech Society',
      date: 'Nov 14 - 15, 2026',
      venue: 'Campus Central Auditorium',
      prizePool: '$2,500',
      fee: 0,
      capacity: 60,
      isTeam: true,
      minTeam: 2,
      maxTeam: 4,
      isExpired: false,
      expiryDate: '2026-11-12T23:59',
      gates: [
        { id: 'gate_1', name: 'Main Auditorium Entrance' },
        { id: 'gate_2', name: 'East Side Hall Entrance' }
      ],
      fields: [
        {
          id: 'field_1',
          label: 'Primary Project Track',
          type: 'select',
          options: ['AI & Machine Learning', 'Web & Cloud Solutions', 'Open Innovation'],
          required: true
        },
        {
          id: 'field_2',
          label: 'GitHub / Portfolio URL',
          type: 'url',
          placeholder: 'https://github.com/your-username',
          required: false
        }
      ]
    };

    this.currentSchema = JSON.parse(JSON.stringify(this.defaultSchema));
  }

  init() {
    this.renderStudio();
    this.renderPhonePreview();
  }

  // Requirement 8: Load an existing form for editing
  loadEventForEditing(eventId) {
    const event = (db.getEvents ? db.getEvents() : []).find(e => e.id === eventId);
    if (!event) return;

    this.editingEventId = eventId;
    this.currentSchema = {
      eventTitle: event.title || '',
      headline: event.headline || event.title || '',
      description: event.description || '',
      festId: event.festId || 'fest-techcarnival-2026',
      category: event.category || 'tech',
      clubName: event.clubName || 'Campus Tech Society',
      date: event.date || '',
      venue: event.venue || '',
      prizePool: event.prizePool || '$0',
      fee: event.fee || 0,
      capacity: event.capacity || 50,
      isTeam: Boolean(event.isTeam),
      minTeam: event.minTeam || (event.isTeam ? 2 : 1),
      maxTeam: event.maxTeam || (event.isTeam ? 4 : 1),
      isExpired: Boolean(event.isExpired),
      expiryDate: event.expiryDate || '',
      gates: (event.gates && event.gates.length > 0)
        ? JSON.parse(JSON.stringify(event.gates))
        : [
            { id: 'gate_1', name: 'Main Gate' },
            { id: 'gate_2', name: 'West Gate' }
          ],
      fields: event.customFields ? JSON.parse(JSON.stringify(event.customFields)) : []
    };

    this.renderStudio();
    this.renderPhonePreview();
  }

  cancelEdit() {
    this.editingEventId = null;
    this.currentSchema = JSON.parse(JSON.stringify(this.defaultSchema));
    this.renderStudio();
    this.renderPhonePreview();
  }

  // Requirement 3: Gate customization methods
  addGate() {
    const newId = 'gate_' + Date.now();
    const count = (this.currentSchema.gates || []).length + 1;
    if (!this.currentSchema.gates) this.currentSchema.gates = [];
    this.currentSchema.gates.push({
      id: newId,
      name: `Gate ${count} Entrance`
    });
    this.renderStudio();
  }

  removeGate(gateId) {
    if ((this.currentSchema.gates || []).length <= 1) {
      alert('At least one gate must be configured for check-in.');
      return;
    }
    this.currentSchema.gates = this.currentSchema.gates.filter(g => g.id !== gateId);
    this.renderStudio();
  }

  updateGate(gateId, newName) {
    const g = (this.currentSchema.gates || []).find(gate => gate.id === gateId);
    if (g) {
      g.name = newName;
    }
  }

  // Question builder methods
  addField(type) {
    const id = 'field_' + Date.now();
    let newField = {
      id,
      label: 'New ' + type.charAt(0).toUpperCase() + type.slice(1) + ' Question',
      type,
      required: true
    };

    if (type === 'select' || type === 'radio') {
      newField.options = ['Option Alpha', 'Option Beta', 'Option Gamma'];
    } else if (type === 'url') {
      newField.placeholder = 'https://...';
    } else {
      newField.placeholder = 'Enter response...';
    }

    this.currentSchema.fields.push(newField);
    this.renderStudio();
    this.renderPhonePreview();
  }

  removeField(fieldId) {
    this.currentSchema.fields = this.currentSchema.fields.filter(f => f.id !== fieldId);
    this.renderStudio();
    this.renderPhonePreview();
  }

  updateField(fieldId, key, value) {
    const field = this.currentSchema.fields.find(f => f.id === fieldId);
    if (field) {
      field[key] = value;
      this.renderPhonePreview();
    }
  }

  updateMeta(key, value) {
    this.currentSchema[key] = value;
    this.renderPhonePreview();
  }

  updateOptions(fieldId, rawStr) {
    const field = this.currentSchema.fields.find(f => f.id === fieldId);
    if (field) {
      field.options = rawStr.split(',').map(s => s.trim()).filter(Boolean);
      this.renderPhonePreview();
    }
  }

  toggleFormExpiry() {
    this.currentSchema.isExpired = !this.currentSchema.isExpired;
    this.renderStudio();
    this.renderPhonePreview();
  }

  renderStudio() {
    if (!this.container) return;

    const currentUser = auth.currentUser;

    // Requirement 10: Enforce login notice
    let authNotice = '';
    if (!currentUser) {
      authNotice = `
        <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <span style="font-size:1.5rem;">🔐</span>
            <div>
              <strong style="color:#f87171; display:block; font-size:0.95rem;">Sign In Required to Create Forms</strong>
              <span style="color:#d1d5db; font-size:0.85rem;">You must be logged in so only you can scan and manage registrations for your events.</span>
            </div>
          </div>
          <button class="btn btn-sm btn-primary" onclick="window.authSystem.openAuthModal('signin', 'Sign in to create or edit registration forms')">
            Sign In / Sign Up &rarr;
          </button>
        </div>
      `;
    }

    const editBanner = this.editingEventId ? `
      <div style="background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.4); border-radius: 10px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between;">
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <span style="font-size:1.4rem;">✏️</span>
          <div>
            <strong style="color:#a5b4fc; font-size:1rem;">Editing Form: ${this.currentSchema.eventTitle}</strong>
            <span style="display:block; color:#9ca3af; font-size:0.82rem;">Updates will take effect immediately across attendee registration and gates.</span>
          </div>
        </div>
        <button class="btn btn-sm btn-secondary" onclick="window.formStudio.cancelEdit()">Cancel Edit</button>
      </div>
    ` : '';

    const gatesHtml = (this.currentSchema.gates || []).map((g, idx) => `
      <div class="fb-gate-row" style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.6rem;">
        <span style="font-size: 0.82rem; font-weight: 700; color: #818cf8; width: 65px;">Gate ${idx + 1}:</span>
        <input type="text" class="fb-input" style="flex: 1;" value="${g.name}" 
          placeholder="e.g. Main Auditorium Entrance"
          oninput="window.formStudio.updateGate('${g.id}', this.value)" />
        <button type="button" class="fb-btn-remove" style="padding: 6px 10px;" 
          onclick="window.formStudio.removeGate('${g.id}')" title="Delete Gate">
          ✕
        </button>
      </div>
    `).join('');

    const fieldsHtml = this.currentSchema.fields.map((f, idx) => {
      let optionsEditor = '';
      if (f.type === 'select' || f.type === 'radio') {
        optionsEditor = `
          <div class="fb-field-options">
            <label class="fb-sublabel">Options (comma separated)</label>
            <input type="text" class="fb-input" value="${(f.options || []).join(', ')}"
              onchange="window.formStudio.updateOptions('${f.id}', this.value)" />
          </div>
        `;
      }

      return `
        <div class="fb-field-card" data-id="${f.id}">
          <div class="fb-field-card-header">
            <span class="fb-field-drag-badge">Question ${idx + 1} • ${f.type.toUpperCase()}</span>
            <button class="fb-btn-remove" onclick="window.formStudio.removeField('${f.id}')" title="Delete">
              ✕ Delete
            </button>
          </div>
          <div class="fb-field-body">
            <div class="fb-row">
              <div class="fb-col">
                <label class="fb-sublabel">Question Label</label>
                <input type="text" class="fb-input" value="${f.label}" 
                  oninput="window.formStudio.updateField('${f.id}', 'label', this.value)" />
              </div>
              <div class="fb-col fb-col-check">
                <label class="fb-sublabel">Required</label>
                <label class="fb-toggle-switch">
                  <input type="checkbox" ${f.required ? 'checked' : ''} 
                    onchange="window.formStudio.updateField('${f.id}', 'required', this.checked)">
                  <span class="fb-toggle-slider"></span>
                </label>
              </div>
            </div>
            ${optionsEditor}
          </div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="fb-studio-wrapper">
        ${authNotice}
        ${editBanner}

        <!-- Requirement 7: Form Headline, Description & Core Details -->
        <div class="fb-meta-section">
          <div class="fb-section-title">
            <span>📝 Form Headline & Description</span>
          </div>

          <div style="margin-bottom: 1.25rem;">
            <label class="fb-label">Form Headline / Title <span class="req">*</span></label>
            <input type="text" id="fbMetaTitle" class="fb-input" value="${this.currentSchema.headline || this.currentSchema.eventTitle}"
              placeholder="e.g. Annual Campus Hackathon 2026 Registration"
              oninput="window.formStudio.updateMeta('eventTitle', this.value); window.formStudio.updateMeta('headline', this.value);">
          </div>

          <div style="margin-bottom: 1.25rem;">
            <label class="fb-label">Form Description / Instructions <span class="req">*</span></label>
            <textarea id="fbMetaDesc" class="fb-input" rows="3" style="resize: vertical;"
              placeholder="Provide event details, eligibility, schedule highlights, rules, and what attendees should bring..."
              oninput="window.formStudio.updateMeta('description', this.value)">${this.currentSchema.description || ''}</textarea>
          </div>

          <div class="fb-grid-2">
            <div>
              <label class="fb-label">Belonging Fest / Carnival</label>
              <select id="fbMetaFest" class="fb-input" onchange="window.formStudio.updateMeta('festId', this.value)">
                ${(db.getFests ? db.getFests() : []).map(f => `<option value="${f.id}" ${f.id === (this.currentSchema.festId || 'fest-techcarnival-2026') ? 'selected' : ''}>${f.title}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="fb-label">Host Organization / Club Name</label>
              <input type="text" id="fbMetaClub" class="fb-input" 
                placeholder="e.g. Campus Tech Society, Robotics Guild" 
                value="${this.currentSchema.clubName || ''}"
                oninput="window.formStudio.updateMeta('clubName', this.value)">
            </div>
            <div>
              <label class="fb-label">Event Date & Time</label>
              <input type="text" class="fb-input" value="${this.currentSchema.date || ''}"
                placeholder="e.g. Nov 14, 2026 • 10:00 AM"
                oninput="window.formStudio.updateMeta('date', this.value)">
            </div>
            <div>
              <label class="fb-label">Venue / Hall Location</label>
              <input type="text" class="fb-input" value="${this.currentSchema.venue || ''}"
                placeholder="e.g. Campus Central Auditorium"
                oninput="window.formStudio.updateMeta('venue', this.value)">
            </div>
            <div>
              <label class="fb-label">Seat Capacity Limit</label>
              <input type="number" class="fb-input" value="${this.currentSchema.capacity}" min="1" max="1000"
                oninput="window.formStudio.updateMeta('capacity', parseInt(this.value) || 50)">
            </div>
            <div>
              <label class="fb-label">Entry Fee ($0 for Free)</label>
              <input type="number" class="fb-input" value="${this.currentSchema.fee}" min="0" max="500"
                oninput="window.formStudio.updateMeta('fee', parseFloat(this.value) || 0)">
            </div>
            <div>
              <label class="fb-label">Prize Pool / Awards</label>
              <input type="text" class="fb-input" value="${this.currentSchema.prizePool || ''}"
                placeholder="e.g. $1,500 + Trophies"
                oninput="window.formStudio.updateMeta('prizePool', this.value)">
            </div>
            <div>
              <label class="fb-label">Category</label>
              <select class="fb-input" onchange="window.formStudio.updateMeta('category', this.value)">
                <option value="hackathon" ${this.currentSchema.category === 'hackathon' ? 'selected' : ''}>Hackathon</option>
                <option value="programming" ${this.currentSchema.category === 'programming' ? 'selected' : ''}>Programming</option>
                <option value="robotics" ${this.currentSchema.category === 'robotics' ? 'selected' : ''}>Robotics</option>
                <option value="ai" ${this.currentSchema.category === 'ai' ? 'selected' : ''}>AI & Web</option>
                <option value="gaming" ${this.currentSchema.category === 'gaming' ? 'selected' : ''}>Gaming</option>
                <option value="workshop" ${this.currentSchema.category === 'workshop' ? 'selected' : ''}>Workshop</option>
                <option value="quiz" ${this.currentSchema.category === 'quiz' ? 'selected' : ''}>Quiz / Olympiad</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Requirement 9: Team Type & Custom Member Limits -->
        <div class="fb-meta-section">
          <div class="fb-section-title">
            <span>👥 Team Configuration (Customize Member Numbers)</span>
          </div>
          <div class="fb-grid-2">
            <div>
              <label class="fb-label">Participation Type</label>
              <select class="fb-input" onchange="window.formStudio.updateMeta('isTeam', this.value === 'true')">
                <option value="false" ${!this.currentSchema.isTeam ? 'selected' : ''}>Solo / Individual Only</option>
                <option value="true" ${this.currentSchema.isTeam ? 'selected' : ''}>Team Registration</option>
              </select>
            </div>
            ${this.currentSchema.isTeam ? `
              <div style="display: flex; gap: 0.75rem;">
                <div style="flex:1;">
                  <label class="fb-label">Min Team Members</label>
                  <input type="number" class="fb-input" min="1" max="20" 
                    value="${this.currentSchema.minTeam || 2}"
                    oninput="window.formStudio.updateMeta('minTeam', parseInt(this.value) || 1)" />
                </div>
                <div style="flex:1;">
                  <label class="fb-label">Max Team Members</label>
                  <input type="number" class="fb-input" min="1" max="20" 
                    value="${this.currentSchema.maxTeam || 4}"
                    oninput="window.formStudio.updateMeta('maxTeam', parseInt(this.value) || 1)" />
                </div>
              </div>
            ` : `
              <div style="display:flex; align-items:center; color:var(--text-muted); font-size:0.88rem; padding-top:1.5rem;">
                ℹ️ Each registrant registers individually (1 member per pass).
              </div>
            `}
          </div>
        </div>

        <!-- Requirement 3: Gate Customization -->
        <div class="fb-meta-section">
          <div class="fb-section-title" style="display:flex; justify-content:space-between; align-items:center;">
            <span>🚪 Custom Gate Checkpoints (${(this.currentSchema.gates || []).length} Gates)</span>
            <button type="button" class="btn btn-sm btn-secondary" onclick="window.formStudio.addGate()">
              + Add Gate Checkpoint
            </button>
          </div>
          <p style="color:var(--text-muted); font-size:0.84rem; margin-bottom:1rem;">
            Customize how many entrance gates this event has and edit their exact checkpoint names. Only you will be able to operate scanners for these gates.
          </p>
          <div class="fb-gates-list">
            ${gatesHtml}
          </div>
        </div>

        <!-- Requirement 6: Form Expiry Controls -->
        <div class="fb-meta-section">
          <div class="fb-section-title">
            <span>⏰ Form Expiry & Status Controls</span>
          </div>
          <div class="fb-grid-2">
            <div>
              <label class="fb-label">Registration Expiry / Deadline</label>
              <input type="datetime-local" class="fb-input" 
                value="${this.currentSchema.expiryDate || ''}"
                oninput="window.formStudio.updateMeta('expiryDate', this.value)" />
            </div>
            <div>
              <label class="fb-label">Instant Expiry / Close Button</label>
              <button type="button" 
                class="btn ${this.currentSchema.isExpired ? 'btn-danger' : 'btn-primary'} btn-block" 
                style="height: 42px; display:flex; align-items:center; justify-content:center; gap:0.5rem;"
                onclick="window.formStudio.toggleFormExpiry()">
                ${this.currentSchema.isExpired ? '🔴 Form is EXPIRED (Click to Reopen)' : '🟢 Form is ACTIVE (Click to Expire Now)'}
              </button>
            </div>
          </div>
        </div>

        <!-- Dynamic Questions Section -->
        <div class="fb-fields-section">
          <div class="fb-fields-header">
            <div class="fb-section-title">
              <span>Dynamic Form Questions (${this.currentSchema.fields.length})</span>
            </div>
            <div class="fb-add-field-bar">
              <span class="fb-add-label">+ Add Question:</span>
              <button class="fb-chip" onclick="window.formStudio.addField('text')">Short Text</button>
              <button class="fb-chip" onclick="window.formStudio.addField('select')">Dropdown</button>
              <button class="fb-chip" onclick="window.formStudio.addField('radio')">Multiple Choice</button>
              <button class="fb-chip" onclick="window.formStudio.addField('url')">Link / URL</button>
            </div>
          </div>

          <div class="fb-fields-list">
            ${fieldsHtml}
          </div>
        </div>

        <!-- Deploy / Save Button -->
        <div class="fb-deploy-box">
          <button class="btn btn-primary btn-glow btn-lg" onclick="window.formStudio.deployForm()">
            ${this.editingEventId ? '💾 Save & Update Form' : '🚀 Publish Registration Form'}
          </button>
        </div>
      </div>
    `;
  }

  renderPhonePreview() {
    if (!this.phonePreview) return;

    const fieldsHtml = this.currentSchema.fields.map(f => {
      let inputMarkup = '';
      if (f.type === 'select') {
        inputMarkup = `
          <select class="phone-input">
            <option value="">Select option...</option>
            ${(f.options || []).map(opt => `<option>${opt}</option>`).join('')}
          </select>
        `;
      } else if (f.type === 'radio') {
        inputMarkup = `
          <div class="phone-radios">
            ${(f.options || []).map((opt, i) => `
              <label class="phone-radio-label">
                <input type="radio" name="${f.id}" ${i === 0 ? 'checked' : ''}/>
                <span>${opt}</span>
              </label>
            `).join('')}
          </div>
        `;
      } else {
        inputMarkup = `<input type="${f.type === 'url' ? 'url' : 'text'}" class="phone-input" placeholder="${f.placeholder || ''}" />`;
      }

      return `
        <div class="phone-field-group">
          <label class="phone-field-label">
            ${f.label} ${f.required ? '<span class="req">*</span>' : ''}
          </label>
          ${inputMarkup}
        </div>
      `;
    }).join('');

    const gatesPreview = (this.currentSchema.gates || []).map(g => `<span class="fest-event-mini-pill" style="font-size:0.65rem;">🚪 ${g.name}</span>`).join(' ');

    this.phonePreview.innerHTML = `
      <div class="phone-device-bezel">
        <div class="phone-notch"></div>
        <div class="phone-screen">
          <div class="phone-status-bar">
            <span>9:41</span>
            <span>5G • 100%</span>
          </div>

          <div class="phone-app-header">
            <div class="phone-event-badge">${(this.currentSchema.clubName || 'STUDENT ORGANIZATION').toUpperCase()}</div>
            <div class="phone-event-title">${this.currentSchema.headline || this.currentSchema.eventTitle}</div>
            <div class="phone-event-meta">
              <span>🎟️ Capacity: ${this.currentSchema.capacity} slots</span>
              <span>💵 ${this.currentSchema.fee === 0 ? 'Free Entry' : '$' + this.currentSchema.fee}</span>
            </div>
            ${this.currentSchema.isExpired ? `
              <div style="background:#ef4444; color:#fff; font-size:0.7rem; font-weight:700; padding:3px 8px; border-radius:4px; margin-top:5px; text-align:center;">
                ⛔ REGISTRATION EXPIRED
              </div>
            ` : ''}
          </div>

          <div class="phone-content-scroll">
            <div class="phone-info-card">
              <span class="phone-card-icon">⚡</span>
              <div>
                <strong>${this.currentSchema.isTeam ? `Team (${this.currentSchema.minTeam}-${this.currentSchema.maxTeam} members)` : 'Solo Registration'}</strong>
                <p>${(this.currentSchema.description || 'Fill out the form below to secure your holographic attendee pass.').substring(0, 100)}...</p>
                <div style="margin-top:6px; display:flex; flex-wrap:wrap; gap:4px;">
                  ${gatesPreview}
                </div>
              </div>
            </div>

            <form class="phone-live-form" onsubmit="event.preventDefault()">
              <div class="phone-field-group">
                <label class="phone-field-label">Full Name <span class="req">*</span></label>
                <input type="text" class="phone-input" value="Campus Member" />
              </div>
              <div class="phone-field-group">
                <label class="phone-field-label">Campus Email <span class="req">*</span></label>
                <input type="email" class="phone-input" value="member@campus.edu" />
              </div>

              ${this.currentSchema.isTeam ? `
                <div class="phone-field-group">
                  <label class="phone-field-label">Team Name (${this.currentSchema.minTeam}-${this.currentSchema.maxTeam} members) <span class="req">*</span></label>
                  <input type="text" class="phone-input" value="Team Alpha" />
                </div>
              ` : ''}

              <!-- Dynamic Fields -->
              ${fieldsHtml}

              <button class="phone-submit-btn" type="button" ${this.currentSchema.isExpired ? 'disabled style="opacity:0.5;"' : ''}>
                ${this.currentSchema.isExpired ? 'Registration Closed' : 'Get Digital Pass & QR →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  // Requirement 10: Require login to publish/edit
  deployForm() {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      auth.requireAuth(() => this.deployForm(), 'You must be logged in to create or publish a registration form.');
      return;
    }

    if (!this.currentSchema.eventTitle || !this.currentSchema.eventTitle.trim()) {
      alert('Please enter a Form Headline / Event Title.');
      return;
    }

    const clubName = (this.currentSchema.clubName && this.currentSchema.clubName.trim())
      ? this.currentSchema.clubName.trim()
      : 'Campus Organization';
    const clubId = 'club-' + clubName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'club-custom';

    if (db.addClub) {
      db.addClub({
        id: clubId,
        name: clubName,
        badge: 'Campus Org',
        color: '#6366f1',
        lead: currentUser.name,
        icon: '🏛️',
        activeEvents: 1,
        members: 50
      });
    }

    const fests = db.getFests ? db.getFests() : [];
    const fest = fests.find(f => f.id === this.currentSchema.festId) || fests[0];
    const festId = fest ? fest.id : 'fest-techcarnival-2026';
    const festName = fest ? fest.shortName : 'Tech Carnival 2026';

    const gates = (this.currentSchema.gates && this.currentSchema.gates.length > 0)
      ? this.currentSchema.gates
      : [
          { id: 'gate_1', name: 'Main Gate' }
        ];

    // Check if updating existing event (Requirement 8)
    if (this.editingEventId) {
      const updatedFields = {
        title: this.currentSchema.eventTitle,
        headline: this.currentSchema.headline || this.currentSchema.eventTitle,
        description: this.currentSchema.description || '',
        festId: festId,
        festName: festName,
        clubName: clubName,
        category: this.currentSchema.category || 'tech',
        date: this.currentSchema.date || 'Upcoming Fest Date',
        venue: this.currentSchema.venue || 'Campus Central Auditorium',
        prizePool: this.currentSchema.prizePool || '$500',
        fee: this.currentSchema.fee || 0,
        isTeam: Boolean(this.currentSchema.isTeam),
        minTeam: this.currentSchema.isTeam ? (this.currentSchema.minTeam || 2) : 1,
        maxTeam: this.currentSchema.isTeam ? (this.currentSchema.maxTeam || 4) : 1,
        capacity: this.currentSchema.capacity || 50,
        isExpired: Boolean(this.currentSchema.isExpired),
        expiryDate: this.currentSchema.expiryDate || '',
        gates: gates,
        customFields: this.currentSchema.fields
      };

      db.updateEvent(this.editingEventId, updatedFields);
      this.editingEventId = null;

      // Toast notification
      this.showToast('Registration Form Updated!', `"${updatedFields.title}" has been successfully saved.`);
    } else {
      // Create new event
      const newEvent = {
        id: 'evt-' + Date.now().toString(36),
        festId: festId,
        festName: festName,
        clubId: clubId,
        title: this.currentSchema.eventTitle,
        headline: this.currentSchema.headline || this.currentSchema.eventTitle,
        description: this.currentSchema.description || '',
        category: this.currentSchema.category || 'tech',
        clubName: clubName,
        badge: 'Campus Event',
        tagline: this.currentSchema.headline || this.currentSchema.eventTitle,
        date: this.currentSchema.date || 'Upcoming Fest Date',
        venue: this.currentSchema.venue || 'Campus Central Auditorium',
        prizePool: this.currentSchema.prizePool || '$500',
        fee: this.currentSchema.fee || 0,
        isTeam: Boolean(this.currentSchema.isTeam),
        minTeam: this.currentSchema.isTeam ? (this.currentSchema.minTeam || 2) : 1,
        maxTeam: this.currentSchema.isTeam ? (this.currentSchema.maxTeam || 4) : 1,
        capacity: this.currentSchema.capacity || 50,
        registeredCount: 0,
        status: 'open',
        isExpired: Boolean(this.currentSchema.isExpired),
        expiryDate: this.currentSchema.expiryDate || '',
        gates: gates,
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
        customFields: this.currentSchema.fields,
        // Requirement 1 & 10: Store creator info
        createdBy: currentUser.email,
        creatorName: currentUser.name,
        createdAt: new Date().toISOString()
      };

      db.addEvent(newEvent);
      db.addAnnouncement('New Event Published!', `"${newEvent.title}" by ${newEvent.clubName} is now live with customizable gates and automated quota.`, 'New Event', '#06b6d4');

      this.showToast('Event & Form Published!', `"${newEvent.title}" is now live in the Fest Directory.`);
    }

    // Reset current schema to default
    this.currentSchema = JSON.parse(JSON.stringify(this.defaultSchema));
    this.renderStudio();
    this.renderPhonePreview();

    // Switch view to arena
    if (window.nexusApp) {
      window.nexusApp.switchTab('arena');
      window.nexusApp.renderFestArena();
      window.nexusApp.updateHeroStats();
    }
  }

  showToast(title, desc) {
    const toast = document.createElement('div');
    toast.className = 'nexus-toast toast-success';
    toast.innerHTML = `
      <div class="toast-icon">🚀</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-desc">${desc}</div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 50);
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }
}
