# NEXUS CLUB OPS
### Next-Gen In-House Fest & Event Management Operating System
**International Tech Carnival 2026 — AI Web Development Contest**
**Theme:** Smart Club Operations

---

## 1. Project Name
**NEXUS CLUB OPS** (The Smart Club Operations & In-House Fest Engine)

---

## 2. Project Description
Traditionally, collegiate fests, tech clubs, and student societies heavily rely on third-party tools like Google Forms for event registrations. This creates an unprofessional attendee experience:
- Broken team rosters where teammates register separately and create duplicate rows.
- No automated capacity limit, resulting in forms remaining open past venue capacity and causing severe overbooking.
- 40-minute gate bottlenecks caused by volunteers manually searching through fragmented spreadsheets.
- Vulnerability to forged payment screenshots and tedious manual reconciliations.

**NEXUS CLUB OPS** is an in-house web platform purpose-built for student organizations, tech clubs, and university societies. It replaces Google Forms by implementing the complete hierarchical model defined in the contest rulebook:

$$\text{Organization} \longrightarrow \text{Fest} \longrightarrow \text{Event} \longrightarrow \text{Registration}$$

The platform enables attendees to browse official festivals, inspect event schedules and venue details, register with instant quota checks, and manage their passes. Organizers gain a centralized Command Center with live gate check-in, real-time participant status management, and instant analytics.

---

## 3. Features

### Fest & Event Directory (`Organization -> Fest -> Event`)
- **Multi-Festival Support:** Pre-loaded with official collegiate festivals:
  - **International Tech Carnival 2026** (AI Web Dev, Programming Contest, Robotics Challenge, Gaming Tournament)
  - **Winter Tech Fest 2026** (Hackathon 24h, AI Workshop, Tech Quiz Olympiad)
  - **Freshers Tech Fest 2027** (Coding Challenge, AI Bootcamp)
- **Fest Details View:** Inspect festival schedules, venue details, and curated event listings.
- **Search & Filtering:** Real-time search across events, fests, rules, prizes, and venues, paired with quick category pills (AI & Web, Programming, Robotics, Gaming, Hackathons, Workshops, Quiz).
- **Comprehensive Event Detail Cards:** Shows parent festival badge, host club, dates, venue, registration deadlines, and live capacity progress bars.

### Google Forms Replacement (Registration System)
- **Clean, Minimal Form Interface:** Intuitive card-based input matching the familiarity of Google Forms without external dependencies.
- **Unified Team Registration:** Team leader registers once, inputting team details and members with auto-generated shared pass credentials.
- **Dynamic Capacity Quota Lock:** Automatically stops submissions when the venue capacity limit is reached, displaying a clean "Quota Full / Capacity Reached" state.
- **Deadline Enforcement:** Clear visual deadline countdown and automated registration status locks.
- **Contest-Specific Custom Questions:** Flexible schemas supporting text, select dropdowns, radio buttons, and URL portfolio links.

### Attendee Self-Service (`My Passes / Registrations`)
- **Attendee Lookup:** Attendees can look up their registrations by entering their campus email or Ticket ID.
- **View Holographic Credentials:** One-click access to dynamic 3D holographic digital passes and pure SVG QR codes.
- **Verifiable Certificate Dispenser:** View and download verifiable digital certificates with SHA-256 hashes.
- **Registration Management & Cancellation:** Attendees can cancel registrations with one click, which **automatically decrements registered counts in real time**, reopening seats for others.

### Organizer Command Center & Management
- **Executive Dashboard:** Live metrics for total registrations, capacity utilization, verified gate check-ins, and club participation.
- **Attendee Roster Management:** Search and filter participants by Festival, Event, and Status.
- **Participant Status Management:** Organizers can update participant registration status in real time (`Approved`, `Pending`, `Waitlisted`, `Checked In`, `Cancelled`).
- **Clean CSV Export:** 1-click export of complete attendee rosters with ticket IDs, team info, and gate timestamps.
- **Emergency Broadcast Engine:** Push urgent bulletins across festival screens and attendee passes.

