// Data Store & State Engine with LocalStorage Persistence
// Designed for 9th DRMC International Tech Carnival 2026 & Smart Club Operations
const STORAGE_KEY = 'NEXUS_DRMC_STATE_V3';

export const INITIAL_ORGANIZATION = {
  id: 'org-drmc-it',
  name: 'DRMC IT Club',
  institution: 'Dhaka Residential Model College',
  tagline: 'Leading the future of technology, competitive coding, robotics, and youth innovation.',
  established: '2004',
  email: 'itclub@drmc.edu.bd',
  location: 'Mirpur Road, Mohammadpur, Dhaka-1207',
  badge: 'Official Student Organization'
};

export const INITIAL_FESTS = [
  {
    id: 'fest-techcarnival-2026',
    title: '9th DRMC International Tech Carnival 2026',
    shortName: 'Tech Carnival 2026',
    edition: '9th International Edition',
    organization: 'DRMC IT Club',
    status: 'Active / Registration Open',
    date: 'October 24 - 26, 2026',
    venue: 'DRMC Campus & Central Auditorium, Dhaka',
    tagline: 'The flagship collegiate and international technology carnival.',
    description: 'Featuring 4 premier competitions: AI Web Development Contest, Programming Contest, Robotics Challenge, and Gaming Tournament.',
    bannerGradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #06b6d4 100%)',
    totalEvents: 4,
    badge: 'Flagship Carnival'
  },
  {
    id: 'fest-wintertech-2026',
    title: 'Winter Tech Fest 2026',
    shortName: 'Winter Tech Fest',
    edition: 'Annual Winter Meet',
    organization: 'DRMC IT Club',
    status: 'Registration Open',
    date: 'December 18 - 20, 2026',
    venue: 'DRMC Science & IT Complex, Dhaka',
    tagline: 'Annual deep-tech immersion, innovation sprint, and Olympiad quiz.',
    description: 'Featuring a 24-hour sprint Hackathon, hands-on LLM/Web Workshop, and the International Tech Quiz.',
    bannerGradient: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 50%, #10b981 100%)',
    totalEvents: 3,
    badge: 'Winter Edition'
  },
  {
    id: 'fest-freshers-2027',
    title: 'Freshers Tech Fest 2027',
    shortName: 'Freshers Tech Fest',
    edition: 'Orientation Edition',
    organization: 'DRMC IT Club',
    status: 'Upcoming',
    date: 'January 15 - 16, 2027',
    venue: 'DRMC IT Labs 1 & 2',
    tagline: 'The welcoming gateway festival for aspiring coders & young innovators.',
    description: 'Featuring the beginner Freshers Coding Challenge and hands-on AI & Generative Tools Bootcamp.',
    bannerGradient: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 50%, #f59e0b 100%)',
    totalEvents: 2,
    badge: 'Freshers Gateway'
  }
];

export const INITIAL_CLUBS = [
  {
    id: 'club-drmc-it',
    name: 'DRMC IT Club',
    badge: 'Tech & AI',
    color: '#6366f1',
    lead: 'Executive Committee',
    icon: '⚡',
    activeEvents: 9,
    members: 850
  },
  {
    id: 'club-robotics',
    name: 'DRMC Robotics Guild',
    badge: 'Hardware & Mechatronics',
    color: '#10b981',
    lead: 'Robotics Wing',
    icon: '🤖',
    activeEvents: 2,
    members: 320
  },
  {
    id: 'club-programming',
    name: 'DRMC Competitive Programming Society',
    badge: 'Algorithms & Olympiads',
    color: '#3b82f6',
    lead: 'CP Wing',
    icon: '💻',
    activeEvents: 3,
    members: 410
  }
];

