import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getDatabase, ref, type Database, type DatabaseReference } from 'firebase/database';

const APP_NAME = 'lotto645-frontend';
const DEFAULT_SESSION_KEY = 'current';

let cachedApp: FirebaseApp | undefined;
let cachedDatabase: Database | undefined;

function readEnvVariable(name: string): string {
  const value = (import.meta.env as Record<string, string | undefined>)[name];
  if (!value || value.trim() === '') {
    throw new Error(`[firebaseClient] Missing required environment variable ${name}`);
  }
  return value;
}

function readFirebaseConfig(): FirebaseOptions {
  return {
    apiKey: readEnvVariable('VITE_FIREBASE_API_KEY'),
    authDomain: readEnvVariable('VITE_FIREBASE_AUTH_DOMAIN'),
    databaseURL: readEnvVariable('VITE_FIREBASE_DATABASE_URL'),
    projectId: readEnvVariable('VITE_FIREBASE_PROJECT_ID'),
    appId: readEnvVariable('VITE_FIREBASE_APP_ID')
  };
}

export function getFirebaseApp(): FirebaseApp {
  if (cachedApp) {
    return cachedApp;
  }

  if (getApps().length > 0) {
    cachedApp = getApp();
  } else {
    cachedApp = initializeApp(readFirebaseConfig(), APP_NAME);
  }

  return cachedApp;
}

export function getRealtimeDatabase(): Database {
  if (cachedDatabase) {
    return cachedDatabase;
  }

  cachedDatabase = getDatabase(getFirebaseApp());
  return cachedDatabase;
}

export function getSessionKey(): string {
  const key = (import.meta.env as Record<string, string | undefined>).VITE_LOTTO_SESSION_KEY;
  const trimmed = key?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_SESSION_KEY;
}

export function getSessionRootPath(sessionKey = getSessionKey()): string {
  return `/sessions/${sessionKey}`;
}

export function getTicketsPath(sessionKey = getSessionKey()): string {
  return `${getSessionRootPath(sessionKey)}/tickets`;
}

export function getDrawPath(sessionKey = getSessionKey()): string {
  return `${getSessionRootPath(sessionKey)}/draw`;
}

export function getSessionRef(database?: Database, sessionKey = getSessionKey()): DatabaseReference {
  return ref(database ?? getRealtimeDatabase(), getSessionRootPath(sessionKey));
}

export function getTicketsRef(database?: Database, sessionKey = getSessionKey()): DatabaseReference {
  return ref(database ?? getRealtimeDatabase(), getTicketsPath(sessionKey));
}

export function getDrawRef(database?: Database, sessionKey = getSessionKey()): DatabaseReference {
  return ref(database ?? getRealtimeDatabase(), getDrawPath(sessionKey));
}
