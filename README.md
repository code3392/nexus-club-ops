# ⚡ NEXUS CLUB OPS (KillTheForms)
### Next-Gen In-House Fest & Event Management Operating System for Student Clubs

> **Project Theme:** Smart Club Operations — Building an in-house fest and event management platform to completely eliminate third-party Google Forms, fragmented spreadsheets, and gate chaos.

---

## 🌟 The Core Problem We Solved

University fests, hackathons, and student technical societies have traditionally relied on **Google Forms**. This created massive operational friction:
1. **Broken Team Roster Registration:** Team members register separately, leading to duplicated entries, mismatched team names, and missing roster members.
2. **Fake Payment Verification:** Google Forms forces treasurers to manually verify thousands of uploaded UPI/card payment screenshots, resulting in 20+ hours of tedious work and vulnerability to photoshopped transaction IDs.
3. **No Dynamic Capacity Throttling:** Google Forms cannot close registrations at exactly the venue seat limit without unstable third-party extensions, leading to severe overbooking and student complaints.
4. **40-Minute Gate Queues:** Gate security relies on printed spreadsheets or slow internet to search 500+ rows, creating massive bottlenecks at the venue entrance.
5. **Disconnected Certificates:** Post-fest certificate generation relies on brittle mail merges that frequently hit Gmail limits and lack verifiable authenticity.

---

## 🚀 Key Features of NEXUS CLUB OPS

### 1. 🎪 Fest Arena (Attendee Portal)
- **Flagship Event Showcase:** Multi-club event discovery across Hackathons, Robotics Arenas, Cultural Bands, Esports LANs, Design Sprints, and Venture Pitches.
- **Dynamic Quota Bars:** Real-time capacity meters showing slots filled vs remaining with auto-locking when full.
- **Side-by-Side Comparison:** Interactive comparison of Google Forms pain points vs Nexus Ops capabilities.
- **Interactive ROI Calculator:** Computes organizing committee hours saved, payment fraud prevented, and gate minutes saved.

### 2. 🛠️ Nexus Form Studio ("The Google Forms Killer")
- **Custom Schema Builder:** Club leads can drag/click to add custom questions (Text, Dropdown, Radio, URL/Portfolio, and Dynamic Teammate Rosters).
- **Seat Capacity Lock:** Hard limit stops overbooking immediately.
- **Live Mobile Device Simulator:** Real-time phone simulator showing live preview keystroke by keystroke as fields are edited.
- **One-Click Deployment:** Instantly publishes new club events into the fest portal without touching code.

### 3. ⚡ Gate Check-in & Scanner Terminal
- **Sub-Second Contactless QR Check-in:** Camera scanner integrated with Web Audio API sound synthesizer.
  - 🎵 **Double Chime:** Valid authorized pass.
  - ⚠️ **Loud Alarm:** Duplicate entry alert (shows exact time and gate where the ticket was already checked in).
  - ⛔ **Error Tone:** Unregistered / fraudulent pass.
- **Quick Test Launchers:** One-click sample barcode buttons to test valid, unchecked, duplicate, and fake passes in real time.
- **Gate Telemetry Feed:** Real-time check-in conversion, gate speed, and live security log.

### 4. 🎫 Cryptographic Holographic E-Pass
- **Dynamic Vector QR Code:** Pure SVG mathematical matrix generation with zero external library dependencies.
- **Holographic Foil Shader:** Cyber iridescent gradient animations with attendee name, team roster, dietary requirements, and SHA-256 security watermark.
- **Print & Gate Ready:** Direct 1-click test at the scanner, copy ID, and printable pass layout.

### 5. 📊 Organizer Command Center & Analytics
- **Executive KPI Dashboard:** Total attendees, gross revenue, check-in conversion, and 0% Google Forms dependency score.
- **Pure Canvas Velocity Charts:** Daily registration trajectory curve and club attendance share donut chart.
- **Unified Participant CRM:** Full-featured attendee table with search, event filters, check-in toggles, and clean CSV export.
- **Cryptographic Certificate Dispenser:** 1-click printable Certificate of Merit with unique verification hashes and Dean/Convenor signatures.
- **Live Campus Broadcaster:** Push emergency bulletins directly to the top marquee ticker across all attendee devices.

---

## 🛠️ Tech Stack & Architecture

- **Zero-Dependency Core:** Pure vanilla HTML5, modern CSS3, and ES Modules. Runs instantly in any modern browser without needing `npm install`.
- **Web Audio API:** Custom oscillator synthesizer generating responsive micro-interaction clicks, success chimes, and gate alarms.
- **Interactive Canvas Network:** Real-time interactive node constellation background that reacts to mouse movement.
- **Local Persistence Engine:** Full state management with `localStorage`, pre-loaded with realistic sample data for 4 clubs and 6 events.
- **Self-Contained Local Server:** Built-in `serve.js` using Node's standard `http` module.

---

## 💻 How to Run Locally

1. Clone or open the repository folder:
   ```bash
   cd c:\Users\User\Downloads\AIwebdev
   ```

2. Start the local server:
   ```bash
   node serve.js
   ```

3. Open in your browser:
   ```
   http://localhost:3000
   ```
   *(Or double-click `index.html` to run directly in any browser!)*

---

## ⌨️ Keyboard Shortcuts
- `Ctrl + K` (or `Cmd + K`): Open global quick navigation command palette.
- `Escape`: Close any open modal or dialog.
