// ─── useSync.js ──────────────────────────────────────────────────────────────
//
//  Uses signInWithRedirect instead of signInWithPopup to avoid
//  Cross-Origin-Opener-Policy issues on Netlify and other strict hosts.
//
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
} from 'firebase/auth';
import { db, auth, googleProvider } from './firebase';

const LOCAL_KEY = 'roadmap_v3';

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || null; } catch { return null; }
}
function saveLocal(data) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)); } catch {}
}

export function useSync() {
  const [user, setUser]             = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncStatus, setSyncStatus]   = useState('offline');

  // 1. Listen for auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // 2. On mount, check if we're returning from a redirect sign-in
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user); // user is now signed in
        }
      })
      .catch((e) => {
        console.error('Redirect result error:', e);
      });
  }, []);

  // 3. Sign in — redirects the page to Google, then comes back
  const signIn = useCallback(() => {
    signInWithRedirect(auth, googleProvider);
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(auth);
    setSyncStatus('offline');
  }, []);

  // 4. Save to Firestore
  const saveToCloud = useCallback(async (data) => {
    saveLocal(data);
    if (!auth.currentUser) return;
    try {
      setSyncStatus('syncing');
      const ref = doc(db, 'users', auth.currentUser.uid, 'data', 'state');
      await setDoc(ref, { payload: JSON.stringify(data), updatedAt: Date.now() });
      setSyncStatus('synced');
    } catch (e) {
      console.error('Sync error:', e);
      setSyncStatus('error');
    }
  }, []);

  // 5. Real-time listener
  const subscribeToCloud = useCallback((onData) => {
    if (!auth.currentUser) return () => {};
    const ref = doc(db, 'users', auth.currentUser.uid, 'data', 'state');
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        try {
          const data = JSON.parse(snap.data().payload);
          saveLocal(data);
          onData(data);
        } catch {}
      }
    }, (err) => {
      console.error('Snapshot error:', err);
      setSyncStatus('error');
    });
    return unsub;
  }, []);

  return { user, authLoading, syncStatus, signIn, signOut, saveToCloud, subscribeToCloud };
}