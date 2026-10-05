// Dynamic Form Builder Studio ("Google Forms Killer")
import { db } from './data.js';
import { sound } from './sound.js';

export class FormBuilderStudio {
  constructor(containerId, previewPhoneId) {
    this.container = document.getElementById(containerId);
    this.phonePreview = document.getElementById(previewPhoneId);
    this.currentSchema = {
      eventTitle: 'RoboWars 2026: Sumo Bot Championship',
      category: 'robotics',
      clubName: 'Autonomous Robotics Guild',
      date: 'Nov 02, 2026',
      venue: 'Robotics Central Arena',
      prizePool: '$1,800',
      fee: 15,
      capacity: 50,
      isTeam: true,
      minTeam: 2,
      maxTeam: 4,
      fields: [
        {
          id: 'field_1',
          label: 'Bot Specification Name',
          type: 'text',
          placeholder: 'e.g. ThunderCrush',
          required: true
        },
        {
          id: 'field_2',
          label: 'Weight Category',
          type: 'select',
          options: ['Under 5kg Lightweight', '15kg Middleweight', '30kg Heavyweight'],
          required: true
        },
        {
          id: 'field_3',
          label: 'Controller Type',
          type: 'radio',
          options: ['2.4GHz RF Remote', 'Bluetooth Autonomous', 'Dual Operator Tethered'],
          required: true
        },
        {
          id: 'field_4',
          label: 'Engineering CAD / Schematic Link',
          type: 'url',
          placeholder: 'https://grabcad.com/... or Google Drive link',
          required: false
        }
      ]
    };
  }

  init() {
    this.renderStudio();
    this.renderPhonePreview();
  }

  addField(type) {
    sound.playClick();
    const id = 'field_' + Date.now();
    let newField = {
      id,
      label: 'New ' + type.charAt(0).toUpperCase() + type.slice(1) + ' Field',
      type,
      required: true
    };

    if (type === 'select' || type === 'radio') {
      newField.options = ['Option Alpha', 'Option Beta', 'Option Gamma'];
    } else if (type === 'url') {
      newField.placeholder = 'https://...';
    } else {
      newField.placeholder = 'Enter value...';
    }

    this.currentSchema.fields.push(newField);
    this.renderStudio();
    this.renderPhonePreview();
  }

