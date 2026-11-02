/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Netlify Serverless Cloud Function: auth
 * Endpoint: /.netlify/functions/auth (or /api/auth via redirect)
 * Provides backend Google ID Token verification, secure password hashing,
 * device session tokens, and brute-force protection.
 */

import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
  hashPassword,
  verifyPassword,
  verifyGoogleIdToken,
  createSessionToken,
  verifySessionToken
} from './core/authCore.js';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

export async function handler(event) {
  const method = (event.httpMethod || 'POST').toUpperCase();

  // 1. CORS Preflight
  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  // 2. Health check (GET)
  if (method === 'GET') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        status: 'ok',
        service: 'NH POS Authentication Service (Serverless Node.js)',
        time: new Date().toISOString()
      })
    };
  }

  if (method !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: `Method ${method} not allowed. Use POST.` })
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const { action } = payload;
    const clientIp = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown_ip';

    switch (action) {
      // ACTION: Verify Google ID Token securely on backend
      case 'verify-google-token': {
        const { idToken } = payload;
        if (!idToken) {
          return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({ success: false, error: 'idToken is required' })
          };
        }

        const verifyResult = await verifyGoogleIdToken(idToken);
        if (!verifyResult.valid) {
          return {
            statusCode: 401,
            headers: CORS_HEADERS,
            body: JSON.stringify({ success: false, error: verifyResult.error })
          };
        }

        // Generate signed session token
        const sessionToken = createSessionToken({
          email: verifyResult.email,
          googleId: verifyResult.googleId,
          authMethod: 'google_oauth'
        });

        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            success: true,
            verifiedEmail: verifyResult.email,
            googleId: verifyResult.googleId,
            name: verifyResult.name,
            picture: verifyResult.picture,
            sessionToken
          })
        };
      }

      // ACTION: Verify Owner or Staff Password
      case 'verify-password': {
        const { email, password, storedHash, salt } = payload;
        const rateKey = `${clientIp}:${(email || '').toLowerCase().trim()}`;

        // Check rate limiting
        const rateCheck = checkRateLimit(rateKey);
        if (!rateCheck.allowed) {
          return {
            statusCode: 429,
            headers: CORS_HEADERS,
            body: JSON.stringify({ success: false, error: rateCheck.error })
          };
        }

        if (!password) {
          return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({ success: false, error: 'Password is required' })
          };
        }

        const verification = verifyPassword(password, storedHash, salt);
        if (!verification.valid) {
          recordFailedAttempt(rateKey);
          return {
            statusCode: 401,
            headers: CORS_HEADERS,
            body: JSON.stringify({
              success: false,
              error: 'غلط پاس ورڈ! برائے مہربانی درست پاس ورڈ درج کریں۔ (Incorrect password)'
            })
          };
        }

        // Password is correct, clear rate limit
        clearRateLimit(rateKey);

        const sessionToken = createSessionToken({
          email: (email || '').toLowerCase().trim(),
          authMethod: 'password_auth'
        });

        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            success: true,
            mustChangePassword: Boolean(verification.mustChangePassword),
            isLegacy: Boolean(verification.isLegacy),
            sessionToken
          })
        };
      }

      // ACTION: Hash a new password
      case 'hash-password': {
        const { password } = payload;
        if (!password || typeof password !== 'string' || password.trim().length < 6) {
          return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({
              success: false,
              error: 'Password must be at least 6 characters long'
            })
          };
        }

        const { hash, salt } = hashPassword(password.trim());
        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({ success: true, hash, salt })
        };
      }

      // ACTION: Verify an existing device session token
      case 'verify-device-token': {
        const { sessionToken } = payload;
        if (!sessionToken) {
          return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({ success: false, error: 'sessionToken is required' })
          };
        }

        const result = verifySessionToken(sessionToken);
        return {
          statusCode: result.valid ? 200 : 401,
          headers: CORS_HEADERS,
          body: JSON.stringify(result)
        };
      }

      default:
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ success: false, error: `Unknown action: ${action}` })
        };
    }
  } catch (err) {
    console.error('Serverless auth function error:', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: err.message || 'Internal authentication error' })
    };
  }
}