export const INITIAL_EVENTS = [
  // ===================== FEST 1: TECH CARNIVAL 2026 =====================
  {
    id: 'evt-ai-webdev',
    festId: 'fest-techcarnival-2026',
    festName: 'Tech Carnival 2026',
    title: 'AI Web Development Contest',
    category: 'ai',
    clubName: 'DRMC IT Club',
    badge: 'Flagship Contest',
    tagline: 'Build an in-house smart operations web platform eliminating third-party Google Forms.',
    description: 'Design and develop an astonishing web platform for a student organization (such as DRMC IT Club) managing the complete Organization → Fest → Event → Registration flow with instant holographic passes, zero spreadsheet chaos, and 0.4s gate check-in.',
    date: 'Oct 24, 2026 • 10:00 AM',
    deadline: 'Oct 22, 2026 • 11:59 PM',
    venue: 'Lab 3, DRMC IT Complex',
    prizePool: '$1,500 + Trophies & Cloud Grants',
    fee: 0,
    isTeam: true,
    minTeam: 1,
    maxTeam: 3,
    capacity: 50,
    registeredCount: 38,
    status: 'open',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    rules: 'Open-source GitHub repository required. Web app must be responsive and deployed live. MIT License mandatory.',
    customFields: [
      { id: 'f_repo', label: 'Public GitHub Repository URL', type: 'url', required: true, placeholder: 'https://github.com/username/project' },
      { id: 'f_deploy', label: 'Live Deployment URL (Vercel / GitHub Pages)', type: 'url', required: true, placeholder: 'https://project.vercel.app' },
      { id: 'f_stack', label: 'Primary Tech Stack & AI Tools Used', type: 'select', required: true, options: ['Vanilla JS + Modern Web APIs', 'React / Next.js', 'Vue / Nuxt', 'Other Modern Stack'] }
    ]
  },
  {
    id: 'evt-prog-contest',
    festId: 'fest-techcarnival-2026',
    festName: 'Tech Carnival 2026',
    title: 'Programming Contest',
    category: 'programming',
    clubName: 'DRMC IT Club',
    badge: 'National Contest',
    tagline: 'ICPC-style algorithmic problem solving testing data structures, speed, and precision.',
    description: 'Compete in a 4-hour high-intensity algorithmic problem-solving sprint. Problems range from number theory and graphs to dynamic programming.',
    date: 'Oct 25, 2026 • 09:30 AM',
    deadline: 'Oct 23, 2026 • 11:59 PM',
    venue: 'Central Computer Center, DRMC',
    prizePool: '$2,000 + Champion Medals',
    fee: 0,
    isTeam: true,
    minTeam: 1,
    maxTeam: 3,
    capacity: 100,
    registeredCount: 84,
    status: 'open',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #3b82f6 100%)',
    rules: 'Languages permitted: C++, Java, Python 3. Standard ICPC scoring with penalty time.',
    customFields: [
      { id: 'f_cfhandle', label: 'Codeforces / VJudge Handle', type: 'text', required: true, placeholder: 'e.g. tourist_bd' },
      { id: 'f_lang', label: 'Primary Programming Language', type: 'select', required: true, options: ['C++ 20', 'Python 3.12', 'Java 21'] }
    ]
  },
  {
    id: 'evt-robotics-challenge',
    festId: 'fest-techcarnival-2026',
    festName: 'Tech Carnival 2026',
    title: 'Robotics Challenge',
    category: 'robotics',
    clubName: 'DRMC IT Club',
    badge: 'Hardware Arena',
    tagline: 'Sumo bot demolition, high-speed line followers, and obstacle navigation maze.',
    description: 'Teams pit their autonomous and RC robots in a custom bulletproof polycarbonate arena. Points awarded for speed, autonomous accuracy, and mechanical durability.',
    date: 'Oct 25, 2026 • 02:00 PM',
    deadline: 'Oct 22, 2026 • 11:59 PM',
    venue: 'Engineering Courtyard Arena, DRMC',
    prizePool: '$1,800 + Hardware Sensor Kits',
    fee: 15,
    isTeam: true,
    minTeam: 2,
    maxTeam: 4,
    capacity: 40,
    registeredCount: 35,
    status: 'open',
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    rules: 'Robot weight limit: 5kg for Sumo, 1.5kg for LFR. Radio failsafe switch verified at pit inspection.',
    customFields: [
      { id: 'f_botname', label: 'Robot Name / Model', type: 'text', required: true, placeholder: 'e.g. ThunderCrush MK-II' },
      { id: 'f_category', label: 'Robotics Track', type: 'select', required: true, options: ['Sumo Bot Combat', 'Autonomous Line Follower (LFR)', 'Maze Solver'] },
      { id: 'f_freq', label: 'Radio Frequency / Controller', type: 'text', required: true, placeholder: 'e.g. 2.4GHz FlySky / Bluetooth' }
    ]
  },
  {
    id: 'evt-gaming-tournament',
    festId: 'fest-techcarnival-2026',
    festName: 'Tech Carnival 2026',
    title: 'Gaming Tournament',
    category: 'gaming',
    clubName: 'DRMC IT Club',
    badge: 'Esports Arena',
    tagline: '5v5 Valorant Tactical LAN & FIFA 26 knockout cup on 240Hz tournament rigs.',
    description: 'The ultimate campus esports showdown. Official casters, spectator stadium seating, and double-elimination knockout brackets.',
    date: 'Oct 26, 2026 • 11:00 AM',
    deadline: 'Oct 24, 2026 • 08:00 AM',
    venue: 'Esports Pavilion, DRMC',
    prizePool: '$1,200 + Pro Mechanical Peripherals',
    fee: 10,
    isTeam: true,
    minTeam: 5,
    maxTeam: 5,
    capacity: 32,
    registeredCount: 32,
    status: 'closed',
    gradient: 'linear-gradient(135deg, #d946ef 0%, #8b5cf6 100%)',
    rules: 'All players must have verified Riot IDs. Anti-cheat verified on tournament PCs.',
    customFields: [
      { id: 'f_riotid', label: 'Team Captain Riot ID (#Tag)', type: 'text', required: true, placeholder: 'e.g. Viper#BD1' },
      { id: 'f_game', label: 'Game Title', type: 'select', required: true, options: ['Valorant 5v5', 'FIFA 26 (1v1 Solo)'] }
    ]
  },

  // ===================== FEST 2: WINTER TECH FEST 2026 =====================
  {
    id: 'evt-hackathon',
    festId: 'fest-wintertech-2026',
    festName: 'Winter Tech Fest 2026',
    title: 'Hackathon (24-Hour Sprint)',
    category: 'hackathon',
    clubName: 'DRMC IT Club',
    badge: 'Innovation Sprint',
    tagline: '24 hours of non-stop building: AI agents, smart campus systems, and decentralized tools.',
    description: 'Overnight innovation sprint with industry mentors, cloud computing credits, midnight pizza, and rapid prototype pitching.',
    date: 'Dec 18 - 19, 2026 • 12:00 PM',
    deadline: 'Dec 16, 2026 • 11:59 PM',
    venue: 'DRMC Science Complex - 3rd Floor',
    prizePool: '$3,500 + Incubation Grants',
    fee: 0,
    isTeam: true,
    minTeam: 2,
    maxTeam: 4,
    capacity: 60,
    registeredCount: 46,
    status: 'open',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
    rules: 'Fresh code only. Open-source libraries permitted. Demos evaluated on technical depth and impact.',
    customFields: [
      { id: 'f_track', label: 'Preferred Track', type: 'select', required: true, options: ['Smart Campus Operations', 'Generative AI & LLMs', 'HealthTech & GreenTech', 'Open Innovation'] },
      { id: 'f_diet', label: 'Midnight Meal Preference', type: 'select', required: true, options: ['Standard', 'Vegetarian', 'Halal'] }
    ]
  },
  {
    id: 'evt-workshop',
    festId: 'fest-wintertech-2026',
    festName: 'Winter Tech Fest 2026',
    title: 'AI & Modern Web Workshop',
    category: 'workshop',
    clubName: 'DRMC IT Club',
    badge: 'Hands-on Lab',
    tagline: 'Master modern frontend architectures, Web Audio APIs, and autonomous AI agents.',
    description: 'Interactive masterclass led by senior engineers. Hands-on coding of client-side web tools, offline engines, and AI integrations.',
    date: 'Dec 19, 2026 • 03:00 PM',
    deadline: 'Dec 17, 2026 • 11:59 PM',
    venue: 'Auditorium Hall B, DRMC',
    prizePool: 'Verified Certificates + Course Pack',
    fee: 5,
    isTeam: false,
    capacity: 150,
    registeredCount: 118,
    status: 'open',
    gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
    rules: 'Participants should bring their laptops with Node.js and a modern browser installed.',
    customFields: [
      { id: 'f_exp', label: 'Current Coding Experience Level', type: 'select', required: true, options: ['Beginner (HTML/CSS basics)', 'Intermediate (JavaScript/React)', 'Advanced (Fullstack/ML)'] }
    ]
  },
  {
    id: 'evt-tech-quiz',
    festId: 'fest-wintertech-2026',
    festName: 'Winter Tech Fest 2026',
    title: 'Tech Quiz Olympiad',
    category: 'quiz',
    clubName: 'DRMC IT Club',
    badge: 'Buzzer Olympiad',
    tagline: 'Test your grasp of tech history, AI breakthroughs, computing pioneers, and hardware.',
    description: 'Fast-paced buzzer rounds, audio-visual questions, and rapid-fire algorithmic riddles.',
    date: 'Dec 20, 2026 • 10:00 AM',
    deadline: 'Dec 18, 2026 • 11:59 PM',
    venue: 'Central Seminar Hall, DRMC',
    prizePool: '$800 Cash + Tech Hampers',
    fee: 0,
    isTeam: true,
    minTeam: 2,
    maxTeam: 3,
    capacity: 80,
    registeredCount: 62,
    status: 'open',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    rules: 'Negative marking applies in final buzzer round. No electronic devices during quiz.',
    customFields: [
      { id: 'f_teamquiz', label: 'Quiz Team Name', type: 'text', required: true, placeholder: 'e.g. The Turing Boffins' }
    ]
  },

  // ===================== FEST 3: FRESHERS TECH FEST 2027 =====================
  {
    id: 'evt-coding-challenge',
    festId: 'fest-freshers-2027',
    festName: 'Freshers Tech Fest 2027',
    title: 'Coding Challenge',
    category: 'programming',
    clubName: 'DRMC IT Club',
    badge: 'Beginner Friendly',
    tagline: 'Introductory problem-solving challenge tailored for freshers and first-year programmers.',
    description: 'Designed to welcome newcomers into competitive coding. Friendly mentor support and introductory problem statements in Python and C++.',
    date: 'Jan 15, 2027 • 11:00 AM',
    deadline: 'Jan 13, 2027 • 11:59 PM',
    venue: 'IT Lab 1 & 2, DRMC',
    prizePool: '$600 + Starter Tech Goodies',
    fee: 0,
    isTeam: false,
    capacity: 120,
    registeredCount: 74,
    status: 'open',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
    rules: 'Open to freshers and high-school / collegiate newcomers.',
    customFields: [
      { id: 'f_pref', label: 'Preferred Language', type: 'select', required: true, options: ['Python', 'C / C++', 'Java', 'JavaScript'] }
    ]
  },
  {
    id: 'evt-ai-intro-workshop',
    festId: 'fest-freshers-2027',
    festName: 'Freshers Tech Fest 2027',
    title: 'AI Workshop',
    category: 'workshop',
    clubName: 'DRMC IT Club',
    badge: 'Bootcamp',
    tagline: 'Practical hands-on workshop introducing generative AI, prompt crafting, and web coding.',
    description: 'Build your first intelligent interactive web app in 3 hours. Guided by mentors from DRMC IT Club.',
    date: 'Jan 16, 2027 • 02:00 PM',
    deadline: 'Jan 14, 2027 • 11:59 PM',
    venue: 'Auditorium Hall A, DRMC',
    prizePool: 'Participation Certificates + AI Badges',
    fee: 0,
    isTeam: false,
    capacity: 100,
    registeredCount: 58,
    status: 'open',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
    rules: 'No prior programming experience required. Bring any laptop or tablet.',
    customFields: [
      { id: 'f_interest', label: 'What excites you most about AI?', type: 'text', required: true, placeholder: 'e.g. Chatbots, robotics, creative coding' }
    ]
  }
];

