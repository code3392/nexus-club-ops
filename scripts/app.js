// Main Application Controller & Coordinator
// Custom built for Smart Campus Operations & Universal Festival Management
import { db } from './data.js';
import { sound } from './sound.js';
import { NetworkCanvas } from './canvas.js';
import { FormBuilderStudio } from './formBuilder.js';
import { GateScannerTerminal } from './scanner.js';
import { AdminCommandCenter } from './analytics.js';
import { renderHolographicBadge } from './badges.js';
import { renderCertificateModal } from './certificates.js';
import { auth } from './auth.js';

class NexusApp {
  constructor() {
    this.currentTab = 'arena';
    this.activeFestFilter = 'all';
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
    // Interactive canvas background
    this.canvas = new NetworkCanvas('networkCanvas');

    // Sub-modules
    window.authSystem = auth;
    window.formStudio = new FormBuilderStudio('fbStudioContainer', 'fbPhonePreview');
    window.gateScanner = new GateScannerTerminal('scannerContainer');
    window.adminCenter = new AdminCommandCenter('adminContainer');

    this.bindEvents();
    this.renderFestFilterPills();
    this.renderFestDirectory();
    this.renderFestArena();
    this.updateHeroStats();

    // Check URL parameters for direct deep-linking
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      if (tabParam === 'studio' && !auth.currentUser) {
        auth.requireAuth(() => this.switchTab('studio'), 'Please sign in or create an account to access Form Studio.');
      } else {
        this.switchTab(tabParam);
      }
    }

    const festParam = urlParams.get('fest');
    if (festParam) {
      this.setFestFilter(festParam);
    }

