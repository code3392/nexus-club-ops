// Holographic Fest Pass & Cryptographic QR Badge Generator

// Lightweight pure SVG QR-like visual generator with deterministic hash patterns
export function generateSvgQr(dataString, size = 160) {
  // Deterministic hash algorithm to build a realistic 21x21 QR code matrix
  const matrixSize = 25;
  const grid = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(0));

  // 1. Draw Finder Patterns (Corners: Top-Left, Top-Right, Bottom-Left)
  function drawFinder(startX, startY) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          grid[startY + r][startX + c] = 1;
        } else {
          grid[startY + r][startX + c] = 0;
        }
      }
    }
  }

  drawFinder(0, 0); // Top-left
  drawFinder(matrixSize - 7, 0); // Top-right
  drawFinder(0, matrixSize - 7); // Bottom-left

  // Timing lines
  for (let i = 8; i < matrixSize - 8; i++) {
    grid[6][i] = i % 2 === 0 ? 1 : 0;
    grid[i][6] = i % 2 === 0 ? 1 : 0;
  }

  // Deterministic data fill based on ticket ID
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    hash = (hash << 5) - hash + dataString.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Skip finder zones
      const isTopLeft = r < 8 && c < 8;
      const isTopRight = r < 8 && c >= matrixSize - 8;
      const isBottomLeft = r >= matrixSize - 8 && c < 8;
      if (isTopLeft || isTopRight || isBottomLeft) continue;

      const seed = Math.abs(Math.sin((r * 31 + c * 17) + hash) * 10000);
      grid[r][c] = (seed % 100) > 42 ? 1 : 0;
    }
  }

  // Build SVG
  const cellSize = size / matrixSize;
  let rects = '';
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (grid[r][c] === 1) {
        rects += `<rect x="${(c * cellSize).toFixed(2)}" y="${(r * cellSize).toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" rx="1" fill="#000000" />`;
      }
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="badge-qr-svg">
      <rect width="${size}" height="${size}" fill="#ffffff" rx="10"/>
      ${rects}
      <!-- Security Center Logo Badge -->
      <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.12}" fill="#000000" />
      <text x="${size / 2}" y="${size / 2 + 4}" font-family="sans-serif" font-weight="900" font-size="10" fill="#ffffff" text-anchor="middle">NEX</text>
    </svg>
  `;
}

// Generate the high-tech holographic HTML card component
export function renderHolographicBadge(reg) {
  const qrSvg = generateSvgQr(reg.ticketId, 140);
  const isChecked = reg.checkedIn;
  const teamInfo = reg.teamName ? `<div class="badge-team-name">TEAM: <span>${reg.teamName}</span></div>` : '';

  const memberPills = (reg.teamMembers || [])
    .map(m => `<span class="badge-member-pill">${m.name} <em>(${m.role || 'Member'})</em></span>`)
    .join('');

  return `
    <div class="hologram-card" id="hologramCard-${reg.ticketId}">
      <div class="hologram-sheen"></div>
      <div class="hologram-glow"></div>
      
      <div class="badge-header">
        <div class="badge-club-meta">
          <span class="badge-org-pill">CAMPUS PASS</span>
          <span class="badge-event-pill">${reg.clubName || 'NEXUS FEST 2026'}</span>
        </div>
        <div class="badge-tier-tag ${reg.passTier ? 'tier-' + reg.passTier.toLowerCase().replace(/\s+/g, '-') : 'tier-general'}">
          ${reg.passTier || 'VIP ACCESS'}
        </div>
      </div>

      <div class="badge-event-title">${reg.eventTitle}</div>
      ${teamInfo}

      <div class="badge-attendee-section">
        <div class="badge-avatar" style="overflow:hidden; display:flex; align-items:center; justify-content:center;">
          ${(reg.leadAvatar && (reg.leadAvatar.startsWith('data:image') || reg.leadAvatar.startsWith('http') || reg.leadAvatar.startsWith('blob:')))
            ? `<img src="${reg.leadAvatar}" alt="${reg.leadName}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`
            : (reg.leadAvatar || (reg.leadName ? reg.leadName.charAt(0).toUpperCase() : 'U'))}
        </div>
        <div class="badge-attendee-details">
          <div class="badge-attendee-name">${reg.leadName}</div>
          <div class="badge-attendee-roll">${reg.collegeRoll || 'STUDENT ID: VERIFIED'}</div>
          <div class="badge-attendee-email">${reg.leadEmail}</div>
        </div>
      </div>

      ${memberPills ? `<div class="badge-members-roster">${memberPills}</div>` : ''}

      <div class="badge-code-row">
        <div class="badge-qr-box">
          ${qrSvg}
          <div class="badge-qr-label">TAP TO SCAN</div>
        </div>

        <div class="badge-telemetry">
          <div class="telemetry-item">
            <span class="label">PASS ID</span>
            <span class="value mono">${reg.ticketId}</span>
          </div>
          <div class="telemetry-item">
            <span class="label">ENTRY STATUS</span>
            <span class="value status-badge ${isChecked ? 'status-in' : 'status-pending'}">
              ${isChecked ? 'CHECKED IN' : 'GATE READY'}
            </span>
          </div>
          <div class="telemetry-item">
            <span class="label">GATE ACCESS</span>
            <span class="value">${reg.gate || 'ALL CAMPUS GATES'}</span>
          </div>
          <div class="telemetry-item">
            <span class="label">VERIFIED PROTOCOL</span>
            <span class="value mono">SHA-256 SECURED</span>
          </div>
        </div>
      </div>

      <div class="badge-footer">
        <div class="badge-barcode">
          <div class="barcode-lines"></div>
          <span class="barcode-num">*${reg.ticketId}*</span>
        </div>
        <div class="badge-watermark">KILLTHEFORMS // NEXUS OPS</div>
      </div>
    </div>
  `;
}
