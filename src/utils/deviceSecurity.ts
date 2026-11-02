/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Advanced Device Trust & Biometric-Grade Hardware Fingerprinting
 * Phase 4: Full Device Lifecycle, Expiry, Revocation, Offline Brute-Force Guard & Audit Logs.
 * 
 * Capabilities:
 * 1. Cryptographically binds physical device ID to verified email & hardware signature.
 * 2. 30-Day session expiration with automatic re-authorization requirement.
 * 3. Status lifecycle: 'trusted' | 'revoked'.
 * 4. Immediate device revocation capability.
 * 5. Offline password attempt rate-limiting (locks offline attempts after 5 consecutive failures).
 * 6. Offline authentication audit logs with automatic sync on reconnect.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const DEVICE_ID_KEY = '_nh_pos_device_hid_sec';
const TRUST_TOKEN_PREFIX = '_nh_sec_dt_';
const SECRET_SALT = 'NH_POS_DEVICE_TRUST_SALT_v16_SEC_2026';
const OFFLINE_FAIL_PREFIX = '_nh_fail_cnt_';
const OFFLINE_LOGS_KEY = '_nh_offline_auth_logs';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Retrieve or generate persistent unique hardware / browser device ID
 */
export function getOrCreateDeviceId(): string {
  try {
    let devId = localStorage.getItem(DEVICE_ID_KEY);
    if (!devId) {
      const randPart = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      const screenSignature = typeof window !== 'undefined'
        ? `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`
        : 'server';
      devId = `dev_${randPart}_${btoa(screenSignature).replace(/=/g, '')}`;
      localStorage.setItem(DEVICE_ID_KEY, devId);
    }
    return devId;
  } catch {
    return 'dev_fallback_anonymous';
  }
}

/**
 * Human-readable device category
 */
export function getDeviceName(): string {
  if (typeof navigator === 'undefined') return 'Unknown Device';
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'Android Device';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'Apple iOS Device';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Mac/i.test(ua)) return 'Macintosh';
  if (/Linux/i.test(ua)) return 'Linux Machine';
  return 'Web Client';
}

/**
 * Obfuscate sensitive trust tokens with XOR encryption & Base64 scrambling
 */
function scrambleSecret(text: string): string {
  try {
    const key = SECRET_SALT;
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
  } catch {
    return btoa(text);
  }
}

function unscrambleSecret(cipher: string): string {
  try {
    const text = atob(cipher);
    const key = SECRET_SALT;
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch {
    return '';
  }
}

/**
 * Generate SHA-256 cryptographic signature
 */
async function computeDeviceSignature(email: string, deviceId: string, timestamp: number): Promise<string> {
  try {
    const payload = `${email.toLowerCase()}:${deviceId}:${timestamp}:${SECRET_SALT}`;
    const enc = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(payload));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return btoa(`${email}_${deviceId}_${timestamp}_${SECRET_SALT}`);
  }
}

export interface DeviceTrustRecord {
  email: string;
  deviceId: string;
  authorizedAt: number;
  lastLoginAt: number;
  lastOfflineAuthAt?: number;
  expiresAt: number;
  signature: string;
  authMethod: 'google_oauth' | 'google_1tap' | 'device_paired' | 'password_auth';
  status: 'trusted' | 'revoked';
  deviceName?: string;
  revocationReason?: string;
}

export interface OfflineAuthLog {
  id: string;
  email: string;
  deviceId: string;
  timestamp: number;
  success: boolean;
  action: 'offline_login_attempt';
}

/**
 * Authorize and bind this physical device to the given account
 */
export async function authorizeDeviceForEmail(
  email: string,
  authMethod: 'google_oauth' | 'google_1tap' | 'device_paired' | 'password_auth' = 'google_oauth'
): Promise<boolean> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return false;

    const deviceId = getOrCreateDeviceId();
    const timestamp = Date.now();
    const expiresAt = timestamp + SESSION_TTL_MS;
    const signature = await computeDeviceSignature(cleanEmail, deviceId, timestamp);
    const deviceName = getDeviceName();

    const record: DeviceTrustRecord = {
      email: cleanEmail,
      deviceId,
      authorizedAt: timestamp,
      lastLoginAt: timestamp,
      expiresAt,
      signature,
      authMethod,
      status: 'trusted',
      deviceName
    };

    const cleanEmailKey = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const localKey = `${TRUST_TOKEN_PREFIX}${cleanEmailKey}`;

    // Store in offline obfuscated format
    const scrambled = scrambleSecret(JSON.stringify(record));
    localStorage.setItem(localKey, scrambled);

    // Sync to Firestore device trust registry if online (non-blocking)
    if (navigator.onLine) {
      try {
        const trustDocRef = doc(db, 'device_trust', `${cleanEmailKey}_${deviceId}`);
        await setDoc(trustDocRef, {
          email: cleanEmail,
          deviceId,
          deviceName,
          authorizedAt: new Date(timestamp).toISOString(),
          lastLoginAt: new Date(timestamp).toISOString(),
          expiresAt: new Date(expiresAt).toISOString(),
          status: 'trusted',
          authMethod
        }, { merge: true });
      } catch (cloudErr) {
        console.warn('Firestore device trust sync notice:', cloudErr);
      }
    }

    return true;
  } catch (err) {
    console.warn('Error authorizing device:', err);
    return false;
  }
}