    const catParam = urlParams.get('category');
    if (catParam) {
      this.setFilter(catParam);
    }

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
        if (tab === 'myregs') {
          this.openMyRegistrationsModal();
        } else if (tab === 'studio' && !auth.currentUser) {
          auth.requireAuth(() => this.switchTab('studio'), 'Please sign in or create an account to build and publish registration forms.');
        } else {
          this.switchTab(tab);
        }
      });
    });

    // Reset data button (if present)
    const resetBtn = document.getElementById('resetDataBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset to initial platform demo state? All initial fests, events, and registrations will be restored.')) {
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
  }

  handleCreateFormClick() {
    if (!auth.currentUser) {
      auth.requireAuth(() => {
        if (window.location.pathname.endsWith('events.html') || window.location.pathname.endsWith('/events')) {
          window.location.href = 'index.html?tab=studio';
        } else {
          this.switchTab('studio');
        }
      }, 'Please sign in or create an account to build and publish registration forms.');
      return;
    }
    if (window.location.pathname.endsWith('events.html') || window.location.pathname.endsWith('/events')) {
      window.location.href = 'index.html?tab=studio';
    } else {
      this.switchTab('studio');
    }
  }

  switchTab(tabId) {
    if (window.location.pathname.endsWith('events.html') || window.location.pathname.endsWith('/events')) {
      if (tabId === 'arena') {
        window.location.href = 'index.html';
      } else {
        window.location.href = `index.html?tab=${tabId}`;
      }
      return;
    }

    if (tabId === 'studio' && !auth.currentUser) {
      auth.requireAuth(() => this.switchTab('studio'), 'Please sign in or create an account to build and publish registration forms.');
      return;
    }
    this.currentTab = tabId;
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    document.querySelectorAll('.tab-view-section').forEach(sec => {
      sec.classList.toggle('active', sec.id === `tabView-${tabId}`);
    });

    // Sub-view refresh
    if (tabId === 'arena') {
      this.renderFestDirectory();
      this.renderFestArena();
    } else if (tabId === 'studio') {
      window.formStudio.renderStudio();
      window.formStudio.renderPhonePreview();
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
    const fests = db.getFests ? db.getFests() : [];
    const totalRegs = registrations.length;
    const checkedIn = registrations.filter(r => r.checkedIn).length;

    const statRegEl = document.getElementById('heroStatRegs');
    const statEventsEl = document.getElementById('heroStatEvents');
    const statCheckedEl = document.getElementById('heroStatChecked');
    const statFestsEl = document.getElementById('heroStatFests');

    if (statRegEl) statRegEl.textContent = totalRegs.toString();
    if (statEventsEl) statEventsEl.textContent = events.length.toString();
    if (statCheckedEl) statCheckedEl.textContent = checkedIn.toString();
    if (statFestsEl) statFestsEl.textContent = fests.length.toString();
  }

  // ===================================================================
  // FEST DIRECTORY LOGIC (Rulebook: Organization → Fest → Event)
  // ===================================================================

  renderFestDirectory() {
    const container = document.getElementById('festsGridContainer');
    if (!container) return;

    const fests = db.getFests ? db.getFests() : [];
    const events = db.getEvents ? db.getEvents() : [];

    if (fests.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1 / -1; padding: 2.5rem 1.5rem; text-align: center; background: rgba(18, 18, 18, 0.5); border: 1px dashed var(--border-subtle); border-radius: var(--radius-lg);">
          <div style="font-size: 2.4rem; margin-bottom: 0.6rem;">🎪</div>
          <h3 style="color: var(--text-main); font-size: 1.15rem; font-weight: 700; margin-bottom: 0.4rem;">No Festivals Scheduled</h3>
          <p style="color: var(--text-muted); font-size: 0.85rem; max-width: 480px; margin: 0 auto 1.25rem auto;">
            Create a new festival container or launch independent event registration forms.
          </p>
          <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-secondary btn-sm" onclick="window.nexusApp.openCreateFestModal()">
              ➕ Add New Festival
            </button>
            <button class="btn btn-primary btn-sm btn-glow" onclick="window.nexusApp.handleCreateFormClick()">
              🛠️ Create Registration Form
            </button>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = fests.map(fest => {
      const festEvents = events.filter(e => e.festId === fest.id);
      const isSelected = this.activeFestFilter === fest.id;

      return `
        <div class="fest-card ${isSelected ? 'fest-card-selected' : ''}" data-id="${fest.id}">
          <div class="fest-card-banner" style="background: ${fest.bannerGradient};">
            <div class="fest-badge-top">
              <span class="fest-status-pill">${fest.status}</span>
              <span class="fest-events-count">${festEvents.length} Contests</span>
            </div>
            <div>
              <div style="font-size:0.75rem; font-weight:700; color:rgba(255,255,255,0.85);">${fest.edition}</div>
              <h3 class="fest-card-title">${fest.title}</h3>
            </div>
          </div>

          <div class="fest-card-body">
            <div>
              <div class="fest-org-tag">
                <span>🏛️</span>
                <span>${fest.organization || 'Campus Tech Society'}</span>
              </div>

              <!-- Compact description with Show More toggle -->
              <div class="fest-desc-wrap" style="margin-bottom: 0.5rem;">
                <p class="fest-tagline fest-tagline-clamped" id="festDesc-${fest.id}">${fest.description || fest.tagline || 'Official campus festival hub.'}</p>
                ${(fest.description || fest.tagline || '').length > 90 ? `
                  <button type="button" class="fest-show-more-btn" onclick="window.nexusApp.toggleFestDescription('${fest.id}', event)">
                    Show more &darr;
                  </button>
                ` : ''}
              </div>

              <div class="fest-meta-list">
                <div class="fest-meta-item">
                  <span>📅</span>
                  <span>${fest.date}</span>
                </div>
                <div class="fest-meta-item">
                  <span>📍</span>
                  <span>${fest.venue}</span>
                </div>
              </div>

              <div class="fest-events-pills">
                ${festEvents.length > 0
                  ? festEvents.map(e => `<span class="fest-event-mini-pill">${e.title}</span>`).join('')
                  : '<span style="font-size:0.72rem; color:var(--text-muted);">Ready for your custom events</span>'}
              </div>
            </div>

            <div class="fest-card-actions">
              <button class="btn btn-primary btn-sm btn-block" onclick="window.nexusApp.openFestDetails('${fest.id}')">
                🎪 Select Fest & Schedule &rarr;
              </button>
              <button class="btn btn-secondary btn-sm" onclick="window.nexusApp.openEditFestModal('${fest.id}')" title="Edit Festival Details">
                ✏️ Edit
              </button>
              <button class="btn btn-outline-danger btn-sm" onclick="window.nexusApp.deleteFest('${fest.id}')" title="Delete Festival">
                🗑️
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  toggleFestDescription(festId, e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const el = document.getElementById(`festDesc-${festId}`);
    const btn = e ? e.currentTarget : null;
    if (!el) return;
    const isClamped = el.classList.toggle('fest-tagline-clamped');
    if (btn) {
      btn.innerHTML = isClamped ? 'Show more &darr;' : 'Show less &uarr;';
    }
  }

  renderFestFilterPills() {
    const row = document.getElementById('festFilterPillsRow');
    if (!row) return;
    const fests = db.getFests ? db.getFests() : [];
    if (fests.length === 0) {
      row.style.display = 'none';
      return;
    }
    row.style.display = 'flex';
    row.innerHTML = `
      <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-right:4px;">Fest:</span>
      <button class="filter-pill ${this.activeFestFilter === 'all' ? 'active' : ''}" data-fest="all" onclick="window.nexusApp.setFestFilter('all')">
        🌟 All Fests
      </button>
      ${fests.map(f => `
        <button class="filter-pill ${this.activeFestFilter === f.id ? 'active' : ''}" data-fest="${f.id}" onclick="window.nexusApp.setFestFilter('${f.id}')">
          🎪 ${f.shortName || f.title}
        </button>
      `).join('')}
    `;
  }

  openFestDetails(festId) {
    sound.playClick();
    const fest = (db.getFests ? db.getFests() : []).find(f => f.id === festId);
    if (!fest) return;

    const festEvents = db.getEvents().filter(e => e.festId === fest.id);
    const modal = document.getElementById('globalModalContainer');
    if (!modal) return;

    modal.innerHTML = `
      <div class="modal-backdrop" onclick="if(event.target===this) window.nexusApp.closeModal()">
        <div class="fest-modal-dialog">
          <div class="fest-modal-hero" style="background: ${fest.bannerGradient};">
            <div class="banner-top-row">
              <span class="event-club-badge">${fest.organization}</span>
              <span class="fest-status-pill" style="background:rgba(0,0,0,0.6);">${fest.status}</span>
            </div>
            <div style="margin-top:1rem;">
              <span class="event-category-chip">${fest.edition.toUpperCase()}</span>
              <h2 style="font-size:1.6rem; font-weight:800; color:#ffffff; margin:0.3rem 0;">${fest.title}</h2>
              <p style="color:rgba(255,255,255,0.9); font-size:0.92rem; max-width:680px;">${fest.description}</p>
            </div>
            <button class="modal-close-btn" onclick="window.nexusApp.closeModal()" style="position:absolute; top:1.25rem; right:1.25rem;">✕</button>
          </div>

          <div style="padding:1.5rem 2rem;">
            <div class="modal-info-columns" style="margin-bottom:1.5rem;">
              <div>
                <p>📍 <strong>Official Venue:</strong> ${fest.venue}</p>
                <p>📅 <strong>Festival Dates:</strong> ${fest.date}</p>
              </div>
              <div style="text-align:right;">
                <span class="badge badge-paid" style="font-size:0.8rem; padding:6px 12px;">Official Campus Event</span>
              </div>
            </div>

            <h4 style="font-size:1.1rem; font-weight:700; color:#ffffff; margin-bottom:0.75rem;">
              Contests & Events in this Festival (${festEvents.length})
            </h4>

            <div class="fest-events-scroll-list">
              ${festEvents.length > 0 ? festEvents.map(evt => {
                const isFull = evt.registeredCount >= evt.capacity || evt.status === 'closed';
                return `
                  <div class="fest-event-tile" onclick="window.nexusApp.closeModal(); window.nexusApp.openEventDetails('${evt.id}')">
                    <div>
                      <span class="event-category-chip" style="color:#ffffff;">${evt.category.toUpperCase()}</span>
                      <div class="fet-title">${evt.title}</div>
                      <div style="font-size:0.78rem; color:#94a3b8; line-height:1.4;">${evt.tagline}</div>
                    </div>
                    <div class="fet-meta">
                      <span>🎟️ ${evt.fee === 0 ? 'Free Entry' : '$' + evt.fee}</span>
                      <span class="${isFull ? 'text-rose' : 'text-emerald'}">
                        ${isFull ? '🔴 Closed / Full' : `⚡ ${evt.capacity - evt.registeredCount} slots left`}
                      </span>
                    </div>
                  </div>
                `;
              }).join('') : `
                <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
                  <div style="font-size: 1.8rem; margin-bottom: 0.5rem;">📝</div>
                  <p>No events added to this festival yet.</p>
                  <button class="btn btn-primary btn-sm" style="margin-top:0.5rem;" onclick="window.nexusApp.closeModal(); window.nexusApp.handleCreateFormClick();">
                    + Add an Event in Form Studio
                  </button>
                </div>
              `}
            </div>
          </div>

          <div class="modal-footer" style="padding:1rem 2rem; border-top:1px solid var(--border-subtle); display:flex; justify-content:space-between;">
            <button class="btn btn-secondary" onclick="window.nexusApp.closeModal()">Close</button>
            <button class="btn btn-primary btn-glow" onclick="window.nexusApp.closeModal(); window.nexusApp.navigateToFestEvents('${fest.id}')">
              View Events in this Fest &rarr;
            </button>
          </div>
        </div>
      </div>
    `;
  }

  navigateToFestEvents(festId) {
    sound.playClick();
    if (document.getElementById('eventsGridContainer')) {
      this.setFestFilter(festId);
    } else {
      window.location.href = `events.html?fest=${encodeURIComponent(festId)}`;
    }
  }

  setFestFilter(festId) {
    sound.playClick();
    this.activeFestFilter = festId;
    document.querySelectorAll('#festFilterPillsRow .filter-pill').forEach(pill => {
      pill.classList.toggle('active', pill.dataset.fest === festId);
    });
    this.renderFestArena();
    const anchor = document.getElementById('arenaFilterAnchor');
    if (anchor) anchor.scrollIntoView({ behavior: 'smooth' });
  }

  resetFestFilter() {
    this.setFestFilter('all');
  }

  openCreateFestModal() {
    sound.playClick();
    if (!auth.currentUser) {
      auth.requireAuth(() => this.openCreateFestModal(), 'Please sign in to create a new festival.');
      return;
    }
    const modal = document.getElementById('globalModalContainer');
    if (!modal) return;

    modal.innerHTML = `
      <div class="modal-backdrop" onclick="if(event.target===this) window.nexusApp.closeModal()">
        <div class="modal-dialog" style="max-width: 520px;">
          <div class="modal-header">
            <h3>🎪 Create New Festival</h3>
            <button class="modal-close-btn" onclick="window.nexusApp.closeModal()">✕</button>
          </div>
          <form class="modal-body" onsubmit="event.preventDefault(); window.nexusApp.handleSaveNewFest();" style="display:flex; flex-direction:column; gap:1rem;">
            <div class="form-group">
              <label class="form-label">Festival Title <span class="req">*</span></label>
              <input type="text" id="newFestTitle" class="form-input" placeholder="e.g. National Robotics Fest 2026" required />
            </div>
            <div class="form-group">
              <label class="form-label">Short Name <span class="req">*</span></label>
              <input type="text" id="newFestShortName" class="form-input" placeholder="e.g. Robotics Fest" required />
            </div>
            <div class="form-group">
              <label class="form-label">Edition / Season</label>
              <input type="text" id="newFestEdition" class="form-input" placeholder="e.g. 1st Annual Edition" />
            </div>
            <div class="form-group">
              <label class="form-label">Date & Timing</label>
              <input type="text" id="newFestDate" class="form-input" placeholder="e.g. November 20-22, 2026" />
            </div>
            <div class="form-group">
              <label class="form-label">Venue / Location</label>
              <input type="text" id="newFestVenue" class="form-input" placeholder="e.g. Campus Central Auditorium" />
            </div>
            <div class="form-group">
              <label class="form-label">Tagline / Brief Description</label>
              <textarea id="newFestDescription" class="form-input form-textarea" placeholder="Brief tagline or description of this festival..." rows="2"></textarea>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem;">
              <button type="button" class="btn btn-secondary" onclick="window.nexusApp.closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-glow">Create Festival</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  handleSaveNewFest() {
    const title = document.getElementById('newFestTitle').value.trim();
    const shortName = document.getElementById('newFestShortName').value.trim() || title;
    const edition = document.getElementById('newFestEdition').value.trim() || 'Annual Edition';
    const date = document.getElementById('newFestDate').value.trim() || 'TBA';
    const venue = document.getElementById('newFestVenue').value.trim() || 'Campus Grounds';
    const description = document.getElementById('newFestDescription').value.trim() || '';

    const newFest = {
      id: 'fest-' + Date.now().toString(36),
      title,
      shortName,
      edition,
      organization: auth.currentUser ? auth.currentUser.name : 'Campus Society',
      createdBy: auth.currentUser ? auth.currentUser.id : null,
      creatorEmail: auth.currentUser ? auth.currentUser.email : null,
      status: 'Active',
      date,
      venue,
      tagline: description,
      description,
      bannerGradient: 'linear-gradient(135deg, #262626 0%, #171717 50%, #0a0a0a 100%)',
      totalEvents: 0,
      badge: 'Official Fest'
    };

    db.addFest(newFest);
    sound.playSuccess();
    this.closeModal();
    this.renderFestDirectory();
    this.renderFestFilterPills();
    this.updateHeroStats();
    if (window.adminCenter && typeof window.adminCenter.render === 'function') {
      window.adminCenter.render();
    }
    if (window.formStudio && window.formStudio.renderMetaFields) {
      window.formStudio.renderMetaFields();
    }
  }

  openEditFestModal(festId) {
    if (!auth.currentUser) {
      auth.requireAuth(() => this.openEditFestModal(festId), 'Please sign in to edit this festival.');
      return;
    }
    const fest = db.getFest ? db.getFest(festId) : (db.getFests ? db.getFests().find(f => f.id === festId) : null);
    if (!fest) {
      alert('Festival not found.');
      return;
    }
    const modal = document.getElementById('globalModalContainer');
    if (!modal) return;

    modal.innerHTML = `
      <div class="modal-backdrop" onclick="if(event.target===this) window.nexusApp.closeModal()">
        <div class="modal-dialog" style="max-width: 540px;">
          <div class="modal-header">
            <h3>✏️ Edit Festival Details</h3>
            <button class="modal-close-btn" onclick="window.nexusApp.closeModal()">✕</button>
          </div>
          <form class="modal-body" onsubmit="event.preventDefault(); window.nexusApp.handleUpdateFest('${fest.id}');" style="display:flex; flex-direction:column; gap:1rem;">
            <div class="form-group">
              <label class="form-label">Festival Title <span class="req">*</span></label>
              <input type="text" id="editFestTitle" class="form-input" value="${fest.title || ''}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Short Name <span class="req">*</span></label>
              <input type="text" id="editFestShortName" class="form-input" value="${fest.shortName || fest.title || ''}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Edition / Season</label>
              <input type="text" id="editFestEdition" class="form-input" value="${fest.edition || ''}" placeholder="e.g. 9th Annual Edition" />
            </div>
            <div class="form-group">
              <label class="form-label">Date & Timing</label>
              <input type="text" id="editFestDate" class="form-input" value="${fest.date || ''}" placeholder="e.g. September 24-26, 2026" />
            </div>
            <div class="form-group">
              <label class="form-label">Venue / Location</label>
              <input type="text" id="editFestVenue" class="form-input" value="${fest.venue || ''}" placeholder="e.g. Dhaka Residential Model College" />
            </div>
            <div class="form-group">
              <label class="form-label">Host Organization / Society</label>
              <input type="text" id="editFestOrg" class="form-input" value="${fest.organization || ''}" placeholder="e.g. DRMC IT CLUB" />
            </div>
            <div class="form-group">
              <label class="form-label">Tagline / Brief Description</label>
              <textarea id="editFestDescription" class="form-input form-textarea" rows="3" placeholder="Brief tagline or description...">${fest.description || fest.tagline || ''}</textarea>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem; flex-wrap:wrap; gap:0.5rem;">
              <button type="button" class="btn btn-outline-danger btn-sm" onclick="window.nexusApp.deleteFest('${fest.id}')">
                🗑️ Delete Festival
              </button>
              <div style="display:flex; gap:0.75rem;">
                <button type="button" class="btn btn-secondary" onclick="window.nexusApp.closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary btn-glow">Save Changes</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  handleUpdateFest(festId) {
    const title = document.getElementById('editFestTitle')?.value.trim();
    if (!title) return;
    const shortName = document.getElementById('editFestShortName')?.value.trim() || title;
    const edition = document.getElementById('editFestEdition')?.value.trim() || 'Annual Edition';
    const date = document.getElementById('editFestDate')?.value.trim() || 'TBA';
    const venue = document.getElementById('editFestVenue')?.value.trim() || 'Campus Grounds';
    const organization = document.getElementById('editFestOrg')?.value.trim() || (auth.currentUser ? auth.currentUser.name : 'Campus Society');
    const description = document.getElementById('editFestDescription')?.value.trim() || '';

    if (db.updateFest) {
      db.updateFest(festId, {
        title,
        shortName,
        edition,
        date,
        venue,
        organization,
        description,
        tagline: description
      });
    }

    sound.playSuccess();
    this.closeModal();
    this.renderFestDirectory();
    this.renderFestArena();
    this.renderFestFilterPills();
    this.updateHeroStats();
    if (window.adminCenter && typeof window.adminCenter.render === 'function') {
      window.adminCenter.render();
    }
    if (window.formStudio && window.formStudio.renderMetaFields) {
      window.formStudio.renderMetaFields();
    }
  }

  deleteFest(festId) {
    const fest = db.getFest ? db.getFest(festId) : (db.getFests ? db.getFests().find(f => f.id === festId) : null);
    const title = fest ? fest.title : 'this festival';
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }

    if (db.deleteFest) {
      db.deleteFest(festId);
    }

    sound.playClick();
    this.closeModal();
    this.renderFestDirectory();
    this.renderFestArena();
    this.renderFestFilterPills();
    this.updateHeroStats();
    if (window.adminCenter && typeof window.adminCenter.render === 'function') {
      window.adminCenter.render();
    }
    if (window.formStudio && window.formStudio.renderMetaFields) {
      window.formStudio.renderMetaFields();
    }
  }

  // ===================================================================
  // EVENT SHOWCASE & FILTERING
  // ===================================================================

  renderFestArena() {
    const container = document.getElementById('eventsGridContainer');
    if (!container) return;

    const events = db.getEvents();
    let filtered = events;

    // Filter by fest
    if (this.activeFestFilter !== 'all') {
      filtered = filtered.filter(e => e.festId === this.activeFestFilter);
    }

    // Filter by category
    if (this.activeFilter !== 'all') {
      filtered = filtered.filter(e => e.category === this.activeFilter);
    }

    // Search query
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.clubName.toLowerCase().includes(q) ||
        (e.festName && e.festName.toLowerCase().includes(q)) ||
        e.tagline.toLowerCase().includes(q) ||
        (e.category && e.category.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.prizePool && e.prizePool.toLowerCase().includes(q)) ||
        (e.venue && e.venue.toLowerCase().includes(q))
      );
    }

    if (events.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1 / -1; padding: 4rem 2rem; text-align: center; background: var(--bg-card); border-radius: 16px; border: 1px dashed var(--border-color); margin: 1.5rem 0;">
          <div style="font-size: 3.5rem; margin-bottom: 1rem;">🎪</div>
          <h3 style="font-size: 1.5rem; color: #ffffff; margin-bottom: 0.5rem;">No Events or Registration Forms Created Yet</h3>
          <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; max-width: 550px; margin: 0 auto 1.5rem;">
            Ready to launch your student organization's competitions, workshops, or fests? Build your custom registration form with tailored gates, team size limits, and instant holographic passes.
          </p>
          <button class="btn btn-primary btn-glow btn-lg" onclick="window.nexusApp.handleCreateFormClick()">
            ➕ Launch Your First Registration Form &rarr;
          </button>
        </div>
      `;
      return;
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
      const isFull = evt.registeredCount >= evt.capacity || evt.status === 'closed';
      const slotsLeft = Math.max(0, evt.capacity - evt.registeredCount);

      const isCreator = auth.currentUser && evt.createdBy && (evt.createdBy.toLowerCase() === auth.currentUser.email.toLowerCase());

      return `
        <div class="event-card" data-id="${evt.id}">
          <div class="event-card-banner" style="background: ${evt.gradient};">
            <div class="banner-top-row">
              <span class="event-club-badge">${evt.festName || evt.clubName}</span>
              ${isCreator ? '<span class="event-club-badge" style="background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.4); color:#ffffff;">👑 Your Event</span>' : ''}
              <span class="event-tier-badge">${evt.fee === 0 ? 'FREE ENTRY' : '$' + evt.fee + ' FEE'}</span>
            </div>
            <div class="event-banner-content">
              <span class="event-category-chip">${evt.category.toUpperCase()}</span>
              <h3 class="event-card-title">${evt.title}</h3>
            </div>
          </div>

          <div class="event-card-body">
            <p class="event-tagline">${evt.tagline}</p>

            <div style="margin-bottom:0.75rem;">
              <span class="event-deadline-pill">⏳ Deadline: ${evt.deadline || 'Oct 23, 2026 • 11:59 PM'}</span>
            </div>

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
                <span>${evt.isTeam ? `Teams (${evt.minTeam}-${evt.maxTeam} Members)` : 'Individual / Solo'}</span>
              </div>
            </div>

            <!-- Dynamic Capacity Quota Bar (Google Forms Killer Feature) -->
            <div class="capacity-meter-box">
              <div class="capacity-meter-header">
                <span>Quota: <strong>${evt.registeredCount} / ${evt.capacity} Filled</strong></span>
                <span class="slots-alert ${slotsLeft <= 5 || isFull ? 'text-rose' : 'text-emerald'}">
                  ${isFull ? '🔴 Capacity Reached' : `⚡ ${slotsLeft} slots remaining`}
                </span>
              </div>
              <div class="capacity-meter-track">
                <div class="capacity-meter-fill" style="width: ${pct}%; background: #ffffff;"></div>
              </div>
            </div>

            <div class="event-card-footer">
              <button class="btn btn-secondary btn-sm" onclick="window.nexusApp.openEventDetails('${evt.id}')">
                Details & Rules
              </button>
              <button class="btn btn-primary btn-sm ${isFull ? 'btn-disabled' : 'btn-glow'}" 
                onclick="window.nexusApp.startRegistration('${evt.id}')" ${isFull ? 'disabled' : ''}>
                ${isFull ? 'Quota Full (Closed)' : (isCreator ? '🎟️ Participate in Your Form &rarr;' : 'Register Now &rarr;')}
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
    document.querySelectorAll('#categoryFilterPillsRow .filter-pill').forEach(pill => {
      pill.classList.toggle('active', pill.dataset.filter === category);
    });
    this.renderFestArena();
  }

  resetFilters() {
    this.activeFilter = 'all';
    this.activeFestFilter = 'all';
    this.searchQuery = '';
    const searchInput = document.getElementById('eventSearchInput');
    if (searchInput) searchInput.value = '';
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.classList.toggle('active', pill.dataset.filter === 'all' || pill.dataset.fest === 'all');
    });
    this.renderFestDirectory();
    this.renderFestArena();
  }

  handleSearch(query) {
    this.searchQuery = query;
    this.renderFestArena();
  }

  // ===================================================================
  // EVENT DETAILS MODAL (Rulebook Page 1 & 2)
  // ===================================================================

  openEventDetails(eventId) {
    sound.playClick();
    const event = db.getEvents().find(e => e.id === eventId);
    if (!event) return;

    const modal = document.getElementById('globalModalContainer');
    if (!modal) return;

    const isFull = event.registeredCount >= event.capacity || event.status === 'closed';
    const slotsLeft = Math.max(0, event.capacity - event.registeredCount);

    modal.innerHTML = `
      <div class="modal-backdrop" onclick="if(event.target===this) window.nexusApp.closeModal()">
        <div class="modal-dialog modal-lg">
          <div class="modal-header">
            <div>
              <span class="modal-club-tag">${event.festName || 'Tech Carnival 2026'} • ${event.clubName}</span>
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
                  <div class="hd-val">${event.fee === 0 ? 'Free Entry' : '$' + event.fee}</div>
                </div>
              </div>
            </div>

            <div class="modal-info-columns">
              <div class="mic-left">
                <h4>Event Description & Scope</h4>
                <p>${event.description || event.tagline}</p>

                <h4>Schedule, Venue & Deadline</h4>
                <p>📍 <strong>Venue:</strong> ${event.venue}</p>
                <p>⏰ <strong>Event Time:</strong> ${event.date}</p>
                <p>⏳ <strong>Registration Deadline:</strong> <span style="color:#ffffff; font-weight:700;">${event.deadline || 'Oct 23, 2026 • 11:59 PM'}</span></p>

                ${event.rules ? `
                  <h4>Contest Rules & Submission</h4>
                  <p style="color:#cbd5e1; font-size:0.88rem;">${event.rules}</p>
                ` : ''}
              </div>

              <div class="mic-right">
                <div class="smart-features-card">
                  <h5>🛡️ Smart Registration Controls</h5>
                  <ul>
                    <li>✓ <strong>Auto Quota Lock:</strong> Strict capacity of ${event.capacity} seats</li>
                    <li>✓ <strong>${slotsLeft} Slots Remaining:</strong> ${isFull ? 'Waitlist Only' : 'Open for registration'}</li>
                    <li>✓ <strong>Format:</strong> ${event.isTeam ? `Team of ${event.minTeam}-${event.maxTeam} members` : 'Individual solo registration'}</li>
                    <li>✓ <strong>Credential:</strong> Instant cryptographic holographic pass</li>
                    <li>✓ <strong>Gate:</strong> 0.4s audio check-in at venue entrance</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="window.nexusApp.closeModal()">Close</button>
            <button class="btn btn-primary ${isFull ? 'btn-disabled' : 'btn-glow'}" 
              onclick="window.nexusApp.startRegistration('${event.id}')" ${isFull ? 'disabled' : ''}>
              ${isFull ? 'Registration Closed (Capacity Reached)' : (auth.currentUser && event.createdBy && (event.createdBy.toLowerCase() === auth.currentUser.email.toLowerCase()) ? '🎟️ Participate / Register in Your Event &rarr;' : 'Proceed to Registration Form &rarr;')}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ===================================================================
  // REGISTRATION SYSTEM (Rulebook Page 2)
  // ===================================================================

  startRegistration(eventId) {
    // Requirement 2: User must login or sign up to register
    if (!auth.currentUser) {
      this.closeModal();
      auth.requireAuth(() => this.startRegistration(eventId), 'You must sign in or create an account to register for events.');
      return;
    }

    const event = db.getEvents().find(e => e.id === eventId);
    if (!event) return;

    // Requirement 6: Check form expiry
    const isExpired = Boolean(event.isExpired) || (event.expiryDate && new Date(event.expiryDate) < new Date());
    if (isExpired) {
      alert(`Registration for "${event.title}" has expired or been closed by the organizer.`);
      return;
    }

    if (event.registeredCount >= event.capacity || event.status === 'closed') {
      alert(`Registration for "${event.title}" is currently closed because the capacity limit (${event.capacity} seats) has been reached.`);
      return;
    }

    const user = auth.currentUser;
    this.currentRegEvent = event;

    // Requirement 9: Pre-populate minimum team members
    const minTeam = event.isTeam ? (event.minTeam || 2) : 1;
    const initialMembers = [{ name: user ? user.name : '', role: 'Leader' }];
    while (initialMembers.length < minTeam) {
      initialMembers.push({ name: '', role: 'Member' });
    }

    this.registrationDraft = {
      leadName: user ? user.name : '',
      leadEmail: user ? user.email : '',
      leadPhone: '',
      collegeRoll: user ? (user.rollNo || '') : '',
      teamName: '',
      teamMembers: initialMembers,
      answers: {}
    };

    this.renderRegistrationModal();
  }

  renderRegistrationModal() {
    const modal = document.getElementById('globalModalContainer');
    if (!modal) return;
    const evt = this.currentRegEvent;

    // Requirement 6: Check form expiry
    const isExpired = Boolean(evt.isExpired) || (evt.expiryDate && new Date(evt.expiryDate) < new Date());

    // Custom dynamic questions
    const customFieldsHtml = (evt.customFields || []).map(f => {
      let inputEl = '';
      const savedVal = this.registrationDraft.answers[f.id] || '';

      if (f.type === 'select') {
        inputEl = `
          <select id="${f.id}" class="gform-input gform-select" ${isExpired ? 'disabled' : ''} onchange="window.nexusApp.updateAnswer('${f.id}', this.value)">
            <option value="" style="background-color: #000000; color: #a1a1aa;">Choose an option...</option>
            ${(f.options || []).map(opt => `<option value="${opt}" style="background-color: #000000; color: #ffffff;" ${savedVal === opt ? 'selected' : ''}>${opt}</option>`).join('')}
          </select>
        `;
      } else if (f.type === 'radio') {
        inputEl = `
          <div class="gform-radios">
            ${(f.options || []).map(opt => `
              <label class="gform-radio-option">
                <input type="radio" name="${f.id}" value="${opt}" ${savedVal === opt ? 'checked' : ''} ${isExpired ? 'disabled' : ''}
                  onchange="window.nexusApp.updateAnswer('${f.id}', this.value)" />
                <span>${opt}</span>
              </label>
            `).join('')}
          </div>
        `;
      } else {
        inputEl = `
          <input type="${f.type === 'url' ? 'url' : 'text'}" id="${f.id}" class="gform-input" 
            placeholder="${f.placeholder || 'Your answer'}" value="${savedVal}" ${isExpired ? 'disabled' : ''}
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

    // Requirement 9: Dynamic team members with customizable limits
    let teamSectionHtml = '';
    if (evt.isTeam) {
      const minTeam = evt.minTeam || 2;
      const maxTeam = evt.maxTeam || 4;

      const membersRows = this.registrationDraft.teamMembers.map((m, idx) => `
        <div class="gform-tm-row">
          <input type="text" class="gform-input tm-name" placeholder="Teammate ${idx + 1} Full Name ${idx < minTeam ? '(Required)' : '(Optional)'}" value="${m.name}" ${isExpired ? 'disabled' : ''}
            onchange="window.nexusApp.updateTeammate(${idx}, 'name', this.value)" />
          ${idx >= minTeam && !isExpired ? `<button type="button" class="btn-remove-tm" onclick="window.nexusApp.removeTeammate(${idx})">✕</button>` : ''}
        </div>
      `).join('');

      teamSectionHtml = `
        <div class="gform-card">
          <label class="gform-question-title">Team Name <span class="req">*</span></label>
          <input type="text" id="regTeamName" class="gform-input" value="${this.registrationDraft.teamName}" placeholder="e.g. NeuralKnights" ${isExpired ? 'disabled' : ''} required />
        </div>

        <div class="gform-card">
          <div class="gform-card-header-flex">
            <label class="gform-question-title">Team Members (${this.registrationDraft.teamMembers.length}/${maxTeam}) • Required: ${minTeam}-${maxTeam}</label>
            ${this.registrationDraft.teamMembers.length < maxTeam && !isExpired ? `
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
          
          <!-- Requirement 7: Header Card with Headline & Description -->
          <div class="gform-header-card" style="border-top-color: #ffffff;">
            <div class="gform-header-badge">${evt.festName || 'Fest'} • ${evt.clubName || 'Student Org'}</div>
            <h2 class="gform-title">${evt.headline || evt.title}</h2>
            <p class="gform-desc">${evt.description || evt.tagline}</p>
            <div class="gform-meta-row">
              <span>📅 ${evt.date}</span>
              <span>📍 ${evt.venue}</span>
              <span>🎟️ ${evt.fee === 0 ? 'Free Entry' : '$' + evt.fee + ' Fee'}</span>
              ${evt.isTeam ? `<span>👥 Team (${evt.minTeam || 2}-${evt.maxTeam || 4} members)</span>` : '<span>👤 Solo Entry</span>'}
            </div>
            <div class="gform-req-notice">* Indicates required question</div>
          </div>

          ${isExpired ? `
            <div class="gform-card" style="border-left: 4px solid #ffffff; background: rgba(255, 255, 255, 0.06);">
              <strong style="color: #ffffff; font-size: 1.05rem;">⛔ REGISTRATION EXPIRED / CLOSED</strong>
              <p style="color: #d1d5db; font-size: 0.88rem; margin-top: 0.25rem;">
                The organizer has closed or expired registrations for this form. Submissions are no longer accepted.
              </p>
            </div>
          ` : ''}

          <form id="eventRegistrationForm" onsubmit="event.preventDefault(); window.nexusApp.submitRegistrationForm();">
            <!-- Full Name -->
            <div class="gform-card">
              <label class="gform-question-title">Lead Attendee Full Name <span class="req">*</span></label>
              <input type="text" id="regName" class="gform-input" value="${this.registrationDraft.leadName}" placeholder="e.g. Tanvir Hossain" ${isExpired ? 'disabled' : ''} required />
            </div>

            <!-- Email -->
            <div class="gform-card">
              <label class="gform-question-title">Email Address <span class="req">*</span></label>
              <input type="email" id="regEmail" class="gform-input" value="${this.registrationDraft.leadEmail}" placeholder="e.g. tanvir.h@campus.edu" ${isExpired ? 'disabled' : ''} required />
            </div>

            <!-- Student ID / Roll -->
            <div class="gform-card">
              <label class="gform-question-title">Student Roll / Institution ID <span class="req">*</span></label>
              <input type="text" id="regRoll" class="gform-input" value="${this.registrationDraft.collegeRoll}" placeholder="e.g. 2024-CS-104" ${isExpired ? 'disabled' : ''} required />
            </div>

            <!-- Phone -->
            <div class="gform-card">
              <label class="gform-question-title">Contact Phone Number</label>
              <input type="tel" id="regPhone" class="gform-input" value="${this.registrationDraft.leadPhone}" placeholder="+880 1711-..." ${isExpired ? 'disabled' : ''} />
            </div>

            <!-- Team Section if applicable -->
            ${teamSectionHtml}

            <!-- Dynamic Custom Event Questions -->
            ${customFieldsHtml}

            <!-- Submit Action Card -->
            <div class="gform-actions-card">
              <div class="gform-actions-left">
                <button type="submit" class="btn btn-primary btn-glow btn-gform-submit" ${isExpired ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                  ${isExpired ? 'Registration Expired' : evt.fee > 0 ? `Pay $${evt.fee} & Submit` : 'Submit Registration'}
                </button>
                ${!isExpired ? `
                  <button type="button" class="btn-text-clear" onclick="window.nexusApp.clearRegistrationForm()">
                    Clear form
                  </button>
                ` : ''}
              </div>
              <button type="button" class="btn-text-cancel" onclick="window.nexusApp.closeModal()">
                Close
              </button>
            </div>
          </form>

        </div>
      </div>
    `;
  }

  addTeammate() {
    const maxTeam = this.currentRegEvent?.maxTeam || 4;
    if (this.currentRegEvent && this.registrationDraft.teamMembers.length < maxTeam) {
      this.registrationDraft.teamMembers.push({ name: '', role: 'Member' });
      this.renderRegistrationModal();
    }
  }

  removeTeammate(idx) {
    const minTeam = this.currentRegEvent?.minTeam || 1;
    if (this.registrationDraft.teamMembers.length > minTeam) {
      this.registrationDraft.teamMembers.splice(idx, 1);
      this.renderRegistrationModal();
    } else {
      alert(`This event requires a minimum of ${minTeam} team member(s).`);
    }
  }

  updateTeammate(idx, field, value) {
    if (this.registrationDraft.teamMembers[idx]) {
      this.registrationDraft.teamMembers[idx][field] = value;
    }
  }

  updateAnswer(fieldId, value) {
    this.registrationDraft.answers[fieldId] = value;
  }

  clearRegistrationForm() {
    const user = auth.currentUser;
    const minTeam = this.currentRegEvent?.isTeam ? (this.currentRegEvent.minTeam || 2) : 1;
    const initialMembers = [{ name: user ? user.name : '', role: 'Leader' }];
    while (initialMembers.length < minTeam) {
      initialMembers.push({ name: '', role: 'Member' });
    }

    this.registrationDraft.leadName = user ? user.name : '';
    this.registrationDraft.leadEmail = user ? user.email : '';
    this.registrationDraft.leadPhone = '';
    this.registrationDraft.collegeRoll = user ? (user.rollNo || '') : '';
    this.registrationDraft.teamName = '';
    this.registrationDraft.teamMembers = initialMembers;
    this.registrationDraft.answers = {};
    this.renderRegistrationModal();
  }

  submitRegistrationForm() {
    const evt = this.currentRegEvent;
    if (!evt) return;

    // Check expiry
    const isExpired = Boolean(evt.isExpired) || (evt.expiryDate && new Date(evt.expiryDate) < new Date());
    if (isExpired) {
      alert('This registration form has expired or been closed by the organizer.');
      return;
    }

    const nameInput = document.getElementById('regName');
    const emailInput = document.getElementById('regEmail');
    const rollInput = document.getElementById('regRoll');
    const teamInput = document.getElementById('regTeamName');

    if (!nameInput || !nameInput.value.trim()) {
      alert('Please enter your full name.');
      return;
    }
    if (!emailInput || !emailInput.value.trim()) {
      alert('Please enter a valid email address.');
      return;
    }
    if (!rollInput || !rollInput.value.trim()) {
      alert('Please enter your Student Roll / ID.');
      return;
    }

    if (evt.isTeam) {
      if (!teamInput || !teamInput.value.trim()) {
        alert('Please enter a Team Name.');
        return;
      }
      const minTeam = evt.minTeam || 1;
      const filledMembers = this.registrationDraft.teamMembers.filter(m => m.name && m.name.trim());
      if (filledMembers.length < minTeam) {
        alert(`This event requires names for at least ${minTeam} team member(s).`);
        return;
      }
    }

    // Save draft
    this.registrationDraft.leadName = nameInput.value.trim();
    this.registrationDraft.leadEmail = emailInput.value.trim();
    this.registrationDraft.collegeRoll = rollInput.value.trim();
    const phoneInput = document.getElementById('regPhone');
    if (phoneInput) this.registrationDraft.leadPhone = phoneInput.value.trim();
    if (teamInput) this.registrationDraft.teamName = teamInput.value.trim();

    // Check required custom questions
    for (const f of (evt.customFields || [])) {
      if (f.required && !this.registrationDraft.answers[f.id]) {
        alert(`Please complete the required question: "${f.label}"`);
        return;
      }
    }

    // Finish registration
    this.finishRegistration();
  }

  finishRegistration(txnId = null) {
    const evt = this.currentRegEvent;
    const catPrefix = evt.category ? evt.category.substring(0, 4).toUpperCase() : 'TECH';
    const ticketId = 'NX-' + catPrefix + '-' + Math.floor(1000 + Math.random() * 9000);

    const newReg = {
      id: 'REG-' + Date.now().toString(36),
      ticketId,
      eventId: evt.id,
      festId: evt.festId || '',
      eventTitle: evt.title,
      festTitle: evt.festName || (evt.festId ? 'Fest Event' : 'Standalone Event'),
      clubName: evt.clubName || 'Campus Tech Society',
      leadName: this.registrationDraft.leadName,
      leadEmail: this.registrationDraft.leadEmail,
      leadPhone: this.registrationDraft.leadPhone,
      collegeRoll: this.registrationDraft.collegeRoll,
      leadAvatar: auth.currentUser ? auth.currentUser.avatar : '',
      userId: auth.currentUser ? auth.currentUser.id : '',
      teamName: evt.isTeam ? this.registrationDraft.teamName : null,
      teamMembers: evt.isTeam ? this.registrationDraft.teamMembers.filter(m => m.name && m.name.trim()) : [],
      answers: this.registrationDraft.answers,
      registrationStatus: 'Approved',
      paymentStatus: evt.fee === 0 ? 'PAID_FREE' : 'VERIFIED',
      transactionId: txnId || ('TXN-' + Math.floor(1000000000 + Math.random() * 9000000000)),
      amount: evt.fee || 0,
      registeredAt: new Date().toISOString(),
      checkedIn: false,
      gate: null,
      passTier: evt.isTeam ? 'Team Pass' : 'VIP Pass',
      // Requirement 1: Store event creator metadata on registration
      createdBy: evt.createdBy || null,
      creatorName: evt.creatorName || null
    };

    db.addRegistration(newReg);
    this.updateHeroStats();
    this.renderFestArena();

    // Open confirmation badge modal
    this.openBadgeModal(ticketId, true);
  }

  // ===================================================================
  // REGISTRATION CONFIRMATION & HOLOGRAPHIC PASS MODAL
  // ===================================================================

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
    navigator.clipboard?.writeText(ticketId);
    sound.playClick();
    alert(`Pass ID ${ticketId} copied to clipboard!`);
  }

  openCertificate(ticketId) {
    const reg = db.getRegistrations().find(r => r.ticketId === ticketId);
    if (!reg) return;
    const modalContainer = document.getElementById('globalModalContainer');
    if (modalContainer) {
      modalContainer.innerHTML = renderCertificateModal(reg, reg.eventTitle, reg.clubName);
    }
  }

  // ===================================================================
  // ATTENDEE SELF-SERVICE: MY REGISTRATIONS (Rulebook Page 2: 5 pts)
  // ===================================================================

  openMyRegistrationsModal(filterQuery = '') {
    sound.playClick();
    const modal = document.getElementById('globalModalContainer');
    if (!modal) return;

    const userEmail = auth.currentUser ? auth.currentUser.email : '';
    const query = filterQuery || userEmail;
    const allRegs = db.getRegistrations();
    let myRegs = query ? db.getRegistrationsByEmailOrTicket(query) : allRegs.slice(0, 4);

    modal.innerHTML = `
      <div class="modal-backdrop" onclick="if(event.target===this) window.nexusApp.closeModal()">
        <div class="my-regs-dialog">
          <div class="modal-header">
            <div>
              <span class="badge badge-paid">Attendee Self-Service</span>
              <h2 class="modal-title" style="margin-top:0.25rem;">🎟️ My Registrations & Passes</h2>
            </div>
            <button class="modal-close-btn" onclick="window.nexusApp.closeModal()">✕</button>
          </div>

          <div class="modal-body">
            <p style="color:var(--text-muted); font-size:0.88rem; margin-bottom:1rem;">
              Look up your registered passes by campus email or pass ticket ID. View holographic credentials, download certificates, or manage registrations.
            </p>

            <div class="my-regs-lookup-bar">
              <input type="text" id="myRegsLookupInput" class="my-regs-input" 
                placeholder="Enter email or Pass ID (e.g. aarav.patel@campus.edu or NX-AI-8821)"
                value="${query}" 
                onkeydown="if(event.key==='Enter') window.nexusApp.lookupMyRegistrations(this.value)" />
              <button class="btn btn-primary" onclick="window.nexusApp.lookupMyRegistrations(document.getElementById('myRegsLookupInput').value)">
                🔍 Find Passes
              </button>
            </div>

            <div id="myRegsResultsList">
              ${this.renderMyRegsCards(myRegs)}
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="window.nexusApp.closeModal()">Close</button>
          </div>
        </div>
      </div>
    `;
  }

  lookupMyRegistrations(val) {
    const q = val.trim();
    const results = q ? db.getRegistrationsByEmailOrTicket(q) : db.getRegistrations().slice(0, 4);
    const container = document.getElementById('myRegsResultsList');
    if (container) {
      container.innerHTML = this.renderMyRegsCards(results);
    }
  }

  renderMyRegsCards(regs) {
    if (!regs || regs.length === 0) {
      return `
        <div class="empty-state-box" style="padding:2rem 1rem;">
          <div class="empty-icon">🎟️</div>
          <h4>No Registrations Found</h4>
          <p>We couldn't find any passes matching that email or Ticket ID. Try registering for an event first.</p>
          <button class="btn btn-primary btn-sm" onclick="window.nexusApp.closeModal(); document.getElementById('arenaFilterAnchor').scrollIntoView({behavior:'smooth'});">
            Explore Contests
          </button>
        </div>
      `;
    }

    return regs.map(r => {
      const status = r.registrationStatus || (r.checkedIn ? 'Checked In' : 'Approved');
      const isCancelled = status === 'Cancelled';

      return `
        <div class="my-reg-card">
          <div class="my-reg-header">
            <div>
              <div class="my-reg-fest">${r.festTitle || 'Campus Fest'}</div>
              <div class="my-reg-title">${r.eventTitle}</div>
            </div>
            <span class="badge ${isCancelled ? 'status-cancelled' : r.checkedIn ? 'status-checked-in' : 'status-approved'}">
              ${isCancelled ? '❌ CANCELLED' : r.checkedIn ? '🟢 CHECKED IN' : '✅ APPROVED'}
            </span>
          </div>

          <div class="my-reg-meta-row">
            <div class="my-reg-meta-item">
              <span>Pass Ticket ID</span>
              <strong class="mono">${r.ticketId}</strong>
            </div>
            <div class="my-reg-meta-item">
              <span>Lead Attendee</span>
              <strong>${r.leadName}</strong>
            </div>
            <div class="my-reg-meta-item">
              <span>Team / Format</span>
              <strong>${r.teamName || 'Individual (Solo)'}</strong>
            </div>
            <div class="my-reg-meta-item">
              <span>Registered Date</span>
              <strong>${new Date(r.registeredAt).toLocaleDateString()}</strong>
            </div>
          </div>

          <div class="my-reg-actions">
            ${!isCancelled ? `
              <button class="btn btn-primary btn-sm" onclick="window.nexusApp.openBadgeModal('${r.ticketId}')">
                🎫 View Holographic Pass
              </button>
              <button class="btn btn-secondary btn-sm" onclick="window.nexusApp.openCertificate('${r.ticketId}')">
                🏆 Certificate
              </button>
              ${r.teamName ? `
                <button class="btn btn-secondary btn-sm" onclick="window.nexusApp.editRegistrationTeam('${r.ticketId}')">
                  ✏️ Edit Team
                </button>
              ` : ''}
              <button class="btn btn-secondary btn-sm text-danger" onclick="window.nexusApp.cancelAttendeeRegistration('${r.ticketId}')">
                ✕ Cancel Registration
              </button>
            ` : `
              <span class="text-rose" style="font-size:0.8rem;">Registration was cancelled. Quota seat released.</span>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

  editRegistrationTeam(ticketId) {
    const reg = db.getRegistrations().find(r => r.ticketId === ticketId);
    if (!reg) return;

    const newTeamName = prompt('Update Team Name:', reg.teamName || '');
    if (newTeamName === null) return;
    if (!newTeamName.trim()) {
      alert('Team Name cannot be empty.');
      return;
    }

    reg.teamName = newTeamName.trim();
    db.save();
    sound.playClick();
    this.openMyRegistrationsModal(ticketId);

    const toast = document.createElement('div');
    toast.className = 'nexus-toast toast-success';
    toast.innerHTML = `
      <div class="toast-icon">✓</div>
      <div class="toast-content">
        <div class="toast-title">Team Info Updated</div>
        <div class="toast-desc">Team name updated to "${reg.teamName}" on pass ${ticketId}.</div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 50);
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  cancelAttendeeRegistration(ticketId) {
    if (confirm(`Are you sure you want to cancel registration for pass ${ticketId}? This will release your seat quota back to other attendees.`)) {
      sound.playClick();
      db.cancelRegistration(ticketId);
      this.updateHeroStats();
      this.renderFestArena();
      this.openMyRegistrationsModal(ticketId);
      
      const toast = document.createElement('div');
      toast.className = 'nexus-toast toast-success';
      toast.innerHTML = `
        <div class="toast-icon">✓</div>
        <div class="toast-content">
          <div class="toast-title">Registration Cancelled</div>
          <div class="toast-desc">Seat quota has been released and pass ${ticketId} is now deactivated.</div>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.classList.add('visible'), 50);
      setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 400);
      }, 3500);
    }
  }

  // ===================================================================
  // MODAL & COMMAND PALETTE
  // ===================================================================

  closeModal() {
    const modal = document.getElementById('globalModalContainer');
    if (modal) modal.innerHTML = '';
  }

  toggleCommandPalette() {
    const cp = document.getElementById('commandPaletteModal');
    if (!cp) return;
    const isHidden = cp.classList.contains('hidden');
    if (isHidden) {
      sound.playClick();
      cp.classList.remove('hidden');
      const input = document.getElementById('commandPaletteInput');
      if (input) {
        input.value = '';
        input.focus();
        this.renderCommandPaletteItems('');
      }
    } else {
      cp.classList.add('hidden');
    }
  }

  closeCommandPalette() {
    const cp = document.getElementById('commandPaletteModal');
    if (cp) cp.classList.add('hidden');
  }

  renderCommandPaletteItems(query = '') {
    const list = document.getElementById('commandPaletteList');
    if (!list) return;

    const events = db.getEvents();
    const fests = db.getFests ? db.getFests() : [];

    const items = [
      { type: 'NAV', title: '🏠 Home / Landing Page', action: () => this.switchTab('arena') },
      { type: 'NAV', title: '🎪 Browse Events & Contests', action: () => { window.location.href = 'events.html'; } },
      { type: 'NAV', title: '🎟️ My Passes / Manage Registrations', action: () => this.openMyRegistrationsModal() },
      { type: 'NAV', title: '🛠️ Form Studio (Build Custom Forms)', action: () => this.switchTab('studio') },
      { type: 'NAV', title: '⚡ Gate Check-in QR Scanner', action: () => this.switchTab('scanner') },
      { type: 'NAV', title: '📊 Organizer Command Center', action: () => this.switchTab('admin') },
      ...fests.map(f => ({
        type: 'FEST',
        title: `Festival: ${f.title}`,
        action: () => {
          this.openFestDetails(f.id);
        }
      })),
      ...events.map(e => ({
        type: 'EVENT',
        title: `Register: ${e.title} (${e.festName || e.clubName})`,
        action: () => {
          this.openEventDetails(e.id);
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
