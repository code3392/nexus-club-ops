// Zero-dependency local HTTP server with shared API store for Nexus Club Ops
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Safely load environment variables from .env if present
const envFilePath = path.join(__dirname, '.env');
if (fs.existsSync(envFilePath)) {
  try {
    if (typeof process.loadEnvFile === 'function') {
      process.loadEnvFile(envFilePath);
    } else {
      const envRaw = fs.readFileSync(envFilePath, 'utf8');
      envRaw.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val.replace(/^["']|["']$/g, '');
          }
        }
      });
    }
  } catch (err) {
    console.warn('Notice: Could not load .env file:', err.message);
  }
}

const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'nexus-default-session-secret-change-in-production';
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
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
    const data = JSON.parse(raw);
    if (!Array.isArray(data.fests)) data.fests = [];
    if (!Array.isArray(data.events)) data.events = [];
    if (!Array.isArray(data.registrations)) data.registrations = [];
    if (!Array.isArray(data.clubs)) data.clubs = [];
    if (!Array.isArray(data.users)) data.users = [];
    return data;
  } catch (err) {
    console.warn('Could not read db.json, returning empty structure', err);
    return { fests: [], events: [], registrations: [], clubs: [], users: [] };
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

function parseCookies(req) {
  const list = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const name = parts[0]?.trim();
    if (!name) return;
    const val = parts.slice(1).join('=').trim();
    try {
      list[name] = decodeURIComponent(val);
    } catch {
      list[name] = val;
    }
  });
  return list;
}

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

function createSignedSessionToken(payload, secret = SESSION_SECRET) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifySignedSessionToken(token, secret = SESSION_SECRET) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  if (signature.length !== expectedSignature.length) return null;
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null; // Expired session
    }
    return payload;
  } catch {
    return null;
  }
}

function getSessionFromReq(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const session = verifySignedSessionToken(token);
    if (session) return session;
  }

  const cookies = parseCookies(req);
  if (cookies.nexus_session) {
    const session = verifySignedSessionToken(cookies.nexus_session);
    if (session) return session;
  }

  return null;
}

