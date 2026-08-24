import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig as defaultFirebaseConfig } from './firebaseConfig';

export function getEffectiveFirebaseConfig() {
  if (typeof window !== 'undefined') {
    try {
      const custom = localStorage.getItem('patil_biryani_custom_firebase_config');
      if (custom) {
        const parsed = JSON.parse(custom);
        if (
          parsed &&
          parsed.apiKey &&
          parsed.projectId &&
          !parsed.apiKey.includes('Dummy') &&
          !parsed.apiKey.includes('dummy')
        ) {
          return parsed;
        }
      }
    } catch {}
  }
  return defaultFirebaseConfig;
}

const activeConfig = getEffectiveFirebaseConfig();

export const isFirebaseConfigured = Boolean(
  activeConfig &&
  activeConfig.apiKey &&
  !activeConfig.apiKey.includes('Dummy') &&
  !activeConfig.apiKey.includes('dummy') &&
  activeConfig.projectId &&
  activeConfig.projectId !== 'patil-biryani-pos'
);

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    _app = !getApps().length ? initializeApp(activeConfig) : getApp();
    _auth = getAuth(_app);
    _db = getFirestore(_app);
  } catch (err) {
    console.warn('[Firebase] Initialization deferred or failed:', err);
  }
}

export const app = _app;
export const auth = _auth;
export const db = _db;




