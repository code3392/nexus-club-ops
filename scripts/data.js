// Data Store & State Engine with LocalStorage Persistence
// Designed for Modern Student Organizations & Smart Club Operations
const STORAGE_KEY = 'NEXUS_CAMPUS_OPS_V6';

export const INITIAL_ORGANIZATION = {
  id: 'org-tech-guild',
  name: 'Campus Tech Society',
  institution: 'University & Collegiate Tech Union',
  tagline: 'Leading the future of technology, competitive coding, robotics, and youth innovation.',
  established: '2015',
  email: 'techsociety@campus.edu',
  location: 'Central Campus Auditorium & Tech Complex',
  badge: 'Official Student Organization'
};

// Shared festival & event catalog across all users
export const INITIAL_FESTS = [
  {
    id: 'fest-drmc-2026',
    title: '9th DRMC International Tech Carnival 2026',
    shortName: '9th DRMC Tech Carnival',
    edition: '9th',
    organization: 'DRMC IT CLUB',
    createdBy: null,
    creatorEmail: 'mdsaminyasirsami@gmail.com',
    status: 'Active',
    date: 'October 8-10, 2026',
    venue: 'Dhaka Residential Model College',
    tagline: 'DRMC IT CLUB proudly presents the grandest tech event of the year, The 9th DRMC International Tech Carnival 2026.',
    description: 'DRMC IT CLUB proudly presents the grandest tech event of the year, The 9th DRMC International Tech Carnival 2026. Join collegiate and high school innovators across national competitions, programming contests, and robotics showcases.',
    bannerGradient: 'linear-gradient(135deg, #262626 0%, #171717 50%, #0a0a0a 100%)',
    totalEvents: 1,
    badge: 'Official Fest'
  }
];

export const INITIAL_CLUBS = [
  {
    id: 'club-tech-society',
    name: 'Campus Tech Society',
    badge: 'Tech & AI',
    color: '#ffffff',
    lead: 'Executive Committee',
    icon: 'TS',
    activeEvents: 0,
    members: 850
  },
  {
    id: 'club-robotics',
    name: 'Campus Robotics Guild',
    badge: 'Hardware & Mechatronics',
    color: '#e5e5e5',
    lead: 'Robotics Wing',
    icon: 'RG',
    activeEvents: 0,
    members: 320
  },
  {
    id: 'club-programming',
    name: 'Competitive Programming Society',
    badge: 'Algorithms & Olympiads',
    color: '#d4d4d4',
    lead: 'CP Wing',
    icon: 'CP',
    activeEvents: 0,
    members: 410
  }
];

// Seeded contest under the active festival
export const INITIAL_EVENTS = [
  {
    id: 'evt-drmc-prog-2026',
    festId: 'fest-drmc-2026',
    festName: '9th DRMC International Tech Carnival 2026',
    clubId: 'club-tech-society',
    clubName: 'DRMC IT CLUB',
    title: 'National Programming Contest 2026',
    category: 'hackathon',
    tagline: 'Collegiate & high school competitive algorithmic contest with live scoreboard.',
    headline: 'National Algorithmic Programming Battle',
    description: 'Solve competitive algorithm and data structure problems in 3 hours. Live scoreboard and instant gate entry pass provided upon registration.',
    rules: 'ICPC style scoring. Individual solo entry or team of up to 3 members. All standard programming languages (C++, Java, Python) allowed.',
    fee: 0,
    capacity: 150,
    registeredCount: 0,
    date: 'October 9, 2026 • 10:00 AM',
    venue: 'Campus Tech Complex, Room 402',
    prizePool: 'BDT 50,000 + Trophies',
    deadline: 'October 7, 2026 • 11:59 PM',
    isTeam: true,
    minTeam: 1,
    maxTeam: 3,
    status: 'open',
    gradient: 'linear-gradient(135deg, #1f1f1f 0%, #121212 100%)',
    gates: [
      { id: 'gate-main', name: 'Main Gate' },
      { id: 'gate-lab', name: 'Lab 4 Entrance' }
    ],
    fields: [
      { id: 'q-institution', type: 'text', label: 'School / College / University Name', required: true, placeholder: 'e.g. Dhaka Residential Model College' },
      { id: 'q-tshirt', type: 'select', label: 'T-Shirt Size', required: true, options: ['M', 'L', 'XL', 'XXL'] }
    ]
  }
];