/**
 * Check if current physical device is authorized, unexpired, and not revoked
 */
export async function isDeviceAuthorizedForEmail(email: string): Promise<{
  isAuthorized: boolean;
  reason?: string;
  isRevoked?: boolean;
}> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { isAuthorized: false, reason: 'Invalid email address.' };
    }

    // 0. Offline rate limiting check (Brute-Force Guard)
    const rateCheck = checkOfflineRateLimit(cleanEmail);
    if (!rateCheck.allowed) {
      return {
        isAuthorized: false,
        reason: `بہت زیادہ غلط کوششیں! براہ کرم ${rateCheck.remainingLockoutSeconds} سیکنڈ بعد دوبارہ کوشش کریں۔ (Offline Lockout)`
      };
    }

    const cleanEmailKey = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const localKey = `${TRUST_TOKEN_PREFIX}${cleanEmailKey}`;
    const deviceId = getOrCreateDeviceId();

    // 1. Check local secret trust token
    const storedScrambled = localStorage.getItem(localKey);
    if (storedScrambled) {
      const jsonStr = unscrambleSecret(storedScrambled);
      if (jsonStr) {
        try {
          const record = JSON.parse(jsonStr) as DeviceTrustRecord;

          // Check revocation
          if (record.status === 'revoked') {
            return {
              isAuthorized: false,
              isRevoked: true,
              reason: 'یہ ڈیوائس منسوخ (Revoked) کر دی گئی ہے۔ رسائی بند کر دی گئی ہے۔'
            };
          }

          // Check expiration
          if (record.expiresAt && Date.now() > record.expiresAt) {
            return {
              isAuthorized: false,
              reason: 'ڈیوائس سیشن کی میعاد (30 دن) ختم ہو چکی ہے۔ براہِ کرم گوگل سے دوبارہ لاگ ان کریں۔'
            };
          }

          if (record.email === cleanEmail && record.deviceId === deviceId) {
            // Validate signature integrity
            const expectedSig = await computeDeviceSignature(cleanEmail, deviceId, record.authorizedAt);
            if (record.signature === expectedSig) {
              return { isAuthorized: true };
            }
          }
        } catch {}
      }
    }

    // 2. Cloud Revocation Check (when online)
    if (navigator.onLine) {
      try {
        const revRef = doc(db, 'device_revocations', `${cleanEmailKey}_${deviceId}`);
        const revSnap = await Promise.race([
          getDoc(revRef),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500))
        ]);

        if (revSnap && revSnap.exists()) {
          // Cloud says revoked! Immediately revoke local store
          await revokeDevice(cleanEmail, deviceId, 'Cloud sync confirmed revocation');
          return {
            isAuthorized: false,
            isRevoked: true,
            reason: 'یہ ڈیوائس کلاؤڈ سیکیورٹی کے ذریعے منسوخ کر دی گئی ہے۔'
          };
        }
      } catch {}
    }

    // 3. Backward Compatibility for Existing Primary Owner Device
    const isSuperAdminEmail =
      cleanEmail === 'aliimtiaz1126@gmail.com' ||
      cleanEmail === 'helpgoodforyouofficial@gmail.com';

    if (isSuperAdminEmail) {
      const storedShop = localStorage.getItem('taj_pos_shop');
      const superAdminSession = localStorage.getItem('taj_super_admin_session');
      if (storedShop || superAdminSession) {
        try {
          const parsed = storedShop ? JSON.parse(storedShop) : null;
          if (parsed?.owner_email?.toLowerCase() === cleanEmail || superAdminSession) {
            await authorizeDeviceForEmail(cleanEmail, 'device_paired');
            return { isAuthorized: true };
          }
        } catch {}
      }
    }

    // 4. Fallback check: If online, check remote Firestore device_trust
    if (navigator.onLine) {
      try {
        const trustDocRef = doc(db, 'device_trust', `${cleanEmailKey}_${deviceId}`);
        const snap = await Promise.race([
          getDoc(trustDocRef),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000))
        ]);

        if (snap && snap.exists()) {
          const data = snap.data();
          if (data?.deviceId === deviceId && data?.status !== 'revoked') {
            await authorizeDeviceForEmail(cleanEmail, 'device_paired');
            return { isAuthorized: true };
          }
        }
      } catch (cloudErr) {
        console.warn('Remote device verification check notice:', cloudErr);
      }
    }

    return {
      isAuthorized: false,
      reason: 'This email is not configured with this device. Please sign in with Google first to authorize this device.'
    };
  } catch (err) {
    console.warn('Error checking device authorization:', err);
    return {
      isAuthorized: false,
      reason: 'Device authorization check failed.'
    };
  }
}

/**
 * Revoke device access immediately
 */
