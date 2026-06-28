# 🗺️ Roadmap Diary — Setup Guide

A personal study tracker with **real-time cross-device sync** via Firebase.  
Works on your Ubuntu laptop, phone browser, or any device — changes sync instantly.

---

## Step 1 — Install dependencies

Make sure you have Node.js installed first:
```bash
node --version   # should print v16+ 
```
If not installed:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Then install the app:
```bash
cd roadmap-diary
npm install
```

---

## Step 2 — Set up Firebase (free, ~5 minutes)

### 2a. Create the Firebase project
1. Go to **https://console.firebase.google.com**
2. Click **"Add project"** → name it `roadmap-diary` → click Continue
3. **Disable** Google Analytics (not needed) → **Create project**
4. Wait ~30 seconds for it to provision

### 2b. Register your web app
1. On the project homepage, click the **`</>`** (Web) icon
2. App nickname: `roadmap-diary` → click **Register app**
3. Firebase will show you a `firebaseConfig` object — **keep this page open**

### 2c. Paste the config into the app
Open `src/firebase.js` in VS Code:
```bash
code src/firebase.js
```
Replace the placeholder values with the real ones from the Firebase console:
```js
const firebaseConfig = {
  apiKey:            "AIzaSy...",       // paste your values here
  authDomain:        "roadmap-diary.firebaseapp.com",
  projectId:         "roadmap-diary",
  storageBucket:     "roadmap-diary.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456:web:abc123",
};
```
Save the file.

### 2d. Enable Firestore database
1. In Firebase console left sidebar: **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** → Next
4. Select a region close to you — for Kenya, pick **`europe-west1`** (closest available) → **Done**

### 2e. Enable Google Sign-In
1. In left sidebar: **Build → Authentication → Get started**
2. Click **Sign-in method** tab
3. Click **Google** → toggle **Enable** → enter your support email → **Save**

---

## Step 3 — Run the app

```bash
npm start
```

The app opens at **http://localhost:3000** in your browser.  
Sign in with Google — your data now syncs to the cloud instantly.

---

## Step 4 — Open on your phone

While `npm start` is running on your laptop, find your laptop's local IP:
```bash
hostname -I   # e.g. 192.168.1.45
```

On your phone (connected to the same Wi-Fi), open:
```
http://192.168.1.45:3000
```

Sign in with the same Google account — you'll see your data appear immediately.

> **To access from anywhere (not just home Wi-Fi):** deploy with `npm run build`  
> and host on **Vercel** (free) — see below.

---

## Optional: Deploy to Vercel (access from anywhere, free)

```bash
npm install -g vercel
npm run build
vercel --prod
```

Vercel gives you a URL like `https://roadmap-diary-abc.vercel.app`  
You can open this on your phone, anywhere, on any network.

---

## How sync works

| Scenario | What happens |
|---|---|
| You check off a task on your laptop | Saves to Firestore → phone updates within ~1 second |
| You add a diary entry on your phone | Syncs to laptop instantly |
| You're offline | App saves to localStorage, syncs to cloud when back online |
| Two devices open at once | The one with more XP/progress wins (no data lost) |
| Not signed in | App works fully offline with localStorage |

---

## File structure

```
roadmap-diary/
├── public/
│   └── index.html
├── src/
│   ├── App.js          ← main app (all tabs, UI, reducer)
│   ├── data.js         ← tasks, tracks, resources, achievements
│   ├── firebase.js     ← ⚠️  PUT YOUR CONFIG HERE
│   ├── useSync.js      ← Firebase sync hook
│   ├── index.js        ← React entry point
│   └── index.css       ← global styles
├── package.json
└── README.md
```

---

## VS Code tips

Open the whole project in VS Code:
```bash
code .
```

Useful extensions to install:
- **ES7+ React snippets** — faster React coding
- **Prettier** — auto-format on save
- **GitLens** — see git history inline

---

## Troubleshooting

**`npm: command not found`** → Install Node.js first (Step 1)

**Sign-in popup blocked** → Allow popups for localhost in your browser settings

**"Missing or insufficient permissions"** → Your Firestore is not in test mode.  
Go to Firestore → Rules → paste this and publish:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Data not syncing** → Check the sync indicator (top-right chip). If it says "Sync error",  
open browser console (F12) and look for the error message.
