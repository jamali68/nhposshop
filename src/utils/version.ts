import { useState, useEffect } from 'react';

export const DEFAULT_APP_VERSION = 'v15.9.4';

let liveSwVersionCache: string | null = null;

/**
 * Extracts version code from SW text:
 * Supports:
 * - const SW_VERSION = 'v15.8.5';
 * - const CACHE_NAME = 'taj-pos-v15.8.5';
 * - Any 'v15.8.X' semantic pattern
 */
export function extractVersionFromSwText(text: string): string | null {
  try {
    // 1. Look for SW_VERSION = '...'
    const swMatch = text.match(/SW_VERSION\s*=\s*['"]([^'"]+)['"]/i);
    if (swMatch && swMatch[1]) {
      const v = swMatch[1].trim();
      return v.startsWith('v') ? v : `v${v}`;
    }

    // 2. Look for CACHE_NAME = 'taj-pos-v15.8.5'
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

    // 3. Fallback regex anywhere in text for version pattern
    const genericMatch = text.match(/\bv?([0-9]+\.[0-9]+(?:\.[0-9]+)?(?:-[a-zA-Z0-9.]+)?)\b/);
    if (genericMatch && genericMatch[0]) {
      const v = genericMatch[0];
      return v.startsWith('v') ? v : `v${v}`;
    }
  } catch (e) {
    console.warn('Error extracting version from SW text:', e);
  }
  return null;
}

/**
 * Reads the actual version code from sw.js dynamically without caching stale data.
 * Always verifies against fresh server sw.js file to immediately reflect user manual changes.
 */
export async function getLiveSwVersion(forceFresh = false): Promise<string> {
  if (!forceFresh && liveSwVersionCache) {
    return liveSwVersionCache;
  }

  const basePath = import.meta.env.BASE_URL || '/';
  const candidates = [
    `${basePath.endsWith('/') ? basePath : basePath + '/'}sw.js`,
    '/sw.js',
    './sw.js',
    'sw.js',
  ];

  for (const url of candidates) {
    try {
      const cleanUrl = url.replace(/\/{2,}/g, '/');
      const res = await fetch(`${cleanUrl}?_nocache=${Date.now()}_${Math.random()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (res.ok) {
        const text = await res.text();
        const extracted = extractVersionFromSwText(text);
        if (extracted) {
          liveSwVersionCache = extracted;
          try {
            sessionStorage.setItem('taj_pos_sw_version', extracted);
          } catch {
            // ignore
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('taj_pos_version_changed', { detail: extracted }));
          }
          return extracted;
        }
      }
    } catch {
      // try next candidate
    }
  }

  // Fallback: check window.caches keys if available
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        const verMatch = name.match(/v?[0-9]+(?:\.[0-9]+)*(?:-[a-zA-Z0-9.]+)?/i);
        if (verMatch) {
          const v = verMatch[0].startsWith('v') ? verMatch[0] : `v${verMatch[0]}`;
          liveSwVersionCache = v;
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

  // Fallback to sessionStorage or DEFAULT_APP_VERSION
  try {
    const stored = sessionStorage.getItem('taj_pos_sw_version');
    if (stored) {
      liveSwVersionCache = stored;
      return stored;
    }
  } catch {
    // ignore
  }

  return liveSwVersionCache || DEFAULT_APP_VERSION;
}

/**
 * Triggers an immediate refresh of the live service worker version
 */
export function refreshAppVersion(): Promise<string> {
  return getLiveSwVersion(true);
}

/**
 * Custom React hook that supplies the current live Service Worker version.
 * Accurately tracks changes to sw.js in real time and automatically updates UI components.
 */
export function useAppVersion() {
  const [version, setVersion] = useState<string>(() => {
    try {
      return sessionStorage.getItem('taj_pos_sw_version') || liveSwVersionCache || DEFAULT_APP_VERSION;
    } catch {
      return liveSwVersionCache || DEFAULT_APP_VERSION;
    }
  });

  useEffect(() => {
    let isMounted = true;

    const applyVersion = (newVer: string) => {
      if (!isMounted || !newVer) return;
      const formatted = newVer.startsWith('v') ? newVer : `v${newVer}`;
      setVersion((prev) => (prev !== formatted ? formatted : prev));
    };

    // 1. Fetch fresh version immediately
    getLiveSwVersion(true).then((liveVer) => {
      applyVersion(liveVer);
    });

    // 2. Listen for custom version change events
    const handleVersionEvent = (e: any) => {
      if (e?.detail) applyVersion(e.detail);
    };
    window.addEventListener('taj_pos_version_changed', handleVersionEvent);

    // 3. Refresh when window gains focus or tab becomes active
    const handleFocus = () => {
      getLiveSwVersion(true).then((liveVer) => applyVersion(liveVer));
    };
    window.addEventListener('focus', handleFocus);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        getLiveSwVersion(true).then((liveVer) => applyVersion(liveVer));
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // 4. Listen to service worker postMessage & controllerchange
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.version) {
          applyVersion(String(event.data.version));
        }
      };

      const handleControllerChange = () => {
        getLiveSwVersion(true).then((liveVer) => applyVersion(liveVer));
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      return () => {
        isMounted = false;
        window.removeEventListener('taj_pos_version_changed', handleVersionEvent);
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleVisibility);
        navigator.serviceWorker.removeEventListener('message', handleMessage);
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }

    return () => {
      isMounted = false;
      window.removeEventListener('taj_pos_version_changed', handleVersionEvent);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const shortVersion = version.replace(/^v/, '').split('.').slice(0, 2).join('.');

  return { version, shortVersion };
}
