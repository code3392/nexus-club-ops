// Vercel serverless function for shared state endpoint
// In serverless environments, maintains in-memory store and seeds initial fest/events

let sharedDb = {
  fests: [
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
  ],
  events: [
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
  ],
  registrations: [],
  clubs: []
};

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json(sharedDb);
  }

  if (req.method === 'POST') {
    const payload = req.body || {};
    if (Array.isArray(payload.fests)) {
      payload.fests.forEach(f => {
        if (!f || !f.id) return;
        const idx = sharedDb.fests.findIndex(item => item.id === f.id);
        if (idx === -1) sharedDb.fests.unshift(f);
        else sharedDb.fests[idx] = { ...sharedDb.fests[idx], ...f };
      });
    }
    if (Array.isArray(payload.events)) {
      payload.events.forEach(e => {
        if (!e || !e.id) return;
        const idx = sharedDb.events.findIndex(item => item.id === e.id);
        if (idx === -1) sharedDb.events.unshift(e);
        else sharedDb.events[idx] = { ...sharedDb.events[idx], ...e };
      });
    }
    if (Array.isArray(payload.registrations)) {
      payload.registrations.forEach(r => {
        if (!r || !r.ticketId) return;
        const idx = sharedDb.registrations.findIndex(item => item.ticketId === r.ticketId);
        if (idx === -1) sharedDb.registrations.unshift(r);
        else sharedDb.registrations[idx] = { ...sharedDb.registrations[idx], ...r };
      });
    }
    return res.status(200).json({ success: true, count: sharedDb.fests.length });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