### Creative Bonus Features
- **Fast QR Gate Scanner:** Sub-second entrance verification with creator-authorized ticket validation, duplicate detection, and invalid pass protection.
- **Interactive Form Builder Studio:** Allows club leads to create new custom event registration schemas with a live mobile phone simulator preview.
- **3D Holographic Pass Generator:** Interactive card physics with iridescent foil gradients, tamper-resistant SHA-256 security signatures, and print mode.
- **Pure Canvas Constellation Background:** Interactive animated node network reacting to cursor coordinates.

---

## 4. Tech Stack
- **Frontend Architecture:** Vanilla JavaScript (ES2022 Modules), Semantic HTML5, and Modern CSS3 (CSS Variables, Flexbox, Grid, Backdrop Filters).
- **Zero Heavy Frameworks:** Eliminates virtual DOM overhead, delivering 60 FPS animations and instant page loads.
- **Client-Side Security:** Built-in cryptographic hash verification and creator-restricted scanning permissions.
- **Visuals & Charts:** HTML5 Canvas 2D API for particle network background and velocity trajectory charts.
- **Offline Data Engine:** Reactive `StateManager` leveraging `localStorage` for complete offline state persistence.
- **Local Web Server:** Lightweight, zero-dependency Node.js HTTP server (`serve.js`).

---

---

## 5. Setup & Authentication Configuration

### 5.1 Google Cloud Authentication Setup

NEXUS CLUB OPS supports secure Google Sign-In powered by official Google Identity Services (GIS) on the frontend and zero-dependency server-side cryptographic token verification on the backend.

Follow these steps to generate your Google Cloud credentials:

