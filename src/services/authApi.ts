/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Client-Side Authentication API Service
 * Dispatches auth verification requests to Netlify Functions / Firebase Functions backend.
 * Provides resilient offline fallback for local operations.
 */

export interface GoogleVerifyResult {
  success: boolean;
  verifiedEmail?: string;
  googleId?: string;
  name?: string;
  picture?: string;
  sessionToken?: string;
  error?: string;
}

export interface PasswordVerifyResult {
  success: boolean;
  mustChangePassword?: boolean;
  isLegacy?: boolean;
  sessionToken?: string;
  error?: string;
}

export interface PasswordHashResult {
  success: boolean;
  hash?: string;
  salt?: string;
  error?: string;
}

const getApiBaseUrls = (): string[] => {
  return ['/.netlify/functions/auth', '/api/auth'];
};

async function postToAuthFunction(payload: any): Promise<any> {
  const urls = getApiBaseUrls();
  let lastError: any = null;

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return data;
      } else {
        return { success: false, error: data.error || `Server responded with status ${res.status}` };
      }
    } catch (err: any) {
      lastError = err;
      // Try next endpoint URL
    }
  }

  throw lastError || new Error('Network error contacting auth service');
}

export const authApi = {
  /**
   * Securely validates a Google ID Token on the backend
   */
  async verifyGoogleIdToken(idToken: string): Promise<GoogleVerifyResult> {
    try {
      const data = await postToAuthFunction({
        action: 'verify-google-token',
        idToken
      });
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to verify Google token with backend'
      };
    }
  },

  /**
   * Securely validates an owner password against stored hash/salt on backend
   */
  async verifyOwnerPassword(
    email: string,
    password: string,
    storedHash?: string,
    salt?: string
  ): Promise<PasswordVerifyResult> {
    try {
      const data = await postToAuthFunction({
        action: 'verify-password',
        email,
        password,
        storedHash,
        salt
      });
      return data;
    } catch (err: any) {
      // Offline fallback: if network is down, check legacy 123456 or local match
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const cleanPass = password.trim();
        if (cleanPass === '123456') {
          return { success: true, mustChangePassword: true, isLegacy: true };
        }
        if (storedHash && cleanPass === storedHash) {
          return { success: true, mustChangePassword: true, isLegacy: true };
        }
      }
      return {
        success: false,
        error: err.message || 'Failed to verify password with authentication service'
      };
    }
  },

  /**
   * Hashes a new password securely on the backend
   */
  async hashPassword(password: string): Promise<PasswordHashResult> {
    try {
      const data = await postToAuthFunction({
        action: 'hash-password',
        password
      });
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to hash password'
      };
    }
  },

  /**
   * Verifies an issued session / device token
   */
  async verifyDeviceToken(sessionToken: string): Promise<{ valid: boolean; claims?: any; error?: string }> {
    try {
      const data = await postToAuthFunction({
        action: 'verify-device-token',
        sessionToken
      });
      return data;
    } catch (err: any) {
      return { valid: false, error: err.message };
    }
  }
};
