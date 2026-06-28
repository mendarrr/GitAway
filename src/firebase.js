// ─── firebase.js ─────────────────────────────────────────────────────────────
//
//  HOW TO SET THIS UP (takes ~5 minutes, totally free):
//
//  1. Go to https://console.firebase.google.com
//  2. Click "Add project" → name it "roadmap-diary" → Continue
//  3. Disable Google Analytics (not needed) → Create project
//  4. Click "Web" icon (</>) → Register app → name it "roadmap-diary" → Register
//  5. Copy the firebaseConfig object Firebase shows you and paste it below
//  6. In the left sidebar: Build → Firestore Database → Create database
//     → Start in TEST MODE → Choose a region (e.g. europe-west1) → Done
//  7. In the left sidebar: Build → Authentication → Get started
//     → Sign-in method → Google → Enable → Save
//
//  That's it! The app will now sync across all your devices automatically.
//
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// ── PASTE YOUR CONFIG HERE ───────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            process.env.REACT_APP_API_KEY,
  authDomain:        process.env.REACT_APP_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_APP_ID,
};
// ─────────────────────────────────────────────────────────────────────────────

const app  = initializeApp(firebaseConfig);
export const db   = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
