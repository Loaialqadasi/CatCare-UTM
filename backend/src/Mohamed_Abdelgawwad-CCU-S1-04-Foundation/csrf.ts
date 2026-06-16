// CSRF protection setup — extracted from app.ts to avoid circular imports
// (routes can import this without importing the entire app)

import { doubleCsrf } from 'csrf-csrf';
import { env } from './env.js';

// CRIT-FIX: Cross-origin CSRF cookies (Vercel ↔ Render) require three things:
// 1. sameSite: 'none'  — allows the cookie to be sent with cross-origin requests
// 2. secure: true      — required by browsers when sameSite is 'none'
// 3. partitioned: true — CHIPS (Cookies Having Independent Partitioned State)
//    allows the cookie to work even when browsers block third-party cookies
//    (Firefox Total Cookie Protection, Chrome third-party cookie phase-out)
//
// IMPORTANT: `secure: true` only works if Express trusts the reverse proxy
// (see `app.set('trust proxy', 1)` in app.ts). Without trust proxy, Express
// sees req.protocol as 'http' and REFUSES to set Secure cookies, which causes
// browsers to reject SameSite=None cookies entirely.
const isProd = env.NODE_ENV === 'production';

const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => env.CSRF_SECRET || env.JWT_SECRET,
  getSessionIdentifier: () => 'catcare-utm',
  cookieName: 'x-csrf-token',
  cookieOptions: {
    sameSite: isProd ? 'none' as const : 'lax' as const,
    path: '/',
    secure: isProd,
    httpOnly: true,
    // CRIT-FIX: Partitioned attribute enables CHIPS — the cookie is scoped
    // to the (top-level-site, cookie-domain) pair instead of just the
    // cookie-domain. This means Firefox/Chrome will accept and send the
    // cookie even under strict third-party-cookie blocking policies.
    partitioned: isProd,
  } as any, // `partitioned` is not yet in @types/cookie but is supported by browsers
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'] as const,
});

export { generateCsrfToken, doubleCsrfProtection as csrfProtection };
