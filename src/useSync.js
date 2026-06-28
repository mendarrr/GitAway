// ─── useSync.js ──────────────────────────────────────────────────────────────
//
//  Drop-in replacement for localStorage that syncs to Firestore in real-time.
//  Your existing reducer still calls save(state) — this file intercepts that
//  and pushes to the cloud instead. On load it pulls from the cloud first,
//  falling back to localStorage if offline.
//
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
} from 'firebase/auth';
import { db, auth, googleProvider } from './firebase';

const LOCAL_KEY = 'roadmap_v3';

// ── helpers ──────────────────────────────────────────────────────────────────
function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || null; } catch { return null; }
}
function saveLocal(data) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)); } catch {}
}

// ── main hook ─────────────────────────────────────────────────────────────────
export function useSync() {
  const [user, setUser]           = useState(null);   // Firebase user
  const [authLoading, setAuthLoading] = useState(true);
  const [syncStatus, setSyncStatus]   = useState('offline'); // 'offline'|'syncing'|'synced'|'error'

  // listen for auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // sign in / out
  const signIn = useCallback(async () => {
    try { await signInWithPopup(auth, googleProvider); }
    catch (e) { console.error('Sign in error:', e); }
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(auth);
    setSyncStatus('offline');
  }, []);

  // save to Firestore (called by the reducer instead of localStorage)
  const saveToCloud = useCallback(async (data) => {
    saveLocal(data); // always save locally too (offline support)
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

  // subscribe to real-time updates from Firestore
  // returns a function to call with a setter so the app can update state live
  const subscribeToCloud = useCallback((onData) => {
    if (!auth.currentUser) return () => {};
    const ref = doc(db, 'users', auth.currentUser.uid, 'data', 'state');
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        try {
          const data = JSON.parse(snap.data().payload);
          saveLocal(data); // keep local in sync
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
