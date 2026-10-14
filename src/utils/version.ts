import { useState, useEffect } from 'react';

export const DEFAULT_APP_VERSION = 'v15.8.3';

let cachedSwVersion: string | null = null;

/**
 * Extracts version code from CACHE_NAME or raw string
 * e.g. 'taj-pos-v15.8.3' -> 'v15.8.3'
 */
export function extractVersionFromSwText(text: string): string | null {
  try {
    // 1. Look for SW_VERSION = '...'
    const swMatch = text.match(/SW_VERSION\s*=\s*['"]([^'"]+)['"]/i);
    if (swMatch && swMatch[1]) {
      const v = swMatch[1].trim();
      return v.startsWith('v') ? v : `v${v}`;
    }

    // 2. Look for CACHE_NAME = 'taj-pos-v15.8.3'
    const cacheMatch = text.match(/CACHE_NAME\s*=\s*['"]([^'"]+)['"]/i);
    if (cacheMatch && cacheMatch[1]) {
      const raw = cacheMatch[1];
      const verMatch = raw.match(/v?[0-9]+(?:\.[0-9]+)*(?:-[a-zA-Z0-9.]+)?/i);
      if (verMatch) {
        const v = verMatch[0];
        return v.startsWith('v') ? v : `v${v}`;
      }
      return raw;
    }

    // 3. Fallback regex anywhere in text
    const genericMatch = text.match(/\bv?([0-9]+\.[0-9]+(?:\.[0-9]+)?)\b/);
    if (genericMatch && genericMatch[1]) {
      return `v${genericMatch[1]}`;
    }
  } catch (e) {
    console.warn('Error extracting version from SW text:', e);
  }
  return null;
}

/**
 * Reads the actual version code from sw.js dynamically
 */
export async function getLiveSwVersion(): Promise<string> {
  if (cachedSwVersion) return cachedSwVersion;

  // Check sessionStorage first for instantaneous rendering
  try {
    const stored = sessionStorage.getItem('taj_pos_sw_version');
    if (stored) {
      cachedSwVersion = stored;
    }
  } catch {
    // ignore
  }

  // 1. Try to fetch sw.js directly
  const candidates = [
    `${import.meta.env.BASE_URL}sw.js`,
    './sw.js',
    '/sw.js',
    'sw.js',
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(`${url}?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const text = await res.text();
        const extracted = extractVersionFromSwText(text);
        if (extracted) {
          cachedSwVersion = extracted;
          try {
            sessionStorage.setItem('taj_pos_sw_version', extracted);
          } catch {
            // ignore
          }
          return extracted;
        }
      }
    } catch {
      // try next candidate
    }
  }

  // 2. Try window.caches keys
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        const verMatch = name.match(/v?[0-9]+(?:\.[0-9]+)*(?:-[a-zA-Z0-9.]+)?/i);
        if (verMatch) {
          const v = verMatch[0].startsWith('v') ? verMatch[0] : `v${verMatch[0]}`;
          cachedSwVersion = v;
          try {
            sessionStorage.setItem('taj_pos_sw_version', v);
          } catch {
            // ignore
          }
          return v;
        }
      }
    } catch {
      // ignore
    }
  }

  return cachedSwVersion || DEFAULT_APP_VERSION;
}

/**
 * Custom React hook that supplies the current live Service Worker version
 * Updates whenever sw.js is modified or cached
 */
export function useAppVersion() {
  const [version, setVersion] = useState<string>(() => {
    try {
      return sessionStorage.getItem('taj_pos_sw_version') || DEFAULT_APP_VERSION;
    } catch {
      return DEFAULT_APP_VERSION;
    }
  });

  useEffect(() => {
    let mounted = true;
    getLiveSwVersion().then((liveVer) => {
      if (mounted && liveVer) {
        setVersion(liveVer);
      }
    });

    // Also listen to service worker messages if it reports updates
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.version) {
          const v = String(event.data.version).startsWith('v') 
            ? String(event.data.version) 
            : `v${event.data.version}`;
          if (mounted) setVersion(v);
          try {
            sessionStorage.setItem('taj_pos_sw_version', v);
          } catch {
            // ignore
          }
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => {
        mounted = false;
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  const shortVersion = version.replace(/^v/, '').split('.').slice(0, 2).join('.');

  return { version, shortVersion };
}
