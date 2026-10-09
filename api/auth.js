// Vercel serverless function for Nexus Club Ops authentication
import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'nexus-default-session-secret-change-in-production';
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();

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
      return null;
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
  // Mode 1: ID token from Google Identity Services button / One-Tap
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

  // Mode 2: Access token from Google OAuth2 popup client (initTokenClient)
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

export default async function handler(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin === 'null' ? '*' : origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Determine requested action
  const urlParts = (req.url || '').split('?')[0].split('/').filter(Boolean);
  const actionFromUrl = urlParts[urlParts.length - 1];
  const action = req.query.action || (actionFromUrl !== 'auth' ? actionFromUrl : '');

  // Route 1: Config
  if (action === 'config' && req.method === 'GET') {
    return res.status(200).json({
      configured: !!GOOGLE_CLIENT_ID,
      clientId: GOOGLE_CLIENT_ID || ''
    });
  }

  // Route 2: Verify Google Token & Sign In
  if (action === 'google' && req.method === 'POST') {
    try {
      let payload = req.body || {};
      if (typeof payload === 'string') {
        try { payload = JSON.parse(payload); } catch (e) {}
      }
      if (!payload || Object.keys(payload).length === 0) {
        payload = await new Promise((resolve) => {
          let raw = '';
          req.on('data', chunk => { raw += chunk; });
          req.on('end', () => {
            try { resolve(JSON.parse(raw)); } catch { resolve({}); }
          });
          req.on('error', () => resolve({}));
        });
      }

      const googleUser = await verifyGoogleToken(payload, GOOGLE_CLIENT_ID);
      const safeUser = {
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
      res.setHeader('Set-Cookie', `nexus_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);

      return res.status(200).json({
        success: true,
        user: safeUser,
        sessionToken
      });
    } catch (err) {
      return res.status(401).json({ error: err.message || 'Google authentication failed.' });
    }
  }

  // Route 3: Session verification
  if (action === 'me' && req.method === 'GET') {
    const session = getSessionFromReq(req);
    if (!session) {
      return res.status(200).json({ authenticated: false, user: null });
    }
    return res.status(200).json({
      authenticated: true,
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        avatar: session.avatar,
        role: session.role
      }
    });
  }

  // Route 4: Logout
  if (action === 'logout' && req.method === 'POST') {
    res.setHeader('Set-Cookie', 'nexus_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    return res.status(200).json({ success: true });
  }

  return res.status(404).json({ error: 'Endpoint not found.' });
}
