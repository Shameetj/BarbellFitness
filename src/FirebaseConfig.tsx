import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from '@firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDsPBNQ7yXQ_NiQo4ZtCfIMhKsfZXQfek0', authDomain: 'barbellfitness-b0d48.firebaseapp.com',
  projectId: 'barbellfitness-b0d48', storageBucket: 'barbellfitness-b0d48.firebasestorage.app',
  messagingSenderId: '552125531713', appId: '1:552125531713:web:ed37f6fb0c8b18c0b968c0', measurementId: 'G-NPQMGDHKXR',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
// Reuse Auth during Fast Refresh; first initialization uses durable RN storage.
let auth: Auth;
try { auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) }); }
catch { auth = getAuth(app); }

const db = getFirestore(app);

export { app, auth, db };
export default app;
