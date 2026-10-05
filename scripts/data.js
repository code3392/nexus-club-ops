// Data Store & State Engine with LocalStorage Persistence
const STORAGE_KEY = 'NEXUS_CLUB_OPS_STATE_V2';

export const INITIAL_CLUBS = [
  {
    id: 'club-turing',
    name: 'Turing Computer Society',
    badge: 'Tech & AI',
    color: '#6366f1',
    lead: 'Alex Chen',
    icon: '💻',
    activeEvents: 2,
    members: 420
  },
  {
    id: 'club-soundwave',
    name: 'SoundWave Arts & Music',
    badge: 'Cultural',
    color: '#ec4899',
    lead: 'Maya Sharma',
    icon: '🎸',
    activeEvents: 1,
    members: 310
  },
  {
    id: 'club-robotics',
    name: 'Autonomous Robotics Guild',
    badge: 'Hardware & Mechatronics',
    color: '#10b981',
    lead: 'Liam Vance',
    icon: '🤖',
    activeEvents: 1,
    members: 180
  },
  {
    id: 'club-ecell',
    name: 'E-Cell Entrepreneurship Hub',
    badge: 'Startups & Ventures',
    color: '#f59e0b',
    lead: 'Rohan Mehta',
    icon: '🚀',
    activeEvents: 2,
    members: 260
  }
];

