import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  doc,
  getDoc,
  setLogLevel
} from 'firebase/firestore';
import localFirebaseConfig from '../../firebase-applet-config.json';

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localFirebaseConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || localFirebaseConfig.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localFirebaseConfig.authDomain,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || localFirebaseConfig.firestoreDatabaseId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localFirebaseConfig.messagingSenderId,
};

const app = initializeApp(firebaseConfig);

// Silence noisy WebChannel timeout warnings and auto-detect long polling for iframe/proxy resilience
setLogLevel('silent');

// CRITICAL: Specify firestoreDatabaseId and enable auto long-polling for reliable connection
export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true
  },
  firebaseConfig.firestoreDatabaseId
);

export const auth = getAuth(app);

export async function testConnection(): Promise<boolean> {
  try {
    await getDoc(doc(db, 'settings', 'general'));
    return true;
  } catch (_error) {
    return false;
  }
}
