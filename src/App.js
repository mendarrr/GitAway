import React, { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import { TASKS, TRACKS, RESOURCES, ACHIEVEMENTS, XP_RULES, MASTERY_LEVELS, DAYS, TIMES,
         SKILL_ROADMAPS, semLabel, makeSemId, parseSemId } from './data';
import { useSync } from './useSync';

// ─── storage ───────────────────────────────────────────────────────────────
const KEY = 'roadmap_v3';
const today = () => new Date().toISOString().slice(0, 10);
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
let _saveToCloud = (d) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} };
function save(d) { _saveToCloud(d); }

const DEFAULT_PREFS = {
  displayName: '',
  bio: '',
  avatarEmoji: '🎓',
  theme: 'dark',       // 'dark' | 'light' | 'midnight'
  accentColor: '#58a6ff',
  font: 'system',      // 'system' | 'mono' | 'rounded'
  fontSize: 14,
  sidebarCompact: false,
  timerWork: 90,
  timerShort: 25,
  timerLong: 50,
  timerDeep: 180,
  chosenSkills: [],    // array of SKILL_ROADMAP ids
  customResources: [], // [{id, category, name, url}]
  hiddenDefaultResources: [], // ["{category}::{name}"]
  semesters: [{ id: '3.1', year: 3, sem: 1, label: 'Year 3 · Sem 1', status: 'active' },
              { id: '3.2', year: 3, sem: 2, label: 'Year 3 · Sem 2', status: 'upcoming' },
              { id: '4.1', year: 4, sem: 1, label: 'Year 4 · Sem 1', status: 'upcoming' },
              { id: '4.2', year: 4, sem: 2, label: 'Year 4 · Sem 2', status: 'upcoming' }],
};

function initState() {
  const s = load();
  return {
    checked: s.checked || {},
    diary: s.diary || {},
    calNotes: s.calNotes || {},
    reminders: s.reminders || [],
    focusSessions: s.focusSessions || [],
    streak: s.streak || 0,
    lastVisit: s.lastVisit || '',
    xp: s.xp || 0,
    xpLog: s.xpLog || [],
    units: s.units || [],
    timetable: s.timetable || [],
    aiHistory: s.aiHistory || [],
    aiQuestions: s.aiQuestions || 0,
    prefs: { ...DEFAULT_PREFS, ...(s.prefs || {}) },
    completedSemesters: s.completedSemesters || [],
    completedYears: s.completedYears || [],
    diaryCount: s.diaryCount || 0,
    customTasks: s.customTasks || [],
  };
}

// ─── THEME PALETTES ─────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg: '#0d1117', surface: '#161b22', surface2: '#21262d', border: '#30363d',
    text: '#e6edf3', muted: '#7d8590',
  },
  light: {
    bg: '#f6f8fa', surface: '#ffffff', surface2: '#f0f2f5', border: '#d0d7de',
    text: '#1f2328', muted: '#656d76',
  },
  midnight: {
    bg: '#070d1a', surface: '#0e1629', surface2: '#162038', border: '#1e3050',
    text: '#cdd6f4', muted: '#6c7086',
  },
};

const FONTS = {
  system: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
  mono: `'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace`,
  rounded: `'Nunito', 'Varela Round', 'Quicksand', sans-serif`,
};

// ─── shared ui ─────────────────────────────────────────────────────────────
let C = {
  bg: '#0d1117', surface: '#161b22', surface2: '#21262d', border: '#30363d',
  text: '#e6edf3', muted: '#7d8590',
  accent: '#58a6ff', green: '#3fb950', amber: '#d29922', red: '#f85149', purple: '#bc8cff',
};

function applyTheme(prefs) {
  const t = THEMES[prefs.theme] || THEMES.dark;
  C = { ...t, accent: prefs.accentColor || '#58a6ff', green: '#3fb950', amber: '#d29922', red: '#f85149', purple: '#bc8cff' };
  const root = document.documentElement;
  Object.entries(C).forEach(([k, v]) => root.style.setProperty(`--${k}`, v));
  root.style.setProperty('--font', FONTS[prefs.font] || FONTS.system);
  root.style.setProperty('--fs', `${prefs.fontSize || 14}px`);
  document.body.style.background = C.bg;
  document.body.style.color = C.text;
  document.body.style.fontFamily = FONTS[prefs.font] || FONTS.system;
}

function Card({ children, style }) {
  return <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18, ...style }}>{children}</div>;
}
function Badge({ label, color = C.accent }) {
  return <span style={{ background: color + '22', color, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, border: `1px solid ${color}44` }}>{label}</span>;
}
function ProgressBar({ value, max, color = C.accent, height = 6 }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return <div style={{ background: C.border, borderRadius: height, height, overflow: 'hidden' }}>
    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: height, transition: 'width .4s ease' }} />
  </div>;
}
function Btn({ children, onClick, color = C.accent, outline = false, style = {}, disabled = false }) {
  return <button disabled={disabled} onClick={onClick} style={{
    background: outline ? 'transparent' : color, color: outline ? color : '#000',
    border: `1px solid ${color}`, borderRadius: 7, padding: '7px 16px', fontWeight: 600,
    fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
    fontFamily: 'inherit', ...style
  }}>{children}</button>;
}
function Input({ value, onChange, placeholder, style = {}, type = 'text', min, max }) {
  return <input type={type} min={min} max={max} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: '8px 10px', fontSize: 13, width: '100%', fontFamily: 'inherit', boxSizing: 'border-box', ...style }} />;
}
function Select({ value, onChange, children, style = {} }) {
  return <select value={value} onChange={e => onChange(e.target.value)}
    style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', ...style }}>{children}</select>;
}
function Modal({ title, onClose, children, wide = false }) {
  return <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    onClick={e => e.target === e.currentTarget && onClose()}>
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, width: wide ? 700 : 480, maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 20, cursor: 'pointer' }}>✕</button>
      </div>
      {children}
    </div>
  </div>;
}
function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>{children}</div>;
}

const UNIT_COLORS = ['#58a6ff','#3fb950','#bc8cff','#d29922','#f85149','#ff9500','#ff6ac1','#00d4aa','#e6c07b','#56d364','#ffa198','#c9d1d9','#f0883e','#a5f3fc','#d946ef','#84cc16','#fb923c','#a78bfa','#34d399','#ff7b72'];
const uid = () => Math.random().toString(36).slice(2, 9);

// ─── XP logic ───────────────────────────────────────────────────────────────
function awardXP(state, amount, reason) {
  const entry = { amount, reason, date: today() };
  return { ...state, xp: state.xp + amount, xpLog: [entry, ...(state.xpLog || [])].slice(0, 200) };
}

// ─── reducer ───────────────────────────────────────────────────────────────
function reducer(state, action) {
  let next = state;
  switch (action.type) {
    case 'toggle': {
      const was = !!state.checked[action.id];
      const delta = was ? -action.xp : action.xp;
      next = { ...state, checked: { ...state.checked, [action.id]: !was }, xp: state.xp + delta };
      if (!was) next = { ...next, xpLog: [{ amount: action.xp, reason: `Task: ${action.title}`, date: today() }, ...(next.xpLog || [])].slice(0, 200) };
      break;
    }
    case 'diary':
      next = awardXP(
        { ...state, diary: { ...state.diary, [action.date]: action.text }, diaryCount: (state.diaryCount || 0) + 1 },
        XP_RULES.diary_entry, 'Diary entry'
      );
      break;
    case 'calNote': next = { ...state, calNotes: { ...state.calNotes, [action.date]: action.text } }; break;
    case 'focusDone':
      next = awardXP({ ...state, focusSessions: [...state.focusSessions, { date: today(), minutes: action.minutes, mode: action.mode }] }, XP_RULES.focus_session, `Focus – ${action.mode}`);
      break;
    case 'addReminder': next = { ...state, reminders: [...state.reminders, action.reminder] }; break;
    case 'removeReminder': next = { ...state, reminders: state.reminders.filter(r => r.id !== action.id) }; break;

    // ── units ──
    case 'addUnit': next = { ...state, units: [...state.units, action.unit] }; break;
    case 'removeUnit': next = { ...state, units: state.units.filter(u => u.id !== action.id) }; break;
    case 'updateUnit': next = { ...state, units: state.units.map(u => u.id === action.unit.id ? action.unit : u) }; break;

    // ── assignments ──
    case 'addAssignment': {
      const units = state.units.map(u => u.id === action.unitId ? { ...u, assignments: [...(u.assignments || []), action.item] } : u);
      next = { ...state, units }; break;
    }
    case 'updateAssignment': {
      let xpGain = 0; let reason = '';
      const units = state.units.map(u => {
        if (u.id !== action.unitId) return u;
        const assignments = (u.assignments || []).map(a => {
          if (a.id !== action.item.id) return a;
          if (!a.submitted && action.item.submitted) { xpGain += XP_RULES.assignment_submit; reason = `Submitted: ${a.title}`; }
          if (!a.grade && action.item.grade) {
            const pct = parseFloat(action.item.grade) / (action.item.outOf || 100) * 100;
            if (pct >= 70) { xpGain += XP_RULES.assignment_grade_A; reason += ` Grade A`; }
            else if (pct >= 60) { xpGain += XP_RULES.assignment_grade_B; reason += ` Grade B`; }
            else { xpGain += XP_RULES.assignment_grade_C; reason += ` Grade C`; }
          }
          return action.item;
        });
        return { ...u, assignments };
      });
      next = xpGain > 0 ? awardXP({ ...state, units }, xpGain, reason) : { ...state, units };
      break;
    }
    case 'addCat': {
      const units = state.units.map(u => u.id === action.unitId ? { ...u, cats: [...(u.cats || []), action.item] } : u);
      next = { ...state, units }; break;
    }
    case 'updateCat': {
      let xpGain = 0; let reason = '';
      const units = state.units.map(u => {
        if (u.id !== action.unitId) return u;
        const cats = (u.cats || []).map(c => {
          if (c.id !== action.item.id) return c;
          if (!c.score && action.item.score) {
            const pct = parseFloat(action.item.score) / (action.item.outOf || 30) * 100;
            if (pct >= 70) { xpGain += XP_RULES.cat_distinction; reason = `CAT distinction`; }
            else if (pct >= 50) { xpGain += XP_RULES.cat_pass; reason = `CAT pass`; }
          }
          return action.item;
        });
        return { ...u, cats };
      });
      next = xpGain > 0 ? awardXP({ ...state, units }, xpGain, reason) : { ...state, units };
      break;
    }
    case 'addExam': {
      const units = state.units.map(u => u.id === action.unitId ? { ...u, exams: [...(u.exams || []), action.item] } : u);
      next = { ...state, units }; break;
    }
    case 'updateExam': {
      let xpGain = 0; let reason = '';
      const units = state.units.map(u => {
        if (u.id !== action.unitId) return u;
        const exams = (u.exams || []).map(e => {
          if (e.id !== action.item.id) return e;
          if (!e.score && action.item.score) {
            const pct = parseFloat(action.item.score) / (action.item.outOf || 70) * 100;
            if (pct >= 70) { xpGain += XP_RULES.exam_distinction; reason = `Exam distinction`; }
            else if (pct >= 40) { xpGain += XP_RULES.exam_pass; reason = `Exam pass`; }
          }
          return action.item;
        });
        return { ...u, exams };
      });
      next = xpGain > 0 ? awardXP({ ...state, units }, xpGain, reason) : { ...state, units };
      break;
    }
    case 'setMastery': {
      const units = state.units.map(u => {
        if (u.id !== action.unitId) return u;
        const topics = (u.topics || []).map(t => t.id === action.topicId ? { ...t, mastery: action.level } : t);
        return { ...u, topics };
      });
      next = action.level === 4 ? awardXP({ ...state, units }, XP_RULES.topic_mastered, `Topic mastered`) : { ...state, units };
      break;
    }
    case 'addTopic': {
      const units = state.units.map(u => u.id === action.unitId ? { ...u, topics: [...(u.topics || []), action.topic] } : u);
      next = { ...state, units }; break;
    }
    case 'removeTopic': {
      const units = state.units.map(u => u.id !== action.unitId ? u : { ...u, topics: (u.topics || []).filter(t => t.id !== action.topicId) });
      next = { ...state, units }; break;
    }
    case 'addSlot': next = { ...state, timetable: [...state.timetable, action.slot] }; break;
    case 'removeSlot': next = { ...state, timetable: state.timetable.filter(s => s.id !== action.id) }; break;
    case 'aiMessage': next = { ...state, aiHistory: [...state.aiHistory, action.msg].slice(-60), aiQuestions: state.aiQuestions + (action.msg.role === 'user' ? 1 : 0) }; break;
    case 'clearAI': next = { ...state, aiHistory: [] }; break;

    // ── prefs ──
    case 'setPrefs': next = { ...state, prefs: { ...state.prefs, ...action.prefs } }; break;

    // ── semester completion ──
    case 'completeSemester': {
      const { semId, clean } = action;
      const already = state.completedSemesters.includes(semId);
      if (already) { next = state; break; }
      const completedSemesters = [...state.completedSemesters, semId];
      let s2 = awardXP({ ...state, completedSemesters }, XP_RULES.semester_complete, `Semester complete: ${semId}`);
      if (clean) s2 = { ...s2, /* cleanSemester flag for achievements */ _lastCleanSem: semId };
      // check if year complete: both sems of same year done
      const { year } = parseSemId(semId);
      const yearDone = [1, 2].every(s => completedSemesters.includes(makeSemId(year, s)));
      if (yearDone && !state.completedYears.includes(year)) {
        s2 = awardXP({ ...s2, completedYears: [...(s2.completedYears || []), year] }, XP_RULES.year_complete, `Year ${year} complete!`);
      }
      next = s2;
      break;
    }
    case 'uncompleteSemester': {
      next = { ...state, completedSemesters: state.completedSemesters.filter(s => s !== action.semId) };
      break;
    }

    case 'addCustomTask': next = { ...state, customTasks: [...(state.customTasks || []), action.task] }; break;
    case 'updateCustomTask': next = { ...state, customTasks: (state.customTasks || []).map(t => t.id === action.task.id ? action.task : t) }; break;
    case 'removeCustomTask': {
      const { [action.id]: _removed, ...checkedRest } = state.checked;
      next = { ...state, customTasks: (state.customTasks || []).filter(t => t.id !== action.id), checked: checkedRest };
      break;
    }

    case '_hydrate': {
      const cloud = action.data;
      if ((cloud.xp || 0) >= (state.xp || 0)) return cloud;
      return state;
    }
case 'loadState': return { ...action.state, _ts: Date.now() };
    default: return state;
  }
  return next;
}

// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS & PROFILE TAB
// ══════════════════════════════════════════════════════════════════════════════
const AVATAR_EMOJIS = ['🎓','👨‍💻','👩‍💻','🧑‍🔬','🦁','🐉','🚀','⚡','🔥','🌟','💎','🎯','🏆','🦊','🐺','🎮','🤖','👾','🌈','🦋'];
const ACCENT_COLORS = ['#58a6ff','#3fb950','#bc8cff','#d29922','#f85149','#ff9500','#ff6ac1','#00d4aa','#ff7b72','#ffa198','#56d364','#e8b86d'];

function SettingsTab({ state, dispatch }) {
  const prefs = state.prefs || DEFAULT_PREFS;
  const [activeSection, setActiveSection] = useState('profile');
  const [semForm, setSemForm] = useState({ year: '', sem: '' });
  const [resForm, setResForm] = useState({ category: '', name: '', url: '' });

  const set = (key, val) => dispatch({ type: 'setPrefs', prefs: { [key]: val } });
  const setMany = (obj) => dispatch({ type: 'setPrefs', prefs: obj });

  const semesters = prefs.semesters || DEFAULT_PREFS.semesters;

  const addSemester = () => {
    const y = parseInt(semForm.year), s = parseInt(semForm.sem);
    if (!y || !s || s < 1 || s > 2) return;
    const id = makeSemId(y, s);
    if (semesters.find(x => x.id === id)) return;
    const newSems = [...semesters, { id, year: y, sem: s, label: `Year ${y} · Sem ${s}`, status: 'upcoming' }]
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.sem - b.sem);
    set('semesters', newSems);
    setSemForm({ year: '', sem: '' });
  };

  const removeSemester = (id) => {
    set('semesters', semesters.filter(s => s.id !== id));
  };

  const addResource = () => {
    if (!resForm.category || !resForm.name || !resForm.url) return;
    const customResources = [...(prefs.customResources || []), { id: uid(), ...resForm }];
    set('customResources', customResources);
    setResForm({ category: '', name: '', url: '' });
  };

  const removeCustomResource = (id) => {
    set('customResources', (prefs.customResources || []).filter(r => r.id !== id));
  };

  const toggleDefaultResource = (key) => {
    const hidden = prefs.hiddenDefaultResources || [];
    const next = hidden.includes(key) ? hidden.filter(h => h !== key) : [...hidden, key];
    set('hiddenDefaultResources', next);
  };

  const toggleSkill = (skillId) => {
    const chosen = prefs.chosenSkills || [];
    const next = chosen.includes(skillId) ? chosen.filter(s => s !== skillId) : [...chosen, skillId];
    set('chosenSkills', next);
  };

  const sections = [
    { id: 'profile', label: '👤 Profile' },
    { id: 'appearance', label: '🎨 Appearance' },
    { id: 'timer', label: '⏱ Timer' },
    { id: 'skills', label: '🗺️ Skills Roadmap' },
    { id: 'resources', label: '📚 Resources' },
    { id: 'semesters', label: '🎓 Semesters' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 20 }}>
      {/* sidebar nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
            background: activeSection === s.id ? C.accent + '22' : 'none',
            color: activeSection === s.id ? C.accent : C.muted,
            border: `1px solid ${activeSection === s.id ? C.accent + '44' : 'transparent'}`,
            borderRadius: 7, padding: '8px 12px', textAlign: 'left', fontSize: 13,
            fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>{s.label}</button>
        ))}
      </div>

      {/* content */}
      <div>
        {/* ── PROFILE ── */}
        {activeSection === 'profile' && (
          <Card>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Profile</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <SectionLabel>Avatar</SectionLabel>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {AVATAR_EMOJIS.map(e => (
                    <button key={e} onClick={() => set('avatarEmoji', e)} style={{
                      fontSize: 24, background: prefs.avatarEmoji === e ? C.accent + '33' : C.surface2,
                      border: `2px solid ${prefs.avatarEmoji === e ? C.accent : C.border}`,
                      borderRadius: 10, width: 44, height: 44, cursor: 'pointer',
                    }}>{e}</button>
                  ))}
                </div>
              </div>
              <div>
                <SectionLabel>Display Name</SectionLabel>
                <Input value={prefs.displayName || ''} onChange={v => set('displayName', v)} placeholder="Your name" />
              </div>
              <div>
                <SectionLabel>Bio / Tagline</SectionLabel>
                <Input value={prefs.bio || ''} onChange={v => set('bio', v)} placeholder="e.g. Data Science student @ JKUAT" />
              </div>
            </div>
          </Card>
        )}

        {/* ── APPEARANCE ── */}
        {activeSection === 'appearance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Card>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Appearance</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <SectionLabel>Theme</SectionLabel>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[['dark','🌙 Dark'],['light','☀️ Light'],['midnight','🌌 Midnight']].map(([id, label]) => (
                      <button key={id} onClick={() => set('theme', id)} style={{
                        padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        background: prefs.theme === id ? C.accent : C.surface2,
                        color: prefs.theme === id ? '#000' : C.text,
                        border: `1px solid ${prefs.theme === id ? C.accent : C.border}`,
                        fontFamily: 'inherit',
                      }}>{label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <SectionLabel>Accent Colour</SectionLabel>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {ACCENT_COLORS.map(col => (
                      <div key={col} onClick={() => set('accentColor', col)} style={{
                        width: 32, height: 32, borderRadius: '50%', background: col, cursor: 'pointer',
                        border: prefs.accentColor === col ? '3px solid white' : '2px solid transparent',
                        boxShadow: prefs.accentColor === col ? '0 0 0 2px ' + col : 'none',
                      }} />
                    ))}
                  </div>
                </div>
                <div>
                  <SectionLabel>Font Family</SectionLabel>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[['system','System'],['mono','Monospace'],['rounded','Rounded']].map(([id, label]) => (
                      <button key={id} onClick={() => set('font', id)} style={{
                        padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        fontFamily: FONTS[id], background: prefs.font === id ? C.accent : C.surface2,
                        color: prefs.font === id ? '#000' : C.text,
                        border: `1px solid ${prefs.font === id ? C.accent : C.border}`,
                      }}>{label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <SectionLabel>Font Size: {prefs.fontSize || 14}px</SectionLabel>
                  <input type="range" min={12} max={18} value={prefs.fontSize || 14}
                    onChange={e => set('fontSize', parseInt(e.target.value))}
                    style={{ width: 200, accentColor: C.accent }} />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── TIMER ── */}
        {activeSection === 'timer' && (
          <Card>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Focus Timer Durations</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['timerWork',  '🍅 Focus (mins)'],
                ['timerShort', '☕ Short Break'],
                ['timerLong',  '🌿 Long Break'],
                ['timerDeep',  '🧠 Deep Work'],
              ].map(([key, label]) => (
                <div key={key}>
                  <SectionLabel>{label}</SectionLabel>
                  <input type="number" min={1} max={240} value={prefs[key] || DEFAULT_PREFS[key]}
                    onChange={e => set(key, parseInt(e.target.value) || 1)}
                    style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: '8px 10px', fontSize: 14, width: 100, fontFamily: 'inherit' }} />
                  <span style={{ fontSize: 12, color: C.muted, marginLeft: 8 }}>minutes</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, fontSize: 12, color: C.muted }}>Changes take effect when you next open the Focus Timer.</div>
          </Card>
        )}

        {/* ── SKILLS ROADMAP ── */}
        {activeSection === 'skills' && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Learning Roadmaps</div>
              <div style={{ fontSize: 13, color: C.muted }}>Pick the skills you want to learn. Their resources will appear in the Resources tab. Inspired by <a href="https://roadmap.sh" target="_blank" rel="noreferrer" style={{ color: C.accent }}>roadmap.sh</a>.</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 10 }}>
              {SKILL_ROADMAPS.map(skill => {
                const chosen = (prefs.chosenSkills || []).includes(skill.id);
                return (
                  <div key={skill.id} onClick={() => toggleSkill(skill.id)} style={{
                    background: chosen ? skill.color + '18' : C.surface2,
                    border: `2px solid ${chosen ? skill.color : C.border}`,
                    borderRadius: 10, padding: '12px 14px', cursor: 'pointer', transition: 'all .15s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{skill.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: chosen ? skill.color : C.text }}>{skill.label}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{skill.description}</div>
                      </div>
                      {chosen && <span style={{ color: skill.color, fontSize: 16 }}>✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            {(prefs.chosenSkills || []).length > 0 && (
              <div style={{ marginTop: 12, fontSize: 12, color: C.green }}>
                ✓ {(prefs.chosenSkills || []).length} roadmap{(prefs.chosenSkills || []).length !== 1 ? 's' : ''} selected — resources visible in the Resources tab.
              </div>
            )}
          </div>
        )}

        {/* ── RESOURCES ── */}
        {activeSection === 'resources' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Add Custom Resource</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Input value={resForm.category} onChange={v => setResForm(f => ({ ...f, category: v }))} placeholder="Category e.g. My Tools" />
                  <Input value={resForm.name} onChange={v => setResForm(f => ({ ...f, name: v }))} placeholder="Resource name" />
                </div>
                <Input value={resForm.url} onChange={v => setResForm(f => ({ ...f, url: v }))} placeholder="https://example.com" />
                <Btn onClick={addResource} disabled={!resForm.category || !resForm.name || !resForm.url}>+ Add Resource</Btn>
              </div>
            </Card>
            {(prefs.customResources || []).length > 0 && (
              <Card>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>My Custom Resources</div>
                {(prefs.customResources || []).map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 12, color: C.accent, marginRight: 8 }}>[{r.category}]</span>
                      <a href={r.url} target="_blank" rel="noreferrer" style={{ color: C.text, fontSize: 13 }}>{r.name}</a>
                    </div>
                    <button onClick={() => removeCustomResource(r.id)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 14 }}>✕</button>
                  </div>
                ))}
              </Card>
            )}
            <Card>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Show/Hide Default Resources</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>Toggle off resources you don't need to keep things clean.</div>
              {RESOURCES.map(cat => (
                <div key={cat.category} style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: C.accent, marginBottom: 6 }}>{cat.category}</div>
                  {cat.items.map(item => {
                    const key = `${cat.category}::${item.name}`;
                    const hidden = (prefs.hiddenDefaultResources || []).includes(key);
                    return (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
                        <input type="checkbox" checked={!hidden} onChange={() => toggleDefaultResource(key)}
                          style={{ accentColor: C.accent, width: 14, height: 14 }} />
                        <a href={item.url} target="_blank" rel="noreferrer"
                          style={{ fontSize: 13, color: hidden ? C.muted : C.text, textDecoration: hidden ? 'line-through' : 'none' }}>{item.name}</a>
                      </div>
                    );
                  })}
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* ── SEMESTERS ── */}
        {activeSection === 'semesters' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Card>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Your Semesters</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>Add any year/semester combination. You can then mark them complete in the Semester Units tab.</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
                <div>
                  <SectionLabel>Year</SectionLabel>
                  <input type="number" min={1} max={9} value={semForm.year}
                    onChange={e => setSemForm(f => ({ ...f, year: e.target.value }))}
                    placeholder="e.g. 3" style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: '8px 10px', fontSize: 13, width: 80, fontFamily: 'inherit' }} />
                </div>
                <div>
                  <SectionLabel>Semester</SectionLabel>
                  <select value={semForm.sem} onChange={e => setSemForm(f => ({ ...f, sem: e.target.value }))}
                    style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }}>
                    <option value="">--</option>
                    <option value="1">Sem 1</option>
                    <option value="2">Sem 2</option>
                  </select>
                </div>
                <Btn onClick={addSemester} disabled={!semForm.year || !semForm.sem}>+ Add Semester</Btn>
              </div>
              <div>
                {semesters.map(sem => {
                  const done = (state.completedSemesters || []).includes(sem.id);
                  return (
                    <div key={sem.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 14 }}>{done ? '✅' : '🔵'}</span>
                      <div style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{sem.label || semLabel(sem.id)}</div>
                      {done && <Badge label="Completed" color={C.green} />}
                      <button onClick={() => removeSemester(sem.id)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 14 }}>✕</button>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RESOURCES TAB (personalised)
// ══════════════════════════════════════════════════════════════════════════════
function ResourcesTab({ prefs }) {
  const chosen = prefs?.chosenSkills || [];
  const hidden = prefs?.hiddenDefaultResources || [];
  const custom = prefs?.customResources || [];

  // Build unified resource list
  const sections = [];

  // 1) Default resources (filtered by hidden)
  RESOURCES.forEach(cat => {
    const visible = cat.items.filter(item => !hidden.includes(`${cat.category}::${item.name}`));
    if (visible.length) sections.push({ category: cat.category, items: visible, isSkill: false });
  });

  // 2) Chosen skill roadmap resources
  chosen.forEach(skillId => {
    const skill = SKILL_ROADMAPS.find(s => s.id === skillId);
    if (skill) sections.push({ category: `${skill.emoji} ${skill.label}`, items: skill.resources, color: skill.color, isSkill: true });
  });

  // 3) Custom resources grouped by category
  const customCats = {};
  custom.forEach(r => { if (!customCats[r.category]) customCats[r.category] = []; customCats[r.category].push(r); });
  Object.entries(customCats).forEach(([cat, items]) => sections.push({ category: `⭐ ${cat}`, items, isCustom: true }));

  return (
    <div>
      {chosen.length === 0 && custom.length === 0 && (
        <div style={{ background: C.accent + '15', border: `1px solid ${C.accent}33`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
          💡 Go to <strong>Settings → Skills Roadmap</strong> to add roadmap resources, or <strong>Settings → Resources</strong> to add your own links.
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        {sections.map(cat => (
          <Card key={cat.category} style={{ borderLeft: cat.color ? `3px solid ${cat.color}` : undefined }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: cat.color || C.accent, fontSize: 13 }}>{cat.category}</div>
            {cat.items.map(item => (
              <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.text, textDecoration: 'none', fontSize: 13, padding: '6px 0', borderBottom: `1px solid ${C.border}` }}
                onMouseEnter={e => { e.currentTarget.style.color = C.accent; }}
                onMouseLeave={e => { e.currentTarget.style.color = C.text; }}>
                <span style={{ color: C.muted, fontSize: 11 }}>↗</span> {item.name}
              </a>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ACHIEVEMENTS TAB (with semester/year achievements)
// ══════════════════════════════════════════════════════════════════════════════
function AchievementsTab({ state }) {
  const doneTasks = Object.values(state.checked).filter(Boolean).length;
  const dataDone = TASKS.filter(t => t.track === 'data' && state.checked[t.id]).length;
  const webDone = TASKS.filter(t => t.track === 'web' && state.checked[t.id]).length;
  const softDone = TASKS.filter(t => t.track === 'soft' && state.checked[t.id]).length;
  const internDone = TASKS.filter(t => t.track === 'intern' && state.checked[t.id]).length;
  const week1Done = TASKS.filter(t => t.week === 1).every(t => state.checked[t.id]);
  const capstone = !!state.checked['t31'];
  const allCats = state.units.flatMap(u => u.cats || []);
  const catsPassed = allCats.filter(c => c.score && parseFloat(c.score) / (c.outOf || 30) * 100 >= 60).length;
  const allExams = state.units.flatMap(u => u.exams || []);
  const examsPassed = allExams.filter(e => e.score && parseFloat(e.score) / (e.outOf || 70) * 100 >= 40).length;
  const allScores = [
    ...state.units.flatMap(u => (u.assignments || []).map(a => a.grade ? parseFloat(a.grade) / (a.outOf || 100) * 100 : 0)),
    ...allCats.map(c => c.score ? parseFloat(c.score) / (c.outOf || 30) * 100 : 0),
  ];
  const topScore = allScores.some(s => s >= 80);
  const assignmentsSubmitted = state.units.flatMap(u => u.assignments || []).filter(a => a.submitted).length;
  const perfectUnit = state.units.some(u => {
    const topics = u.topics || [];
    return topics.length > 0 && topics.every(t => t.mastery === 4);
  });
  // Check for clean semester (all assignments submitted, all cats+exams passed)
  const cleanSemester = (state.completedSemesters || []).length > 0 || !!state._lastCleanSem;
  const yearComplete = (state.completedYears || []).length > 0;
  const skillsChosen = (state.prefs?.chosenSkills || []).length;

  const d = {
    done: doneTasks, xp: state.xp, dataDone, webDone, softDone, internDone,
    week1Done, capstone, streak: state.streak, units: state.units.length,
    catsPassed, topScore, totalSessions: state.focusSessions.length,
    aiQuestions: state.aiQuestions || 0, examsPassed, assignmentsSubmitted,
    perfectUnit, cleanSemester, yearComplete, skillsChosen,
    diaryEntries: state.diaryCount || 0,
    completedSemestersCount: (state.completedSemesters || []).length,
  };

  const unlocked = ACHIEVEMENTS.filter(a => a.condition(d)).length;

  const groups = [
    { label: '🏖️ Holiday Tasks', ids: ['a1','a2','a3','a4','a5','a11','a12','a8','a10'] },
    { label: '⭐ XP', ids: ['a6','a7','a17','a19'] },
    { label: '🎓 Academic', ids: ['a13','a14','a15','a16','a22','a23','a24'] },
    { label: '📅 Semester & Year', ids: ['a20','a21'] },
    { label: '🔥 Consistency', ids: ['a9','a25','a26'] },
    { label: '🗺️ Skills & AI', ids: ['a27','a28','a18'] },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 24, color: C.amber }}>{unlocked}<span style={{ fontSize: 14, color: C.muted }}>/{ACHIEVEMENTS.length}</span></div>
          <div style={{ fontSize: 12, color: C.muted }}>Achievements unlocked</div>
        </div>
        <div style={{ flex: 1 }}>
          <ProgressBar value={unlocked} max={ACHIEVEMENTS.length} color={C.amber} height={8} />
        </div>
      </div>
      {groups.map(g => {
        const achInGroup = ACHIEVEMENTS.filter(a => g.ids.includes(a.id));
        return (
          <div key={g.label} style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.muted, marginBottom: 10 }}>{g.label}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 10 }}>
              {achInGroup.map(a => {
                const ok = a.condition(d);
                return (
                  <div key={a.id} style={{ background: ok ? C.surface : C.surface2, border: `1px solid ${ok ? C.amber + '55' : C.border}`, borderRadius: 10, padding: '14px 12px', textAlign: 'center', opacity: ok ? 1 : 0.45, transition: 'all .2s' }}>
                    <div style={{ fontSize: 30, marginBottom: 6 }}>{a.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: ok ? C.amber : C.muted }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{a.desc}</div>
                    {ok && <div style={{ marginTop: 8 }}><Badge label="✓ Unlocked" color={C.green} /></div>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function Dashboard({ state }) {
  const prefs = state.prefs || DEFAULT_PREFS;
  const doneTasks = Object.values(state.checked).filter(Boolean).length;
  const sessions = state.focusSessions.length;
  const semUnits = state.units.length;

  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + 14);
  const upcoming = [];
  state.units.forEach(u => {
    (u.assignments || []).filter(a => !a.submitted && a.due && new Date(a.due) <= cutoff)
      .forEach(a => upcoming.push({ label: `${u.code}: ${a.title}`, due: a.due, color: u.color }));
    (u.cats || []).filter(c => !c.score && c.date && new Date(c.date) <= cutoff)
      .forEach(c => upcoming.push({ label: `${u.code}: ${c.title} (CAT)`, due: c.date, color: u.color }));
    (u.exams || []).filter(e => !e.score && e.date && new Date(e.date) <= cutoff)
      .forEach(e => upcoming.push({ label: `${u.code}: ${e.title} (Exam)`, due: e.date, color: u.color }));
  });
  upcoming.sort((a, b) => a.due.localeCompare(b.due));

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {/* Profile card */}
      {(prefs.displayName || prefs.bio) && (
        <Card style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 48 }}>{prefs.avatarEmoji || '🎓'}</div>
          <div>
            {prefs.displayName && <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20 }}>{prefs.displayName}</div>}
            {prefs.bio && <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{prefs.bio}</div>}
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 26, color: C.amber }}>{state.xp} ⭐</div>
            <div style={{ fontSize: 12, color: C.muted }}>{state.streak}🔥 day streak</div>
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { label: 'Total XP', value: state.xp, color: C.amber },
          { label: 'Tasks Done', value: `${doneTasks}/45`, color: C.accent },
          { label: 'Focus Sessions', value: sessions, color: C.purple },
          { label: 'Semester Units', value: semUnits, color: C.green },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: 'Space Grotesk' }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>📅 Upcoming deadlines (14 days)</div>
          {upcoming.length === 0 && <div style={{ color: C.muted, fontSize: 13 }}>Nothing due soon — you're ahead!</div>}
          {upcoming.slice(0, 6).map((u, i) => {
            const daysLeft = Math.ceil((new Date(u.due) - new Date()) / 86400000);
            return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: u.color, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13 }}>{u.label}</div>
              <Badge label={daysLeft <= 1 ? 'Tomorrow' : `${daysLeft}d`} color={daysLeft <= 2 ? C.red : C.amber} />
            </div>;
          })}
        </Card>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>📊 Track Progress</div>
          {TRACKS.map(track => {
            const all = TASKS.filter(t => t.track === track.id);
            const done = all.filter(t => state.checked[t.id]).length;
            return <div key={track.id} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>{track.emoji} {track.label}</span>
                <span style={{ color: C.muted }}>{done}/{all.length}</span>
              </div>
              <ProgressBar value={done} max={all.length} color={track.color} />
            </div>;
          })}
        </Card>
      </div>

      {/* Chosen skill roadmaps */}
      {(prefs.chosenSkills || []).length > 0 && (
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>🗺️ Your Learning Roadmaps</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(prefs.chosenSkills || []).map(id => {
              const skill = SKILL_ROADMAPS.find(s => s.id === id);
              if (!skill) return null;
              return <div key={id} style={{ background: skill.color + '18', border: `1px solid ${skill.color}44`, borderRadius: 20, padding: '4px 12px', fontSize: 13, color: skill.color, fontWeight: 600 }}>{skill.emoji} {skill.label}</div>;
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SEMESTER UNITS (dynamic years/sems)
// ══════════════════════════════════════════════════════════════════════════════
function UnitsTab({ state, dispatch }) {
  const prefs = state.prefs || DEFAULT_PREFS;
  const semesters = prefs.semesters || DEFAULT_PREFS.semesters;

  const [showAdd, setShowAdd] = useState(false);
  const [editUnitId, setEditUnitId] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', color: UNIT_COLORS[0], semester: semesters[0]?.id || '3.1' });
  const [openUnit, setOpenUnit] = useState(null);

  const openAddModal = () => {
    setEditUnitId(null);
    setForm({ code: '', name: '', color: UNIT_COLORS[0], semester: semesters[0]?.id || '3.1' });
    setShowAdd(true);
  };
  const openEditModal = (e, unit) => {
    e.stopPropagation();
    setEditUnitId(unit.id);
    setForm({ code: unit.code, name: unit.name, color: unit.color, semester: unit.semester || semesters[0]?.id || '3.1' });
    setShowAdd(true);
  };
  const saveUnit = () => {
    if (!form.code || !form.name) return;
    if (editUnitId) {
      const existing = state.units.find(u => u.id === editUnitId);
      dispatch({ type: 'updateUnit', unit: { ...existing, ...form } });
    } else {
      dispatch({ type: 'addUnit', unit: { id: uid(), ...form, topics: [], assignments: [], cats: [], exams: [] } });
    }
    setShowAdd(false); setEditUnitId(null);
  };
  const deleteUnit = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Remove this unit and all its data?')) dispatch({ type: 'removeUnit', id });
  };

  const semLabels = Object.fromEntries(semesters.map(s => [s.id, s.label || semLabel(s.id)]));

  if (openUnit) {
    const unit = state.units.find(u => u.id === openUnit);
    if (!unit) { setOpenUnit(null); return null; }
    return <UnitDetail unit={unit} dispatch={dispatch} onBack={() => setOpenUnit(null)} semLabels={semLabels} />;
  }

  const grouped = semesters.map(sem => ({
    sem: sem.id, label: semLabels[sem.id],
    units: state.units.filter(u => u.semester === sem.id),
    completed: (state.completedSemesters || []).includes(sem.id),
  })).filter(g => g.units.length > 0);
  const knownSems = new Set(semesters.map(s => s.id));
  const otherUnits = state.units.filter(u => !knownSems.has(u.semester));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ color: C.muted, fontSize: 13 }}>{state.units.length} unit{state.units.length !== 1 ? 's' : ''} · {semesters.length} semester{semesters.length !== 1 ? 's' : ''}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn outline onClick={() => {}} color={C.muted} style={{ fontSize: 12 }}>Manage in Settings</Btn>
          <Btn onClick={openAddModal}>+ Add unit</Btn>
        </div>
      </div>

      {state.units.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎓</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No units yet</div>
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Add your semester units to track assignments, CATs and exams.</div>
          <Btn onClick={openAddModal}>+ Add your first unit</Btn>
        </Card>
      )}

      {[...grouped, ...(otherUnits.length ? [{ sem: 'other', label: 'Other', units: otherUnits, completed: false }] : [])].map(group => (
        <div key={group.sem} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: group.completed ? C.green : C.accent, fontFamily: 'Space Grotesk' }}>
              {group.completed ? '✅ ' : ''}{group.label}
            </div>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            {group.sem !== 'other' && !group.completed && (
              <button onClick={() => {
                const allSubmitted = group.units.every(u =>
                  (u.assignments || []).every(a => a.submitted) && (u.exams || []).every(e => e.score)
                );
                if (window.confirm(`Mark ${group.label} as complete? This awards +150 XP.`))
                  dispatch({ type: 'completeSemester', semId: group.sem, clean: allSubmitted });
              }} style={{ background: C.green + '22', border: `1px solid ${C.green}44`, color: C.green, borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                ✓ Mark Complete
              </button>
            )}
            {group.completed && (
              <button onClick={() => dispatch({ type: 'uncompleteSemester', semId: group.sem })} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                Undo
              </button>
            )}
            <span style={{ fontSize: 11, color: C.muted }}>{group.units.length} unit{group.units.length !== 1 ? 's' : ''}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
            {group.units.map(unit => {
              const assignments = unit.assignments || [];
              const cats = unit.cats || [];
              const topics = unit.topics || [];
              const mastered = topics.filter(t => t.mastery === 4).length;
              const pending = assignments.filter(a => !a.submitted).length + cats.filter(c => !c.score).length;
              return (
                <Card key={unit.id} style={{ cursor: 'pointer', borderLeft: `3px solid ${unit.color}`, position: 'relative' }}
                  onClick={() => setOpenUnit(unit.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: unit.color }}>{unit.code}</div>
                      <div style={{ fontSize: 13, marginTop: 2 }}>{unit.name}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{semLabels[unit.semester] || unit.semester}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                      {pending > 0 && <Badge label={`${pending} pending`} color={C.red} />}
                      <button onClick={e => openEditModal(e, unit)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 15, padding: '2px 4px' }}>✏️</button>
                      <button onClick={e => deleteUnit(e, unit.id)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 15, padding: '2px 4px' }}>🗑️</button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    {[
                      { label: 'Assign.', val: assignments.length, done: assignments.filter(a => a.submitted).length },
                      { label: 'CATs', val: cats.length, done: cats.filter(c => c.score).length },
                      { label: 'Topics', val: topics.length, done: mastered },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{s.label}</div>
                        <ProgressBar value={s.done} max={s.val || 1} color={unit.color} />
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{s.done}/{s.val}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {showAdd && (
        <Modal title={editUnitId ? 'Edit Unit' : 'Add Unit'} onClose={() => { setShowAdd(false); setEditUnitId(null); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input value={form.code} onChange={v => setForm(f => ({ ...f, code: v }))} placeholder="Unit code e.g. ICS 301" />
            <Input value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Unit name e.g. Database Systems" />
            <div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Year · Semester</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: 6 }}>
                {semesters.map(s => (
                  <button key={s.id} onClick={() => setForm(f => ({ ...f, semester: s.id }))} style={{
                    padding: '8px 4px', borderRadius: 7, border: `2px solid ${form.semester === s.id ? C.accent : C.border}`,
                    background: form.semester === s.id ? C.accent + '22' : C.surface2,
                    color: form.semester === s.id ? C.accent : C.muted,
                    cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                  }}>{s.label || semLabel(s.id)}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Colour</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {UNIT_COLORS.map(c => (
                  <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '3px solid white' : '2px solid transparent' }} />
                ))}
              </div>
            </div>
            <Btn onClick={saveUnit}>{editUnitId ? 'Save Changes' : 'Add Unit'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// UNIT DETAIL
// ══════════════════════════════════════════════════════════════════════════════
function UnitDetail({ unit, dispatch, onBack, semLabels = {} }) {
  const [tab, setTab] = useState('assignments');
  const [modal, setModal] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const [topicInput, setTopicInput] = useState('');
  const [topicGroup, setTopicGroup] = useState('General');
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const openAdd = (type) => { setModal(type); setEditItem(null); setForm({}); };
  const openEdit = (type, item) => { setModal(type); setEditItem(item); setForm({ ...item }); };

  const saveAssignment = () => {
    if (!form.title) return;
    const item = { id: editItem?.id || uid(), title: form.title, due: form.due || '', outOf: form.outOf || 100, submitted: form.submitted || false, grade: form.grade || '', notes: form.notes || '' };
    dispatch(editItem ? { type: 'updateAssignment', unitId: unit.id, item } : { type: 'addAssignment', unitId: unit.id, item });
    setModal(null);
  };
  const saveCat = () => {
    if (!form.title) return;
    const item = { id: editItem?.id || uid(), title: form.title, date: form.date || '', outOf: form.outOf || 30, score: form.score || '', notes: form.notes || '' };
    dispatch(editItem ? { type: 'updateCat', unitId: unit.id, item } : { type: 'addCat', unitId: unit.id, item });
    setModal(null);
  };
  const saveExam = () => {
    if (!form.title) return;
    const item = { id: editItem?.id || uid(), title: form.title, date: form.date || '', outOf: form.outOf || 70, score: form.score || '', notes: form.notes || '' };
    dispatch(editItem ? { type: 'updateExam', unitId: unit.id, item } : { type: 'addExam', unitId: unit.id, item });
    setModal(null);
  };
  const addTopic = () => {
    if (!topicInput.trim()) return;
    dispatch({ type: 'addTopic', unitId: unit.id, topic: { id: uid(), name: topicInput.trim(), mastery: 0, notes: '', group: topicGroup || 'General' } });
    setTopicInput('');
  };

  const assignments = unit.assignments || [];
  const cats = unit.cats || [];
  const exams = unit.exams || [];
  const topics = unit.topics || [];
  const tabStyle = (t) => ({ padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'none', color: tab === t ? unit.color : C.muted, borderBottom: `2px solid ${tab === t ? unit.color : 'transparent'}`, fontFamily: 'inherit' });

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontSize: 13, marginBottom: 14, fontFamily: 'inherit' }}>← Back</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{ width: 6, height: 40, borderRadius: 3, background: unit.color }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, color: unit.color }}>{unit.code}</div>
          <div style={{ fontSize: 13, color: C.muted }}>{unit.name} · {semLabels[unit.semester] || unit.semester}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => { if (window.confirm('Remove unit?')) { dispatch({ type: 'removeUnit', id: unit.id }); onBack(); } }}
            style={{ background: 'none', border: `1px solid ${C.red}44`, color: C.red, borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 13 }}>🗑️ Remove</button>
        </div>
      </div>
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 18 }}>
        {[['assignments','📋 Assignments'],['cats','📝 CATs'],['exams','📚 Exams'],['mastery','🧠 Mastery']].map(([t,l]) => (
          <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>

      {tab === 'assignments' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}><Btn onClick={() => openAdd('assignment')}>+ Add</Btn></div>
          {assignments.length === 0 && <div style={{ color: C.muted, fontSize: 13 }}>No assignments yet.</div>}
          {assignments.map(a => {
            const pct = a.grade ? Math.round(parseFloat(a.grade) / (a.outOf || 100) * 100) : null;
            return (
              <Card key={a.id} style={{ marginBottom: 10, borderLeft: `3px solid ${a.submitted ? C.green : C.amber}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{a.title}</div>
                    {a.due && <div style={{ fontSize: 12, color: C.muted }}>Due: {a.due}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {pct !== null && <Badge label={`${pct}%`} color={pct >= 70 ? C.green : pct >= 50 ? C.amber : C.red} />}
                    <Badge label={a.submitted ? '✓' : 'Pending'} color={a.submitted ? C.green : C.amber} />
                    <button onClick={() => openEdit('assignment', a)} style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontSize: 12 }}>Edit</button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'cats' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}><Btn onClick={() => openAdd('cat')}>+ Add CAT</Btn></div>
          {cats.length === 0 && <div style={{ color: C.muted, fontSize: 13 }}>No CATs yet.</div>}
          {cats.map(c => {
            const pct = c.score ? Math.round(parseFloat(c.score) / (c.outOf || 30) * 100) : null;
            return (
              <Card key={c.id} style={{ marginBottom: 10, borderLeft: `3px solid ${pct !== null ? (pct >= 50 ? C.green : C.red) : C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.title}</div>
                    {c.date && <div style={{ fontSize: 12, color: C.muted }}>{c.date}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {pct !== null ? <Badge label={`${pct}%`} color={pct >= 70 ? C.green : pct >= 50 ? C.amber : C.red} /> : <Badge label="Pending" color={C.amber} />}
                    <button onClick={() => openEdit('cat', c)} style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontSize: 12 }}>Edit</button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'exams' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}><Btn onClick={() => openAdd('exam')}>+ Add Exam</Btn></div>
          {exams.length === 0 && <div style={{ color: C.muted, fontSize: 13 }}>No exams yet.</div>}
          {exams.map(e => {
            const pct = e.score ? Math.round(parseFloat(e.score) / (e.outOf || 70) * 100) : null;
            return (
              <Card key={e.id} style={{ marginBottom: 10, borderLeft: `3px solid ${pct !== null ? (pct >= 40 ? C.green : C.red) : C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{e.title}</div>
                    {e.date && <div style={{ fontSize: 12, color: C.muted }}>{e.date}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {pct !== null ? <Badge label={`${pct}%`} color={pct >= 70 ? C.green : pct >= 40 ? C.amber : C.red} /> : <Badge label="Upcoming" color={C.amber} />}
                    <button onClick={() => openEdit('exam', e)} style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontSize: 12 }}>Edit</button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'mastery' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <input value={topicInput} onChange={e => setTopicInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTopic()} placeholder="New topic name..." style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: '8px 10px', fontSize: 13, flex: 1, minWidth: 160, fontFamily: 'inherit' }} />
            <input value={topicGroup} onChange={e => setTopicGroup(e.target.value)} placeholder="Group" style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: '8px 10px', fontSize: 13, width: 120, fontFamily: 'inherit' }} />
            <Btn onClick={addTopic}>+ Add</Btn>
          </div>
          {(() => {
            const groups = {};
            topics.forEach(t => { const g = t.group || 'General'; if (!groups[g]) groups[g] = []; groups[g].push(t); });
            return Object.entries(groups).map(([g, ts]) => (
              <div key={g} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }} onClick={() => setCollapsedGroups(c => ({ ...c, [g]: !c[g] }))}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{collapsedGroups[g] ? '▶' : '▼'} {g}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{ts.filter(t => t.mastery === 4).length}/{ts.length}</div>
                </div>
                {!collapsedGroups[g] && ts.map(topic => (
                  <div key={topic.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
                    <button onClick={() => dispatch({ type: 'removeTopic', unitId: unit.id, topicId: topic.id })} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 12, padding: 0 }}>✕</button>
                    <div style={{ flex: 1, fontSize: 13 }}>{topic.name}</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {MASTERY_LEVELS.map(l => (
                        <button key={l.level} onClick={() => dispatch({ type: 'setMastery', unitId: unit.id, topicId: topic.id, level: l.level })} title={l.label}
                          style={{ width: 26, height: 26, borderRadius: '50%', border: `2px solid ${topic.mastery === l.level ? l.color : C.border}`, background: topic.mastery === l.level ? l.color + '44' : 'none', cursor: 'pointer', fontSize: 12, color: l.color }}>
                          {l.icon}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ));
          })()}
          {topics.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <ProgressBar value={topics.reduce((s, t) => s + (t.mastery || 0), 0)} max={topics.length * 4} color={unit.color} height={10} />
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{topics.filter(t => t.mastery === 4).length}/{topics.length} mastered</div>
            </div>
          )}
        </div>
      )}

      {modal === 'assignment' && (
        <Modal title={editItem ? 'Edit Assignment' : 'Add Assignment'} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Input value={form.title || ''} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="Title" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Due date</div><Input type="date" value={form.due || ''} onChange={v => setForm(f => ({ ...f, due: v }))} /></div>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Out of</div><Input type="number" value={form.outOf || 100} onChange={v => setForm(f => ({ ...f, outOf: v }))} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Score</div><Input type="number" value={form.grade || ''} onChange={v => setForm(f => ({ ...f, grade: v }))} placeholder="Leave blank if not graded" /></div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!form.submitted} onChange={e => setForm(f => ({ ...f, submitted: e.target.checked }))} /> Submitted
                </label>
              </div>
            </div>
            <div style={{ fontSize: 11, color: C.amber }}>⭐ XP awarded automatically on submission and grading</div>
            <Btn onClick={saveAssignment}>{editItem ? 'Save' : 'Add'}</Btn>
          </div>
        </Modal>
      )}
      {modal === 'cat' && (
        <Modal title={editItem ? 'Edit CAT' : 'Add CAT'} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Input value={form.title || ''} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="e.g. CAT 1 – Week 4" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Date</div><Input type="date" value={form.date || ''} onChange={v => setForm(f => ({ ...f, date: v }))} /></div>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Out of</div><Input type="number" value={form.outOf || 30} onChange={v => setForm(f => ({ ...f, outOf: v }))} /></div>
            </div>
            <Input type="number" value={form.score || ''} onChange={v => setForm(f => ({ ...f, score: v }))} placeholder="Score (leave blank until graded)" />
            <div style={{ fontSize: 11, color: C.amber }}>⭐ XP: pass +40, distinction +70</div>
            <Btn onClick={saveCat}>{editItem ? 'Save' : 'Add CAT'}</Btn>
          </div>
        </Modal>
      )}
      {modal === 'exam' && (
        <Modal title={editItem ? 'Edit Exam' : 'Add Exam'} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Input value={form.title || ''} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="e.g. End of semester exam" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Date</div><Input type="date" value={form.date || ''} onChange={v => setForm(f => ({ ...f, date: v }))} /></div>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Out of</div><Input type="number" value={form.outOf || 70} onChange={v => setForm(f => ({ ...f, outOf: v }))} /></div>
            </div>
            <Input type="number" value={form.score || ''} onChange={v => setForm(f => ({ ...f, score: v }))} placeholder="Score (after results)" />
            <div style={{ fontSize: 11, color: C.amber }}>⭐ XP: pass +80, distinction +120</div>
            <Btn onClick={saveExam}>{editItem ? 'Save' : 'Add Exam'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TIMETABLE
// ══════════════════════════════════════════════════════════════════════════════
function TimetableTab({ state, dispatch }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ day: 'Mon', time: '8:00', unitId: '', type: 'Lecture', room: '', notes: '' });
  const slotsByDay = DAYS.map(day => ({ day, slots: state.timetable.filter(s => s.day === day).sort((a,b) => a.time.localeCompare(b.time)) }));
  const getUnit = (id) => state.units.find(u => u.id === id);

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <span style={{ color: C.muted, fontSize: 13 }}>{state.timetable.length} slots</span>
        <div style={{ marginLeft: 'auto' }}>
          {state.units.length > 0 && <Btn onClick={() => setShowAdd(true)}>+ Add slot</Btn>}
        </div>
      </div>
      {state.units.length === 0 && <Card style={{ textAlign: 'center', padding: 32 }}><div style={{ color: C.muted }}>Add units first.</div></Card>}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${DAYS.length}, 1fr)`, gap: 2, minWidth: 700 }}>
          <div />
          {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontWeight: 600, fontSize: 12, color: C.muted, padding: '6px 0' }}>{d}</div>)}
          {TIMES.map(time => (
            <React.Fragment key={time}>
              <div style={{ fontSize: 11, color: C.muted, paddingTop: 6, textAlign: 'right', paddingRight: 8 }}>{time}</div>
              {DAYS.map(day => {
                const slots = state.timetable.filter(s => s.day === day && s.time === time);
                return (
                  <div key={day} style={{ minHeight: 40, background: C.surface2, borderRadius: 4, padding: 2 }}>
                    {slots.map(slot => {
                      const u = getUnit(slot.unitId);
                      return (
                        <div key={slot.id} onClick={() => dispatch({ type: 'removeSlot', id: slot.id })} title="Click to remove"
                          style={{ background: u?.color + '33', border: `1px solid ${u?.color || C.border}`, borderRadius: 4, padding: '3px 6px', fontSize: 11, marginBottom: 2, cursor: 'pointer' }}>
                          <div style={{ fontWeight: 600, color: u?.color }}>{u?.code || '?'}</div>
                          <div style={{ color: C.muted }}>{slot.type}{slot.room ? ` · ${slot.room}` : ''}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: C.muted }}>Click a slot to remove it.</div>
      {showAdd && (
        <Modal title="Add Slot" onClose={() => setShowAdd(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Day</div><Select value={form.day} onChange={v => setForm(f => ({ ...f, day: v }))}>{DAYS.map(d => <option key={d}>{d}</option>)}</Select></div>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Time</div><Select value={form.time} onChange={v => setForm(f => ({ ...f, time: v }))}>{TIMES.map(t => <option key={t}>{t}</option>)}</Select></div>
            </div>
            <Select value={form.unitId} onChange={v => setForm(f => ({ ...f, unitId: v }))}>
              <option value="">Select unit</option>
              {state.units.map(u => <option key={u.id} value={u.id}>{u.code}</option>)}
            </Select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Select value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))}>
                {['Lecture','Tutorial','Lab','Study','CAT','Exam'].map(t => <option key={t}>{t}</option>)}
              </Select>
              <Input value={form.room} onChange={v => setForm(f => ({ ...f, room: v }))} placeholder="Room / venue" />
            </div>
            <Btn onClick={() => { dispatch({ type: 'addSlot', slot: { id: uid(), ...form } }); setShowAdd(false); }} disabled={!form.unitId}>Add Slot</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// AI ASSISTANT
// ══════════════════════════════════════════════════════════════════════════════
function AITab({ state, dispatch }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const prefs = state.prefs || DEFAULT_PREFS;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [state.aiHistory, loading]);

  const unitsSummary = state.units.map(u => {
    const pending = (u.assignments || []).filter(a => !a.submitted).length;
    return `${u.code} (${u.name}): ${pending} pending assignments, ${(u.cats||[]).length} CATs, ${(u.topics||[]).filter(t=>t.mastery===4).length}/${(u.topics||[]).length} topics mastered`;
  }).join('\n');

  const name = prefs.displayName || 'Student';
  const systemPrompt = `You are a friendly academic assistant for ${name}${prefs.bio ? ` (${prefs.bio})` : ''}.

Semester units:
${unitsSummary || 'No units added yet.'}
XP: ${state.xp} | Streak: ${state.streak} days | Tasks done: ${Object.values(state.checked).filter(Boolean).length}/45
Chosen roadmaps: ${(prefs.chosenSkills||[]).join(', ') || 'none yet'}

Help with: Data Science, Statistics, Programming, Math concepts, assignment guidance, CAT/exam revision, study planning, Kenya internship advice. Keep responses concise but thorough.`;

const send = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = { role: 'user', content: input.trim() };
    dispatch({ type: 'aiMessage', msg: userMsg });
    setInput(''); 
    setLoading(true);
    
    try {
      // Points to your relative Netlify functions path
      const res = await fetch('/.netlify/functions/chat', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          systemPrompt: systemPrompt, 
          messages: [...state.aiHistory, userMsg] 
        }),
      });
      
      if (!res.ok) {
        throw new Error('Server error handling request');
      }

      const data = await res.json();
      
      dispatch({ 
        type: 'aiMessage', 
        msg: { role: 'assistant', content: data.text || 'No response.' } 
      });
    } catch (error) {
      console.error("Frontend Error:", error);
      dispatch({ 
        type: 'aiMessage', 
        msg: { role: 'assistant', content: 'Network error — check connection and try again.' } 
      });
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)', maxHeight: 700 }}>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 8 }}>
        {state.aiHistory.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>AI Study Assistant</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Ask anything about your studies, assignments, or career.</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {['Explain hypothesis testing','SQL joins for interviews','Help revise for Data Structures','Python pandas practice Qs','Internship CV tips Kenya'].map(s => (
                <button key={s} onClick={() => setInput(s)} style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text, borderRadius: 20, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {state.aiHistory.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '80%', background: msg.role === 'user' ? C.accent : C.surface2, color: msg.role === 'user' ? '#000' : C.text, borderRadius: 12, padding: '10px 14px', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && <div style={{ display: 'flex', justifyContent: 'flex-start' }}><div style={{ background: C.surface2, borderRadius: 12, padding: '10px 14px', fontSize: 13, color: C.muted }}>Thinking…</div></div>}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Ask anything… (Enter to send)" rows={2}
          style={{ flex: 1, background: C.surface2, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: '10px 12px', fontSize: 13, resize: 'none', fontFamily: 'inherit' }} />
        <Btn onClick={send} disabled={loading || !input.trim()} style={{ alignSelf: 'flex-end', padding: '10px 20px' }}>Send</Btn>
        <button onClick={() => dispatch({ type: 'clearAI' })} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: '10px 12px', fontSize: 12, cursor: 'pointer', alignSelf: 'flex-end', fontFamily: 'inherit' }}>Clear</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TASKS TAB  (customisable: add / edit / remove per skill category)
// ══════════════════════════════════════════════════════════════════════════════
function SkillProgressChart({ skillId, tasks, checked }) {
  const done  = tasks.filter(t => checked[t.id]).length;
  const total = tasks.length;
  if (!total) return null;
  const pct   = Math.round((done / total) * 100);
  const skill = SKILL_ROADMAPS.find(s => s.id === skillId);
  const color = skill?.color || C.accent;
  const r = 28; const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 80 }}>
      <svg width={72} height={72} viewBox="0 0 72 72">
        <circle cx={36} cy={36} r={r} fill="none" stroke={C.border} strokeWidth={7} />
        <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 36 36)"
          style={{ transition: 'stroke-dashoffset .5s' }} />
        <text x={36} y={40} textAnchor="middle" fill={color} fontSize={14} fontWeight={700}>{pct}%</text>
      </svg>
      <div style={{ fontSize: 10, color: C.muted, textAlign: 'center', maxWidth: 72 }}>{done}/{total} done</div>
    </div>
  );
}

const BLANK_TASK_FORM = { title: '', skillId: '', xp: 20, link: '', week: '' };

function TasksTab({ state, toggle, dispatch }) {
  const prefs       = state.prefs || DEFAULT_PREFS;
  const customTasks = state.customTasks || [];
  const chosenSkills = prefs.chosenSkills || [];

  // Build the full skill list for filtering:
  // built-in TRACKS + chosen SKILL_ROADMAPS
  const builtInCategories = TRACKS.map(t => ({ id: t.id, label: t.label, emoji: t.emoji, color: t.color, isSkill: false }));
  const skillCategories   = SKILL_ROADMAPS
    .filter(s => chosenSkills.includes(s.id))
    .map(s => ({ id: s.id, label: s.label, emoji: s.emoji, color: s.color, isSkill: true }));
  const allCategories = [...builtInCategories, ...skillCategories];

  const [activeTab, setActiveTab]   = useState('all');   // 'all' | category id | 'progress'
  const [showModal, setShowModal]   = useState(false);
  const [editTask, setEditTask]     = useState(null);     // null = adding new
  const [form, setForm]             = useState(BLANK_TASK_FORM);
  const [confirmDel, setConfirmDel] = useState(null);

  // All tasks: built-in (have week/track) + custom (have skillId)
  const allTasks = [
    ...TASKS.map(t => ({ ...t, _builtin: true })),
    ...customTasks.map(t => ({ ...t, _builtin: false })),
  ];

  const filteredTasks = activeTab === 'all' || activeTab === 'progress'
    ? allTasks
    : allTasks.filter(t => (t.track || t.skillId) === activeTab);

  // Group by skill/track for display
  function getCatMeta(task) {
    if (task.track) {
      const tr = TRACKS.find(t => t.id === task.track);
      return tr ? { id: tr.id, label: tr.label, emoji: tr.emoji, color: tr.color } : null;
    }
    if (task.skillId) {
      const sk = SKILL_ROADMAPS.find(s => s.id === task.skillId);
      return sk ? { id: sk.id, label: sk.label, emoji: sk.emoji, color: sk.color } : null;
    }
    return null;
  }

  // Group tasks by week (built-in) or by skillId (custom, no week)
  const grouped = [];
  if (activeTab !== 'progress') {
    // First: week-grouped tasks (built-in or custom with week set)
    const withWeek = filteredTasks.filter(t => t.week);
    const weeks = [...new Set(withWeek.map(t => t.week))].sort((a,b) => a-b);
    weeks.forEach(week => {
      const tasks = withWeek.filter(t => t.week === week);
      if (tasks.length) grouped.push({ type: 'week', week, tasks });
    });
    // Then: custom tasks without a week, grouped by skill
    const noWeek = filteredTasks.filter(t => !t.week);
    const cats = [...new Set(noWeek.map(t => t.skillId).filter(Boolean))];
    cats.forEach(skillId => {
      const sk = SKILL_ROADMAPS.find(s => s.id === skillId);
      const tasks = noWeek.filter(t => t.skillId === skillId);
      if (tasks.length) grouped.push({ type: 'skill', skillId, label: `${sk?.emoji || ''} ${sk?.label || skillId}`, color: sk?.color || C.accent, tasks });
    });
    const orphan = noWeek.filter(t => !t.skillId);
    if (orphan.length) grouped.push({ type: 'skill', skillId: '_other', label: '📌 Other', color: C.muted, tasks: orphan });
  }

  const openAdd = () => {
    setEditTask(null);
    setForm({ ...BLANK_TASK_FORM, skillId: activeTab !== 'all' && activeTab !== 'progress' ? activeTab : '' });
    setShowModal(true);
  };
  const openEdit = (task) => {
    setEditTask(task);
    setForm({ title: task.title, skillId: task.skillId || task.track || '', xp: task.xp, link: task.link || '', week: task.week || '' });
    setShowModal(true);
  };
  const saveTask = () => {
    if (!form.title.trim()) return;
    const taskData = {
      title: form.title.trim(),
      skillId: form.skillId || '',
      xp: parseInt(form.xp) || 20,
      link: form.link.trim(),
      week: form.week ? parseInt(form.week) : null,
    };
    if (editTask) {
      dispatch({ type: 'updateCustomTask', task: { ...editTask, ...taskData } });
    } else {
      dispatch({ type: 'addCustomTask', task: { id: uid(), ...taskData } });
    }
    setShowModal(false);
  };
  const deleteTask = (task) => {
    dispatch({ type: 'removeCustomTask', id: task.id });
    setConfirmDel(null);
  };

  const totalDone  = allTasks.filter(t => state.checked[t.id]).length;
  const totalCount = allTasks.length;

  return (
    <div>
      {/* ── Header row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: C.muted }}>{totalDone}/{totalCount} done</span>
          <div style={{ width: 120, marginLeft: 6 }}><ProgressBar value={totalDone} max={totalCount} color={C.green} height={5} /></div>
        </div>
        <Btn onClick={openAdd}>+ Add Task</Btn>
      </div>

      {/* ── Category filter tabs ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {[{ id: 'all', label: 'All', emoji: '📋', color: C.accent }, { id: 'progress', label: 'Progress', emoji: '📊', color: C.purple }, ...allCategories].map(cat => (
          <button key={cat.id} onClick={() => setActiveTab(cat.id)} style={{
            background: activeTab === cat.id ? (cat.color || C.accent) : C.surface2,
            color: activeTab === cat.id ? '#000' : C.text,
            border: `1px solid ${activeTab === cat.id ? (cat.color || C.accent) : C.border}`,
            borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>{cat.emoji} {cat.label}</button>
        ))}
      </div>

      {/* ── PROGRESS VIEW ── */}
      {activeTab === 'progress' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Overall summary card */}
          <Card>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Overall Progress</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
              {allCategories.map(cat => {
                const tasks = allTasks.filter(t => (t.track || t.skillId) === cat.id);
                const done  = tasks.filter(t => state.checked[t.id]).length;
                if (!tasks.length) return null;
                const pct = Math.round((done / tasks.length) * 100);
                return (
                  <div key={cat.id} style={{ background: C.surface2, borderRadius: 10, padding: '12px 14px', borderLeft: `4px solid ${cat.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{cat.emoji} {cat.label}</span>
                      <span style={{ fontSize: 12, color: cat.color, fontWeight: 700 }}>{done}/{tasks.length}</span>
                    </div>
                    <ProgressBar value={done} max={tasks.length} color={cat.color} height={7} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: C.muted }}>
                      <span>{pct}% complete</span>
                      <span>+{tasks.filter(t => state.checked[t.id]).reduce((s,t) => s + (t.xp||0), 0)} XP earned</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Skill-by-skill ring charts */}
          {chosenSkills.length > 0 && (
            <Card>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Skill Roadmap Progress</div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {chosenSkills.map(skillId => {
                  const tasks = allTasks.filter(t => t.skillId === skillId);
                  const sk    = SKILL_ROADMAPS.find(s => s.id === skillId);
                  if (!tasks.length) return (
                    <div key={skillId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 80, opacity: 0.5 }}>
                      <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{sk?.emoji}</div>
                      <div style={{ fontSize: 10, color: C.muted, textAlign: 'center' }}>No tasks yet</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{sk?.label}</div>
                    </div>
                  );
                  return (
                    <div key={skillId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <SkillProgressChart skillId={skillId} tasks={tasks} checked={state.checked} />
                      <div style={{ fontSize: 11, fontWeight: 600, color: sk?.color, maxWidth: 80, textAlign: 'center' }}>{sk?.emoji} {sk?.label}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Weekly built-in progress */}
          <Card>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Built-in Roadmap by Week</div>
            {[...new Set(TASKS.map(t => t.week))].sort((a,b) => a-b).map(week => {
              const tasks = TASKS.filter(t => t.week === week);
              const done  = tasks.filter(t => state.checked[t.id]).length;
              const pct   = Math.round((done / tasks.length) * 100);
              return (
                <div key={week} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>Week {week}</span>
                    <span style={{ color: done === tasks.length ? C.green : C.muted }}>{done}/{tasks.length} · {pct}%</span>
                  </div>
                  <ProgressBar value={done} max={tasks.length} color={done === tasks.length ? C.green : C.accent} height={8} />
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* ── TASK LIST VIEW ── */}
      {activeTab !== 'progress' && grouped.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No tasks here yet</div>
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Add a task for this skill, or choose skills in Settings → Skills Roadmap.</div>
          <Btn onClick={openAdd}>+ Add Task</Btn>
        </Card>
      )}

      {activeTab !== 'progress' && grouped.map((group, gi) => {
        const done = group.tasks.filter(t => state.checked[t.id]).length;
        return (
          <div key={gi} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              {group.type === 'week'
                ? <div style={{ fontWeight: 700, fontSize: 13, color: C.accent }}>Week {group.week}</div>
                : <div style={{ fontWeight: 700, fontSize: 13, color: group.color }}>{group.label}</div>
              }
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <Badge label={`${done}/${group.tasks.length}`} color={done === group.tasks.length ? C.green : C.amber} />
            </div>

            {group.tasks.map(task => {
              const cat     = getCatMeta(task);
              const checked = !!state.checked[task.id];
              return (
                <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: checked ? C.surface : C.surface2, borderRadius: 8, marginBottom: 6, border: `1px solid ${checked ? C.green + '44' : C.border}`, opacity: checked ? 0.75 : 1, transition: 'all .15s' }}>
                  {/* Checkbox */}
                  <div onClick={() => toggle(task.id, task.xp, task.title)} style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${checked ? C.green : C.border}`, background: checked ? C.green : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, color: '#000', cursor: 'pointer' }}>{checked ? '✓' : ''}</div>

                  {/* Content */}
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => toggle(task.id, task.xp, task.title)}>
                    <div style={{ fontSize: 13, textDecoration: checked ? 'line-through' : 'none', color: checked ? C.muted : C.text }}>{task.title}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      {cat && <Badge label={`${cat.emoji} ${cat.label}`} color={cat.color} />}
                      <Badge label={`+${task.xp} XP`} color={C.amber} />
                      {!task._builtin && <Badge label="custom" color={C.purple} />}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {task.link && <a href={task.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} title="Open resource" style={{ color: C.accent, fontSize: 13, padding: '2px 4px', textDecoration: 'none' }}>↗</a>}
                    {!task._builtin && (
                      <>
                        <button onClick={e => { e.stopPropagation(); openEdit(task); }} title="Edit" style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 14, padding: '2px 4px' }}>✏️</button>
                        <button onClick={e => { e.stopPropagation(); setConfirmDel(task); }} title="Delete" style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 14, padding: '2px 4px' }}>🗑️</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* ── Add / Edit Task Modal ── */}
      {showModal && (
        <Modal title={editTask ? 'Edit Task' : 'Add Task'} onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <SectionLabel>Task Title</SectionLabel>
              <Input value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="e.g. Build a REST API with Node.js" />
            </div>

            <div>
              <SectionLabel>Category / Skill</SectionLabel>
              <select value={form.skillId} onChange={e => setForm(f => ({ ...f, skillId: e.target.value }))}
                style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', width: '100%' }}>
                <option value="">— Choose category —</option>
                <optgroup label="Built-in tracks">
                  {TRACKS.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
                </optgroup>
                {chosenSkills.length > 0 && (
                  <optgroup label="My Skill Roadmaps">
                    {chosenSkills.map(id => {
                      const sk = SKILL_ROADMAPS.find(s => s.id === id);
                      return sk ? <option key={id} value={id}>{sk.emoji} {sk.label}</option> : null;
                    })}
                  </optgroup>
                )}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <SectionLabel>XP Reward</SectionLabel>
                <Input type="number" min={1} max={200} value={form.xp} onChange={v => setForm(f => ({ ...f, xp: v }))} placeholder="20" />
              </div>
              <div>
                <SectionLabel>Week (optional)</SectionLabel>
                <Input type="number" min={1} max={52} value={form.week} onChange={v => setForm(f => ({ ...f, week: v }))} placeholder="e.g. 3" />
              </div>
            </div>

            <div>
              <SectionLabel>Resource Link (optional)</SectionLabel>
              <Input value={form.link} onChange={v => setForm(f => ({ ...f, link: v }))} placeholder="https://..." />
            </div>

            <Btn onClick={saveTask} disabled={!form.title.trim()}>{editTask ? 'Save Changes' : '+ Add Task'}</Btn>
          </div>
        </Modal>
      )}

      {/* ── Confirm Delete Modal ── */}
      {confirmDel && (
        <Modal title="Delete Task?" onClose={() => setConfirmDel(null)}>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Remove <strong style={{ color: C.text }}>{confirmDel.title}</strong>? This cannot be undone.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn color={C.red} onClick={() => deleteTask(confirmDel)}>Delete</Btn>
            <Btn outline onClick={() => setConfirmDel(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FOCUS TIMER (uses prefs for durations)
// ══════════════════════════════════════════════════════════════════════════════
function FocusTimer({ dispatch, prefs }) {
  const modes = [
    { id: 'work',  label: '🍅 Focus',      mins: prefs?.timerWork  || 90 },
    { id: 'short', label: '☕ Short Break', mins: prefs?.timerShort || 25 },
    { id: 'long',  label: '🌿 Long Break',  mins: prefs?.timerLong  || 50 },
    { id: 'deep',  label: '🧠 Deep Work',   mins: prefs?.timerDeep  || 180 },
  ];
  const [modeIdx, setModeIdx] = useState(0);
  const [secs, setSecs] = useState(modes[0].mins * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  const mode = modes[modeIdx];

  useEffect(() => { setSecs(mode.mins * 60); setRunning(false); clearInterval(intervalRef.current); }, [modeIdx]);
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecs(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current); setRunning(false);
            dispatch({ type: 'focusDone', minutes: mode.mins, mode: mode.label });
            if ('Notification' in window && Notification.permission === 'granted')
              new Notification('✅ Session Complete!', { body: `${mode.label} done. +10 XP!` });
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const r = 80; const circ = 2 * Math.PI * r;
  const dash = circ - (((mode.mins * 60 - secs) / (mode.mins * 60)) * circ);

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <Card style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
          {modes.map((m, i) => (
            <button key={m.id} onClick={() => setModeIdx(i)} style={{ background: i === modeIdx ? C.accent : C.surface2, color: i === modeIdx ? '#000' : C.text, border: `1px solid ${C.border}`, borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {m.label} <span style={{ fontSize: 11, opacity: 0.8 }}>{m.mins}m</span>
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
          <svg width={200} height={200} viewBox="0 0 200 200">
            <circle cx={100} cy={100} r={r} fill="none" stroke={C.border} strokeWidth={10} />
            <circle cx={100} cy={100} r={r} fill="none" stroke={C.accent} strokeWidth={10} strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round" transform="rotate(-90 100 100)" style={{ transition: 'stroke-dashoffset .5s' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: 38, fontWeight: 700 }}>{fmt(secs)}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{mode.label}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Btn onClick={() => setRunning(r => !r)} color={running ? C.red : C.green} style={{ padding: '10px 32px', fontSize: 15 }}>{running ? 'Pause' : 'Start'}</Btn>
          <Btn onClick={() => { setSecs(mode.mins * 60); setRunning(false); }} outline style={{ padding: '10px 20px', fontSize: 15 }}>Reset</Btn>
        </div>
        <div style={{ marginTop: 14, fontSize: 12, color: C.amber }}>⭐ Each completed session earns +10 XP</div>
        <div style={{ marginTop: 6, fontSize: 12, color: C.muted }}>Customise durations in Settings → Timer</div>
        <button onClick={() => 'Notification' in window && Notification.requestPermission()} style={{ marginTop: 8, background: 'transparent', color: C.muted, border: 'none', fontSize: 12, textDecoration: 'underline', cursor: 'pointer' }}>Enable notifications</button>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CALENDAR, DIARY, REMINDERS, XP LOG (unchanged from original, wired)
// ══════════════════════════════════════════════════════════════════════════════
function CalendarTab({ state, dispatch }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [selected, setSelected] = useState(today());
  const [noteText, setNoteText] = useState('');
  const firstDay = new Date(month.y, month.m, 1).getDay();
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayKey = d => `${month.y}-${String(month.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={() => setMonth(p => { const d = new Date(p.y, p.m - 1); return { y: d.getFullYear(), m: d.getMonth() }; })} style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: '4px 10px', fontSize: 16, cursor: 'pointer' }}>‹</button>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18 }}>{MONTHS[month.m]} {month.y}</span>
          <button onClick={() => setMonth(p => { const d = new Date(p.y, p.m + 1); return { y: d.getFullYear(), m: d.getMonth() }; })} style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: '4px 10px', fontSize: 16, cursor: 'pointer' }}>›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 8 }}>
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: 12, color: C.muted, fontWeight: 600 }}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const d = i + 1; const key = dayKey(d); const isToday = key === today(); const isSel = key === selected;
            const hasFocus = state.focusSessions.some(s => s.date === key);
            const hasNote = !!state.calNotes[key];
            const hasDeadline = state.units.some(u => [...(u.assignments || []), ...(u.cats || []), ...(u.exams || [])].some(item => (item.due || item.date) === key));
            return <div key={d} onClick={() => setSelected(key)} style={{ aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 8, cursor: 'pointer', background: isSel ? C.accent : isToday ? 'rgba(88,166,255,0.15)' : C.surface2, border: `2px solid ${isToday ? C.accent : 'transparent'}`, color: isSel ? '#000' : C.text, fontWeight: isToday ? 700 : 400, fontSize: 13 }}>
              {d}
              <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                {hasFocus && <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSel ? '#000' : C.purple }} />}
                {hasNote && <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSel ? '#000' : C.amber }} />}
                {hasDeadline && <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSel ? '#000' : C.red }} />}
              </div>
            </div>;
          })}
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 12, fontSize: 11, color: C.muted }}>
          <span>🟣 focus</span><span>🟡 note</span><span>🔴 deadline</span>
        </div>
      </Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>📅 {selected}</div>
          {state.focusSessions.filter(s => s.date === selected).map((s, i) => <div key={i} style={{ fontSize: 13, color: C.purple, marginBottom: 4 }}>⏱ {s.minutes}min – {s.mode}</div>)}
          {state.units.map(u => {
            const items = [...(u.assignments || []).filter(a => (a.due || '') === selected), ...(u.cats || []).filter(c => (c.date || '') === selected), ...(u.exams || []).filter(e => (e.date || '') === selected)];
            return items.map(item => <div key={item.id} style={{ fontSize: 12, color: C.red, marginBottom: 2 }}>📌 {u.code}: {item.title}</div>);
          })}
          {state.calNotes[selected] && <div style={{ fontSize: 13, color: C.muted, marginTop: 6, whiteSpace: 'pre-wrap' }}>{state.calNotes[selected]}</div>}
        </Card>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Add note</div>
          <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="What happened today?" style={{ width: '100%', background: C.surface2, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: 10, fontSize: 13, resize: 'vertical', minHeight: 70, fontFamily: 'inherit', boxSizing: 'border-box' }} />
          <Btn onClick={() => { dispatch({ type: 'calNote', date: selected, text: noteText }); setNoteText(''); }} style={{ marginTop: 8, width: '100%' }}>Save</Btn>
        </Card>
      </div>
    </div>
  );
}

function DiaryTab({ state, dispatch }) {
  const [text, setText] = useState('');
  const entries = Object.entries(state.diary).sort((a, b) => b[0].localeCompare(a[0]));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
      <div>
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>📝 Today – {today()}</div>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="What did you learn? What challenged you? What are you proud of?"
            style={{ width: '100%', background: C.surface2, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: 12, fontSize: 14, resize: 'vertical', minHeight: 100, fontFamily: 'inherit', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <span style={{ fontSize: 12, color: C.amber }}>⭐ +5 XP for each entry</span>
            <Btn onClick={() => { if (text.trim()) { dispatch({ type: 'diary', date: today(), text: text.trim() }); setText(''); } }}>Save Entry</Btn>
          </div>
        </Card>
        {entries.map(([date, txt]) => (
          <Card key={date} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{date}</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{txt}</p>
          </Card>
        ))}
      </div>
      <Card>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>💡 Quick tip</div>
        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, margin: 0 }}>Daily reflections build a learning habit. Each entry earns XP and gives you a searchable record of your progress.<br /><br />Try writing at least one thing you learned, one challenge, and one thing to try tomorrow.</p>
      </Card>
    </div>
  );
}

function RemindersTab({ state, dispatch }) {
  const [form, setForm] = useState({ title: '', date: '', time: '', type: 'study' });
  const sorted = [...state.reminders].sort((a, b) => a.date.localeCompare(b.date));
  const now = new Date();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <Card>
        <div style={{ fontWeight: 600, marginBottom: 14 }}>➕ Add Reminder</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Input value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="What to remember..." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Input type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
            <Input type="time" value={form.time} onChange={v => setForm(f => ({ ...f, time: v }))} />
          </div>
          <Select value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))}>
            {['study','assignment','cat','exam','apply','review','other'].map(t => <option key={t}>{t}</option>)}
          </Select>
          <Btn onClick={() => { if (!form.title || !form.date) return; dispatch({ type: 'addReminder', reminder: { ...form, id: Date.now() } }); setForm({ title: '', date: '', time: '', type: 'study' }); }}>Set Reminder</Btn>
        </div>
      </Card>
      <Card>
        <div style={{ fontWeight: 600, marginBottom: 14 }}>🔔 All Reminders</div>
        {sorted.length === 0 && <p style={{ color: C.muted, fontSize: 13 }}>No reminders yet.</p>}
        {sorted.map(r => {
          const dt = new Date(`${r.date}T${r.time || '23:59'}`); const overdue = dt < now;
          return <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: `1px solid ${C.border}`, opacity: overdue ? 0.6 : 1 }}>
            <span style={{ fontSize: 18 }}>{r.type === 'exam' ? '📚' : r.type === 'cat' ? '📝' : r.type === 'assignment' ? '📋' : '📌'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{r.title}</div>
              <div style={{ fontSize: 11, color: overdue ? C.red : C.muted }}>{overdue ? '⚠ Overdue – ' : ''}{r.date}{r.time ? ' at ' + r.time : ''}</div>
            </div>
            <button onClick={() => dispatch({ type: 'removeReminder', id: r.id })} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 16, cursor: 'pointer' }}>✕</button>
          </div>;
        })}
      </Card>
    </div>
  );
}

function XPLogTab({ state }) {
  const log = state.xpLog || [];
  const byCategory = {};
  log.forEach(e => {
    const cat = e.reason?.split(':')[0]?.split('–')[0]?.trim() || 'Other';
    byCategory[cat] = (byCategory[cat] || 0) + e.amount;
  });
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
      <Card>
        <div style={{ fontWeight: 600, marginBottom: 14 }}>📜 XP History (last 200)</div>
        {log.length === 0 && <div style={{ color: C.muted, fontSize: 13 }}>No XP yet — complete tasks, focus sessions, or diary entries.</div>}
        {log.map((e, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
            <div><span>{e.reason}</span><span style={{ fontSize: 11, color: C.muted, marginLeft: 10 }}>{e.date}</span></div>
            <span style={{ color: C.amber, fontWeight: 600, flexShrink: 0 }}>+{e.amount} XP</span>
          </div>
        ))}
      </Card>
      <div>
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>⭐ Total: {state.xp} XP</div>
          {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, xp]) => (
            <div key={cat} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>{cat}</span><span style={{ color: C.amber }}>{xp}</span>
              </div>
              <ProgressBar value={xp} max={state.xp} color={C.amber} />
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>📖 XP Rules</div>
          {[['Holiday task','varies'],['Focus session','+10'],['Diary entry','+5'],['Assignment submit','+30'],['Grade A','+50'],['Grade B','+35'],['CAT pass','+40'],['CAT distinction','+70'],['Exam pass','+80'],['Exam distinction','+120'],['Topic mastered','+25'],['Semester complete','+150'],['Year complete','+300']].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: `1px solid ${C.border}`, color: C.muted }}>
              <span>{label}</span><span style={{ color: C.amber }}>{val}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: 'dashboard', label: '🏠 Dashboard',      group: 'general' },
  { id: 'xplog',     label: '⭐ XP & Progress',   group: 'general' },
  { id: 'achieve',   label: '🏆 Achievements',     group: 'general' },
  { id: 'units',     label: '🎓 Semester Units',   group: 'semester' },
  { id: 'timetable', label: '🗓️ Timetable',        group: 'semester' },
  { id: 'ai',        label: '🤖 AI Assistant',     group: 'semester' },
  { id: 'tasks',     label: '✅ Tasks',             group: 'holiday' },
  { id: 'calendar',  label: '📅 Calendar',         group: 'holiday' },
  { id: 'timer',     label: '⏱ Focus Timer',       group: 'holiday' },
  { id: 'diary',     label: '📝 Diary',            group: 'holiday' },
  { id: 'reminders', label: '🔔 Reminders',        group: 'holiday' },
  { id: 'resources', label: '📚 Resources',        group: 'holiday' },
  { id: 'settings',  label: '⚙️ Settings',          group: 'general' },
];

function AppInner({ user }) {
  const [tab, setTab] = useState('dashboard');
  const [state, dispatch] = useReducer(reducer, null, initState);

  // PASTE THIS CODE HERE:
  useEffect(() => {
    if (state) {
      save(state);
    }
  }, [state]);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const prefs = state.prefs || DEFAULT_PREFS;

  // Apply theme whenever prefs change
  useEffect(() => { applyTheme(prefs); }, [prefs]);

  useEffect(() => {
    const t = today();
    if (state.lastVisit !== t) {
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const yKey = yesterday.toISOString().slice(0, 10);
      const newStreak = state.lastVisit === yKey ? state.streak + 1 : 1;
      const next = { ...state, lastVisit: t, streak: newStreak };
      save(next);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      state.reminders.forEach(r => {
        const dt = new Date(`${r.date}T${r.time || '09:00'}`);
        if (Math.abs(now - dt) / 1000 < 35 && 'Notification' in window && Notification.permission === 'granted')
          new Notification('⏰ ' + r.title, { body: r.type });
      });
    }, 30000);
    return () => clearInterval(id);
  }, [state.reminders]);

  const toggle = useCallback((id, xp, title) => dispatch({ type: 'toggle', id, xp, title }), []);

  const groups = [
    { id: 'general',  label: 'Overview' },
    { id: 'semester', label: 'Semester' },
    { id: 'holiday',  label: 'Holiday' },
  ];

  const displayName = prefs.displayName || user?.displayName?.split(' ')[0] || 'You';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, color: C.text, fontFamily: FONTS[prefs.font] || FONTS.system, fontSize: prefs.fontSize || 14 }}>
      {/* sidebar */}
      <div style={{ width: sidebarOpen ? 220 : 56, flexShrink: 0, background: C.surface, borderRight: `1px solid ${C.border}`, transition: 'width .2s', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 12px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{prefs.avatarEmoji || '🗺️'}</span>
          {sidebarOpen && <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</span>}
          <button onClick={() => setSidebarOpen(o => !o)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: C.muted, fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>{sidebarOpen ? '◂' : '▸'}</button>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {groups.map(g => (
            <div key={g.id}>
              {sidebarOpen && <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: '.08em', textTransform: 'uppercase', padding: '10px 14px 4px' }}>{g.label}</div>}
              {TABS.filter(t => t.group === g.id).map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '9px 14px', background: tab === t.id ? (prefs.accentColor || C.accent) + '18' : 'none', border: 'none', borderLeft: `3px solid ${tab === t.id ? (prefs.accentColor || C.accent) : 'transparent'}`, color: tab === t.id ? (prefs.accentColor || C.accent) : C.text, textAlign: 'left', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{t.label.split(' ')[0]}</span>
                  {sidebarOpen && <span>{t.label.split(' ').slice(1).join(' ')}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        {sidebarOpen && (
          <div style={{ padding: 14, borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, color: C.muted }}>XP</div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: C.amber }}>{state.xp} ⭐</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Streak: {state.streak}🔥</div>
          </div>
        )}
      </div>

      {/* main */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 18 }}>
            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, margin: 0 }}>{TABS.find(t => t.id === tab)?.label}</h1>
          </div>
          {tab === 'dashboard'  && <Dashboard state={state} />}
          {tab === 'xplog'      && <XPLogTab state={state} />}
          {tab === 'achieve'    && <AchievementsTab state={state} />}
          {tab === 'units'      && <UnitsTab state={state} dispatch={dispatch} />}
          {tab === 'timetable'  && <TimetableTab state={state} dispatch={dispatch} />}
          {tab === 'ai'         && <AITab state={state} dispatch={dispatch} />}
          {tab === 'tasks'      && <TasksTab state={state} toggle={toggle} dispatch={dispatch} />}
          {tab === 'calendar'   && <CalendarTab state={state} dispatch={dispatch} />}
          {tab === 'timer'      && <FocusTimer dispatch={dispatch} prefs={prefs} />}
          {tab === 'diary'      && <DiaryTab state={state} dispatch={dispatch} />}
          {tab === 'reminders'  && <RemindersTab state={state} dispatch={dispatch} />}
          {tab === 'resources'  && <ResourcesTab prefs={prefs} />}
          {tab === 'settings'   && <SettingsTab state={state} dispatch={dispatch} />}
        </div>
      </div>
    </div>
  );
}

// ─── Synced App wrapper ───────────────────────────────────────────────────────
export default function App() {
  const { user, authLoading, syncStatus, signIn, signOut, saveToCloud, subscribeToCloud, loadLocal } = useSync();

  useEffect(() => { _saveToCloud = saveToCloud; }, [saveToCloud]);

  // We need dispatch from AppInner — hoist it so the cloud can hydrate
  const [cloudData, setCloudData] = useState(null);
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToCloud((data) => setCloudData(data));
    return unsub;
  }, [user, subscribeToCloud]);

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0d1117', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 32 }}>🗺️</div>
        <div style={{ color: '#7d8590', fontSize: 14 }}>Loading your tracker…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0d1117', flexDirection: 'column', gap: 20, padding: 24 }}>
        <div style={{ fontSize: 56 }}>🗺️</div>
        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 26, color: '#e6edf3', textAlign: 'center' }}>GitAway Tracker</div>
        <div style={{ color: '#7d8590', fontSize: 14, maxWidth: 360, textAlign: 'center', lineHeight: 1.7 }}>
          Track your semester units, holiday roadmap tasks, focus sessions, and internship progress — all in one place. Sign in to sync across all your devices.
        </div>
        <button onClick={signIn} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 32px', background: '#fff', color: '#1a1a1a', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(0,0,0,.4)' }}>
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.5 33.4 30 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c11 0 20-8 20-21 0-1.3-.2-2.7-.5-4z" /><path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.5 19.2 13.5 24 13.5c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.5 6.1 29.5 4 24 4c-7.2 0-13.4 3.9-16.7 9.7z" /><path fill="#FBBC05" d="M24 45c5.3 0 10.2-1.8 14-4.9l-6.5-5.3C29.5 36.5 27 37.5 24 37.5c-5.9 0-10.9-3.9-12.7-9.3l-7 5.4C7.8 41.1 15.3 45 24 45z" /><path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-.8 2.4-2.3 4.4-4.2 5.8l6.5 5.3C42 35.7 45 30.3 45 24c0-1.3-.2-2.7-.5-4z" /></svg>
          Continue with Google
        </button>
        <div style={{ color: '#7d8590', fontSize: 12 }}>Your data is private and only visible to you.</div>
      </div>
    );
  }

  const syncColors = { syncing: '#d29922', synced: '#3fb950', error: '#f85149', offline: '#7d8590' };
  const syncLabels = { syncing: 'Syncing…', synced: 'Synced ✓', error: 'Sync error', offline: 'Local only' };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000, height: 2, background: syncStatus === 'synced' ? '#3fb950' : syncStatus === 'syncing' ? '#d29922' : '#f85149', transition: 'background .4s' }} />
      <div style={{ position: 'fixed', top: 6, right: 12, zIndex: 2001, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(22,27,34,.95)', border: '1px solid #30363d', borderRadius: 20, padding: '4px 10px 4px 6px', fontSize: 12 }}>
        {user.photoURL && <img src={user.photoURL} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} />}
        <span style={{ color: '#7d8590' }}>{user.displayName?.split(' ')[0]}</span>
        <span style={{ color: syncColors[syncStatus], fontSize: 11 }}>· {syncLabels[syncStatus]}</span>
        <button onClick={signOut} style={{ background: 'none', border: 'none', color: '#7d8590', fontSize: 11, cursor: 'pointer', marginLeft: 4 }}>Sign out</button>
      </div>
      <AppInner user={user} />
    </div>
  );
}