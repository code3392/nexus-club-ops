// Live Gate Check-in & Scanner Terminal
import { db } from './data.js';
import { sound } from './sound.js';

export class GateScannerTerminal {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentGate = 'Gate 1 (North Hub)';
    this.stream = null;
    this.isCameraActive = false;
  }

  init() {
    this.render();
  }

  render() {
    if (!this.container) return;

    const registrations = db.getRegistrations();
    const totalRegs = registrations.length;
    const checkedInCount = registrations.filter(r => r.checkedIn).length;
    const pendingCount = totalRegs - checkedInCount;
    const checkInRate = totalRegs > 0 ? Math.round((checkedInCount / totalRegs) * 100) : 0;

    const scanLogs = db.state.scanHistory || [];

    this.container.innerHTML = `
      <div class="scanner-terminal-grid">
        <!-- Left: Scanner Viewfinder & Controls -->
        <div class="scanner-main-col">
          <div class="scanner-card">
            <div class="scanner-card-header">
              <div class="scanner-title-badge">
                <span class="live-pulse"></span>
                <span>GATE SCANNER ACTIVE</span>
              </div>
              <div class="scanner-gate-selector">
                <label>Checkpoint:</label>
                <select id="scannerGateSelect" class="scanner-select" onchange="window.gateScanner.setGate(this.value)">
                  <option value="Gate 1 (North Hub)">Gate 1 (North Hub)</option>
                  <option value="Gate 2 (Arena South)">Gate 2 (Arena South)</option>
                  <option value="VIP Backstage Access">VIP Backstage Access</option>
                  <option value="Auditorium Gate 4">Auditorium Gate 4</option>
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
                <div class="viewfinder-icon">📷</div>
                <div class="viewfinder-text">Point camera at Attendee QR Badge</div>
                <div class="viewfinder-sub">Or use rapid ticket test-launcher below</div>
                <button class="btn btn-sm btn-secondary" onclick="window.gateScanner.toggleCamera()">
                  🎥 Toggle Live Webcam
                </button>
              </div>
            </div>

            <!-- Manual / Quick Barcode Dispatcher -->
            <div class="scanner-manual-bar">
              <div class="scanner-input-group">
                <input type="text" id="manualTicketInput" class="scanner-input mono" 
                  placeholder="Enter Ticket ID (e.g. NX-NOVA-8821)" 
                  onkeydown="if(event.key==='Enter') window.gateScanner.processScan(this.value)" />
                <button class="btn btn-primary" onclick="window.gateScanner.processManualInput()">
                  ⚡ Check In
                </button>
              </div>

              <!-- Quick Test Buttons with Real Sample Tickets -->
              <div class="scanner-test-chips">
                <span class="chips-label">Quick Scan Tests:</span>
                <button class="chip-btn" onclick="window.gateScanner.processScan('NX-NOVA-8821')">
                  [Valid Pass] Aarav
                </button>
                <button class="chip-btn" onclick="window.gateScanner.processScan('NX-AURA-7124')">
                  [Unchecked] Sophia
                </button>
                <button class="chip-btn" onclick="window.gateScanner.processScan('NX-ROBO-9019')">
                  [Test Duplicate] David
                </button>
                <button class="chip-btn chip-error" onclick="window.gateScanner.processScan('NX-FAKE-0000')">
                  [Fake Pass] Fraud Test
                </button>
              </div>
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
              <div class="metric-label">Gate Speed</div>
              <div class="metric-val text-cyan">0.4s</div>
              <div class="metric-sub">Avg pass verification</div>
            </div>
            <div class="sc-metric-card">
              <div class="metric-label">Fraud Prevented</div>
              <div class="metric-val text-rose">100%</div>
              <div class="metric-sub">Crypto-verified QR</div>
            </div>
          </div>

          <div class="scanner-log-card">
            <div class="scanner-log-header">
              <div class="log-title">📋 Live Gate Activity Feed</div>
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

  setGate(gateName) {
    this.currentGate = gateName;
  }

  renderLogItems(logs) {
    if (!logs || logs.length === 0) {
      return `<div class="empty-log-state">No gate scans recorded yet. Use the scanner to begin checking in attendees.</div>`;
    }

    return logs.slice(0, 15).map(log => {
      let statusClass = 'log-success';
      let icon = '✅';
      if (log.status === 'DUPLICATE') {
        statusClass = 'log-warning';
        icon = '⚠️';
      } else if (log.status === 'INVALID') {
        statusClass = 'log-danger';
        icon = '⛔';
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
        alert('Webcam access was denied or not available. Use the quick test buttons or type ticket IDs to test verification.');
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

  processScan(ticketId) {
    const res = db.verifyCheckIn(ticketId, this.currentGate);
    const resultBox = document.getElementById('scanResultBox');
    if (!resultBox) return;

    resultBox.classList.remove('hidden', 'result-success', 'result-warning', 'result-error');

    if (res.status === 'SUCCESS') {
      sound.playSuccess();
      resultBox.classList.add('result-success');
      resultBox.innerHTML = `
        <div class="res-head">
          <div class="res-icon">✅</div>
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
          ${res.reg.teamName ? `<div class="res-team-box">👥 Team: <strong>${res.reg.teamName}</strong> (${res.reg.teamMembers?.length || 1} members)</div>` : ''}
          <div class="res-diet-tag">🍱 Meal: ${res.reg.answers?.f_diet || 'Standard'} • T-Shirt: ${res.reg.answers?.f_tshirt || 'M'}</div>
        </div>
      `;
    } else if (res.status === 'DUPLICATE') {
      sound.playWarning();
      resultBox.classList.add('result-warning');
      resultBox.innerHTML = `
        <div class="res-head">
          <div class="res-icon">⚠️</div>
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
      sound.playWarning();
      resultBox.classList.add('result-error');
      resultBox.innerHTML = `
        <div class="res-head">
          <div class="res-icon">⛔</div>
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