async function verifyGoogleToken(payload, expectedClientId) {
  if (payload.idToken || payload.credential) {
    const idToken = payload.idToken || payload.credential;
    const tokeninfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
    const resp = await fetch(tokeninfoUrl);
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Google token verification failed (${resp.status}): ${errText}`);
    }

    const tokenData = await resp.json();
    if (expectedClientId && tokenData.aud !== expectedClientId) {
      throw new Error('Audience mismatch: token audience does not match configured client id.');
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (tokenData.exp && parseInt(tokenData.exp, 10) < nowSec) {
      throw new Error('Google token has expired.');
    }

    if (!tokenData.email) {
      throw new Error('Google token does not contain an email address.');
    }

    return {
      sub: tokenData.sub,
      email: tokenData.email.toLowerCase(),
      name: tokenData.name || tokenData.email.split('@')[0],
      picture: tokenData.picture || '',
      email_verified: tokenData.email_verified === 'true' || tokenData.email_verified === true
    };
  }

  if (payload.accessToken) {
    const userInfoUrl = 'https://www.googleapis.com/oauth2/v3/userinfo';
    const resp = await fetch(userInfoUrl, {
      headers: { Authorization: `Bearer ${payload.accessToken}` }
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Google token verification failed (${resp.status}): ${errText}`);
    }

    const userData = await resp.json();
    if (!userData.email) {
      throw new Error('Google profile does not contain an email address.');
    }

    return {
      sub: userData.sub,
      email: userData.email.toLowerCase(),
      name: userData.name || userData.email.split('@')[0],
      picture: userData.picture || '',
      email_verified: userData.email_verified === true || userData.email_verified === 'true'
    };
  }

  throw new Error('Missing Google credentials (idToken or accessToken required).');
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const reqPath = parsedUrl.pathname;

  const origin = req.headers.origin || '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  // Common JSON response headers
  const jsonHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    ...corsHeaders
  };

  // API Route: GET /api/auth/config (Check Google Client ID configuration status)
  if (reqPath === '/api/auth/config' && req.method === 'GET') {
    res.writeHead(200, jsonHeaders);
    res.end(JSON.stringify({
      configured: !!GOOGLE_CLIENT_ID,
      clientId: GOOGLE_CLIENT_ID || ''
    }));
    return;
  }

  // API Route: POST /api/auth/google (Server-side Google token verification)
  if (reqPath === '/api/auth/google' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const googleUser = await verifyGoogleToken(payload, GOOGLE_CLIENT_ID);
      const db = readDb();
      if (!Array.isArray(db.users)) db.users = [];

      let user = db.users.find(u => u.email.toLowerCase() === googleUser.email);
      if (!user) {
        user = {
          id: 'g-usr-' + Date.now().toString(36) + '-' + Math.floor(1000 + Math.random() * 9000),
          email: googleUser.email,
          name: googleUser.name,
          rollNo: '',
          avatar: googleUser.picture || googleUser.name.charAt(0).toUpperCase(),
          provider: 'google',
          verified: true,
          role: 'Campus Member',
          createdAt: new Date().toISOString()
        };
        db.users.push(user);
        writeDb(db);
      } else {
        if (googleUser.picture && (!user.avatar || !user.avatar.startsWith('data:'))) {
          user.avatar = googleUser.picture;
        }
        if (googleUser.name && (!user.name || user.name === user.email.split('@')[0])) {
          user.name = googleUser.name;
        }
        user.verified = true;
        writeDb(db);
      }

      const safeUser = { ...user };
      delete safeUser.password;

      const nowSec = Math.floor(Date.now() / 1000);
      const sessionPayload = {
        userId: safeUser.id,
        email: safeUser.email,
        name: safeUser.name,
        avatar: safeUser.avatar,
        role: safeUser.role,
        iat: nowSec,
        exp: nowSec + (7 * 24 * 60 * 60)
      };

      const sessionToken = createSignedSessionToken(sessionPayload);
      const cookieHeader = `nexus_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;

      res.writeHead(200, {
        ...jsonHeaders,
        'Set-Cookie': cookieHeader
      });
      res.end(JSON.stringify({
        success: true,
        user: safeUser,
        sessionToken
      }));
      return;
    } catch (err) {
      res.writeHead(401, jsonHeaders);
      res.end(JSON.stringify({ error: err.message || 'Google authentication failed.' }));
      return;
    }
  }

  // API Route: GET /api/auth/me (Verify active session server-side)
  if (reqPath === '/api/auth/me' && req.method === 'GET') {
    const session = getSessionFromReq(req);
    if (!session) {
      res.writeHead(200, jsonHeaders);
      res.end(JSON.stringify({ authenticated: false, user: null }));
      return;
    }

    const db = readDb();
    const user = (db.users || []).find(u => u.id === session.userId || u.email.toLowerCase() === session.email.toLowerCase());
    const safeUser = user ? { ...user } : {
      id: session.userId,
      email: session.email,
      name: session.name,
      avatar: session.avatar,
      role: session.role
    };
    delete safeUser.password;

    res.writeHead(200, jsonHeaders);
    res.end(JSON.stringify({ authenticated: true, user: safeUser }));
    return;
  }

  // API Route: POST /api/auth/logout (Clear session)
  if (reqPath === '/api/auth/logout' && req.method === 'POST') {
    res.writeHead(200, {
      ...jsonHeaders,
      'Set-Cookie': 'nexus_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
    });
    res.end(JSON.stringify({ success: true }));
    return;
  }

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
      if (Array.isArray(payload.users)) {
        db.users = payload.users;
      }

      writeDb(db);
      res.writeHead(200, jsonHeaders);
      res.end(JSON.stringify({
        success: true,
        festsCount: db.fests.length,
        eventsCount: db.events.length,
        registrationsCount: db.registrations.length,
        usersCount: db.users.length
      }));
      return;
    } catch (err) {
      res.writeHead(400, jsonHeaders);
      res.end(JSON.stringify({ error: err.message || 'Invalid JSON' }));
      return;
    }
  }

  // API Route: POST /api/fests (Create or update festival - Requires verified session)
  if (reqPath === '/api/fests' && req.method === 'POST') {
    const session = getSessionFromReq(req);
    if (!session) {
      res.writeHead(401, jsonHeaders);
      res.end(JSON.stringify({ error: 'Authentication required. Please sign in to create or modify festivals.' }));
      return;
    }

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

  // API Route: DELETE /api/fests/:id (Requires verified session)
  if (reqPath.startsWith('/api/fests/') && req.method === 'DELETE') {
    const session = getSessionFromReq(req);
    if (!session) {
      res.writeHead(401, jsonHeaders);
      res.end(JSON.stringify({ error: 'Authentication required. Please sign in to delete festivals.' }));
      return;
    }

    const festId = reqPath.replace('/api/fests/', '');
    const db = readDb();
    db.fests = db.fests.filter(f => f.id !== festId);
    writeDb(db);
    res.writeHead(200, jsonHeaders);
    res.end(JSON.stringify({ success: true, deleted: festId }));
    return;
  }

  // API Route: POST /api/events (Create or update event - Requires verified session)
  if (reqPath === '/api/events' && req.method === 'POST') {
    const session = getSessionFromReq(req);
    if (!session) {
      res.writeHead(401, jsonHeaders);
      res.end(JSON.stringify({ error: 'Authentication required. Please sign in to create or modify events.' }));
      return;
    }

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

  // API Route: DELETE /api/events/:id (Requires verified session)
  if (reqPath.startsWith('/api/events/') && req.method === 'DELETE') {
    const session = getSessionFromReq(req);
    if (!session) {
      res.writeHead(401, jsonHeaders);
      res.end(JSON.stringify({ error: 'Authentication required. Please sign in to delete events.' }));
      return;
    }

    const eventId = reqPath.replace('/api/events/', '');
    const db = readDb();
    db.events = db.events.filter(e => e.id !== eventId);
    writeDb(db);
    res.writeHead(200, jsonHeaders);
    res.end(JSON.stringify({ success: true, deleted: eventId }));
    return;
  }

  // API Route: GET /api/users
  if (reqPath === '/api/users' && req.method === 'GET') {
    const db = readDb();
    const safeUsers = (db.users || []).map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      rollNo: u.rollNo,
      avatar: u.avatar,
      provider: u.provider,
      role: u.role,
      createdAt: u.createdAt
    }));
    res.writeHead(200, jsonHeaders);
    res.end(JSON.stringify(safeUsers));
    return;
  }

  // API Route: POST /api/users/check-email (Verify 1 email = 1 account)
  if (reqPath === '/api/users/check-email' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const email = (payload.email || '').trim().toLowerCase();
      if (!email) {
        res.writeHead(400, jsonHeaders);
        res.end(JSON.stringify({ error: 'Email is required' }));
        return;
      }
      const db = readDb();
      const existing = (db.users || []).find(u => u.email.toLowerCase() === email);
      if (existing) {
        res.writeHead(200, jsonHeaders);
        res.end(JSON.stringify({
          exists: true,
          name: existing.name,
          provider: existing.provider,
          avatar: existing.avatar
        }));
      } else {
        res.writeHead(200, jsonHeaders);
        res.end(JSON.stringify({ exists: false }));
      }
      return;
    } catch (err) {
      res.writeHead(400, jsonHeaders);
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
  }

  // API Route: POST /api/users/register (Enforce 1 email = 1 account)
  if (reqPath === '/api/users/register' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const email = (payload.email || '').trim().toLowerCase();
      const password = payload.password || '';
      const name = (payload.name || '').trim();

      if (!email || !name) {
        res.writeHead(400, jsonHeaders);
        res.end(JSON.stringify({ error: 'Name and email are required.' }));
        return;
      }

      if (!password || password.length < 6) {
        res.writeHead(400, jsonHeaders);
        res.end(JSON.stringify({ error: 'Password must be at least 6 characters long.' }));
        return;
      }

      const db = readDb();
      if (!Array.isArray(db.users)) db.users = [];

      // Enforce 1 email = 1 account
      const exists = db.users.some(u => u.email.toLowerCase() === email);
      if (exists) {
        res.writeHead(409, jsonHeaders);
        res.end(JSON.stringify({
          error: 'An account with this email already exists. Please sign in with your password.'
        }));
        return;
      }

      const newUser = {
        id: (payload.provider === 'google' ? 'g-usr-' : 'usr-') + Date.now().toString(36) + '-' + Math.floor(1000 + Math.random() * 9000),
        email,
        password,
        name,
        rollNo: (payload.rollNo || '').trim(),
        avatar: payload.avatar || name.charAt(0).toUpperCase(),
        provider: payload.provider || 'email',
        verified: true,
        role: payload.role || 'Campus Member',
        createdAt: new Date().toISOString()
      };

      db.users.push(newUser);
      writeDb(db);

      const safeUser = { ...newUser };
      delete safeUser.password;

      const nowSec = Math.floor(Date.now() / 1000);
      const sessionPayload = {
        userId: safeUser.id,
        email: safeUser.email,
        name: safeUser.name,
        avatar: safeUser.avatar,
        role: safeUser.role,
        iat: nowSec,
        exp: nowSec + (7 * 24 * 60 * 60)
      };
      const sessionToken = createSignedSessionToken(sessionPayload);
      const cookieHeader = `nexus_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;

      res.writeHead(201, {
        ...jsonHeaders,
        'Set-Cookie': cookieHeader
      });
      res.end(JSON.stringify({ success: true, user: safeUser, sessionToken }));
      return;
    } catch (err) {
      res.writeHead(400, jsonHeaders);
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
  }

  // API Route: POST /api/users/login (Authenticate user with password)
  if (reqPath === '/api/users/login' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const email = (payload.email || '').trim().toLowerCase();
      const password = payload.password || '';

      if (!email || !password) {
        res.writeHead(400, jsonHeaders);
        res.end(JSON.stringify({ error: 'Email and password are required.' }));
        return;
      }

      const db = readDb();
      const user = (db.users || []).find(u => u.email.toLowerCase() === email);

      if (!user) {
        res.writeHead(404, jsonHeaders);
        res.end(JSON.stringify({ error: 'No account found with this email. Please create an account first.' }));
        return;
      }

      // Verify password
      if (user.password !== password) {
        res.writeHead(401, jsonHeaders);
        res.end(JSON.stringify({ error: 'Incorrect password. Please enter the correct password.' }));
        return;
      }

      const safeUser = { ...user };
      delete safeUser.password;

      const nowSec = Math.floor(Date.now() / 1000);
      const sessionPayload = {
        userId: safeUser.id,
        email: safeUser.email,
        name: safeUser.name,
        avatar: safeUser.avatar,
        role: safeUser.role,
        iat: nowSec,
        exp: nowSec + (7 * 24 * 60 * 60)
      };
      const sessionToken = createSignedSessionToken(sessionPayload);
      const cookieHeader = `nexus_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;

      res.writeHead(200, {
        ...jsonHeaders,
        'Set-Cookie': cookieHeader
      });
      res.end(JSON.stringify({ success: true, user: safeUser, sessionToken }));
      return;
    } catch (err) {
      res.writeHead(400, jsonHeaders);
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
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
