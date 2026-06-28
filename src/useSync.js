// ─── useSync.js ──────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback, useRef } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  browserPopupRedirectResolver,
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
  const [user, setUser]               = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncStatus, setSyncStatus]   = useState('offline');
  const signingIn                     = useRef(false); // prevents double-calls

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const signIn = useCallback(async () => {
    if (signingIn.current) return;
    signingIn.current = true;
    try {
      // browserPopupRedirectResolver is explicitly passed so Firebase uses
      // its own iframe relay instead of window.closed polling — this is what
      // avoids the COOP error without needing a full-page redirect.
      await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
    } catch (e) {
      // auth/cancelled-popup-request and auth/popup-closed-by-user are normal
      // (user closed the popup) — don't log those as errors
      if (!['auth/cancelled-popup-request', 'auth/popup-closed-by-user'].includes(e.code)) {
        console.error('Sign in error:', e);
      }
    } finally {
      signingIn.current = false;
    }
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(auth);
    setSyncStatus('offline');
  }, []);

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

  return { user, authLoading, syncStatus, signIn, signOut, saveToCloud, subscribeToCloud, loadLocal };
}