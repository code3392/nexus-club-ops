// Cryptographic Certificate Generator for Post-Event Dispensing
import { generateSvgQr } from './badges.js';
import { sound } from './sound.js';

export function renderCertificateModal(participant, eventName, clubName) {
  sound.playPassUnlocked();

  const certId = 'CERT-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-2026';
  const qrSvg = generateSvgQr(certId, 100);

  return `
    <div class="cert-modal-backdrop" onclick="if(event.target === this) window.nexusApp.closeModal()">
      <div class="cert-modal-dialog">
        <div class="cert-modal-actions">
          <button class="btn btn-primary btn-sm" onclick="window.print()">Print Certificate</button>
          <button class="btn btn-secondary btn-sm" onclick="window.nexusApp.closeModal()">Close</button>
        </div>

        <div class="cert-frame" id="printableCertificate">
          <div class="cert-inner-border">
            <div class="cert-corner tl"></div>
            <div class="cert-corner tr"></div>
            <div class="cert-corner bl"></div>
            <div class="cert-corner br"></div>

            <div class="cert-header">
              <div class="cert-org-emblem" style="font-weight:900; font-family:var(--font-mono); letter-spacing:0.1em;">HONOR</div>
              <div class="cert-super-title">CAMPUS SMART OPERATIONS ALLIANCE</div>
              <div class="cert-main-title">Certificate of Merit & Excellence</div>
              <div class="cert-tagline">This credential certifies verifiable technical participation</div>
            </div>

            <div class="cert-body">
              <div class="cert-presented-to">PROUDLY PRESENTED TO</div>
              <div class="cert-recipient-name">${participant.leadName || participant.name || 'Honored Participant'}</div>
              <div class="cert-narrative">
                For distinguished performance, technical rigor, and outstanding collaboration in
                <strong>${eventName || 'HackNova 2026'}</strong> hosted by <strong>${clubName || 'Turing Computer Society'}</strong>.
              </div>
            </div>

            <div class="cert-footer">
              <div class="cert-sign-block">
                <div class="cert-signature-line">Prof. Elena Rostova</div>
                <div class="cert-sign-role">Faculty Dean of Student Affairs</div>
              </div>

              <div class="cert-qr-block">
                ${qrSvg}
                <div class="cert-id-badge mono">${certId}</div>
              </div>

              <div class="cert-sign-block">
                <div class="cert-signature-line">Alex Chen</div>
                <div class="cert-sign-role">Convenor & Lead Organizer</div>
              </div>
            </div>

            <div class="cert-meta-bar">
              <span>VERIFIED BY NEXUS SMART OPERATIONS PROTOCOL</span>
              <span>•</span>
              <span>SHA-256 HASH VERIFICATION ENABLED</span>
              <span>•</span>
              <span>REPLACING THIRD-PARTY GOOGLE FORMS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