export const INITIAL_EVENTS = [
  {
    id: 'evt-hacknova',
    clubId: 'club-turing',
    title: 'HackNova 2026: 36h Autonomous AI Hackathon',
    category: 'hackathon',
    clubName: 'Turing Computer Society',
    badge: 'Flagship Tech Fest',
    tagline: 'Build autonomous agents, smart campus tools, and decentralised apps.',
    date: 'Oct 24-26, 2026',
    venue: 'Campus Innovation Hub - Floor 3',
    prizePool: '$4,000 + Cloud Grants',
    fee: 0,
    isTeam: true,
    minTeam: 2,
    maxTeam: 4,
    capacity: 120,
    registeredCount: 96,
    status: 'hot',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    customFields: [
      { id: 'f_track', label: 'Preferred Track', type: 'select', required: true, options: ['AI & Autonomous Agents', 'Web3 & Identity', 'Smart Campus Ops', 'Open Innovation'] },
      { id: 'f_github', label: 'GitHub / Devpost Portfolio URL', type: 'url', required: true, placeholder: 'https://github.com/username' },
      { id: 'f_diet', label: 'Midnight Hack Meal Preference', type: 'select', required: true, options: ['Vegetarian', 'Vegan', 'Standard Meal', 'Jain Option'] },
      { id: 'f_tshirt', label: 'Hacker T-Shirt Size', type: 'select', required: true, options: ['S', 'M', 'L', 'XL', 'XXL'] }
    ]
  },
  {
    id: 'evt-aurabeats',
    clubId: 'club-soundwave',
    title: 'Aura Beats: Battle of the Campus Bands',
    category: 'cultural',
    clubName: 'SoundWave Arts & Music',
    badge: 'Cultural Fest Headliner',
    tagline: 'High-energy live rock, fusion, and indie performances under the amphitheater lights.',
    date: 'Oct 25, 2026 • 6:00 PM',
    venue: 'Open-Air Amphitheater',
    prizePool: '$1,500 Cash + Studio Time',
    fee: 15,
    isTeam: true,
    minTeam: 3,
    maxTeam: 8,
    capacity: 25,
    registeredCount: 19,
    status: 'filling',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
    customFields: [
      { id: 'f_genre', label: 'Band Genre', type: 'select', required: true, options: ['Rock / Metal', 'Indie / Pop', 'Fusion / Acoustic', 'Electronic / Synth'] },
      { id: 'f_gear', label: 'Do you bring your own Drum Kit / Keyboards?', type: 'radio', required: true, options: ['Yes, we have our own backline', 'No, need venue backline'] },
      { id: 'f_spotify', label: 'Demo Audio / YouTube Link', type: 'url', required: false, placeholder: 'https://youtube.com/watch?v=...' }
    ]
  },
  {
    id: 'evt-roboclash',
    clubId: 'club-robotics',
    title: 'RoboClash: 15kg Combat Robot Deathmatch',
    category: 'robotics',
    clubName: 'Autonomous Robotics Guild',
    badge: 'Hardware Arena',
    tagline: 'Spinner vs Wedge bot demolition in a bulletproof polycarbonate arena.',
    date: 'Oct 27, 2026 • 2:00 PM',
    venue: 'Engineering Courtyard Arena',
    prizePool: '$2,200 Hardware Pool',
    fee: 20,
    isTeam: true,
    minTeam: 2,
    maxTeam: 4,
    capacity: 32,
    registeredCount: 28,
    status: 'urgent',
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    customFields: [
      { id: 'f_botname', label: 'Combat Bot Name', type: 'text', required: true, placeholder: 'e.g. ThunderStrike MK-II' },
      { id: 'f_weapon', label: 'Primary Weapon System', type: 'select', required: true, options: ['Vertical Spinner', 'Drum Spinner', 'Pneumatic Flipper', 'Lifter / Wedge'] },
      { id: 'f_failsafe', label: 'Has compliant radio failsafe cutoff?', type: 'select', required: true, options: ['Yes - Verified 2.4GHz cutoff', 'Testing in progress'] }
    ]
  },
  {
    id: 'evt-apexvelocity',
    clubId: 'club-turing',
    title: 'Apex Velocity: 5v5 Valorant LAN Championship',
    category: 'gaming',
    clubName: 'Turing Computer Society',
    badge: 'Esports Championship',
    tagline: 'High-refresh-rate LAN showdown with live casters and stadium spectator stream.',
    date: 'Oct 28, 2026 • 11:00 AM',
    venue: 'Esports Arena Lab 4',
    prizePool: '$1,200 + Peripheral Gear',
    fee: 10,
    isTeam: true,
    minTeam: 5,
    maxTeam: 5,
    capacity: 32,
    registeredCount: 31,
    status: 'urgent',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)',
    customFields: [
      { id: 'f_riotid', label: 'Team Captain Riot ID (#Tag)', type: 'text', required: true, placeholder: 'Shadow#NA1' },
      { id: 'f_rank', label: 'Average Team Competitive Rank', type: 'select', required: true, options: ['Immortal / Radiant', 'Ascendant', 'Diamond', 'Platinum', 'Gold & Under'] }
    ]
  },
  {
    id: 'evt-designthon',
    clubId: 'club-soundwave',
    title: 'DesignSprint: 12-Hour Product & AI UX Jam',
    category: 'design',
    clubName: 'SoundWave Arts & Music',
    badge: 'Creative Sprint',
    tagline: 'Reimagine zero-friction campus software and future spatial user interfaces.',
    date: 'Oct 26, 2026 • 9:00 AM',
    venue: 'Design Studio Lab A',
    prizePool: '$1,000 + Figma Pro Subs',
    fee: 0,
    isTeam: false,
    capacity: 50,
    registeredCount: 42,
    status: 'filling',
    gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
    customFields: [
      { id: 'f_figma', label: 'Portfolio Link (Behance / Dribbble / Web)', type: 'url', required: true, placeholder: 'https://bento.me/designer' },
      { id: 'f_level', label: 'Primary Design Domain', type: 'select', required: true, options: ['Mobile / Web Product Design', 'Design Systems & Tokens', '3D / Motion Graphics', 'Design Engineering (Figma to Code)'] }
    ]
  },
  {
    id: 'evt-venturepitch',
    clubId: 'club-ecell',
    title: 'Campus Shark Tank: Student Venture Pitch',
    category: 'business',
    clubName: 'E-Cell Entrepreneurship Hub',
    badge: 'Angel Pitch Day',
    tagline: 'Pitch your collegiate startup to 5 VC partners and seed angel networks.',
    date: 'Oct 29, 2026 • 3:00 PM',
    venue: 'Executive Seminar Hall',
    prizePool: '$5,000 Non-Dilutive Angel Grant',
    fee: 0,
    isTeam: true,
    minTeam: 1,
    maxTeam: 3,
    capacity: 20,
    registeredCount: 16,
    status: 'filling',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #c084fc 100%)',
    customFields: [
      { id: 'f_startupname', label: 'Startup / Project Name', type: 'text', required: true, placeholder: 'e.g. EcoPack Labs' },
      { id: 'f_deck', label: 'Pitch Deck Link (PDF/Pitch)', type: 'url', required: true, placeholder: 'https://drive.google.com/...' },
      { id: 'f_sector', label: 'Sector / Market', type: 'select', required: true, options: ['B2B SaaS / AI', 'Hardware & DeepTech', 'Climate & Cleantech', 'Consumer / Edtech'] }
    ]
  }
];

