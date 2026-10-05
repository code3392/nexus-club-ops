// Data Store & State Engine with LocalStorage Persistence
// Designed for Modern Student Organizations & Smart Club Operations
const STORAGE_KEY = 'NEXUS_CAMPUS_OPS_V5';

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

export const INITIAL_FESTS = [
  {
    id: 'fest-techcarnival-2026',
    title: 'International Tech Carnival 2026',
    shortName: 'Tech Carnival 2026',
    edition: '9th International Edition',
    organization: 'Campus Tech Society',
    status: 'Active / Registration Open',
    date: 'October 24 - 26, 2026',
    venue: 'Campus Central Auditorium & Main Arena',
    tagline: 'The flagship collegiate and international technology carnival.',
    description: 'Premier collegiate festival ready for your custom competitions and workshops.',
    bannerGradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #06b6d4 100%)',
    totalEvents: 0,
    badge: 'Flagship Carnival'
  },
  {
    id: 'fest-wintertech-2026',
    title: 'Winter Tech Fest 2026',
    shortName: 'Winter Tech Fest',
    edition: 'Annual Winter Meet',
    organization: 'Campus Tech Society',
    status: 'Registration Open',
    date: 'December 18 - 20, 2026',
    venue: 'Science & IT Complex, Campus',
    tagline: 'Annual deep-tech immersion, innovation sprint, and Olympiad quiz.',
    description: 'Winter season festival container ready for hackathons and masterclasses.',
    bannerGradient: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 50%, #10b981 100%)',
    totalEvents: 0,
    badge: 'Winter Edition'
  },
  {
    id: 'fest-freshers-2027',
    title: 'Freshers Tech Fest 2027',
    shortName: 'Freshers Tech Fest',
    edition: 'Orientation Edition',
    organization: 'Campus Tech Society',
    status: 'Upcoming',
    date: 'January 15 - 16, 2027',
    venue: 'Campus IT Labs 1 & 2',
    tagline: 'The welcoming gateway festival for aspiring coders & young innovators.',
    description: 'Orientation festival container ready for beginner-friendly contests.',
    bannerGradient: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 50%, #f59e0b 100%)',
    totalEvents: 0,
    badge: 'Freshers Gateway'
  }
];

export const INITIAL_CLUBS = [
  {
    id: 'club-tech-society',
    name: 'Campus Tech Society',
    badge: 'Tech & AI',
    color: '#6366f1',
    lead: 'Executive Committee',
    icon: '⚡',
    activeEvents: 0,
    members: 850
  },
  {
    id: 'club-robotics',
    name: 'Campus Robotics Guild',
    badge: 'Hardware & Mechatronics',
    color: '#10b981',
    lead: 'Robotics Wing',
    icon: '🤖',
    activeEvents: 0,
    members: 320
  },
  {
    id: 'club-programming',
    name: 'Competitive Programming Society',
    badge: 'Algorithms & Olympiads',
    color: '#3b82f6',
    lead: 'CP Wing',
    icon: '💻',
    activeEvents: 0,
    members: 410
  }
];

// Requirement 4: Empty initial events list (user adds events manually)
export const INITIAL_EVENTS = [];

// Requirement 4: Empty initial registrations
export const INITIAL_REGISTRATIONS = [];

export const INITIAL_ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    time: 'Live',
    title: 'NexusOps Portal Active',
    message: 'Welcome to Smart Club Operations. Create your first event and registration form in the Form Builder.',
    tag: 'Notice',
    color: '#6366f1'
  }
];

// Helper to load or persist state
export class StateManager {
  constructor() {
    this.state = this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.events)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read localStorage', e);
    }

    return {
      organization: INITIAL_ORGANIZATION,
      fests: INITIAL_FESTS,
      clubs: INITIAL_CLUBS,
      events: INITIAL_EVENTS,
      registrations: INITIAL_REGISTRATIONS,
      announcements: INITIAL_ANNOUNCEMENTS,
      scanHistory: []
    };
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }

  resetToDefault() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = {
      organization: INITIAL_ORGANIZATION,
      fests: INITIAL_FESTS,
      clubs: INITIAL_CLUBS,
      events: INITIAL_EVENTS,
      registrations: INITIAL_REGISTRATIONS,
      announcements: INITIAL_ANNOUNCEMENTS,
      scanHistory: []
    };
    this.save();
    return this.state;
  }

  getOrganization() {
    return this.state.organization || INITIAL_ORGANIZATION;
  }

  getFests() {
    return this.state.fests || INITIAL_FESTS;
  }

  getFest(id) {
    return (this.state.fests || []).find(f => f.id === id);
  }

  addFest(festData) {
    if (!this.state.fests) this.state.fests = [];
    this.state.fests.unshift(festData);
    this.save();
    return festData;
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
    }
  }

  getRegistrations() {
    return this.state.registrations || [];
  }

  addEvent(eventData) {
    if (!this.state.events) this.state.events = [];
    this.state.events.unshift(eventData);
    this.save();
    return eventData;
  }

  // Requirement 8: Update created event / registration form
  updateEvent(eventId, updatedFields) {
    if (!this.state.events) return null;
    const idx = this.state.events.findIndex(e => e.id === eventId);
    if (idx !== -1) {
      this.state.events[idx] = { ...this.state.events[idx], ...updatedFields };
      this.save();
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
      return true;
    }
    return false;
  }

  cancelRegistration(ticketId) {
    return this.updateRegistrationStatus(ticketId, 'Cancelled');
  }

  updateRegistrationDetails(ticketId, updateFields) {
    const reg = (this.state.registrations || []).find(r => r.ticketId.toUpperCase() === ticketId.trim().toUpperCase());
    if (reg) {
      Object.assign(reg, updateFields);
      this.save();
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
      r.collegeRoll?.toLowerCase() === q
    );
  }

  // Requirement 1: Only the user who launched the event can scan tickets for it
  verifyCheckIn(ticketId, gate = 'Gate 1', currentOperatorEmail = null) {
    const reg = (this.state.registrations || []).find(
      r => r.ticketId.toUpperCase() === ticketId.trim().toUpperCase()
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

  addAnnouncement(title, message, tag = 'Broadcast', color = '#6366f1') {
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
