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
  persistentMultipleTabManager,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Silence internal offline retry messages to prevent false alarm connection errors in sandboxes
setLogLevel('silent');

const app = initializeApp(firebaseConfig);

const isBrowser = typeof window !== 'undefined';
const hasIndexedDB = isBrowser && typeof window.indexedDB !== 'undefined';

export const db = initializeFirestore(
  app,
  {
    ignoreUndefinedProperties: true,
    ...(isBrowser ? { experimentalAutoDetectLongPolling: true } : {}),
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

