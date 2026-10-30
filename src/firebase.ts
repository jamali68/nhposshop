import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

const isBrowser = typeof window !== 'undefined';
const hasIndexedDB = isBrowser && typeof window.indexedDB !== 'undefined';

export const db = initializeFirestore(
  app,
  {
    ignoreUndefinedProperties: true,
    // Force long polling in browser to eliminate 10s streaming connection timeouts in iframes & sandboxes
    ...(isBrowser ? { experimentalForceLongPolling: true } : {}),
    ...(hasIndexedDB
      ? {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
          })
        }
      : {})
  },
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined
);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, GoogleAuthProvider };

