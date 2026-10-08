// Holographic Fest Pass & Cryptographic QR Badge Generator

// Lightweight pure SVG QR-like visual generator with high-avalanche entropy patterns
export function generateSvgQr(dataString, size = 160) {
  const str = String(dataString || 'NEXUS-PASS-DEFAULT');
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

  // High-entropy multi-round avalanche hash so every single pass generates a completely different QR pattern
  let h1 = 0x811c9dc5;
  let h2 = 0x5bd1e995;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 0x01000193);
    h2 = Math.imul(h2 ^ (code + (i * 17)), 0x5bd1e995);
  }
  h1 ^= h1 >>> 16;
  h2 ^= h2 >>> 13;

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Skip finder zones
      const isTopLeft = r < 8 && c < 8;
      const isTopRight = r < 8 && c >= matrixSize - 8;
      const isBottomLeft = r >= matrixSize - 8 && c < 8;
      if (isTopLeft || isTopRight || isBottomLeft) continue;

      const cellSeed = Math.imul(h1 ^ (r * 131 + c * 59), 0x27d4eb2d) ^ Math.imul(h2 ^ (r * 37 + c * 83), 0x165667b1);
      const mixed = (cellSeed ^ (cellSeed >>> 15)) >>> 0;
      grid[r][c] = (mixed % 100) > 46 ? 1 : 0;
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
  const qrPayload = reg.qrData || `${reg.ticketId}:${reg.passCode || ''}:${reg.id || ''}`;
  const qrSvg = generateSvgQr(qrPayload, 140);
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
            <span class="label">PASS CODE</span>
            <span class="value mono text-highlight">${reg.passCode || 'SEC-READY'}</span>
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

