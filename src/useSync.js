// ─── useSync.js ──────────────────────────────────────────────────────────────
//
//  Debounced cloud sync to avoid hammering Firestore on every keystroke /
//  checkbox click. Writes are coalesced and sent at most once every
//  WRITE_DELAY_MS, with localStorage updated instantly so the UI never waits
//  on the network. A write-tag is used to ignore the snapshot echo of our
//  own writes, so subscribeToCloud only fires for genuinely external changes
//  (a different tab or device).
//
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback, useRef } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
} from 'firebase/auth';
import { db, auth, googleProvider } from './firebase';

const LOCAL_KEY = 'roadmap_v3';
const WRITE_DELAY_MS = 4000;     // coalesce rapid edits into one write every 4s
const MIN_WRITE_GAP_MS = 3000;   // hard floor between any two writes, even if debounce keeps resetting

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

  // refs so the debounce timer and write-tag survive across renders without
  // re-subscribing effects every time
  const debounceTimer = useRef(null);
  const lastWriteAt    = useRef(0);
  const pendingData     = useRef(null);
  const myWriteTag      = useRef(null); // tag we stamp on our own writes
  const flushTimer      = useRef(null);

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
      .then((result) => { if (result?.user) setUser(result.user); })
      .catch((e) => console.error('Redirect result error:', e));
  }, []);

  // 3. Sign in — redirects the page to Google, then comes back
  const signIn = useCallback(() => { signInWithRedirect(auth, googleProvider); }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(auth);
    setSyncStatus('offline');
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  }, []);

  // The actual network write — only ever called by the debounced flush below.
  const doWrite = useCallback(async (data) => {
    if (!auth.currentUser) return;
    try {
      setSyncStatus('syncing');
      const tag = Math.random().toString(36).slice(2);
      myWriteTag.current = tag;
      const ref = doc(db, 'users', auth.currentUser.uid, 'data', 'state');
      await setDoc(ref, { payload: JSON.stringify(data), updatedAt: Date.now(), writeTag: tag });
      lastWriteAt.current = Date.now();
      setSyncStatus('synced');
    } catch (e) {
      console.error('Sync error:', e);
      setSyncStatus('error');
    }
  }, []);

  // 4. Save — instant locally, debounced + rate-limited to the cloud.
  // This is what App.js's save()/_saveToCloud() calls on every dispatch.
  const saveToCloud = useCallback((data) => {
    saveLocal(data);               // instant, synchronous, never blocks the UI
    pendingData.current = data;

    if (!auth.currentUser) return; // offline / signed out — local only

    // reset the debounce window on every call (coalesces rapid edits)
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const sinceLastWrite = Date.now() - lastWriteAt.current;
      const wait = Math.max(0, MIN_WRITE_GAP_MS - sinceLastWrite);
      if (flushTimer.current) clearTimeout(flushTimer.current);
      flushTimer.current = setTimeout(() => {
        if (pendingData.current) doWrite(pendingData.current);
      }, wait);
    }, WRITE_DELAY_MS);
  }, [doWrite]);

  // Force an immediate write — useful for sign-out or "save now" actions.
  const flushNow = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (flushTimer.current) clearTimeout(flushTimer.current);
    if (pendingData.current) doWrite(pendingData.current);
  }, [doWrite]);

  // 5. Real-time listener — ignores the echo of our own writes via writeTag,
  // so onSnapshot only fires App.js's _hydrate for genuinely external changes
  // (another device/tab), not every time we save our own edits.
  const subscribeToCloud = useCallback((onData) => {
    if (!auth.currentUser) return () => {};
    const ref = doc(db, 'users', auth.currentUser.uid, 'data', 'state');
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      try {
        const raw = snap.data();
        if (raw.writeTag && raw.writeTag === myWriteTag.current) {
          // this is the echo of our own write coming back down — ignore it
          return;
        }
        const data = JSON.parse(raw.payload);
        saveLocal(data);
        onData(data);
      } catch {}
    }, (err) => {
      console.error('Snapshot error:', err);
      setSyncStatus('error');
    });
    return unsub;
  }, []);

  return { user, authLoading, syncStatus, signIn, signOut, saveToCloud, subscribeToCloud, flushNow, loadLocal };
}