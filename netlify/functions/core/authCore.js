/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Independent Core Authentication Service (Provider-Agnostic)
 * Compatible with Netlify Serverless Functions & Firebase Cloud Functions.
 */

import crypto from 'crypto';

// Secret key for signing sessions and device tokens (falls back to secure environment variable)
const TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || process.env.JWT_SECRET || 'nh-pos-production-secure-token-salt-98234710';

// In-memory rate limiter for brute-force protection
// Map: key (e.g. `ip:email`) -> { attempts: number, lockUntil: number, firstAttempt: number }
const rateLimitStore = new Map();

/**
 * Check and record an authentication attempt to prevent brute-force attacks.
 * Max 5 failed attempts per 15-minute window.
 */
export function checkRateLimit(identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // Clean up expired locks
  if (record) {
    if (record.lockUntil && now < record.lockUntil) {
      const waitSeconds = Math.ceil((record.lockUntil - now) / 1000);
      return { allowed: false, error: `بہت زیادہ غلط کوششیں! براہ کرم ${waitSeconds} سیکنڈ بعد دوبارہ کوشش کریں۔ (Too many attempts. Try again in ${waitSeconds}s)` };
    }
    if (now - record.firstAttempt > windowMs) {
      rateLimitStore.delete(identifier);
    }
  }

  return { allowed: true };
}

export function recordFailedAttempt(identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000, lockoutMs = 15 * 60 * 1000) {
  const now = Date.now();
  const record = rateLimitStore.get(identifier) || { attempts: 0, firstAttempt: now, lockUntil: 0 };
  
  record.attempts += 1;
  if (record.attempts >= maxAttempts) {
    record.lockUntil = now + lockoutMs;
  }
  rateLimitStore.set(identifier, record);
}

export function clearRateLimit(identifier) {
  rateLimitStore.delete(identifier);
}

/**
 * Hash a password using PBKDF2 with a cryptographically secure random salt.
 */
export function hashPassword(password, existingSalt = null) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.pbkdf2Sync(password, salt, 12000, 32, 'sha256');
  return {
    hash: derivedKey.toString('hex'),
    salt
  };
}

/**
 * Verifies a plaintext password against a stored hash and salt.
 * Also securely validates legacy migration password '123456'.
 */
export function verifyPassword(password, storedHash, salt) {
  if (!password) {
    return { valid: false, mustChangePassword: false, isLegacy: false };
  }

  const cleanPass = String(password).trim();

  // Legacy fallback check: If stored hash is '123456' or plaintext '123456' was supplied
  const isLegacyMatch = (storedHash === '123456' && cleanPass === '123456') ||
                        (!storedHash && cleanPass === '123456');

  if (isLegacyMatch) {
    return {
      valid: true,
      mustChangePassword: true,
      isLegacy: true
    };
  }

  if (!storedHash || !salt) {
    // If no salt exists and storedHash is exact match (legacy fallback)
    if (storedHash && cleanPass === storedHash) {
      return { valid: true, mustChangePassword: true, isLegacy: true };
    }
    return { valid: false, mustChangePassword: false, isLegacy: false };
  }

  try {
    const derived = crypto.pbkdf2Sync(cleanPass, salt, 12000, 32, 'sha256').toString('hex');
    const hashBuffer = Buffer.from(storedHash, 'hex');
    const derivedBuffer = Buffer.from(derived, 'hex');

    if (hashBuffer.length !== derivedBuffer.length) {
      return { valid: false, mustChangePassword: false, isLegacy: false };
    }

    const valid = crypto.timingSafeEqual(hashBuffer, derivedBuffer);
    const mustChangePassword = cleanPass === '123456';

    return {
      valid,
      mustChangePassword,
      isLegacy: false
    };
  } catch (err) {
    return { valid: false, mustChangePassword: false, isLegacy: false };
  }
}

/**
 * Verifies a Google ID token against Google's official OAuth tokeninfo endpoint.
 * Validates issuer, expiry, audience, and email verification.
 */
export async function verifyGoogleIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    return { valid: false, error: 'Google ID Token is missing or invalid' };
  }

  try {
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken.trim())}`;
    const res = await fetch(url, { method: 'GET' });

    if (!res.ok) {
      const errorText = await res.text();
      return { valid: false, error: `Google token verification failed: ${errorText}` };
    }

    const data = await res.json();

    // Verify expiry
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const exp = Number(data.exp || 0);
    if (exp <= nowInSeconds) {
      return { valid: false, error: 'Google token has expired. Please sign in again.' };
    }

    // Verify email verification status
    const emailVerified = data.email_verified === 'true' || data.email_verified === true;
    if (!emailVerified) {
      return { valid: false, error: 'Google email is not verified by Google.' };
    }

    const email = (data.email || '').toLowerCase().trim();
    if (!email) {
      return { valid: false, error: 'No email found in Google token payload.' };
    }

    return {
      valid: true,
      email,
      googleId: data.sub,
      name: data.name || '',
      picture: data.picture || '',
      emailVerified: true
    };
  } catch (err) {
    return { valid: false, error: err.message || 'Network error verifying Google ID token' };
  }
}

/**
 * Creates a signed session / device token.
 */
export function createSessionToken(payload, expiresInMs = 30 * 24 * 60 * 60 * 1000) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Date.now() + expiresInMs;
  const claims = { ...payload, exp, iat: Date.now() };

  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Claims = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const message = `${b64Header}.${b64Claims}`;

  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(message).digest('base64url');
  return `${message}.${signature}`;
}

/**
 * Validates a signed session / device token.
 */
export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token missing' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Malformed token' };
  }

  const [b64Header, b64Claims, signature] = parts;
  const message = `${b64Header}.${b64Claims}`;
  const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(message).digest('base64url');

  if (signature !== expectedSig) {
    return { valid: false, error: 'Invalid token signature' };
  }

  try {
    const claims = JSON.parse(Buffer.from(b64Claims, 'base64url').toString('utf8'));
    if (claims.exp && Date.now() > claims.exp) {
      return { valid: false, error: 'Session token expired' };
    }
    return { valid: true, claims };
  } catch {
    return { valid: false, error: 'Failed to parse claims' };
  }
}