export const INITIAL_REGISTRATIONS = [
  {
    id: 'REG-8821',
    ticketId: 'DRMC-AI-8821',
    eventId: 'evt-ai-webdev',
    festId: 'fest-techcarnival-2026',
    eventTitle: 'AI Web Development Contest',
    festTitle: 'Tech Carnival 2026',
    clubName: 'DRMC IT Club',
    leadName: 'Aarav Patel',
    leadEmail: 'aarav.patel@campus.edu',
    leadPhone: '+880 1711-204910',
    collegeRoll: 'DRMC-2024-104',
    teamName: 'NeuralKnights',
    teamMembers: [
      { name: 'Aarav Patel', role: 'Team Captain & Fullstack' },
      { name: 'Kavya Singh', role: 'UI/UX Designer' },
      { name: 'Marcus Brody', role: 'Backend Engineer' }
    ],
    answers: {
      f_repo: 'https://github.com/neuralknights/nexus-ops',
      f_deploy: 'https://nexus-ops.vercel.app',
      f_stack: 'Vanilla JS + Modern Web APIs'
    },
    registrationStatus: 'Approved',
    paymentStatus: 'PAID_FREE',
    amount: 0,
    registeredAt: '2026-10-04T14:32:00Z',
    checkedIn: true,
    checkedInAt: '2026-10-05T09:12:15Z',
    gate: 'Gate 1 (Central Hub)',
    passTier: 'Hacker Pass'
  },
  {
    id: 'REG-4412',
    ticketId: 'DRMC-PROG-4412',
    eventId: 'evt-prog-contest',
    festId: 'fest-techcarnival-2026',
    eventTitle: 'Programming Contest',
    festTitle: 'Tech Carnival 2026',
    clubName: 'DRMC IT Club',
    leadName: 'Tanvir Hossain',
    leadEmail: 'tanvir.h@student.drmc.edu.bd',
    leadPhone: '+880 1819-334102',
    collegeRoll: 'DRMC-2023-088',
    teamName: 'BinaryBeasts',
    teamMembers: [
      { name: 'Tanvir Hossain', role: 'Captain / Algo' },
      { name: 'Sabbir Ahmed', role: 'Math Specialist' },
      { name: 'Farhan Kabir', role: 'Graph Lead' }
    ],
    answers: {
      f_cfhandle: 'tanvir_master',
      f_lang: 'C++ 20'
    },
    registrationStatus: 'Approved',
    paymentStatus: 'PAID_FREE',
    amount: 0,
    registeredAt: '2026-10-03T18:40:00Z',
    checkedIn: true,
    checkedInAt: '2026-10-05T09:40:10Z',
    gate: 'Gate 2 (IT Labs)',
    passTier: 'Contestant Pass'
  },
  {
    id: 'REG-9019',
    ticketId: 'DRMC-ROBO-9019',
    eventId: 'evt-robotics-challenge',
    festId: 'fest-techcarnival-2026',
    eventTitle: 'Robotics Challenge',
    festTitle: 'Tech Carnival 2026',
    clubName: 'DRMC IT Club',
    leadName: 'David Zhang',
    leadEmail: 'david.zhang@robotics.edu',
    leadPhone: '+880 1912-884019',
    collegeRoll: 'DRMC-2022-412',
    teamName: 'TitanForge Mechatronics',
    teamMembers: [
      { name: 'David Zhang', role: 'Driver & Electrical' },
      { name: 'Rachel Lee', role: 'Chassis & Armor' },
      { name: 'Vikram Joshi', role: 'Telemetry' }
    ],
    answers: {
      f_botname: 'Titan Destroyer MK-IV',
      f_category: 'Sumo Bot Combat',
      f_freq: '2.4GHz FlySky FS-i6'
    },
    registrationStatus: 'Approved',
    paymentStatus: 'VERIFIED',
    transactionId: 'TXN-8812903341',
    amount: 15,
    registeredAt: '2026-10-02T11:20:00Z',
    checkedIn: true,
    checkedInAt: '2026-10-05T10:45:20Z',
    gate: 'Gate 2 (Courtyard)',
    passTier: 'Pit Crew Pass'
  },
  {
    id: 'REG-3310',
    ticketId: 'DRMC-GAME-3310',
    eventId: 'evt-gaming-tournament',
    festId: 'fest-techcarnival-2026',
    eventTitle: 'Gaming Tournament',
    festTitle: 'Tech Carnival 2026',
    clubName: 'DRMC IT Club',
    leadName: 'Kenji Sato',
    leadEmail: 'kenji.sato@esports.edu',
    leadPhone: '+880 1612-409112',
    collegeRoll: 'DRMC-2024-773',
    teamName: 'Ghost Protocol',
    teamMembers: [
      { name: 'Kenji Sato', role: 'Duelist / IGL' },
      { name: 'Liam Ross', role: 'Initiator' },
      { name: 'Elena Rostova', role: 'Controller' },
      { name: 'Brian O\'Connor', role: 'Sentinel' },
      { name: 'Jin Woo', role: 'Flex' }
    ],
    answers: {
      f_riotid: 'Ghost#BD1',
      f_game: 'Valorant 5v5'
    },
    registrationStatus: 'Approved',
    paymentStatus: 'VERIFIED',
    transactionId: 'TXN-7739182390',
    amount: 10,
    registeredAt: '2026-10-04T08:15:00Z',
    checkedIn: false,
    gate: null,
    passTier: 'Player Pass'
  },
  {
    id: 'REG-1209',
    ticketId: 'DRMC-HACK-1209',
    eventId: 'evt-hackathon',
    festId: 'fest-wintertech-2026',
    eventTitle: 'Hackathon (24-Hour Sprint)',
    festTitle: 'Winter Tech Fest 2026',
    clubName: 'DRMC IT Club',
    leadName: 'Zubair Rahman',
    leadEmail: 'zubair.r@tech.drmc.edu.bd',
    leadPhone: '+880 1515-992144',
    collegeRoll: 'DRMC-2023-311',
    teamName: 'HyperLoopers',
    teamMembers: [
      { name: 'Zubair Rahman', role: 'Lead Architect' },
      { name: 'Nadia Karim', role: 'ML Researcher' }
    ],
    answers: {
      f_track: 'Smart Campus Operations',
      f_diet: 'Standard'
    },
    registrationStatus: 'Approved',
    paymentStatus: 'PAID_FREE',
    amount: 0,
    registeredAt: '2026-10-04T16:00:00Z',
    checkedIn: false,
    gate: null,
    passTier: 'Hacker Pass'
  }
];

