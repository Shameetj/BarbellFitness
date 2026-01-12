// src/FirebaseConfig.tsx
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🧩 Your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDsPBNQ7yXQ_NiQo4ZtCfIMhKsfZXQfek0",
  authDomain: "barbellfitness-b0d48.firebaseapp.com",
  projectId: "barbellfitness-b0d48",
  storageBucket: "barbellfitness-b0d48.firebasestorage.app",
  messagingSenderId: "552125531713",
  appId: "1:552125531713:web:ed37f6fb0c8b18c0b968c0",
  measurementId: "G-NPQMGDHKXR"
};

// 🔥 Initialize Firebase only once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// 🗝 Initialize Firebase Auth with AsyncStorage persistence
const auth = getAuth(app);

export { app, auth };
export default app;