1. **Create or Select a Google Cloud Project:**
   - Open the [Google Cloud Console](https://console.cloud.google.com/).
   - Click the project dropdown in the top bar and select **New Project**.
   - Enter a Project Name (e.g. `Nexus Club Ops`) and click **Create**.

2. **Configure the OAuth Consent Screen:**
   - In the left sidebar, navigate to **APIs & Services** > **OAuth consent screen**.
   - Select User Type: **External** (or **Internal** if using Google Workspace), then click **Create**.
   - Fill in the required fields:
     - **App name:** `Nexus Club Ops`
     - **User support email:** Select your email address
     - **Developer contact email:** Enter your email address
   - In the **Scopes** step, click **Add or Remove Scopes** and select:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - Click **Save and Continue**.
   - In the **Test users** step (if your app status is Testing), add your personal Gmail account(s) so you can sign in during development.
   - Click **Save and Continue**.

3. **Create OAuth 2.0 Client ID Credentials:**
   - In the left sidebar, navigate to **APIs & Services** > **Credentials**.
   - Click **Create Credentials** > **OAuth client ID**.
   - Set **Application type** to **Web application**.
   - Set **Name** to `Nexus Web Client`.
   - Under **Authorized JavaScript origins**, click **Add URI** and enter:
     - `http://localhost:3000`
     - `http://127.0.0.1:3000`
     - `https://<your-project>.vercel.app` (replace with your Vercel deployment domain)
   - Under **Authorized redirect URIs**, click **Add URI** and enter:
     - `http://localhost:3000`
     - `https://<your-project>.vercel.app`
   - Click **Create**.
   - Copy the generated **Client ID** (format: `xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`).

4. **Configure Environment Variables:**
   - Copy the template file `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and set your configuration values:
     ```env
     PORT=3000
     GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=your-actual-client-secret
     SESSION_SECRET=your-random-32-character-session-secret-string
     ```

### 5.2 Running Locally via Node.js
1. Start the zero-dependency Node.js server:
   ```bash
   node serve.js
   ```
2. Open in your browser:
   ```
   http://localhost:3000
   ```
3. Test authentication:
   - Click **Sign In / Join** in the navigation header.
   - Click **Continue with Google** (or use the rendered Google button if configured).
   - Once signed in, your Google name, email, and avatar will appear across all pages (`index.html` and `events.html`) simultaneously.

### 5.3 Deploying to Vercel
1. Push your repository to GitHub.
2. Log in to [Vercel](https://vercel.com/) and click **Add New** > **Project**.
3. Import your `nexus-club-ops` repository.
4. Under **Environment Variables**, add the following keys:
   - `GOOGLE_CLIENT_ID`: Your Google Cloud OAuth Client ID
   - `SESSION_SECRET`: A secure random string for HMAC session token signing
5. Click **Deploy**.
6. Once deployed, copy your production Vercel URL (e.g. `https://nexus-ops.vercel.app`) and add it to **Authorized JavaScript origins** in your Google Cloud Console project.

### 5.4 Offline & Password Fallback
If Google OAuth credentials are not yet configured, the system provides a seamless email and password sign-in and registration flow. Every account enforces a strict 1-email-to-1-account policy with password authentication. All accounts, whether registered via Google or campus email, receive cryptographically signed session tokens and `HttpOnly` session cookies.

---

## 6. Deployment URL
- **Live Public Deployment (GitHub Pages):** [https://code3392.github.io/nexus-club-ops/](https://code3392.github.io/nexus-club-ops/)
- **Public GitHub Repository:** [https://github.com/code3392/nexus-club-ops](https://github.com/code3392/nexus-club-ops)

---

## 7. Demo Credentials
The application is pre-loaded with comprehensive mock data so judges can immediately evaluate all features without manual data entry.

- **Role:** Organizer / Admin / Attendee
- **Quick Demo Sign-in:** Click the profile icon in the navigation bar to use the one-click demo credentials:
  - **Organizer Admin:** `admin@campus.edu` (Password: any 6+ chars)
  - **Contestant Attendee:** `aarav.patel@campus.edu` (Password: any 6+ chars)
- **Pre-loaded Ticket IDs to test at Gate Scanner or My Passes:**
  - `NX-AI-8821` (Aarav Patel - AI Web Dev Contest)
  - `NX-PROG-4412` (Tanvir Hossain - Programming Contest)
  - `NX-ROBO-9019` (David Zhang - Robotics Challenge)
  - `NX-GAME-3310` (Kenji Sato - Gaming Tournament)
  - `NX-HACK-1209` (Zubair Rahman - Winter Hackathon)

---

## 8. Third-Party Services / APIs
- **Typography:** Google Fonts (`Inter` and `JetBrains Mono` via CDN).
- **100% Self-Contained:** Zero paid third-party APIs. Vector QR generation, audio synthesis, and cryptographic hashing are implemented in pure native client-side JavaScript to ensure offline reliability during campus festivals.

---

## 9. AI Tools & Features Used
In compliance with contest rules (Rulebook Page 4, Section 9), the development tools and AI agents used in creating this project are disclosed below:
- **Google Antigravity Agentic Assistant / DeepMind Agent:** Autonomous codebase coordination, pair programming, schema design, and responsive layout styling.
- **LLM Assisted Models (Claude 3.5 Sonnet / Gemini):** Rapid algorithmic brainstorming, UI copy generation, and rulebook compliance audit.

---

## 10. Screenshots & Flow Diagram

### Architecture Flow:
```
Campus Tech Society (Organization)
│
├── International Tech Carnival 2026 (Fest)
│   ├── AI Web Development Contest (Event)
│   ├── Programming Contest (Event)
│   ├── Robotics Challenge (Event)
│   └── Gaming Tournament (Event)
│
├── Winter Tech Fest 2026 (Fest)
│   ├── Hackathon (24-Hour Sprint) (Event)
│   ├── AI & Modern Web Workshop (Event)
│   └── Tech Quiz Olympiad (Event)
│
└── Freshers Tech Fest 2027 (Fest)
    ├── Freshers Coding Challenge (Event)
    └── AI & Generative Tools Bootcamp (Event)
```

### User Navigation Flow:
```
Fest / Event Directory ──► Select a Fest ──► View Fest Schedule & Contests
                                                     │
                                                     ▼
Registration Confirmation ◄── Submit Form ◄── Select Event & View Details
          │
          ▼
Holographic Pass & QR ──► 0.4s Gate Scanner Check-in
```

---

## 11. Known Limitations
- Camera-based QR scanning requires browser camera permissions over `localhost` or `https://` (on `http://` network origins, browsers block camera access; one-click simulation buttons are built-in for instant gate testing).
- Persistent state uses browser `localStorage`. To reset to the initial demo state at any time, click **Preferences -> Reset Demo Data**.

---

## 12. License
This project is open-source and released under the **MIT License**. See the [LICENSE](LICENSE) file for complete terms.
