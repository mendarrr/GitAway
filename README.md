# 🗺️ Holiday Skills Roadmap App

A personal learning tracker for your 8-week holiday — built for your Data Science, Web Dev, and internship goals.

## Features
- ✅ **Task tracker** with checkboxes across all 45 tasks (8 weeks × 4 tracks)
- 📅 **Calendar** with colour-coded dots for focus sessions and notes
- ⏱ **Pomodoro focus timer** (25min / 5min / 15min / 50min modes)
- 📝 **Daily diary** — quick reflections that pair with your OneNote mind maps
- 🔔 **Reminders** with overdue highlighting and desktop notifications
- 📚 **Resources** — all free learning links (Kaggle, Power BI, KNBS, etc.)
- 🏆 **Achievements** — 12 badges to unlock as you progress
- ⭐ **XP system** — earn points for tasks, diary entries, and focus sessions
- 🔥 **Daily streak** tracker
- 💾 **Persistent storage** — all progress saved in your browser (localStorage)

## Setup on Ubuntu

### Prerequisites

Make sure you have Node.js installed:
```bash
node --version   # should be 16 or higher
```

If not installed:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install & Run

```bash
# 1. Navigate to the project folder
cd GitAway

# 2. Install dependencies (first time only)
npm install

# 3. Start the development server
npm start
```

The app will open at **http://localhost:3000** in your browser.

### Build for Production (optional)

```bash
npm run build
```
This creates a `build/` folder you can deploy to Netlify, GitHub Pages, or any static host.

## Project Structure

```
GitAway/
├── public/
│   └── index.html
├── src/
│   ├── App.js          ← Main app (all tabs + components)
│   ├── data.js         ← All tasks, tracks, resources, achievements
│   ├── index.js        ← Entry point
│   └── index.css       ← Global styles + CSS variables
├── package.json
└── README.md
```

## Editing in VS Code

```bash
code .    # opens the project in VS Code
```

Key files to customise:
- **`src/data.js`** — Add/edit tasks, change XP values, update resource links
- **`src/App.js`** — All UI components live here; each tab is its own function
- **`src/index.css`** — Change the colour theme via CSS variables at the top

## Tips

- Your progress is saved in **localStorage** — it persists between browser sessions but is tied to that browser. To back it up, open DevTools → Application → Local Storage → copy the `roadmap_v2` key.
- For **desktop notifications** (reminders + timer), click "Enable desktop notifications" in the Focus Timer tab and allow when the browser asks.
- The **OneNote** companion structure is in the Diary tab — use this app for quick notes, OneNote for detailed mind maps.
- Pair each resource link (↗) with a Kaggle notebook or local Jupyter notebook to practise what you learn.
