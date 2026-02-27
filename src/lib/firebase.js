/**
 * Firebase Realtime Database - Add your config in .env (project root):
 * VITE_FIREBASE_API_KEY=...
 * VITE_FIREBASE_AUTH_DOMAIN=...
 * VITE_FIREBASE_DATABASE_URL=...
 * VITE_FIREBASE_PROJECT_ID=...
 * VITE_FIREBASE_STORAGE_BUCKET=...
 * VITE_FIREBASE_MESSAGING_SENDER_ID=...
 * VITE_FIREBASE_APP_ID=...
 */
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

function env(key) {
  const v = import.meta.env[key];
  return typeof v === 'string' ? v.trim() : (v ?? '');
}

const apiKey = env('VITE_FIREBASE_API_KEY');
const databaseURL = env('VITE_FIREBASE_DATABASE_URL');
const projectId = env('VITE_FIREBASE_PROJECT_ID');
const appId = env('VITE_FIREBASE_APP_ID');

let db = null;

try {
  if (apiKey && databaseURL && projectId && appId) {
    const firebaseConfig = {
      apiKey,
      authDomain: env('VITE_FIREBASE_AUTH_DOMAIN') || `${projectId}.firebaseapp.com`,
      databaseURL,
      projectId,
      storageBucket: env('VITE_FIREBASE_STORAGE_BUCKET') || `${projectId}.appspot.com`,
      messagingSenderId: env('VITE_FIREBASE_MESSAGING_SENDER_ID') || '',
      appId,
    };
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
  }
} catch (e) {
  console.warn('Firebase init skipped (add .env config for real-time multiplayer):', e.message);
}

export { db };
export const useFirebase = () => !!db;