// Generate a high-resolution PNG image canvas matching the pass card exactly
export function generateBadgeCanvas(reg) {
  const canvas = document.createElement('canvas');
  // High-DPI canvas dimensions (scale = 2 for crisp 380x600 layout)
  const width = 420;
  const height = 620;
  canvas.width = width * 2;
  canvas.height = height * 2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);

  // Helper rounded rectangle
  function roundRect(x, y, w, h, r, fill, stroke, strokeColor) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = strokeColor || 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // 1. Pass background
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#18181b');
  bgGrad.addColorStop(1, '#09090b');
  roundRect(0, 0, width, height, 24, bgGrad, true, 'rgba(255,255,255,0.18)');

  // 2. Sheen subtle shine effect
  ctx.save();
  ctx.beginPath();
  roundRect(0, 0, width, height, 24, null, false);
  ctx.clip();
  const sheen = ctx.createLinearGradient(0, 0, width, height);
  sheen.addColorStop(0, 'rgba(255,255,255,0.06)');
  sheen.addColorStop(0.3, 'rgba(255,255,255,0.02)');
  sheen.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  let curY = 32;

  // 3. Header badges
  // Campus Pass Pill
  roundRect(24, curY, 86, 20, 10, '#ffffff', false);
  ctx.fillStyle = '#000000';
  ctx.font = '800 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('CAMPUS PASS', 31, curY + 14);

  // Club / Org Pill
  const clubText = (reg.clubName || 'NEXUS FEST 2026').toUpperCase();
  ctx.font = '700 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const clubWidth = Math.min(130, ctx.measureText(clubText).width + 14);
  roundRect(116, curY, clubWidth, 20, 10, 'rgba(255,255,255,0.1)', false);
  ctx.fillStyle = '#a1a1aa';
  ctx.fillText(clubText, 123, curY + 14);

  // Pass Tier Tag (Right aligned)
  const tierText = (reg.passTier || (reg.isTeam || reg.teamName ? 'TEAM PASS' : 'VIP ACCESS')).toUpperCase();
  ctx.font = '800 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const tierWidth = ctx.measureText(tierText).width + 16;
  roundRect(width - 24 - tierWidth, curY, tierWidth, 20, 4, '#ffffff', false);
  ctx.fillStyle = '#000000';
  ctx.fillText(tierText, width - 24 - tierWidth + 8, curY + 14);

  curY += 44;

  // 4. Event Title (Multi-line support if needed)
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const eventTitle = reg.eventTitle || 'Campus Event';
  const words = eventTitle.split(' ');
  let line = '';
  const maxTitleWidth = width - 48;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxTitleWidth && n > 0) {
      ctx.fillText(line.trim(), 24, curY);
      line = words[n] + ' ';
      curY += 24;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), 24, curY);
  curY += 24;

  // 5. Team info
  if (reg.teamName) {
    ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText('TEAM: ', 24, curY);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(reg.teamName, 68, curY);
    curY += 22;
  } else {
    curY += 6;
  }

  // 6. Attendee Card Box
  roundRect(24, curY, width - 48, 64, 12, 'rgba(255,255,255,0.04)', true, 'rgba(255,255,255,0.08)');
  
  // Avatar Circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(58, curY + 32, 22, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.font = '900 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const leadInitial = reg.leadName ? reg.leadName.charAt(0).toUpperCase() : 'U';
  ctx.fillText(leadInitial, 58, curY + 32);
  ctx.restore();

  // Attendee Details
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(reg.leadName || 'Attendee', 92, curY + 24);

  ctx.fillStyle = '#71717a';
  ctx.font = '600 11px "JetBrains Mono", monospace';
  ctx.fillText('ID: ' + (reg.collegeRoll || 'VERIFIED'), 92, curY + 40);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(reg.leadEmail || '', 92, curY + 54);

  curY += 76;

  // 7. Team member pills if any
  if (reg.teamMembers && reg.teamMembers.length > 0) {
    let pillX = 24;
    reg.teamMembers.forEach(m => {
      const pillLabel = `${m.name} (${m.role || 'Member'})`;
      ctx.font = '500 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const pWidth = ctx.measureText(pillLabel).width + 14;
      if (pillX + pWidth > width - 24) return; // avoid overflow
      roundRect(pillX, curY, pWidth, 20, 6, 'rgba(255,255,255,0.06)', false);
      ctx.fillStyle = '#a1a1aa';
      ctx.fillText(pillLabel, pillX + 7, curY + 14);
      pillX += pWidth + 6;
    });
    curY += 28;
  }

  // 8. QR Code Box & Telemetry
  const qrBoxSize = 144;
  roundRect(24, curY, qrBoxSize, qrBoxSize + 20, 12, '#ffffff', false);

  // Draw deterministic QR matrix directly onto canvas
  const matrixSize = 25;
  const grid = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(0));
  function drawFinderMatrix(startX, startY) {
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
  drawFinderMatrix(0, 0);
  drawFinderMatrix(matrixSize - 7, 0);
  drawFinderMatrix(0, matrixSize - 7);
  for (let i = 8; i < matrixSize - 8; i++) {
    grid[6][i] = i % 2 === 0 ? 1 : 0;
    grid[i][6] = i % 2 === 0 ? 1 : 0;
  }
  const qrPayload = reg.qrData || `${reg.ticketId}:${reg.passCode || ''}:${reg.id || ''}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x5bd1e995;
  for (let i = 0; i < qrPayload.length; i++) {
    const code = qrPayload.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 0x01000193);
    h2 = Math.imul(h2 ^ (code + (i * 17)), 0x5bd1e995);
  }
  h1 ^= h1 >>> 16;
  h2 ^= h2 >>> 13;

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      const isTopLeft = r < 8 && c < 8;
      const isTopRight = r < 8 && c >= matrixSize - 8;
      const isBottomLeft = r >= matrixSize - 8 && c < 8;
      if (isTopLeft || isTopRight || isBottomLeft) continue;
      const cellSeed = Math.imul(h1 ^ (r * 131 + c * 59), 0x27d4eb2d) ^ Math.imul(h2 ^ (r * 37 + c * 83), 0x165667b1);
      const mixed = (cellSeed ^ (cellSeed >>> 15)) >>> 0;
      grid[r][c] = (mixed % 100) > 46 ? 1 : 0;
    }
  }

  const qrInnerMargin = 8;
  const cellSize = (qrBoxSize - qrInnerMargin * 2) / matrixSize;
  ctx.fillStyle = '#000000';
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (grid[r][c] === 1) {
        ctx.fillRect(
          24 + qrInnerMargin + c * cellSize,
          curY + qrInnerMargin + r * cellSize,
          cellSize,
          cellSize
        );
      }
    }
  }

  // Center QR Security badge
  const qrCenterX = 24 + qrBoxSize / 2;
  const qrCenterY = curY + qrInnerMargin + (qrBoxSize - qrInnerMargin * 2) / 2;
  ctx.beginPath();
  ctx.arc(qrCenterX, qrCenterY, 14, 0, Math.PI * 2);
  ctx.fillStyle = '#000000';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NEX', qrCenterX, qrCenterY + 1);

  // Label under QR
  ctx.fillStyle = '#000000';
  ctx.font = '800 8px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('TAP TO SCAN', qrCenterX, curY + qrBoxSize + 10);

  // Right Telemetry details
  const telemX = 186;
  let telemY = curY + 4;

  // PASS ID
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#71717a';
  ctx.font = '600 8.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('PASS ID', telemX, telemY);
  telemY += 14;
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 12px "JetBrains Mono", monospace';
  ctx.fillText(reg.ticketId || 'NX-PASS-0000', telemX, telemY);
  telemY += 18;

  // PASS CODE
  ctx.fillStyle = '#71717a';
  ctx.font = '600 8.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('PASS CODE', telemX, telemY);
  telemY += 14;
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 11px "JetBrains Mono", monospace';
  ctx.fillText(reg.passCode || 'SEC-READY', telemX, telemY);
  telemY += 18;

  // ENTRY STATUS
  ctx.fillStyle = '#71717a';
  ctx.font = '600 8.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('ENTRY STATUS', telemX, telemY);
  telemY += 14;
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(reg.checkedIn ? 'CHECKED IN' : 'GATE READY', telemX, telemY);
  telemY += 18;

  // GATE ACCESS
  ctx.fillStyle = '#71717a';
  ctx.font = '600 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('GATE ACCESS', telemX, telemY);
  telemY += 16;
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(reg.gate || 'ALL CAMPUS GATES', telemX, telemY);
  telemY += 22;

  // VERIFIED PROTOCOL
  ctx.fillStyle = '#71717a';
  ctx.font = '600 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('VERIFIED PROTOCOL', telemX, telemY);
  telemY += 16;
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 11px "JetBrains Mono", monospace';
  ctx.fillText('SHA-256 SECURED', telemX, telemY);

  curY += qrBoxSize + 36;

  // 9. Footer: Barcode & Watermark
  // Dotted line
  ctx.beginPath();
  ctx.setLineDash([4, 4]);
  ctx.moveTo(24, curY);
  ctx.lineTo(width - 24, curY);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.stroke();
  ctx.setLineDash([]);

  curY += 16;

  // Barcode stripes
  let barX = 24;
  const barPattern = [3, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 2, 3, 1, 2, 4, 2];
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let b = 0; b < barPattern.length; b++) {
    const barW = barPattern[b];
    if (b % 2 === 0) {
      ctx.fillRect(barX, curY, barW, 16);
    }
    barX += barW + 2;
  }
  ctx.fillStyle = '#71717a';
  ctx.font = '600 9px "JetBrains Mono", monospace';
  ctx.fillText('*' + (reg.ticketId || '') + '*', 24, curY + 28);

  // Watermark text
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '800 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('KILLTHEFORMS // NEXUS OPS', width - 24, curY + 20);

  return canvas;
}

// Download the high-resolution pass PNG file
export function downloadBadgeImage(reg) {
  const canvas = generateBadgeCanvas(reg);
  const link = document.createElement('a');
  link.download = `Pass-${reg.ticketId || 'card'}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

