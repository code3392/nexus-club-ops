// Analytics Charts and Organizer Command Center Logic
import { db } from './data.js';
import { sound } from './sound.js';
import { renderCertificateModal } from './certificates.js';

export class AdminCommandCenter {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentFilter = 'all';
    this.currentFestFilter = 'all';
    this.currentStatusFilter = 'all';
    this.searchQuery = '';
  }

  init() {
    this.render();
  }

  render() {
    if (!this.container) return;

    const registrations = db.getRegistrations();
    const events = db.getEvents();
    const clubs = db.getClubs();
    const announcements = db.state.announcements || [];

    const totalRegs = registrations.length;
    const totalRevenue = registrations.reduce((sum, r) => sum + (r.amount || 0), 0);
    const checkedInCount = registrations.filter(r => r.checkedIn).length;
    const checkInRate = totalRegs > 0 ? Math.round((checkedInCount / totalRegs) * 100) : 0;

    this.container.innerHTML = `
      <div class="admin-dashboard-wrap">
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
      `"${r.festTitle || 'DRMC Fest'}"`,
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
}