// Requirement 4: Empty initial registrations
export const INITIAL_REGISTRATIONS = [];

export const INITIAL_ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    time: 'Live',
    title: 'NexusOps Portal Active',
    message: 'Welcome to Smart Club Operations. Create your first event and registration form in the Form Builder.',
    tag: 'Notice',
    color: '#ffffff'
  }
];

// Helper to load or persist state
export class StateManager {
  constructor() {
    this.state = this.loadState();

    // Real-time broadcast channel across open tabs in same browser
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel('nexus_ops_channel');
        this.channel.onmessage = (event) => {
          if (event && event.data && event.data.type === 'STATE_UPDATED') {
            this.handleRemoteSync(event.data.state);
          }
        };
      } catch (e) {
        this.channel = null;
      }
    }

    // Cross-tab storage listener
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            this.handleRemoteSync(JSON.parse(e.newValue));
          } catch (err) {}
        }
      });

      // Window focus sync to catch updates from other users/devices immediately
      window.addEventListener('focus', () => {
        this.syncWithServer();
      });
    }

    // Initial server sync
    this.syncWithServer();

    // Background poll every 15 seconds to sync from server across all devices & users
    if (typeof setInterval !== 'undefined') {
      setInterval(() => {
        this.syncWithServer();
      }, 15000);
    }
  }

  handleRemoteSync(newState) {
    if (!newState) return;
    this.state = newState;
    this.notifySyncListeners();
  }

  notifySyncListeners() {
    if (typeof window !== 'undefined') {
      if (window.nexusApp && typeof window.nexusApp.onDataSynced === 'function') {
        window.nexusApp.onDataSynced();
      }
      if (window.adminCenter && typeof window.adminCenter.render === 'function') {
        window.adminCenter.render();
      }
    }
  }

  async syncWithServer() {
    try {
      const res = await fetch('/api/data', { cache: 'no-store' });
      if (!res.ok) return;
      const serverData = await res.json();
      if (!serverData) return;

      // Compute stable signature to avoid re-rendering DOM if data is identical
      const incomingSignature = JSON.stringify({
        fCount: serverData.fests?.length || 0,
        eCount: serverData.events?.length || 0,
        rCount: serverData.registrations?.length || 0,
        fIds: (serverData.fests || []).map(f => `${f.id}:${f.name}`),
        eIds: (serverData.events || []).map(e => `${e.id}:${e.registeredCount || 0}`)
      });

      if (this._lastServerSignature === incomingSignature) {
        return; // No changes from server, skip re-render
      }

      let hasServerChanges = false;

      if (!Array.isArray(this.state.fests)) this.state.fests = [];
      if (!Array.isArray(this.state.events)) this.state.events = [];
      if (!Array.isArray(this.state.registrations)) this.state.registrations = [];

      // 1. Synchronize festivals
      if (Array.isArray(serverData.fests)) {
        const serverFestIds = new Set(serverData.fests.map(sf => sf.id));
        const localFests = this.state.fests || [];
        
        const filteredLocal = localFests.filter(lf => serverFestIds.has(lf.id));
        if (filteredLocal.length !== localFests.length) {
          hasServerChanges = true;
        }

        const mergedFests = [...serverData.fests];
        if (JSON.stringify(this.state.fests) !== JSON.stringify(mergedFests)) {
          this.state.fests = mergedFests;
          hasServerChanges = true;
        }
      }

      // 2. Synchronize events
      if (Array.isArray(serverData.events)) {
        if (JSON.stringify(this.state.events) !== JSON.stringify(serverData.events)) {
          this.state.events = [...serverData.events];
          hasServerChanges = true;
        }
      }

      // 3. Synchronize registrations
      if (Array.isArray(serverData.registrations)) {
        if (JSON.stringify(this.state.registrations) !== JSON.stringify(serverData.registrations)) {
          this.state.registrations = [...serverData.registrations];
          hasServerChanges = true;
        }
      }

      this._lastServerSignature = incomingSignature;

      // If server had new or updated items, update local storage and notify UI
      if (hasServerChanges) {
        this.save(false);
        this.notifySyncListeners();
      }
    } catch (err) {
      // Offline fallback
    }
  }

  async pushStateToServer() {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fests: this.state.fests || [],
          events: this.state.events || [],
          registrations: this.state.registrations || []
        })
      });
    } catch (err) {
      // Offline fallback
    }
  }

  loadState() {
    try {
      ['NEXUS_CAMPUS_OPS_V1', 'NEXUS_CAMPUS_OPS_V2', 'NEXUS_CAMPUS_OPS_V3', 'NEXUS_CAMPUS_OPS_V4', 'NEXUS_CAMPUS_OPS_V5'].forEach(k => {
        try { localStorage.removeItem(k); } catch (e) {}
      });

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.events)) {
          if (Array.isArray(parsed.fests)) {
            parsed.fests = parsed.fests.filter(f => 
              f.id !== 'fest-techcarnival-2026' && 
              f.id !== 'fest-wintertech-2026' && 
              f.id !== 'fest-freshers-2027'
            );
          } else {
            parsed.fests = [...INITIAL_FESTS];
          }
          if (!Array.isArray(parsed.events)) {
            parsed.events = [...INITIAL_EVENTS];
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read localStorage', e);
    }

    return {
      organization: INITIAL_ORGANIZATION,
      fests: [...INITIAL_FESTS],
      clubs: INITIAL_CLUBS,
      events: [...INITIAL_EVENTS],
      registrations: INITIAL_REGISTRATIONS,
      announcements: INITIAL_ANNOUNCEMENTS,
      scanHistory: []
    };
  }

  save(broadcast = true) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      if (broadcast && this.channel) {
        this.channel.postMessage({ type: 'STATE_UPDATED', state: this.state });
      }
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }

  resetToDefault() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = {
      organization: INITIAL_ORGANIZATION,
      fests: [...INITIAL_FESTS],
      clubs: INITIAL_CLUBS,
      events: [...INITIAL_EVENTS],
      registrations: INITIAL_REGISTRATIONS,
      announcements: INITIAL_ANNOUNCEMENTS,
      scanHistory: []
    };
    this.save();
    this.pushStateToServer();
    return this.state;
  }

  getOrganization() {
    return this.state.organization || INITIAL_ORGANIZATION;
  }

  getFests() {
    return this.state.fests || [];
  }

  getFest(id) {
    return (this.state.fests || []).find(f => f.id === id);
  }

  addFest(festData) {
    if (!this.state.fests) this.state.fests = [];
    this.state.fests.unshift(festData);
    this.save();
    this.pushStateToServer();
    return festData;
  }

  deleteFest(festId) {
    if (!this.state.fests) return false;
    this.state.fests = this.state.fests.filter(f => f.id !== festId);
    this.save();
    fetch('/api/fests/' + encodeURIComponent(festId), { method: 'DELETE', credentials: 'include' }).catch(() => {});
    this.pushStateToServer();
    return true;
  }

  updateFest(festId, updatedFields) {
    if (!this.state.fests) return null;
    const idx = this.state.fests.findIndex(f => f.id === festId);
    if (idx !== -1) {
      this.state.fests[idx] = { ...this.state.fests[idx], ...updatedFields };
      this.save();
      this.pushStateToServer();
      return this.state.fests[idx];
    }
    return null;
  }

  getEvents() {
    return this.state.events || [];
  }

  getEventsByFest(festId) {
    return (this.state.events || []).filter(e => e.festId === festId);
  }

  getClubs() {
    return this.state.clubs || [];
  }

  addClub(clubData) {
    if (!this.state.clubs) this.state.clubs = [];
    if (!this.state.clubs.some(c => c.name.toLowerCase() === clubData.name.toLowerCase())) {
      this.state.clubs.push(clubData);
      this.save();
      this.pushStateToServer();
    }
  }

  getRegistrations() {
    return this.state.registrations || [];
  }

  addEvent(eventData) {
    if (!this.state.events) this.state.events = [];
    this.state.events.unshift(eventData);
    this.save();
    this.pushStateToServer();
    return eventData;
  }

  // Requirement 8: Update created event / registration form
  updateEvent(eventId, updatedFields) {
    if (!this.state.events) return null;
    const idx = this.state.events.findIndex(e => e.id === eventId);
    if (idx !== -1) {
      this.state.events[idx] = { ...this.state.events[idx], ...updatedFields };
      this.save();
      this.pushStateToServer();
      return this.state.events[idx];
    }
    return null;
  }

  // Requirement 8: Cancel / Delete created event & registration form
  deleteEvent(eventId) {
    if (!this.state.events) return false;
    this.state.events = this.state.events.filter(e => e.id !== eventId);
    if (this.state.registrations) {
      this.state.registrations = this.state.registrations.filter(r => r.eventId !== eventId);
    }
    this.save();
    fetch('/api/events/' + encodeURIComponent(eventId), { method: 'DELETE', credentials: 'include' }).catch(() => {});
    this.pushStateToServer();
    return true;
  }

  addRegistration(regData) {
    if (!this.state.registrations) this.state.registrations = [];
    if (!regData.registrationStatus) {
      regData.registrationStatus = 'Approved';
    }
    this.state.registrations.unshift(regData);

    // increment event registeredCount
    const event = (this.state.events || []).find(e => e.id === regData.eventId);
    if (event) {
      event.registeredCount = (event.registeredCount || 0) + 1;
    }
    this.save();
    this.pushStateToServer();
    return regData;
  }

  // Update participant status (Approved, Pending, Waitlisted, Cancelled, Checked In)
  updateRegistrationStatus(ticketId, newStatus) {
    const reg = (this.state.registrations || []).find(r => r.ticketId.toUpperCase() === ticketId.trim().toUpperCase());
    if (reg) {
      reg.registrationStatus = newStatus;
      if (newStatus === 'Checked In') {
        reg.checkedIn = true;
        reg.checkedInAt = new Date().toISOString();
      } else if (newStatus === 'Cancelled') {
        const event = (this.state.events || []).find(e => e.id === reg.eventId);
        if (event && event.registeredCount > 0) {
          event.registeredCount -= 1;
        }
      }
      this.save();
      this.pushStateToServer();
      return true;
    }
    return false;
  }

  cancelRegistration(ticketId) {
    return this.updateRegistrationStatus(ticketId, 'Cancelled');
  }

  deleteRegistration(ticketId) {
    if (!this.state.registrations) return false;
    const reg = this.state.registrations.find(r => r.ticketId.toUpperCase() === ticketId.trim().toUpperCase());
    if (reg) {
      const event = (this.state.events || []).find(e => e.id === reg.eventId);
      if (event && event.registeredCount > 0) {
        event.registeredCount -= 1;
      }
    }
    this.state.registrations = this.state.registrations.filter(r => r.ticketId.toUpperCase() !== ticketId.trim().toUpperCase());
    this.save();
    this.pushStateToServer();
    return true;
  }

  updateRegistrationDetails(ticketId, updateFields) {
    const reg = (this.state.registrations || []).find(r => r.ticketId.toUpperCase() === ticketId.trim().toUpperCase());
    if (reg) {
      Object.assign(reg, updateFields);
      this.save();
      this.pushStateToServer();
      return true;
    }
    return false;
  }

  getRegistrationsByEmailOrTicket(query) {
    if (!query) return [];
    const q = query.trim().toLowerCase();
    return (this.state.registrations || []).filter(r =>
      r.leadEmail?.toLowerCase() === q ||
      r.ticketId?.toLowerCase() === q ||
      r.passCode?.toLowerCase() === q ||
      r.collegeRoll?.toLowerCase() === q
    );
  }

  // Requirement 1: Only the user who launched the event can scan tickets for it
  verifyCheckIn(ticketId, gate = 'Gate 1', currentOperatorEmail = null) {
    const query = ticketId.trim().toUpperCase();
    const reg = (this.state.registrations || []).find(
      r => (r.ticketId && r.ticketId.toUpperCase() === query)
        || (r.passCode && r.passCode.toUpperCase() === query)
        || (r.qrData && r.qrData.toUpperCase() === query)
        || (r.qrData && r.qrData.toUpperCase().includes(query))
    );

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (!reg) {
      const log = {
        ticketId: ticketId.toUpperCase(),
        name: 'Unknown Attendee',
        event: 'Unrecognized Pass',
        time: nowStr,
        status: 'INVALID',
        gate
      };
      if (!this.state.scanHistory) this.state.scanHistory = [];
      this.state.scanHistory.unshift(log);
      this.save();
      return { status: 'INVALID', message: 'Ticket ID not found in database. Possible fraudulent or unissued pass.', reg: null };
    }

    // Check event creator authorization
    const event = (this.state.events || []).find(e => e.id === reg.eventId);
    if (event && currentOperatorEmail) {
      const isCreator = (event.createdBy && event.createdBy.toLowerCase() === currentOperatorEmail.toLowerCase()) 
        || currentOperatorEmail.toLowerCase() === 'admin@campus.edu'
        || !event.createdBy; // fallback if event had no creator set

      if (!isCreator) {
        const log = {
          ticketId: reg.ticketId,
          name: reg.leadName,
          event: reg.eventTitle,
          time: nowStr,
          status: 'UNAUTHORIZED',
          gate
        };
        if (!this.state.scanHistory) this.state.scanHistory = [];
        this.state.scanHistory.unshift(log);
        this.save();
        return {
          status: 'UNAUTHORIZED',
          message: `Access Denied: You can only scan passes for events that you launched. This event was launched by ${event.creatorName || event.createdBy || 'another user'}.`,
          reg
        };
      }
    }

    if (reg.registrationStatus === 'Cancelled') {
      const log = {
        ticketId: reg.ticketId,
        name: reg.leadName,
        event: reg.eventTitle,
        time: nowStr,
        status: 'INVALID',
        gate
      };
      if (!this.state.scanHistory) this.state.scanHistory = [];
      this.state.scanHistory.unshift(log);
      this.save();
      return { status: 'INVALID', message: 'Registration has been cancelled. Entry denied.', reg };
    }

    if (reg.checkedIn) {
      const log = {
        ticketId: reg.ticketId,
        name: reg.leadName,
        event: reg.eventTitle,
        time: nowStr,
        status: 'DUPLICATE',
        gate
      };
      if (!this.state.scanHistory) this.state.scanHistory = [];
      this.state.scanHistory.unshift(log);
      this.save();
      return {
        status: 'DUPLICATE',
        message: `Duplicate Entry Alert! This ticket was already checked in at ${reg.checkedInAt || 'earlier'} at ${reg.gate || 'Gate 1'}.`,
        reg
      };
    }

    // Mark as checked in
    reg.checkedIn = true;
    reg.registrationStatus = 'Checked In';
    reg.checkedInAt = new Date().toISOString();
    reg.gate = gate;

    const log = {
      ticketId: reg.ticketId,
      name: reg.leadName,
      event: reg.eventTitle,
      time: nowStr,
      status: 'SUCCESS',
      gate
    };
    if (!this.state.scanHistory) this.state.scanHistory = [];
    this.state.scanHistory.unshift(log);
    this.save();

    return {
      status: 'SUCCESS',
      message: `Verified! Welcome ${reg.leadName} (${reg.teamName || 'Solo'}). Pass authorized for entry.`,
      reg
    };
  }

  addAnnouncement(title, message, tag = 'Broadcast', color = '#ffffff') {
    if (!this.state.announcements) this.state.announcements = [];
    const ann = {
      id: 'ann-' + Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title,
      message,
      tag,
      color
    };
    this.state.announcements.unshift(ann);
    this.save();
    return ann;
  }
}

export const db = new StateManager();