export const INITIAL_REGISTRATIONS = [
  {
    id: 'REG-8821',
    ticketId: 'NX-NOVA-8821',
    eventId: 'evt-hacknova',
    eventTitle: 'HackNova 2026',
    clubName: 'Turing Computer Society',
    leadName: 'Aarav Patel',
    leadEmail: 'aarav.patel@campus.edu',
    leadPhone: '+1 (555) 349-2104',
    collegeRoll: '2023-CS-104',
    teamName: 'NeuralKnights',
    teamMembers: [
      { name: 'Aarav Patel', role: 'Captain & ML Eng' },
      { name: 'Kavya Singh', role: 'Fullstack Dev' },
      { name: 'Marcus Brody', role: 'Backend / Ops' }
    ],
    answers: {
      f_track: 'AI & Autonomous Agents',
      f_github: 'https://github.com/neuralknights',
      f_diet: 'Vegetarian',
      f_tshirt: 'L'
    },
    paymentStatus: 'PAID_FREE',
    amount: 0,
    registeredAt: '2026-10-04T14:32:00Z',
    checkedIn: true,
    checkedInAt: '2026-10-05T09:12:15Z',
    gate: 'Gate 1 (North Hub)',
    passTier: 'VIP Hacker'
  },
  {
    id: 'REG-7124',
    ticketId: 'NX-AURA-7124',
    eventId: 'evt-aurabeats',
    eventTitle: 'Aura Beats',
    clubName: 'SoundWave Arts & Music',
    leadName: 'Sophia Rodriguez',
    leadEmail: 'sophia.r@stateuniv.edu',
    leadPhone: '+1 (555) 721-8890',
    collegeRoll: '2022-ART-089',
    teamName: 'The Crimson Overdrive',
    teamMembers: [
      { name: 'Sophia Rodriguez', role: 'Vocals & Lead Guitar' },
      { name: 'Ethan Hunt', role: 'Drums' },
      { name: 'Zane Malik', role: 'Bass' },
      { name: 'Chloe Dubois', role: 'Keys & Synth' }
    ],
    answers: {
      f_genre: 'Indie / Pop',
      f_gear: 'Yes, we have our own backline',
      f_spotify: 'https://youtube.com/crimsonoverdrive'
    },
    paymentStatus: 'VERIFIED',
    transactionId: 'TXN-9021841284',
    amount: 15,
    registeredAt: '2026-10-03T18:40:00Z',
    checkedIn: false,
    gate: null,
    passTier: 'Artist Backstage'
  },
  {
    id: 'REG-9019',
    ticketId: 'NX-ROBO-9019',
    eventId: 'evt-roboclash',
    eventTitle: 'RoboClash 2026',
    clubName: 'Autonomous Robotics Guild',
    leadName: 'David Zhang',
    leadEmail: 'david.zhang@robotics.edu',
    leadPhone: '+1 (555) 602-4411',
    collegeRoll: '2021-MECH-412',
    teamName: 'TitanForge Mechatronics',
    teamMembers: [
      { name: 'David Zhang', role: 'Driver & Electrical' },
      { name: 'Rachel Lee', role: 'Armor Fabrication' },
      { name: 'Vikram Joshi', role: 'Telemetry & Safety' }
    ],
    answers: {
      f_botname: 'Titan Destroyer MK-IV',
      f_weapon: 'Vertical Spinner',
      f_failsafe: 'Yes - Verified 2.4GHz cutoff'
    },
    paymentStatus: 'VERIFIED',
    transactionId: 'TXN-8812903341',
    amount: 20,
    registeredAt: '2026-10-02T11:20:00Z',
    checkedIn: true,
    checkedInAt: '2026-10-05T10:45:20Z',
    gate: 'Gate 2 (Arena South)',
    passTier: 'Combat Pit Crew'
  },
  {
    id: 'REG-6512',
    ticketId: 'NX-APEX-6512',
    eventId: 'evt-apexvelocity',
    eventTitle: 'Apex Velocity',
    clubName: 'Turing Computer Society',
    leadName: 'Kenji Sato',
    leadEmail: 'kenji.s@gaming.campus.edu',
    leadPhone: '+1 (555) 431-9872',
    collegeRoll: '2024-ENG-773',
    teamName: 'Ghost Protocol',
    teamMembers: [
      { name: 'Kenji Sato', role: 'Duelist / IGL' },
      { name: 'Liam Ross', role: 'Initiator' },
      { name: 'Elena Rostova', role: 'Controller' },
      { name: 'Brian O\'Connor', role: 'Sentinel' },
      { name: 'Jin Woo', role: 'Flex' }
    ],
    answers: {
      f_riotid: 'Ghost#NA99',
      f_rank: 'Immortal / Radiant'
    },
    paymentStatus: 'VERIFIED',
    transactionId: 'TXN-7739182390',
    amount: 10,
    registeredAt: '2026-10-04T08:15:00Z',
    checkedIn: false,
    gate: null,
    passTier: 'Esports Player'
  },
  {
    id: 'REG-3341',
    ticketId: 'NX-DSGN-3341',
    eventId: 'evt-designthon',
    eventTitle: 'DesignSprint 12h',
    clubName: 'SoundWave Arts & Music',
    leadName: 'Nadia Karim',
    leadEmail: 'nadia.design@campus.edu',
    leadPhone: '+1 (555) 890-1234',
    collegeRoll: '2023-DES-201',
    teamName: 'Solo Sprint',
    teamMembers: [
      { name: 'Nadia Karim', role: 'Product Designer' }
    ],
    answers: {
      f_figma: 'https://bento.me/nadiadesign',
      f_level: 'Design Engineering (Figma to Code)'
    },
    paymentStatus: 'PAID_FREE',
    amount: 0,
    registeredAt: '2026-10-05T01:10:00Z',
    checkedIn: true,
    checkedInAt: '2026-10-05T11:04:10Z',
    gate: 'Gate 1 (North Hub)',
    passTier: 'Standard Creator'
  }
];