export const INITIAL_ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    time: '11:30 AM',
    title: '9th DRMC Tech Carnival Live Registration Active',
    message: 'Registrations for AI Web Dev, Programming Contest, and Robotics are now open. Automated quota lock active.',
    tag: 'Alert',
    color: '#6366f1'
  },
  {
    id: 'ann-2',
    time: '10:15 AM',
    title: 'Robotics Challenge Pit Inspection',
    message: 'All 5kg Sumo teams must report to Arena Bay 2 with radio failsafe telemetry switches.',
    tag: 'Notice',
    color: '#10b981'
  },
  {
    id: 'ann-3',
    time: '09:00 AM',
    title: 'Gate 1 Sub-Second Check-In Record',
    message: 'Over 300 attendee QR passes verified via audio scanner in under 5 minutes with 0 duplicate admissions.',
    tag: 'Milestone',
    color: '#06b6d4'
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
        if (parsed && parsed.fests && parsed.fests.length > 0) {
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
      scanHistory: [
        {
          ticketId: 'DRMC-AI-8821',
          name: 'Aarav Patel',
          event: 'AI Web Development Contest',
          time: '09:12:15 AM',
          status: 'SUCCESS',
          gate: 'Gate 1'
        },
        {
          ticketId: 'DRMC-PROG-4412',
          name: 'Tanvir Hossain',
          event: 'Programming Contest',
          time: '09:40:10 AM',
          status: 'SUCCESS',
          gate: 'Gate 2'
        },
        {
          ticketId: 'DRMC-ROBO-9019',
          name: 'David Zhang',
          event: 'Robotics Challenge',
          time: '10:45:20 AM',
          status: 'SUCCESS',
          gate: 'Gate 2'
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
    return this.state.events;
  }

  getEventsByFest(festId) {
    return this.state.events.filter(e => e.festId === festId);
  }

  getClubs() {
    return this.state.clubs;
  }

  addClub(clubData) {
    if (!this.state.clubs.some(c => c.name.toLowerCase() === clubData.name.toLowerCase())) {
      this.state.clubs.push(clubData);
      this.save();
    }
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
    if (!regData.registrationStatus) {
      regData.registrationStatus = 'Approved';
    }
    this.state.registrations.unshift(regData);

    // increment event registeredCount
    const event = this.state.events.find(e => e.id === regData.eventId);
    if (event) {
      event.registeredCount = (event.registeredCount || 0) + 1;
    }
    this.save();
    return regData;
  }

  // Update participant status (Approved, Pending, Waitlisted, Cancelled, Checked In)
  updateRegistrationStatus(ticketId, newStatus) {
    const reg = this.state.registrations.find(r => r.ticketId.toUpperCase() === ticketId.trim().toUpperCase());
    if (reg) {
      reg.registrationStatus = newStatus;
      if (newStatus === 'Checked In') {
        reg.checkedIn = true;
        reg.checkedInAt = new Date().toISOString();
      } else if (newStatus === 'Cancelled') {
        // decrement event registeredCount
        const event = this.state.events.find(e => e.id === reg.eventId);
        if (event && event.registeredCount > 0) {
          event.registeredCount -= 1;
        }
      }
      this.save();
      return true;
    }
    return false;
  }

  // Cancel registration by user (freeing up capacity)
  cancelRegistration(ticketId) {
    return this.updateRegistrationStatus(ticketId, 'Cancelled');
  }

  // Update team members or answers
  updateRegistrationDetails(ticketId, updateFields) {
    const reg = this.state.registrations.find(r => r.ticketId.toUpperCase() === ticketId.trim().toUpperCase());
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
    return this.state.registrations.filter(r =>
      r.leadEmail.toLowerCase() === q ||
      r.ticketId.toLowerCase() === q ||
      r.collegeRoll?.toLowerCase() === q
    );
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

    if (reg.registrationStatus === 'Cancelled') {
      const log = {
        ticketId: reg.ticketId,
        name: reg.leadName,
        event: reg.eventTitle,
        time: nowStr,
        status: 'INVALID',
        gate
      };
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
