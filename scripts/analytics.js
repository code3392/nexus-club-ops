// Analytics Charts and Organizer Command Center Logic
import { db } from './data.js';
import { sound } from './sound.js';
import { renderCertificateModal } from './certificates.js';
import { auth } from './auth.js';

export class AdminCommandCenter {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentFilter = 'all';
    this.currentFestFilter = 'all';
    this.currentStatusFilter = 'all';
    this.searchQuery = '';
    this.pendingAvatar = null;
  }

  init() {
    auth.addAuthListener(() => this.render());
    this.render();
  }

  render() {
    if (!this.container) return;

    const registrations = db.getRegistrations();
    const events = db.getEvents();
    const fests = db.getFests ? db.getFests() : [];
    const clubs = db.getClubs();
    const announcements = db.state.announcements || [];

    const totalRegs = registrations.length;
    const totalRevenue = registrations.reduce((sum, r) => sum + (r.amount || 0), 0);
    const checkedInCount = registrations.filter(r => r.checkedIn).length;
    const checkInRate = totalRegs > 0 ? Math.round((checkedInCount / totalRegs) * 100) : 0;

    this.container.innerHTML = `
      <div class="admin-dashboard-wrap">
        <!-- User Profile & Account Settings Section -->
        ${this.renderUserProfileSection()}

        <!-- Top Stats Row -->
        <div class="admin-kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon-wrap bg-indigo-subtle">👥</div>
            <div class="kpi-content">
              <div class="kpi-value">${totalRegs}</div>
              <div class="kpi-label">Registered Attendees</div>
              <div class="kpi-trend text-muted">Across ${events.length} events</div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon-wrap bg-emerald-subtle">💰</div>
            <div class="kpi-content">
              <div class="kpi-value">$${totalRevenue.toLocaleString()}</div>
              <div class="kpi-label">Total Revenue Collected</div>
              <div class="kpi-trend text-muted">From paid event entries</div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon-wrap bg-cyan-subtle">🎟️</div>
            <div class="kpi-content">
              <div class="kpi-value">${checkInRate}%</div>
              <div class="kpi-label">Checked-In Rate</div>
              <div class="kpi-trend text-emerald">${checkedInCount} of ${totalRegs} attendees</div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon-wrap bg-purple-subtle">⏳</div>
            <div class="kpi-content">
              <div class="kpi-value">${totalRegs - checkedInCount}</div>
              <div class="kpi-label">Pending Gate Check-in</div>
              <div class="kpi-trend text-muted">Expected at venue</div>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="admin-charts-grid">
          <div class="admin-chart-card">
            <div class="chart-header">
              <div class="chart-title">📈 Registration & Check-in Trajectory</div>
              <span class="chart-pill">Live Timeline</span>
            </div>
            <div class="canvas-chart-container">
              <canvas id="velocityChart" height="220"></canvas>
            </div>
          </div>

          <div class="admin-chart-card">
            <div class="chart-header">
              <div class="chart-title">🏛️ Club Quota & Attendance Share</div>
              <span class="chart-pill">Active Clubs</span>
            </div>
            <div class="canvas-chart-container">
              <canvas id="clubShareChart" height="220"></canvas>
            </div>
          </div>
        </div>

        <!-- Live Campus Broadcast Terminal -->
        <div class="admin-broadcast-card">
          <div class="broadcast-header">
            <div class="broadcast-title">
              <span class="live-pulse"></span>
              <span>Campus Live Broadcast & Schedule Updates</span>
            </div>
            <span class="broadcast-hint">Instantly alerts attendees across venue screens and e-badges</span>
          </div>

          <div class="broadcast-input-row">
            <input type="text" id="broadcastTitle" class="admin-input" placeholder="Announcement Headline (e.g. Robowars Round 2 starting at Arena B)" />
            <input type="text" id="broadcastMsg" class="admin-input flex-2" placeholder="Detailed bulletin or room update..." />
            <button class="btn btn-primary" onclick="window.adminCenter.sendBroadcast()">
              📢 Push Broadcast
            </button>
          </div>

          <div class="broadcast-feed" id="broadcastFeed">
            ${this.renderBroadcastFeed(announcements)}
          </div>
        </div>

        <!-- Created Festivals & Hubs Management Section -->
        <div class="admin-table-card" style="margin-bottom: 2rem;">
          <div class="table-card-header">
            <div class="table-title-group">
              <div class="table-title">🎪 Created Festivals & Operations (${fests.length})</div>
              <div class="table-subtitle">Edit festival details, manage timelines, or remove created festival hubs</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="window.nexusApp.openCreateFestModal()">
              ➕ Add New Festival
            </button>
          </div>

          <div class="table-responsive">
            <table class="crm-table">
              <thead>
                <tr>
                  <th>Festival & Edition</th>
                  <th>Host / Society</th>
                  <th>Dates & Venue</th>
                  <th>Contests / Events</th>
                  <th>Status</th>
                  <th>Manage Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.renderCreatedFestsRows(fests, events)}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Requirement 8: Created Registration Forms Management Section -->
        <div class="admin-table-card" style="margin-bottom: 2rem;">
          <div class="table-card-header">
            <div class="table-title-group">
              <div class="table-title">📋 Created Registration Forms & Events (${events.length})</div>
              <div class="table-subtitle">Edit schemas, configure gates, toggle form expiry, or cancel created registration forms</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="window.nexusApp.switchTab('studio')">
              ➕ Create New Form
            </button>
          </div>

          <div class="table-responsive">
            <table class="crm-table">
              <thead>
                <tr>
                  <th>Event & Headline</th>
                  <th>Host & Creator</th>
                  <th>Configured Gates</th>
                  <th>Capacity / Signups</th>
                  <th>Form Status</th>
                  <th>Manage Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.renderCreatedFormsRows(events)}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Unified Participant CRM Table -->
        <div class="admin-table-card">
          <div class="table-card-header">
            <div class="table-title-group">
              <div class="table-title">Attendee Roster & E-Pass Management</div>
              <div class="table-subtitle">Search, verify payments, issue certificates, or resend passes</div>
            </div>

            <div class="table-actions-group">
              <input type="text" id="crmSearch" class="admin-search-input" placeholder="Search attendee, ticket ID, team..."
                oninput="window.adminCenter.handleSearch(this.value)" />

              <select class="admin-select" onchange="window.adminCenter.handleFestFilter(this.value)">
                <option value="all">All Fests</option>
                ${(db.getFests ? db.getFests() : []).map(f => `<option value="${f.id}" ${this.currentFestFilter === f.id ? 'selected' : ''}>${f.shortName || f.title}</option>`).join('')}
              </select>

              <select class="admin-select" onchange="window.adminCenter.handleFilter(this.value)">
                <option value="all">All Events</option>
                ${events.map(e => `<option value="${e.id}" ${this.currentFilter === e.id ? 'selected' : ''}>${e.title}</option>`).join('')}
              </select>

              <select class="admin-select" onchange="window.adminCenter.handleStatusFilter(this.value)">
                <option value="all">All Statuses</option>
                <option value="Approved" ${this.currentStatusFilter === 'Approved' ? 'selected' : ''}>Approved</option>
                <option value="Pending" ${this.currentStatusFilter === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="Waitlisted" ${this.currentStatusFilter === 'Waitlisted' ? 'selected' : ''}>Waitlisted</option>
                <option value="Checked In" ${this.currentStatusFilter === 'Checked In' ? 'selected' : ''}>Checked In</option>
                <option value="Cancelled" ${this.currentStatusFilter === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>

              <button class="btn btn-secondary btn-sm" onclick="window.adminCenter.exportCSV()">
                📥 Export Clean CSV
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="crm-table">
              <thead>
                <tr>
                  <th>Attendee & Team</th>
                  <th>Event & Fest</th>
                  <th>Ticket ID</th>
                  <th>Registration Status</th>
                  <th>Payment</th>
                  <th>Gate Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="crmTableBody">
                ${this.renderTableRows(registrations)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      this.drawVelocityChart();
      this.drawClubChart();
    }, 50);
  }

  renderBroadcastFeed(announcements) {
    return announcements.map(ann => `
      <div class="announcement-pill">
        <span class="ann-time">${ann.time}</span>
        <span class="ann-tag" style="background:${ann.color}22; color:${ann.color}; border:1px solid ${ann.color}44;">
          ${ann.tag}
        </span>
        <strong class="ann-title">${ann.title}:</strong>
        <span class="ann-msg">${ann.message}</span>
      </div>
    `).join('');
  }

  renderCreatedFestsRows(fests, events) {
    if (!fests || fests.length === 0) {
      return `
        <tr>
          <td colspan="6" style="text-align:center; padding: 2.5rem 1rem; color:var(--text-muted);">
            <div style="font-size:2rem; margin-bottom:0.5rem;">🎪</div>
            <strong>No festivals created yet.</strong>
            <p style="font-size:0.85rem; margin-top:0.25rem;">Create a festival umbrella container to host multiple contests, hackathons, and symposiums.</p>
            <button class="btn btn-primary btn-sm" style="margin-top:0.75rem;" onclick="window.nexusApp.openCreateFestModal()">
              ➕ Add New Festival
            </button>
          </td>
        </tr>
      `;
    }

    return fests.map(f => {
      const festEvents = events.filter(e => e.festId === f.id);

      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: #ffffff; font-size: 0.95rem;">${f.title}</div>
            <div style="font-size: 0.78rem; color: #818cf8; font-weight:600;">${f.edition || 'Annual Edition'}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${(f.description || f.tagline || '').replace(/"/g, '&quot;')}">
              ${f.description || f.tagline || ''}
            </div>
          </td>
          <td>
            <div style="font-size: 0.88rem; color: #c7d2fe;">${f.organization || 'Campus Society'}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${f.shortName || f.title}</div>
          </td>
          <td>
            <div style="font-size: 0.84rem; color: #ffffff;">📅 ${f.date || 'TBA'}</div>
            <div style="font-size: 0.76rem; color: var(--text-muted);">📍 ${f.venue || 'Campus'}</div>
          </td>
          <td>
            <span class="fest-event-mini-pill" style="font-size:0.75rem; color:#38bdf8;">
              ${festEvents.length} Contests / Events
            </span>
          </td>
          <td>
            <span class="badge status-approved" style="font-size:0.75rem;">
              🟢 ${f.status || 'Active'}
            </span>
          </td>
          <td>
            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
              <button class="btn btn-secondary btn-sm" onclick="window.nexusApp.openEditFestModal('${f.id}')" title="Edit Festival details and info">
                ✏️ Edit
              </button>
              <button class="btn btn-outline-danger btn-sm" onclick="window.nexusApp.deleteFest('${f.id}')" title="Delete & Remove Festival">
                🗑️ Remove
              </button>
              <button class="btn btn-primary btn-sm btn-glow" onclick="window.nexusApp.switchTab('arena'); setTimeout(() => window.nexusApp.openFestDetails('${f.id}'), 120);" title="View Festival Arena">
                🎪 View
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Requirement 8: Render Created Forms Rows with Edit, Expire & Cancel Controls
  renderCreatedFormsRows(events) {
    if (!events || events.length === 0) {
      return `
        <tr>
          <td colspan="6" style="text-align:center; padding: 2.5rem 1rem; color:var(--text-muted);">
            <div style="font-size:2rem; margin-bottom:0.5rem;">📝</div>
            <strong>No registration forms created yet.</strong>
            <p style="font-size:0.85rem; margin-top:0.25rem;">Create your first event registration form with custom gates and expiry controls.</p>
            <button class="btn btn-primary btn-sm" style="margin-top:0.75rem;" onclick="window.nexusApp.switchTab('studio')">
              + Launch Registration Form
            </button>
          </td>
        </tr>
      `;
    }

    return events.map(evt => {
      const isExpired = Boolean(evt.isExpired);
      const gatesList = (evt.gates && evt.gates.length > 0)
        ? evt.gates.map(g => `<span class="fest-event-mini-pill" style="font-size:0.75rem;">🚪 ${g.name}</span>`).join(' ')
        : '<span class="text-muted">Standard Gate</span>';

      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: #ffffff;">${evt.title}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${evt.headline || evt.tagline || ''}</div>
          </td>
          <td>
            <div style="font-size: 0.88rem; color: #c7d2fe;">${evt.clubName || 'Campus Org'}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">By: ${evt.creatorName || evt.createdBy || 'Campus Member'}</div>
          </td>
          <td>
            <div style="display:flex; flex-wrap:wrap; gap:4px; max-width:240px;">
              ${gatesList}
            </div>
          </td>
          <td>
            <div style="font-weight: 600;">${evt.registeredCount || 0} / ${evt.capacity}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${evt.isTeam ? `Team (${evt.minTeam}-${evt.maxTeam})` : 'Solo'}</div>
          </td>
          <td>
            <span class="badge ${isExpired ? 'status-cancelled' : 'status-approved'}" style="font-size:0.75rem;">
              ${isExpired ? '🔴 EXPIRED' : '🟢 ACTIVE'}
            </span>
          </td>
          <td>
            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
              <button class="btn btn-primary btn-sm btn-glow" onclick="window.nexusApp.startRegistration('${evt.id}')" title="Register / Participate in this event">
                🎟️ Participate
              </button>
              <button class="btn btn-secondary btn-sm" onclick="window.adminCenter.editForm('${evt.id}')" title="Edit Form Questions & Gates">
                ✏️ Edit
              </button>
              <button class="btn btn-sm ${isExpired ? 'btn-primary' : 'btn-secondary'}" 
                onclick="window.adminCenter.toggleEventExpiry('${evt.id}')" 
                title="${isExpired ? 'Reopen Registrations' : 'Expire Registrations'}">
                ${isExpired ? '🟢 Reopen' : '⏰ Expire'}
              </button>
              <button class="btn btn-danger btn-sm" onclick="window.adminCenter.cancelCreatedForm('${evt.id}')" title="Cancel & Delete Event">
                🚫 Cancel
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  editFest(festId) {
    if (window.nexusApp && window.nexusApp.openEditFestModal) {
      window.nexusApp.openEditFestModal(festId);
    }
  }

  deleteFest(festId) {
    if (window.nexusApp && window.nexusApp.deleteFest) {
      window.nexusApp.deleteFest(festId);
    }
  }

  // Requirement 8: Edit created form in Form Studio
  editForm(eventId) {
    if (window.formStudio) {
      window.formStudio.loadEventForEditing(eventId);
    }
    if (window.nexusApp) {
      window.nexusApp.switchTab('studio');
    }
  }

  // Requirement 6: Expiry button that can be edited by organizer
  toggleEventExpiry(eventId) {
    const event = (db.getEvents ? db.getEvents() : []).find(e => e.id === eventId);
    if (!event) return;
    event.isExpired = !event.isExpired;
    db.save();
    this.render();
    if (window.nexusApp) {
      window.nexusApp.renderFestArena();
      window.nexusApp.updateHeroStats();
    }
    this.showToast(`Form for "${event.title}" is now ${event.isExpired ? 'EXPIRED' : 'ACTIVE'}.`);
  }

  // Requirement 8: Cancel created form from dashboard
  cancelCreatedForm(eventId) {
    const event = (db.getEvents ? db.getEvents() : []).find(e => e.id === eventId);
    if (!event) return;
    if (confirm(`Are you sure you want to cancel and delete "${event.title}"? This cannot be undone.`)) {
      db.deleteEvent(eventId);
      this.render();
      if (window.nexusApp) {
        window.nexusApp.renderFestArena();
        window.nexusApp.updateHeroStats();
      }
      this.showToast(`Cancelled and removed registration form "${event.title}".`);
    }
  }

  renderTableRows(regs) {
    let filtered = regs;
    if (this.currentFestFilter !== 'all') {
      filtered = filtered.filter(r => r.festId === this.currentFestFilter);
    }
    if (this.currentFilter !== 'all') {
      filtered = filtered.filter(r => r.eventId === this.currentFilter);
    }
    if (this.currentStatusFilter !== 'all') {
      filtered = filtered.filter(r => (r.registrationStatus || 'Approved') === this.currentStatusFilter);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.leadName.toLowerCase().includes(q) ||
        r.ticketId.toLowerCase().includes(q) ||
        (r.teamName && r.teamName.toLowerCase().includes(q)) ||
        r.eventTitle.toLowerCase().includes(q) ||
        (r.festTitle && r.festTitle.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      return `<tr><td colspan="7" class="table-empty">No attendee records match your filter criteria.</td></tr>`;
    }

    return filtered.map(r => {
      const status = r.registrationStatus || (r.checkedIn ? 'Checked In' : 'Approved');
      const statusClass = 'status-' + status.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      return `
      <tr>
        <td>
          <div class="crm-attendee-cell">
            <div class="crm-avatar">${r.leadName.charAt(0)}</div>
            <div>
              <div class="crm-name">${r.leadName}</div>
              <div class="crm-email">${r.leadEmail}</div>
              ${r.teamName ? `<div class="crm-team">Team: <strong>${r.teamName}</strong> (${r.teamMembers?.length || 1})</div>` : ''}
            </div>
          </div>
        </td>
        <td>
          <div class="crm-event-name">${r.eventTitle}</div>
          <div class="crm-club-name">${r.festTitle || r.clubName}</div>
        </td>
        <td>
          <span class="mono crm-ticket-id">${r.ticketId}</span>
        </td>
        <td>
          <select class="admin-status-dropdown ${statusClass}" 
            onchange="window.adminCenter.updateParticipantStatus('${r.ticketId}', this.value)">
            <option value="Approved" ${status === 'Approved' ? 'selected' : ''}>✅ Approved</option>
            <option value="Pending" ${status === 'Pending' ? 'selected' : ''}>⏳ Pending</option>
            <option value="Waitlisted" ${status === 'Waitlisted' ? 'selected' : ''}>📋 Waitlisted</option>
            <option value="Checked In" ${status === 'Checked In' ? 'selected' : ''}>🟢 Checked In</option>
            <option value="Cancelled" ${status === 'Cancelled' ? 'selected' : ''}>❌ Cancelled</option>
          </select>
        </td>
        <td>
          <span class="badge ${r.amount === 0 ? 'badge-neutral' : 'badge-paid'}">
            ${r.amount === 0 ? 'FREE TIER' : '$' + r.amount + ' VERIFIED'}
          </span>
        </td>
        <td>
          <span class="badge ${r.checkedIn ? 'badge-checked' : 'badge-pending'}">
            ${r.checkedIn ? '🟢 VERIFIED' : '🟡 AT GATE'}
          </span>
        </td>
        <td>
          <div class="crm-actions">
            <button class="crm-btn" title="View Digital Pass" onclick="window.nexusApp.openBadgeModal('${r.ticketId}')">
              🎫 Pass
            </button>
            <button class="crm-btn" title="Dispense Certificate" onclick="window.adminCenter.openCertificate('${r.ticketId}')">
              🏆 Cert
            </button>
            <button class="crm-btn" title="Quick Toggle Check-in" onclick="window.adminCenter.toggleCheckIn('${r.ticketId}')">
              ${r.checkedIn ? 'Undo' : 'Check-in'}
            </button>
          </div>
        </td>
      </tr>
      `;
    }).join('');
  }

  handleSearch(val) {
    this.searchQuery = val;
    const body = document.getElementById('crmTableBody');
    if (body) {
      body.innerHTML = this.renderTableRows(db.getRegistrations());
    }
  }

  handleFestFilter(festId) {
    this.currentFestFilter = festId;
    const body = document.getElementById('crmTableBody');
    if (body) {
      body.innerHTML = this.renderTableRows(db.getRegistrations());
    }
  }

  handleStatusFilter(status) {
    this.currentStatusFilter = status;
    const body = document.getElementById('crmTableBody');
    if (body) {
      body.innerHTML = this.renderTableRows(db.getRegistrations());
    }
  }

  handleFilter(eventId) {
    this.currentFilter = eventId;
    const body = document.getElementById('crmTableBody');
    if (body) {
      body.innerHTML = this.renderTableRows(db.getRegistrations());
    }
  }

  updateParticipantStatus(ticketId, newStatus) {
    sound.playClick();
    db.updateRegistrationStatus(ticketId, newStatus);
    const body = document.getElementById('crmTableBody');
    if (body) {
      body.innerHTML = this.renderTableRows(db.getRegistrations());
    }
    this.showToast(`Updated: ${ticketId} set to "${newStatus}"`);
  }

  showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'nexus-toast toast-success';
    toast.innerHTML = `
      <div class="toast-icon">⚡</div>
      <div class="toast-content">
        <div class="toast-title">Organizer Management</div>
        <div class="toast-desc">${msg}</div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 50);
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

  toggleCheckIn(ticketId) {
    sound.playClick();
    const reg = db.getRegistrations().find(r => r.ticketId === ticketId);
    if (reg) {
      reg.checkedIn = !reg.checkedIn;
      if (reg.checkedIn) {
        reg.checkedInAt = new Date().toISOString();
        reg.gate = 'Manual Admin Override';
      }
      db.save();
      this.render();
    }
  }

  openCertificate(ticketId) {
    const reg = db.getRegistrations().find(r => r.ticketId === ticketId);
    if (!reg) return;
    const modalContainer = document.getElementById('globalModalContainer');
    if (modalContainer) {
      modalContainer.innerHTML = renderCertificateModal(reg, reg.eventTitle, reg.clubName);
    }
  }

  sendBroadcast() {
    const titleInput = document.getElementById('broadcastTitle');
    const msgInput = document.getElementById('broadcastMsg');
    if (!titleInput || !msgInput) return;

    const title = titleInput.value.trim();
    const msg = msgInput.value.trim();
    if (!title) {
      alert('Please enter a broadcast announcement headline.');
      return;
    }

    sound.playPassUnlocked();
    db.addAnnouncement(title, msg || 'Please refer to event volunteers for immediate instructions.');
    titleInput.value = '';
    msgInput.value = '';

    const feed = document.getElementById('broadcastFeed');
    if (feed) {
      feed.innerHTML = this.renderBroadcastFeed(db.state.announcements);
    }

    // Also update hero ticker if visible
    if (window.nexusApp) {
      window.nexusApp.updateAnnouncementTicker();
    }
  }

  exportCSV() {
    sound.playClick();
    const registrations = db.getRegistrations();
    const headers = ['Ticket ID', 'Attendee Name', 'Email', 'Roll No', 'Fest', 'Event', 'Team Name', 'Members Count', 'Status', 'Amount Paid', 'Checked In', 'Check In Time', 'Gate'];
    
    const rows = registrations.map(r => [
      r.ticketId,
      `"${r.leadName}"`,
      r.leadEmail,
      r.collegeRoll || '',
      `"${r.festTitle || 'Campus Fest'}"`,
      `"${r.eventTitle}"`,
      `"${r.teamName || 'Solo'}"`,
      r.teamMembers ? r.teamMembers.length : 1,
      r.registrationStatus || 'Approved',
      r.amount || 0,
      r.checkedIn ? 'YES' : 'NO',
      r.checkedInAt || '',
      r.gate || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexus_fest_roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Pure HTML5 Canvas Velocity Chart
  drawVelocityChart() {
    const canvas = document.getElementById('velocityChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = (canvas.width = canvas.parentElement.clientWidth || 500);
    const height = (canvas.height = 220);

    ctx.clearRect(0, 0, width, height);

    const dataPoints = [12, 28, 45, 62, 98, 140, 210, 290, 360, 420];
    const labels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7', 'Day 8', 'Day 9', 'Day 10'];

    const padding = { top: 20, right: 30, bottom: 35, left: 45 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = 500;

    // Draw horizontal grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal - (maxVal / 4) * i), padding.left - 8, y + 3);
    }

    // Build curve points
    const stepX = chartW / (dataPoints.length - 1);
    const points = dataPoints.map((val, idx) => ({
      x: padding.left + idx * stepX,
      y: padding.top + chartH - (val / maxVal) * chartH
    }));

    // Area fill gradient
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const cur = points[i];
      const cx = (prev.x + cur.x) / 2;
      ctx.bezierCurveTo(cx, prev.y, cx, cur.y, cur.x, cur.y);
    }
    ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
    ctx.lineTo(points[0].x, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw stroke line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const cur = points[i];
      const cx = (prev.x + cur.x) / 2;
      ctx.bezierCurveTo(cx, prev.y, cx, cur.y, cur.x, cur.y);
    }
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw points and labels
    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 2;
      ctx.stroke();

      // X Labels
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], p.x, height - 12);
    });
  }

  // Pure HTML5 Canvas Club Share Donut / Bar Chart
  drawClubChart() {
    const canvas = document.getElementById('clubShareChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = (canvas.width = canvas.parentElement.clientWidth || 500);
    const height = (canvas.height = 220);

    ctx.clearRect(0, 0, width, height);

    const clubData = [
      { name: 'Turing (Tech)', count: 127, color: '#6366f1' },
      { name: 'SoundWave (Music)', count: 61, color: '#ec4899' },
      { name: 'Robotics Guild', count: 48, color: '#10b981' },
      { name: 'E-Cell (Startups)', count: 35, color: '#f59e0b' }
    ];

    const total = clubData.reduce((acc, c) => acc + c.count, 0);
    const centerX = width * 0.32;
    const centerY = height * 0.5;
    const outerRadius = 75;
    const innerRadius = 45;

    let startAngle = -Math.PI / 2;

    clubData.forEach(c => {
      const sliceAngle = (c.count / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = c.color;
      ctx.fill();

      startAngle += sliceAngle;
    });

    // Center text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${total}`, centerX, centerY - 6);

    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('Attendees', centerX, centerY + 12);

    // Legend
    const legendX = width * 0.58;
    let legendY = 40;

    clubData.forEach(c => {
      // Color dot
      ctx.beginPath();
      ctx.arc(legendX, legendY + 5, 5, 0, Math.PI * 2);
      ctx.fillStyle = c.color;
      ctx.fill();

      // Text
      ctx.fillStyle = '#f8fafc';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.name, legendX + 12, legendY + 5);

      // Percentage
      const pct = Math.round((c.count / total) * 100);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(`${c.count} (${pct}%)`, legendX + 12, legendY + 22);

      legendY += 40;
    });
  }

  // ===================================================================
  // USER PROFILE & ACCOUNT SETTINGS (Dashboard Management)
  // ===================================================================

  renderUserProfileSection() {
    const user = auth.currentUser;

    if (!user) {
      return `
        <div class="admin-profile-card unauth-profile-card" id="dashboardUserProfileCard">
          <div class="unauth-profile-inner">
            <div class="unauth-profile-icon">👤</div>
            <div class="unauth-profile-text">
              <h3 style="font-size:1.25rem; font-weight:800; color:#fff; margin-bottom:0.35rem;">Personalize Your Profile & Digital Passes</h3>
              <p style="color:var(--text-muted); font-size:0.9rem; line-height:1.5;">Sign in with Google or create an account to customize your profile name, picture, campus ID, phone, department, and contact information across NexusOps.</p>
            </div>
            <button class="btn btn-primary btn-glow btn-lg" onclick="window.authSystem.openAuthModal('signin')">
              👤 Sign In / Create Account &rarr;
            </button>
          </div>
        </div>
      `;
    }

    const currentAvatar = this.pendingAvatar !== null ? this.pendingAvatar : user.avatar;
    const isImg = currentAvatar && (currentAvatar.startsWith('data:image') || currentAvatar.startsWith('http') || currentAvatar.startsWith('blob:'));
    const avatarPreviewHTML = isImg
      ? `<img src="${currentAvatar}" alt="${user.name}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`
      : `<div style="font-size:2.8rem; line-height:1; display:flex; align-items:center; justify-content:center; width:100%; height:100%;">${currentAvatar || user.name.charAt(0).toUpperCase()}</div>`;

    return `
      <div class="admin-profile-card" id="dashboardUserProfileCard">
        <div class="profile-card-header">
          <div class="profile-header-left">
            <div class="profile-section-badge">
              <span class="badge-dot pulse"></span>
              <span>${user.provider === 'google' ? 'Google Verified Account' : 'Campus Member Account'}</span>
            </div>
            <h2 class="profile-card-title">👤 My Profile & Account Settings</h2>
            <p class="profile-card-sub">Edit your profile name, picture, and contact details. Reflected automatically across your passes, registrations, and forms.</p>
          </div>
          <div class="profile-header-right">
            <span class="sync-status-tag">⚡ Live Sync Enabled</span>
          </div>
        </div>

        <div class="profile-editor-layout">
          <!-- Left Column: Picture / Avatar Manager -->
          <div class="profile-avatar-col">
            <div class="profile-avatar-preview-box" id="dashboardAvatarPreview">
              ${avatarPreviewHTML}
            </div>
            <div class="avatar-title-label">${user.name}</div>
            <div class="avatar-role-label">${user.provider === 'google' ? 'Google Account' : 'Registered Member'}</div>

            <div class="avatar-actions-wrap">
              <label class="btn btn-sm btn-primary btn-glow btn-block" style="cursor:pointer; margin-bottom:0.5rem;">
                📷 Upload Photo File
                <input type="file" id="dashboardPhotoFileInput" accept="image/*" style="display:none;" onchange="window.adminCenter.handleProfilePhotoUpload(event)" />
              </label>

              <div class="url-input-wrap mb-2">
                <input type="url" id="dashboardPhotoUrlInput" class="form-input form-input-sm" 
                  placeholder="Or paste image link (https://...)" 
                  value="${(currentAvatar && currentAvatar.startsWith('http')) ? currentAvatar : ''}"
                  oninput="window.adminCenter.handleProfilePhotoUrlChange(this.value)" />
              </div>

              <div class="avatar-presets-grid">
                <span class="presets-caption">Or choose an avatar:</span>
                <div class="presets-emoji-list">
                  ${['👨‍💻', '👩‍💻', '🚀', '⚡', '🤖', '🎓', '🌟', '🦊', '🎨', '🦁', '💡', '🏆'].map(emoji => `
                    <button type="button" class="btn-emoji-pick-sm" onclick="window.adminCenter.selectProfileAvatarEmoji('${emoji}')" title="Pick ${emoji}">
                      ${emoji}
                    </button>
                  `).join('')}
                </div>
              </div>

              <button type="button" class="btn btn-sm btn-secondary btn-block mt-2" onclick="window.adminCenter.useInitialsAvatar()">
                Use Initials (${user.name ? user.name.charAt(0).toUpperCase() : 'U'})
              </button>
            </div>
          </div>

          <!-- Right Column: Personal Information & Contact Inputs -->
          <div class="profile-fields-col">
            <form onsubmit="event.preventDefault(); window.adminCenter.saveProfileChanges();">
              <div class="profile-fields-grid">
                <div class="form-group">
                  <label class="form-label">Full Name <span class="req">*</span></label>
                  <input type="text" id="profName" class="form-input" value="${user.name || ''}" placeholder="e.g. Maya Chen" required />
                </div>

                <div class="form-group">
                  <label class="form-label">Email Address <span class="req">*</span></label>
                  <input type="email" id="profEmail" class="form-input" value="${user.email || ''}" placeholder="e.g. student@campus.edu" required />
                </div>

                <div class="form-group">
                  <label class="form-label">Campus Student Roll / Member ID</label>
                  <input type="text" id="profRoll" class="form-input" value="${user.rollNo || ''}" placeholder="e.g. 2024-CS-088" />
                </div>

                <div class="form-group">
                  <label class="form-label">Contact Phone Number</label>
                  <input type="tel" id="profPhone" class="form-input" value="${user.phone || ''}" placeholder="e.g. +1 555-0199" />
                </div>

                <div class="form-group">
                  <label class="form-label">Department / Academic Major</label>
                  <input type="text" id="profDept" class="form-input" value="${user.department || ''}" placeholder="e.g. Computer Science & Software Engineering" />
                </div>

                <div class="form-group">
                  <label class="form-label">Organization / Club / Institution</label>
                  <input type="text" id="profOrg" class="form-input" value="${user.organization || ''}" placeholder="e.g. Campus Tech Society" />
                </div>
              </div>

              <div class="form-group mt-3">
                <label class="form-label">Bio / Profile Description</label>
                <textarea id="profBio" class="form-input" rows="2" placeholder="Brief tagline or description...">${user.bio || ''}</textarea>
              </div>

              <div class="profile-save-bar">
                <button type="submit" class="btn btn-primary btn-glow btn-lg">
                  💾 Save Profile Changes &rarr;
                </button>
                <button type="button" class="btn btn-secondary btn-lg" onclick="window.adminCenter.resetProfileChanges()">
                  Discard Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  handleProfilePhotoUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file (PNG, JPG, WebP, etc.).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alert('Image size exceeds 3MB. Please select a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.pendingAvatar = e.target.result;
      const previewEl = document.getElementById('dashboardAvatarPreview');
      if (previewEl) {
        previewEl.innerHTML = `<img src="${this.pendingAvatar}" alt="Preview" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`;
      }
      const urlInput = document.getElementById('dashboardPhotoUrlInput');
      if (urlInput) urlInput.value = '';
    };
    reader.readAsDataURL(file);
  }

  handleProfilePhotoUrlChange(url) {
    url = url.trim();
    if (!url) return;
    this.pendingAvatar = url;
    const previewEl = document.getElementById('dashboardAvatarPreview');
    if (previewEl) {
      previewEl.innerHTML = `<img src="${url}" alt="Preview" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" onerror="this.parentElement.textContent='👤'" />`;
    }
  }

  selectProfileAvatarEmoji(emoji) {
    sound.playClick();
    this.pendingAvatar = emoji;
    const previewEl = document.getElementById('dashboardAvatarPreview');
    if (previewEl) {
      previewEl.innerHTML = `<div style="font-size:2.8rem; line-height:1; display:flex; align-items:center; justify-content:center; width:100%; height:100%;">${emoji}</div>`;
    }
    const urlInput = document.getElementById('dashboardPhotoUrlInput');
    if (urlInput) urlInput.value = '';
  }

  useInitialsAvatar() {
    sound.playClick();
    const name = document.getElementById('profName')?.value.trim() || 'User';
    const initial = name.charAt(0).toUpperCase();
    this.pendingAvatar = initial;
    const previewEl = document.getElementById('dashboardAvatarPreview');
    if (previewEl) {
      previewEl.innerHTML = `<div style="font-size:2.5rem; font-weight:800; color:#fff; display:flex; align-items:center; justify-content:center; width:100%; height:100%;">${initial}</div>`;
    }
    const urlInput = document.getElementById('dashboardPhotoUrlInput');
    if (urlInput) urlInput.value = '';
  }

  resetProfileChanges() {
    sound.playClick();
    this.pendingAvatar = null;
    this.render();
  }

  saveProfileChanges() {
    sound.playPassUnlocked();
    const user = auth.currentUser;
    if (!user) {
      alert('Please sign in first.');
      return;
    }

    const name = document.getElementById('profName')?.value.trim();
    const email = document.getElementById('profEmail')?.value.trim();
    const rollNo = document.getElementById('profRoll')?.value.trim();
    const phone = document.getElementById('profPhone')?.value.trim();
    const department = document.getElementById('profDept')?.value.trim();
    const organization = document.getElementById('profOrg')?.value.trim();
    const bio = document.getElementById('profBio')?.value.trim();

    if (!name || !email) {
      alert('Full Name and Email Address are required.');
      return;
    }

    const newAvatar = this.pendingAvatar !== null ? this.pendingAvatar : (user.avatar || name.charAt(0).toUpperCase());

    const updatedUser = {
      ...user,
      name,
      email,
      rollNo,
      phone,
      department,
      organization,
      bio,
      avatar: newAvatar
    };

    // Update in auth system and localStorage
    auth.saveUser(updatedUser);

    // If Google account, update in saved accounts list
    if (updatedUser.provider === 'google') {
      auth.updateSavedGoogleAccount(updatedUser);
    }

    // Update existing registrations for this attendee in database
    const regs = db.getRegistrations();
    let updatedRegs = false;
    regs.forEach(r => {
      if (r.userId === updatedUser.id || r.leadEmail === user.email) {
        r.leadName = updatedUser.name;
        r.leadEmail = updatedUser.email;
        if (updatedUser.phone) r.leadPhone = updatedUser.phone;
        if (updatedUser.rollNo) r.collegeRoll = updatedUser.rollNo;
        r.leadAvatar = newAvatar;
        updatedRegs = true;
      }
    });
    if (updatedRegs) {
      db.saveRegistrations(regs);
    }

    this.pendingAvatar = null;
    this.render();

    // Show toast
    if (window.nexusApp) {
      window.nexusApp.showToast(`Profile updated! Name & picture refreshed.`);
    } else {
      alert('Profile updated successfully!');
    }
  }

  scrollToProfile() {
    const card = document.getElementById('dashboardUserProfileCard');
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      card.classList.add('highlight-pulse');
      setTimeout(() => card.classList.remove('highlight-pulse'), 2000);
    }
  }
}