  removeField(fieldId) {
    sound.playClick();
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

  renderStudio() {
    if (!this.container) return;

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
                <label class="fb-sublabel">Question</label>
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
        <div class="fb-meta-section">
          <div class="fb-section-title">
            <span>📝 Event Details</span>
          </div>
          <div class="fb-grid-2">
            <div>
              <label class="fb-label">Event Title</label>
              <input type="text" id="fbMetaTitle" class="fb-input" value="${this.currentSchema.eventTitle}"
                oninput="window.formStudio.updateMeta('eventTitle', this.value)">
            </div>
            <div>
              <label class="fb-label">Organization / Club Name</label>
              <input type="text" id="fbMetaClub" class="fb-input" 
                placeholder="e.g. IEEE Student Branch, ACM, Debate Society" 
                value="${this.currentSchema.clubName || ''}"
                oninput="window.formStudio.updateMeta('clubName', this.value)">
            </div>
            <div>
              <label class="fb-label">Seat Capacity Limit</label>
              <input type="number" class="fb-input" value="${this.currentSchema.capacity}" min="5" max="500"
                oninput="window.formStudio.updateMeta('capacity', parseInt(this.value) || 50)">
            </div>
            <div>
              <label class="fb-label">Entry Fee ($0 for Free)</label>
              <input type="number" class="fb-input" value="${this.currentSchema.fee}" min="0" max="100"
                oninput="window.formStudio.updateMeta('fee', parseFloat(this.value) || 0)">
            </div>
            <div>
              <label class="fb-label">Registration Type</label>
              <select class="fb-input" onchange="window.formStudio.updateMeta('isTeam', this.value === 'true')">
                <option value="true" ${this.currentSchema.isTeam ? 'selected' : ''}>Team</option>
                <option value="false" ${!this.currentSchema.isTeam ? 'selected' : ''}>Individual / Solo</option>
              </select>
            </div>
            <div>
              <label class="fb-label">Prize / Rewards</label>
              <input type="text" class="fb-input" value="${this.currentSchema.prizePool}"
                oninput="window.formStudio.updateMeta('prizePool', this.value)">
            </div>
          </div>
        </div>

        <div class="fb-fields-section">
          <div class="fb-fields-header">
            <div class="fb-section-title">
              <span>Questions (${this.currentSchema.fields.length})</span>
            </div>
            <div class="fb-add-field-bar">
              <span class="fb-add-label">+ Add Question:</span>
              <button class="fb-chip" onclick="window.formStudio.addField('text')">Short Answer</button>
              <button class="fb-chip" onclick="window.formStudio.addField('select')">Dropdown</button>
              <button class="fb-chip" onclick="window.formStudio.addField('radio')">Multiple Choice</button>
              <button class="fb-chip" onclick="window.formStudio.addField('url')">Link / URL</button>
            </div>
          </div>

          <div class="fb-fields-list">
            ${fieldsHtml}
          </div>
        </div>

        <div class="fb-deploy-box">
          <button class="btn btn-primary btn-glow btn-lg" onclick="window.formStudio.deployForm()">
            Publish Form
          </button>
        </div>
      </div>
    `;
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
            <div class="phone-event-title">${this.currentSchema.eventTitle}</div>
            <div class="phone-event-meta">
              <span>🎟️ Capacity: ${this.currentSchema.capacity} slots</span>
              <span>💵 ${this.currentSchema.fee === 0 ? 'Free Entry' : '$' + this.currentSchema.fee}</span>
            </div>
          </div>

          <div class="phone-content-scroll">
            <div class="phone-info-card">
              <span class="phone-card-icon">⚡</span>
              <div>
                <strong>In-House Smart Form</strong>
                <p>Anti-fraud verification & instant holographic fest badge</p>
              </div>
            </div>

            <form class="phone-live-form" onsubmit="event.preventDefault()">
              <div class="phone-field-group">
                <label class="phone-field-label">Full Name <span class="req">*</span></label>
                <input type="text" class="phone-input" value="Jordan Hayes" />
              </div>
              <div class="phone-field-group">
                <label class="phone-field-label">Campus Email <span class="req">*</span></label>
                <input type="email" class="phone-input" value="jordan@campus.edu" />
              </div>

              ${this.currentSchema.isTeam ? `
                <div class="phone-field-group">
                  <label class="phone-field-label">Team Name <span class="req">*</span></label>
                  <input type="text" class="phone-input" value="AeroDynamics" />
                </div>
              ` : ''}

              <!-- Dynamic Fields -->
              ${fieldsHtml}

              <button class="phone-submit-btn" type="button">
                Get Digital Pass & QR &rarr;
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  deployForm() {
    sound.playPassUnlocked();

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
        lead: 'Student Lead',
        icon: '🏛️',
        activeEvents: 1,
        members: 50
      });
    }

    const newEvent = {
      id: 'evt-' + Date.now().toString(36),
      clubId: clubId,
      title: this.currentSchema.eventTitle || 'Untitled Event',
      category: this.currentSchema.category || 'tech',
      clubName: clubName,
      badge: 'Campus Event',
      tagline: 'Custom form deployed via Nexus Form Studio.',
      date: this.currentSchema.date || 'Upcoming Fest Date',
      venue: this.currentSchema.venue || 'Campus Central Auditorium',
      prizePool: this.currentSchema.prizePool || '$500',
      fee: this.currentSchema.fee || 0,
      isTeam: this.currentSchema.isTeam,
      minTeam: 2,
      maxTeam: 4,
      capacity: this.currentSchema.capacity || 50,
      registeredCount: 0,
      status: 'hot',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
      customFields: this.currentSchema.fields
    };

    db.addEvent(newEvent);
    db.addAnnouncement('New Event Published!', `"${newEvent.title}" by ${newEvent.clubName} is now open for registration on the fest portal.`, 'New Event', '#06b6d4');

    // Show toast
    const toast = document.createElement('div');
    toast.className = 'nexus-toast toast-success';
    toast.innerHTML = `
      <div class="toast-icon">🚀</div>
      <div class="toast-content">
        <div class="toast-title">Event Successfully Published!</div>
        <div class="toast-desc">"${newEvent.title}" is live in the Fest Arena with automated quota lock.</div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 50);
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    }, 4000);

    // Switch view to arena
    if (window.nexusApp) {
      window.nexusApp.switchTab('arena');
    }
  }
}
