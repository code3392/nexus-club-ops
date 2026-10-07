// Zero-dependency local HTTP server with shared API store for Nexus Club Ops
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function ensureDbFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const defaultData = {
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
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

function readDb() {
  ensureDbFile();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Could not read db.json, returning empty structure', err);
    return { fests: [], events: [], registrations: [], clubs: [] };
  }
}

function writeDb(data) {
  ensureDbFile();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Could not write db.json', err);
    return false;
  }
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', err => reject(err));
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const reqPath = parsedUrl.pathname;

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    });
    res.end();
    return;
  }

  // Common JSON response headers
  const jsonHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Access-Control-Allow-Origin': '*'
  };

  // API Route: GET /api/data (Retrieve shared fests, events, and registrations)
  if (reqPath === '/api/data' && req.method === 'GET') {
    const db = readDb();
    res.writeHead(200, jsonHeaders);
    res.end(JSON.stringify(db));
    return;
  }

  // API Route: POST /api/data (Sync full state from client)
  if (reqPath === '/api/data' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const db = readDb();

      if (Array.isArray(payload.fests)) {
        db.fests = payload.fests;
      }
      if (Array.isArray(payload.events)) {
        db.events = payload.events;
      }
      if (Array.isArray(payload.registrations)) {
        db.registrations = payload.registrations;
      }
      if (Array.isArray(payload.clubs)) {
        db.clubs = payload.clubs;
      }

      writeDb(db);
      res.writeHead(200, jsonHeaders);
      res.end(JSON.stringify({
        success: true,
        festsCount: db.fests.length,
        eventsCount: db.events.length,
        registrationsCount: db.registrations.length
      }));
      return;
    } catch (err) {
      res.writeHead(400, jsonHeaders);
      res.end(JSON.stringify({ error: err.message || 'Invalid JSON' }));
      return;
    }
  }

  // API Route: POST /api/fests (Create or update festival)
  if (reqPath === '/api/fests' && req.method === 'POST') {
    try {
      const fest = await parseJsonBody(req);
      if (!fest || !fest.id) {
        res.writeHead(400, jsonHeaders);
        res.end(JSON.stringify({ error: 'Fest requires a valid id' }));
        return;
      }
      const db = readDb();
      const idx = db.fests.findIndex(f => f.id === fest.id);
      if (idx === -1) {
        db.fests.unshift(fest);
      } else {
        db.fests[idx] = { ...db.fests[idx], ...fest };
      }
      writeDb(db);
      res.writeHead(200, jsonHeaders);
      res.end(JSON.stringify({ success: true, fest }));
      return;
    } catch (err) {
      res.writeHead(400, jsonHeaders);
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
  }

  // API Route: DELETE /api/fests/:id
  if (reqPath.startsWith('/api/fests/') && req.method === 'DELETE') {
    const festId = reqPath.replace('/api/fests/', '');
    const db = readDb();
    db.fests = db.fests.filter(f => f.id !== festId);
    writeDb(db);
    res.writeHead(200, jsonHeaders);
    res.end(JSON.stringify({ success: true, deleted: festId }));
    return;
  }

  // API Route: POST /api/events (Create or update event)
  if (reqPath === '/api/events' && req.method === 'POST') {
    try {
      const evt = await parseJsonBody(req);
      if (!evt || !evt.id) {
        res.writeHead(400, jsonHeaders);
        res.end(JSON.stringify({ error: 'Event requires a valid id' }));
        return;
      }
      const db = readDb();
      const idx = db.events.findIndex(e => e.id === evt.id);
      if (idx === -1) {
        db.events.unshift(evt);
      } else {
        db.events[idx] = { ...db.events[idx], ...evt };
      }
      writeDb(db);
      res.writeHead(200, jsonHeaders);
      res.end(JSON.stringify({ success: true, event: evt }));
      return;
    } catch (err) {
      res.writeHead(400, jsonHeaders);
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
  }

  // API Route: DELETE /api/events/:id
  if (reqPath.startsWith('/api/events/') && req.method === 'DELETE') {
    const eventId = reqPath.replace('/api/events/', '');
    const db = readDb();
    db.events = db.events.filter(e => e.id !== eventId);
    writeDb(db);
    res.writeHead(200, jsonHeaders);
    res.end(JSON.stringify({ success: true, deleted: eventId }));
    return;
  }

  // Static File Serving
  let filePathUrl = reqPath;
  if (filePathUrl === '/' || filePathUrl === '') {
    filePathUrl = '/index.html';
  }

  const safePath = path.normalize(filePathUrl).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(__dirname, safePath);

  if (!fs.existsSync(filePath) && !path.extname(filePath)) {
    const htmlPath = filePath + '.html';
    if (fs.existsSync(htmlPath)) {
      filePath = htmlPath;
    }
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

ensureDbFile();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Nexus Club Ops server running at: http://localhost:${PORT}`);
});
