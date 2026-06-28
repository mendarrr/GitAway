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
  apiKey: "AIzaSyAFwCQyfrFRLLavkEuhiabY5O1GcShxpTA",
  authDomain: "gitaway-4ccc8.firebaseapp.com",
  projectId: "gitaway-4ccc8",
  storageBucket: "gitaway-4ccc8.firebasestorage.app",
  messagingSenderId: "594218408170",
  appId: "1:594218408170:web:5096c67af4119bc7845f93"
};
// ─────────────────────────────────────────────────────────────────────────────

const app  = initializeApp(firebaseConfig);
export const db   = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
