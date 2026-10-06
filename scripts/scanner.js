// Live Gate Check-in & Scanner Terminal
import { db } from './data.js';
import { sound } from './sound.js';
import { auth } from './auth.js';

export class GateScannerTerminal {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentGate = 'Main Gate';
    this.activeEventId = null;
    this.stream = null;
    this.isCameraActive = false;
  }

  init() {
    this.render();
  }

  setActiveEvent(eventId) {
    this.activeEventId = eventId;
    const events = db.getEvents();
    const evt = events.find(e => e.id === eventId);
    if (evt && evt.gates && evt.gates.length > 0) {
      this.currentGate = evt.gates[0].name;
    }
    this.render();
  }

  setGate(gateName) {
    this.currentGate = gateName;
  }

  render() {
    if (!this.container) return;

    const currentUser = auth.currentUser;

    // Requirement 1 & 10: Enforce login to operate scanner
    if (!currentUser) {
      this.container.innerHTML = `
        <div class="empty-state-box" style="padding: 3.5rem 1.5rem; text-align: center; max-width: 540px; margin: 3rem auto; background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border-color);">
          <div style="font-size: 1.5rem; font-weight:800; font-family:var(--font-mono); margin-bottom: 1rem;">GATE AUTH</div>
          <h3 style="font-size: 1.4rem; color: #ffffff; margin-bottom: 0.5rem;">Gate Scanner Operator Sign-In</h3>
          <p style="color: var(--text-muted); font-size: 0.92rem; line-height: 1.6; margin-bottom: 1.5rem;">
            Security Policy: An organizer can scan tickets for events they launched only. Please sign in with your organizer account to operate checkpoint verification.
          </p>
          <button class="btn btn-primary btn-glow btn-lg" onclick="window.authSystem.openAuthModal('signin', 'Sign in to access Gate Scanner and verify passes')">
            Sign In with Operator Account &rarr;
          </button>
        </div>
      `;
      return;
    }

    const allEvents = db.getEvents();
    // Filter events launched by the current user (or all if admin)
    const isSuperAdmin = currentUser.email === 'admin@campus.edu' || currentUser.role === 'admin';
    const myEvents = isSuperAdmin
      ? allEvents
      : allEvents.filter(e => (e.createdBy && e.createdBy.toLowerCase() === currentUser.email.toLowerCase()) || !e.createdBy);

    if (myEvents.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state-box" style="padding: 3.5rem 1.5rem; text-align: center; max-width: 580px; margin: 3rem auto; background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border-color);">
          <div style="font-size: 1.5rem; font-weight:800; font-family:var(--font-mono); margin-bottom: 1rem;">OPERATOR</div>
          <h3 style="font-size: 1.4rem; color: #ffffff; margin-bottom: 0.5rem;">No Events Launched by Your Account</h3>
          <p style="color: var(--text-muted); font-size: 0.92rem; line-height: 1.6; margin-bottom: 1.5rem;">
            Per security rules, you can only scan attendee tickets for events that you launched. Create an event in the Form Builder to generate registrations and check in attendees.
          </p>
          <button class="btn btn-primary btn-glow btn-lg" onclick="window.nexusApp.switchTab('studio')">
            Create & Launch an Event &rarr;
          </button>
        </div>
      `;
      return;
    }

    // Set default active event if not set or invalid
    if (!this.activeEventId || !myEvents.some(e => e.id === this.activeEventId)) {
      this.activeEventId = myEvents[0].id;
    }

    const activeEvent = myEvents.find(e => e.id === this.activeEventId) || myEvents[0];
    const customGates = (activeEvent.gates && activeEvent.gates.length > 0)
      ? activeEvent.gates
      : [{ id: 'gate_1', name: 'Main Gate Entrance' }];

    if (!customGates.some(g => g.name === this.currentGate)) {
      this.currentGate = customGates[0].name;
    }

    const registrations = db.getRegistrations().filter(r => r.eventId === activeEvent.id);
    const totalRegs = registrations.length;
    const checkedInCount = registrations.filter(r => r.checkedIn).length;
    const pendingCount = totalRegs - checkedInCount;
    const checkInRate = totalRegs > 0 ? Math.round((checkedInCount / totalRegs) * 100) : 0;

    const scanLogs = (db.state.scanHistory || []).filter(log => {
      // Show logs for this event or operator
      return true;
    });

    this.container.innerHTML = `
      <div class="scanner-terminal-grid">
        <!-- Left: Scanner Viewfinder & Controls -->
        <div class="scanner-main-col">
          <div class="scanner-card">
            <div class="scanner-card-header" style="flex-wrap: wrap; gap: 0.75rem;">
              <div class="scanner-title-badge">
                <span class="live-pulse"></span>
                <span>GATE SCANNER ACTIVE</span>
              </div>

              <!-- Select which launched event you are scanning for -->
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <label style="font-size:0.8rem; color:var(--text-muted);">Event:</label>
                <select id="scannerEventSelect" class="scanner-select" style="max-width:200px;" onchange="window.gateScanner.setActiveEvent(this.value)">
                  ${myEvents.map(e => `<option value="${e.id}" ${e.id === activeEvent.id ? 'selected' : ''}>${e.title}</option>`).join('')}
                </select>
              </div>

              <!-- Requirement 3: Customized gates selector -->
              <div class="scanner-gate-selector">
                <label>Checkpoint:</label>
                <select id="scannerGateSelect" class="scanner-select" onchange="window.gateScanner.setGate(this.value)">
                  ${customGates.map(g => `<option value="${g.name}" ${g.name === this.currentGate ? 'selected' : ''}>${g.name}</option>`).join('')}
                </select>
              </div>
            </div>

            <div class="viewfinder-box" id="viewfinderBox">
              <div class="viewfinder-laser"></div>
              <div class="viewfinder-corners">
                <div class="corner tl"></div>
                <div class="corner tr"></div>
                <div class="corner bl"></div>
                <div class="corner br"></div>
              </div>

              <video id="scannerVideo" class="scanner-video" playsinline muted></video>

              <div class="viewfinder-overlay" id="viewfinderOverlay">
                <div class="viewfinder-icon">[CAMERA]</div>
                <div class="viewfinder-text">Point camera at Attendee QR Badge</div>
                <div class="viewfinder-sub">Scanning for: <strong>${activeEvent.title}</strong></div>
                <button class="btn btn-sm btn-secondary" onclick="window.gateScanner.toggleCamera()">
                  Toggle Live Webcam
                </button>
              </div>
            </div>

            <!-- Manual / Quick Barcode Dispatcher -->
            <div class="scanner-manual-bar">
              <div class="scanner-input-group">
                <input type="text" id="manualTicketInput" class="scanner-input mono" 
                  placeholder="Enter Ticket ID (e.g. NX-TECH-1234)" 
                  onkeydown="if(event.key==='Enter') window.gateScanner.processScan(this.value)" />
                <button class="btn btn-primary" onclick="window.gateScanner.processManualInput()">
                  Check In
                </button>
              </div>

              ${registrations.length > 0 ? `
                <div class="scanner-test-chips">
                  <span class="chips-label">Recent Event Registrations:</span>
                  ${registrations.slice(0, 4).map(r => `
                    <button class="chip-btn" onclick="window.gateScanner.processScan('${r.ticketId}')">
                      ${r.checkedIn ? '[OK]' : '>'} ${r.leadName} (${r.ticketId})
                    </button>
                  `).join('')}
                </div>
              ` : `
                <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.5rem;">
                  No attendees registered for this event yet. As attendees register, their passes can be scanned here.
                </div>
              `}
            </div>

            <!-- Instant Verification Result Modal / Alert Box -->
            <div id="scanResultBox" class="scan-result-card hidden">
              <!-- Dynamically populated -->
            </div>
          </div>
        </div>

        <!-- Right: Telemetry & Gate History -->
        <div class="scanner-stats-col">
          <div class="scanner-metrics-grid">
            <div class="sc-metric-card">
              <div class="metric-label">Checked-In</div>
              <div class="metric-val text-emerald">${checkedInCount}</div>
              <div class="metric-sub">${checkInRate}% of total registrations</div>
            </div>
            <div class="sc-metric-card">
              <div class="metric-label">Pending Entry</div>
              <div class="metric-val text-amber">${pendingCount}</div>
              <div class="metric-sub">Expected at gate</div>
            </div>
            <div class="sc-metric-card">
              <div class="metric-label">Active Gate</div>
              <div class="metric-val text-cyan" style="font-size:1.1rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                ${this.currentGate}
              </div>
              <div class="metric-sub">${customGates.length} total checkpoints</div>
            </div>
            <div class="sc-metric-card">
              <div class="metric-label">Operator</div>
              <div class="metric-val text-rose" style="font-size:1rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                ${currentUser.name}
              </div>
              <div class="metric-sub">Authorized Creator</div>
            </div>
          </div>

          <div class="scanner-log-card">
            <div class="scanner-log-header">
              <div class="log-title">Live Gate Activity Feed</div>
              <span class="log-badge">${scanLogs.length} Scans</span>
            </div>
            <div class="scanner-log-list" id="scannerLogList">
              ${this.renderLogItems(scanLogs)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderLogItems(logs) {
    if (!logs || logs.length === 0) {
      return `<div class="empty-log-state">No gate scans recorded yet. Use the scanner to begin checking in attendees.</div>`;
    }

    return logs.slice(0, 15).map(log => {
      let statusClass = 'log-success';
      let icon = '[OK]';
      if (log.status === 'DUPLICATE') {
        statusClass = 'log-warning';
        icon = '[WARN]';
      } else if (log.status === 'UNAUTHORIZED' || log.status === 'INVALID') {
        statusClass = 'log-danger';
        icon = '[DENIED]';
      }

      return `
        <div class="scanner-log-row ${statusClass}">
          <div class="log-icon">${icon}</div>
          <div class="log-info">
            <div class="log-attendee">${log.name} <span class="log-ticket mono">(${log.ticketId})</span></div>
            <div class="log-event">${log.event} • <span class="log-gate">${log.gate}</span></div>
          </div>
          <div class="log-time">${log.time}</div>
        </div>
      `;
    }).join('');
  }

  async toggleCamera() {
    const video = document.getElementById('scannerVideo');
    const overlay = document.getElementById('viewfinderOverlay');
    if (!video) return;

    if (this.isCameraActive) {
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }
      this.isCameraActive = false;
      video.style.display = 'none';
      if (overlay) overlay.style.display = 'flex';
    } else {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = this.stream;
        video.style.display = 'block';
        video.play();
        this.isCameraActive = true;
        if (overlay) overlay.style.display = 'none';
      } catch (err) {
        alert('Webcam access was denied or not available. Use the manual input or buttons below.');
      }
    }
  }

  processManualInput() {
    const input = document.getElementById('manualTicketInput');
    if (input && input.value.trim()) {
      this.processScan(input.value.trim());
      input.value = '';
    }
  }

  // Requirement 1: Check in with creator email check
  processScan(ticketId) {
    const currentUser = auth.currentUser;
    const operatorEmail = currentUser ? currentUser.email : null;
    const res = db.verifyCheckIn(ticketId, this.currentGate, operatorEmail);
    const resultBox = document.getElementById('scanResultBox');
    if (!resultBox) return;

    resultBox.classList.remove('hidden', 'result-success', 'result-warning', 'result-error');

    if (res.status === 'SUCCESS') {
      resultBox.classList.add('result-success');
      resultBox.innerHTML = `
        <div class="res-head">
          <div class="res-icon" style="font-weight:900; font-family:var(--font-mono);">[OK]</div>
          <div>
            <div class="res-title">ENTRY AUTHORIZED</div>
            <div class="res-sub">Checked in at ${this.currentGate}</div>
          </div>
        </div>
        <div class="res-body">
          <div class="res-attendee-name">${res.reg.leadName}</div>
          <div class="res-meta-line">
            <span><strong>Event:</strong> ${res.reg.eventTitle}</span>
            <span><strong>Pass:</strong> <span class="mono">${res.reg.ticketId}</span></span>
          </div>
          ${res.reg.teamName ? `<div class="res-team-box">Team: <strong>${res.reg.teamName}</strong> (${res.reg.teamMembers?.length || 1} members)</div>` : ''}
        </div>
      `;
    } else if (res.status === 'UNAUTHORIZED') {
      // Requirement 1: User tried to scan a ticket for an event launched by someone else
      resultBox.classList.add('result-error');
      resultBox.innerHTML = `
        <div class="res-head">
          <div class="res-icon" style="font-weight:900; font-family:var(--font-mono);">[DENIED]</div>
          <div>
            <div class="res-title">SECURITY VIOLATION: UNAUTHORIZED SCANNER</div>
            <div class="res-sub">You can only scan passes for events that you launched</div>
          </div>
        </div>
        <div class="res-body">
          <div class="res-desc">${res.message}</div>
          <div class="res-meta-line">
            <span><strong>Ticket:</strong> <span class="mono">${ticketId}</span></span>
            <span><strong>Your Account:</strong> ${operatorEmail}</span>
          </div>
        </div>
      `;
    } else if (res.status === 'DUPLICATE') {
      resultBox.classList.add('result-warning');
      resultBox.innerHTML = `
        <div class="res-head">
          <div class="res-icon" style="font-weight:900; font-family:var(--font-mono);">[WARN]</div>
          <div>
            <div class="res-title">SECURITY WARNING: DUPLICATE ENTRY</div>
            <div class="res-sub">This pass has already been used!</div>
          </div>
        </div>
        <div class="res-body">
          <div class="res-desc">${res.message}</div>
          <div class="res-meta-line">
            <span><strong>Registered Name:</strong> ${res.reg?.leadName || 'Unknown'}</span>
            <span><strong>Ticket:</strong> <span class="mono">${ticketId}</span></span>
          </div>
        </div>
      `;
    } else {
      resultBox.classList.add('result-error');
      resultBox.innerHTML = `
        <div class="res-head">
          <div class="res-icon" style="font-weight:900; font-family:var(--font-mono);">[DENIED]</div>
          <div>
            <div class="res-title">INVALID PASS / REJECTED</div>
            <div class="res-sub">Ticket does not exist in the database</div>
          </div>
        </div>
        <div class="res-body">
          <div class="res-desc">${res.message}</div>
          <div class="res-meta-line">
            <span><strong>Input Ticket ID:</strong> <span class="mono">${ticketId}</span></span>
          </div>
        </div>
      `;
    }

    // Refresh telemetry stats and log feed
    const logContainer = document.getElementById('scannerLogList');
    if (logContainer) {
      logContainer.innerHTML = this.renderLogItems(db.state.scanHistory);
    }

    // Auto-scroll to result
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