export const INITIAL_ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    time: '11:30 AM',
    title: 'RoboClash Safety Inspection Starting',
    message: 'All 15kg bot teams report to Pit Bay 4 with telemetry switches for radio verification.',
    tag: 'Alert',
    color: '#ef4444'
  },
  {
    id: 'ann-2',
    time: '10:00 AM',
    title: 'HackNova Cloud Credits Released',
    message: '$500 API inference tokens dispatched directly to all registered team captain dashboards.',
    tag: 'Update',
    color: '#6366f1'
  },
  {
    id: 'ann-3',
    time: '09:15 AM',
    title: 'Gate 1 Check-in Speed Record',
    message: 'Over 400 attendees checked in via QR scanner in under 8 minutes with 0 queue backlog.',
    tag: 'Milestone',
    color: '#10b981'
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
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not read localStorage', e);
    }
    return {
      clubs: INITIAL_CLUBS,
      events: INITIAL_EVENTS,
      registrations: INITIAL_REGISTRATIONS,
      announcements: INITIAL_ANNOUNCEMENTS,
      scanHistory: [
        {
          ticketId: 'NX-NOVA-8821',
          name: 'Aarav Patel',
          event: 'HackNova 2026',
          time: '09:12:15 AM',
          status: 'SUCCESS',
          gate: 'Gate 1'
        },
        {
          ticketId: 'NX-ROBO-9019',
          name: 'David Zhang',
          event: 'RoboClash 2026',
          time: '10:45:20 AM',
          status: 'SUCCESS',
          gate: 'Gate 2'
        },
        {
          ticketId: 'NX-DSGN-3341',
          name: 'Nadia Karim',
          event: 'DesignSprint 12h',
          time: '11:04:10 AM',
          status: 'SUCCESS',
          gate: 'Gate 1'
        }
      ]
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
      clubs: INITIAL_CLUBS,
      events: INITIAL_EVENTS,
      registrations: INITIAL_REGISTRATIONS,
      announcements: INITIAL_ANNOUNCEMENTS,
      scanHistory: []
    };
    this.save();
    return this.state;
  }

  getEvents() {
    return this.state.events;
  }

  getClubs() {
    return this.state.clubs;
  }

  getRegistrations() {
    return this.state.registrations;
  }

  addEvent(eventData) {
    this.state.events.unshift(eventData);
    this.save();
    return eventData;
  }

  addRegistration(regData) {
    this.state.registrations.unshift(regData);
    // increment event registeredCount
    const event = this.state.events.find(e => e.id === regData.eventId);
    if (event) {
      event.registeredCount = (event.registeredCount || 0) + 1;
    }
    this.save();
    return regData;
  }

  verifyCheckIn(ticketId, gate = 'Gate 1') {
    const reg = this.state.registrations.find(
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
      this.state.scanHistory.unshift(log);
      this.save();
      return { status: 'INVALID', message: 'Ticket ID not found in database. Possible fraudulent or unissued pass.', reg: null };
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
    this.state.scanHistory.unshift(log);
    this.save();

    return {
      status: 'SUCCESS',
      message: `Verified! Welcome ${reg.leadName} (${reg.teamName || 'Solo'}). Pass authorized for entry.`,
      reg
    };
  }

  addAnnouncement(title, message, tag = 'Broadcast', color = '#6366f1') {
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