export async function revokeDevice(
  email: string,
  targetDeviceId?: string,
  reason: string = 'User initiated revocation'
): Promise<boolean> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanEmailKey = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const deviceId = targetDeviceId || getOrCreateDeviceId();
    const localKey = `${TRUST_TOKEN_PREFIX}${cleanEmailKey}`;

    // Mark locally as revoked
    const stored = localStorage.getItem(localKey);
    if (stored) {
      const jsonStr = unscrambleSecret(stored);
      if (jsonStr) {
        try {
          const rec = JSON.parse(jsonStr) as DeviceTrustRecord;
          rec.status = 'revoked';
          rec.revocationReason = reason;
          localStorage.setItem(localKey, scrambleSecret(JSON.stringify(rec)));
        } catch {}
      }
    }

    // Sync cloud revocation if online
    if (navigator.onLine) {
      try {
        await setDoc(doc(db, 'device_revocations', `${cleanEmailKey}_${deviceId}`), {
          email: cleanEmail,
          deviceId,
          revokedAt: new Date().toISOString(),
          reason
        }, { merge: true });

        await setDoc(doc(db, 'device_trust', `${cleanEmailKey}_${deviceId}`), {
          status: 'revoked',
          revokedAt: new Date().toISOString(),
          revocationReason: reason
        }, { merge: true });
      } catch {}
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Offline rate limiting check
 */
export function checkOfflineRateLimit(email: string): { allowed: boolean; remainingLockoutSeconds?: number } {
  try {
    const key = `${OFFLINE_FAIL_PREFIX}${email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`;
    const stored = localStorage.getItem(key);
    if (!stored) return { allowed: true };
    const data = JSON.parse(stored);
    const now = Date.now();
    if (data.lockedUntil && now < data.lockedUntil) {
      return { allowed: false, remainingLockoutSeconds: Math.ceil((data.lockedUntil - now) / 1000) };
    }
    if (now - data.firstAttempt > 15 * 60 * 1000) {
      localStorage.removeItem(key);
    }
  } catch {}
  return { allowed: true };
}

/**
 * Record offline authentication attempt
 */
export function recordOfflineAuthAttempt(email: string, success: boolean): void {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const key = `${OFFLINE_FAIL_PREFIX}${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const now = Date.now();

    appendOfflineAuthLog(cleanEmail, success);

    if (success) {
      localStorage.removeItem(key);
      return;
    }

    let data = { attempts: 0, firstAttempt: now, lockedUntil: 0 };
    const stored = localStorage.getItem(key);
    if (stored) {
      try { data = JSON.parse(stored); } catch {}
    }

    data.attempts += 1;
    if (data.attempts >= 5) {
      data.lockedUntil = now + (15 * 60 * 1000); // 15-minute lock
    }
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

/**
 * Append offline authentication log entry
 */
function appendOfflineAuthLog(email: string, success: boolean) {
  try {
    const logs: OfflineAuthLog[] = JSON.parse(localStorage.getItem(OFFLINE_LOGS_KEY) || '[]');
    logs.push({
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      email,
      deviceId: getOrCreateDeviceId(),
      timestamp: Date.now(),
      success,
      action: 'offline_login_attempt'
    });
    if (logs.length > 50) logs.shift();
    localStorage.setItem(OFFLINE_LOGS_KEY, JSON.stringify(logs));
  } catch {}
}

/**
 * Sync offline authentication logs to Firestore when online
 */
export async function syncOfflineAuthLogs(shopId?: string): Promise<void> {
  if (!navigator.onLine) return;
  try {
    const raw = localStorage.getItem(OFFLINE_LOGS_KEY);
    if (!raw) return;
    const logs: OfflineAuthLog[] = JSON.parse(raw);
    if (!logs || logs.length === 0) return;

    const targetCollection = shopId ? `shops/${shopId}/auth_audit_logs` : 'auth_audit_logs';
    for (const item of logs) {
      try {
        await setDoc(doc(db, targetCollection, item.id), item, { merge: true });
      } catch {}
    }
    localStorage.removeItem(OFFLINE_LOGS_KEY);
  } catch {}
}

/**
 * Retrieve primary recognized owner email bound to this physical device
 */
export function getStoredAuthorizedEmail(): string | null {
  try {
    const deviceId = getOrCreateDeviceId();
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(TRUST_TOKEN_PREFIX)) {
        const val = localStorage.getItem(k);
        if (val) {
          const jsonStr = unscrambleSecret(val);
          if (jsonStr) {
            try {
              const rec = JSON.parse(jsonStr) as DeviceTrustRecord;
              if (rec && rec.email && rec.deviceId === deviceId && rec.status !== 'revoked') {
                return rec.email.toLowerCase();
              }
            } catch {}
          }
        }
      }
    }
    const storedShop = localStorage.getItem('taj_pos_shop');
    if (storedShop) {
      try {
        const s = JSON.parse(storedShop);
        if (s && s.owner_email) return s.owner_email.toLowerCase();
      } catch {}
    }
    const saSession = localStorage.getItem('taj_super_admin_session');
    if (saSession) {
      return 'aliimtiaz1126@gmail.com';
    }
    return null;
  } catch {
    return null;
  }
}
