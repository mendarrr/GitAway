import React, { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import { TASKS, TRACKS, RESOURCES, ACHIEVEMENTS, XP_RULES, MASTERY_LEVELS, DAYS, TIMES } from './data';
import { useSync } from './useSync';

// ─── storage ───────────────────────────────────────────────────────────────
const KEY = 'roadmap_v3';
const today = () => new Date().toISOString().slice(0, 10);
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
// _saveToCloud is replaced by the useSync hook once App mounts.
// Until then it falls back to localStorage so the app works offline too.
let _saveToCloud = (d) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} };
function save(d) { _saveToCloud(d); }

function initState() {
  const s = load();
  return {
    // holiday
    checked: s.checked || {},
    diary: s.diary || {},
    calNotes: s.calNotes || {},
    reminders: s.reminders || [],
    focusSessions: s.focusSessions || [],
    streak: s.streak || 0,
    lastVisit: s.lastVisit || '',
    xp: s.xp || 0,
    xpLog: s.xpLog || [],
    // semester
    units: s.units || [],          // [{id,code,name,color,topics:[],assignments:[],cats:[],exams:[]}]
    timetable: s.timetable || [],  // [{id,day,time,unitId,type,notes}]
    aiHistory: s.aiHistory || [],  // [{role,content}]
    aiQuestions: s.aiQuestions || 0,
  };
}

// ─── shared ui ─────────────────────────────────────────────────────────────
const C = {
  surface: 'var(--surface)',
  surface2: 'var(--surface2)',
  border: 'var(--border)',
  text: 'var(--text)',
  muted: 'var(--muted)',
  accent: 'var(--accent)',
  green: 'var(--green)',
  amber: 'var(--amber)',
  red: 'var(--red)',
  purple: 'var(--purple)',
};

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
    style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: '8px 10px', fontSize: 13, width: '100%', fontFamily: 'inherit', ...style }} />;
}
function Select({ value, onChange, children, style = {} }) {
  return <select value={value} onChange={e => onChange(e.target.value)}
    style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', ...style }}>{children}</select>;
}
function Modal({ title, onClose, children }) {
  return <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    onClick={e => e.target === e.currentTarget && onClose()}>
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, width: 480, maxHeight: '85vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 20, cursor: 'pointer' }}>✕</button>
      </div>
      {children}
    </div>
  </div>;
}

const trackColor = (id) => TRACKS.find(t => t.id === id)?.color || C.accent;
const UNIT_COLORS = ['#58a6ff','#3fb950','#bc8cff','#d29922','#f85149','#39d353','#ff7b72','#79c0ff'];
const uid = () => Math.random().toString(36).slice(2, 9);

// ─── XP logic (auto) ───────────────────────────────────────────────────────
function awardXP(state, amount, reason) {
  const entry = { amount, reason, date: today() };
  return { ...state, xp: state.xp + amount, xpLog: [entry, ...(state.xpLog || [])].slice(0, 200) };
}

// ─── reducer ───────────────────────────────────────────────────────────────
function reducer(state, action) {
  let next = state;
  switch (action.type) {

    // holiday tasks — XP auto from task
    case 'toggle': {
      const was = !!state.checked[action.id];
      const delta = was ? -action.xp : action.xp;
      next = { ...state, checked: { ...state.checked, [action.id]: !was }, xp: state.xp + delta };
      if (!was) next = { ...next, xpLog: [{ amount: action.xp, reason: `Task: ${action.title}`, date: today() }, ...(next.xpLog || [])].slice(0, 200) };
      break;
    }
    case 'diary': next = awardXP({ ...state, diary: { ...state.diary, [action.date]: action.text } }, XP_RULES.diary_entry, 'Diary entry'); break;
    case 'calNote': next = { ...state, calNotes: { ...state.calNotes, [action.date]: action.text } }; break;
    case 'focusDone':
      next = awardXP({ ...state, focusSessions: [...state.focusSessions, { date: today(), minutes: action.minutes, mode: action.mode }] }, XP_RULES.focus_session, `Focus session – ${action.mode}`);
      break;
    case 'addReminder': next = { ...state, reminders: [...state.reminders, action.reminder] }; break;
    case 'removeReminder': next = { ...state, reminders: state.reminders.filter(r => r.id !== action.id) }; break;

    // ── semester: units ──
    case 'addUnit': next = { ...state, units: [...state.units, action.unit] }; break;
    case 'removeUnit': next = { ...state, units: state.units.filter(u => u.id !== action.id) }; break;
    case 'updateUnit': next = { ...state, units: state.units.map(u => u.id === action.unit.id ? action.unit : u) }; break;

    // ── semester: assignments ──
    case 'addAssignment': {
      const units = state.units.map(u => u.id === action.unitId
        ? { ...u, assignments: [...(u.assignments || []), action.item] } : u);
      next = { ...state, units };
      break;
    }
    case 'updateAssignment': {
      let xpGain = 0; let reason = '';
      const units = state.units.map(u => {
        if (u.id !== action.unitId) return u;
        const assignments = (u.assignments || []).map(a => {
          if (a.id !== action.item.id) return a;
          // auto XP on submission
          if (!a.submitted && action.item.submitted) { xpGain += XP_RULES.assignment_submit; reason = `Submitted: ${a.title}`; }
          // auto XP on grading
          if (!a.grade && action.item.grade) {
            const g = parseFloat(action.item.grade);
            const pct = g / (action.item.outOf || 100) * 100;
            if (pct >= 70) { xpGain += XP_RULES.assignment_grade_A; reason += ` | Grade A (${g})`; }
            else if (pct >= 60) { xpGain += XP_RULES.assignment_grade_B; reason += ` | Grade B`; }
            else { xpGain += XP_RULES.assignment_grade_C; reason += ` | Grade C`; }
          }
          return action.item;
        });
        return { ...u, assignments };
      });
      next = xpGain > 0 ? awardXP({ ...state, units }, xpGain, reason) : { ...state, units };
      break;
    }

    // ── semester: CATs ──
    case 'addCat': {
      const units = state.units.map(u => u.id === action.unitId
        ? { ...u, cats: [...(u.cats || []), action.item] } : u);
      next = { ...state, units };
      break;
    }
    case 'updateCat': {
      let xpGain = 0; let reason = '';
      const units = state.units.map(u => {
        if (u.id !== action.unitId) return u;
        const cats = (u.cats || []).map(c => {
          if (c.id !== action.item.id) return c;
          if (!c.score && action.item.score) {
            const pct = parseFloat(action.item.score) / (action.item.outOf || 30) * 100;
            if (pct >= 70) { xpGain += XP_RULES.cat_distinction; reason = `CAT distinction: ${c.title}`; }
            else if (pct >= 50) { xpGain += XP_RULES.cat_pass; reason = `CAT pass: ${c.title}`; }
          }
          return action.item;
        });
        return { ...u, cats };
      });
      next = xpGain > 0 ? awardXP({ ...state, units }, xpGain, reason) : { ...state, units };
      break;
    }

    // ── semester: exams ──
    case 'addExam': {
      const units = state.units.map(u => u.id === action.unitId
        ? { ...u, exams: [...(u.exams || []), action.item] } : u);
      next = { ...state, units };
      break;
    }
    case 'updateExam': {
      let xpGain = 0; let reason = '';
      const units = state.units.map(u => {
        if (u.id !== action.unitId) return u;
        const exams = (u.exams || []).map(e => {
          if (e.id !== action.item.id) return e;
          if (!e.score && action.item.score) {
            const pct = parseFloat(action.item.score) / (action.item.outOf || 70) * 100;
            if (pct >= 70) { xpGain += XP_RULES.exam_distinction; reason = `Exam distinction: ${e.title}`; }
            else if (pct >= 40) { xpGain += XP_RULES.exam_pass; reason = `Exam pass: ${e.title}`; }
          }
          return action.item;
        });
        return { ...u, exams };
      });
      next = xpGain > 0 ? awardXP({ ...state, units }, xpGain, reason) : { ...state, units };
      break;
    }

    // ── semester: topics (mastery) ──
    case 'setMastery': {
      const units = state.units.map(u => {
        if (u.id !== action.unitId) return u;
        const topics = (u.topics || []).map(t => t.id === action.topicId ? { ...t, mastery: action.level } : t);
        return { ...u, topics };
      });
      // award XP when reaching level 4
      next = action.level === 4 ? awardXP({ ...state, units }, XP_RULES.topic_mastered, `Topic mastered`) : { ...state, units };
      break;
    }
    case 'addTopic': {
      const units = state.units.map(u => u.id === action.unitId
        ? { ...u, topics: [...(u.topics || []), action.topic] } : u);
      next = { ...state, units };
      break;
    }
    case 'removeTopic': {
      const units = state.units.map(u => u.id !== action.unitId ? u
        : { ...u, topics: (u.topics || []).filter(t => t.id !== action.topicId) });
      next = { ...state, units };
      break;
    }

    // ── timetable ──
    case 'addSlot': next = { ...state, timetable: [...state.timetable, action.slot] }; break;
    case 'removeSlot': next = { ...state, timetable: state.timetable.filter(s => s.id !== action.id) }; break;

    // ── AI ──
    case 'aiMessage': next = { ...state, aiHistory: [...state.aiHistory, action.msg].slice(-60), aiQuestions: state.aiQuestions + (action.msg.role === 'user' ? 1 : 0) }; break;
    case 'clearAI': next = { ...state, aiHistory: [] }; break;

    // real-time cloud hydration — only update if cloud state has more progress
    case '_hydrate': {
      const cloud = action.data;
      // prefer whichever has more XP (more progress) to avoid overwriting local work
      if ((cloud.xp || 0) >= (state.xp || 0)) {
        return cloud; // don't call save() — this data came FROM the cloud
      }
      return state;
    }

    default: return state;
  }
  save(next);
  return next;
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function Dashboard({ state }) {
  const doneTasks = Object.values(state.checked).filter(Boolean).length;
  const totalXp = state.xp;
  const sessions = state.focusSessions.length;
  const semUnits = state.units.length;

  // upcoming deadlines (next 14 days)
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + 14);
  const upcoming = [];
  state.units.forEach(u => {
    (u.assignments || []).filter(a => !a.submitted && a.due && new Date(a.due) <= cutoff)
      .forEach(a => upcoming.push({ label: `${u.code}: ${a.title}`, due: a.due, type: 'assignment', color: u.color }));
    (u.cats || []).filter(c => !c.score && c.date && new Date(c.date) <= cutoff)
      .forEach(c => upcoming.push({ label: `${u.code}: ${c.title} (CAT)`, due: c.date, type: 'cat', color: u.color }));
    (u.exams || []).filter(e => !e.score && e.date && new Date(e.date) <= cutoff)
      .forEach(e => upcoming.push({ label: `${u.code}: ${e.title} (Exam)`, due: e.date, type: 'exam', color: u.color }));
  });
  upcoming.sort((a, b) => a.due.localeCompare(b.due));

  const recentXP = (state.xpLog || []).slice(0, 5);

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { label: 'Total XP', value: totalXp, color: C.amber },
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
              <div style={{ width: 3, height: 32, borderRadius: 2, background: u.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>{u.label}</div>
                <div style={{ fontSize: 11, color: daysLeft <= 3 ? C.red : C.muted }}>{daysLeft <= 0 ? 'Overdue!' : `${daysLeft}d left`} · {u.due}</div>
              </div>
              <Badge label={u.type} color={u.type === 'exam' ? C.red : u.type === 'cat' ? C.amber : C.accent} />
            </div>;
          })}
        </Card>

        <Card>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>⭐ Recent XP earned</div>
          {recentXP.length === 0 && <div style={{ color: C.muted, fontSize: 13 }}>Complete tasks, diary entries or focus sessions to earn XP.</div>}
          {recentXP.map((e, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
              <span style={{ color: C.muted }}>{e.reason?.slice(0, 45)}</span>
              <span style={{ color: C.amber, fontWeight: 600 }}>+{e.amount}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* holiday progress */}
      <Card>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>🗺️ GitAway Roadmap progress</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {TRACKS.map(tr => {
            const all = TASKS.filter(t => t.track === tr.id);
            const done = all.filter(t => state.checked[t.id]).length;
            return <div key={tr.id}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{tr.emoji} {tr.label}</div>
              <ProgressBar value={done} max={all.length} color={tr.color} />
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{done}/{all.length}</div>
            </div>;
          })}
        </div>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SEMESTER UNITS (overview)
// ══════════════════════════════════════════════════════════════════════════════
function UnitsTab({ state, dispatch }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', color: UNIT_COLORS[0], semester: 'Semester 1' });
  const [openUnit, setOpenUnit] = useState(null);

  const addUnit = () => {
    if (!form.code || !form.name) return;
    dispatch({ type: 'addUnit', unit: { id: uid(), ...form, topics: [], assignments: [], cats: [], exams: [] } });
    setForm({ code: '', name: '', color: UNIT_COLORS[0], semester: 'Semester 1' });
    setShowAdd(false);
  };

  if (openUnit) {
    const unit = state.units.find(u => u.id === openUnit);
    if (!unit) { setOpenUnit(null); return null; }
    return <UnitDetail unit={unit} dispatch={dispatch} onBack={() => setOpenUnit(null)} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ color: C.muted, fontSize: 13 }}>{state.units.length} units</span>
        <Btn onClick={() => setShowAdd(true)}>+ Add unit</Btn>
      </div>

      {state.units.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎓</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No units yet</div>
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Add your semester units to track assignments, CATs and exams.</div>
          <Btn onClick={() => setShowAdd(true)}>+ Add your first unit</Btn>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
        {state.units.map(unit => {
          const assignments = unit.assignments || [];
          const cats = unit.cats || [];
          const exams = unit.exams || [];
          const topics = unit.topics || [];
          const mastered = topics.filter(t => t.mastery === 4).length;
          const pending = assignments.filter(a => !a.submitted).length + cats.filter(c => !c.score).length;
          return (
            <Card key={unit.id} style={{ cursor: 'pointer', borderLeft: `3px solid ${unit.color}` }}
              onClick={() => setOpenUnit(unit.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, color: unit.color }}>{unit.code}</div>
                  <div style={{ fontSize: 13, marginTop: 2 }}>{unit.name}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{unit.semester}</div>
                </div>
                {pending > 0 && <Badge label={`${pending} pending`} color={C.red} />}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 10 }}>
                {[
                  { label: 'Assignments', val: assignments.length, done: assignments.filter(a => a.submitted).length },
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

      {showAdd && (
        <Modal title="Add Unit" onClose={() => setShowAdd(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input value={form.code} onChange={v => setForm(f => ({ ...f, code: v }))} placeholder="Unit code e.g. DSA 201" />
            <Input value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Unit name e.g. Data Structures & Algorithms" />
            <Select value={form.semester} onChange={v => setForm(f => ({ ...f, semester: v }))}>
              {['Semester 1','Semester 2','Year 3','Year 4'].map(s => <option key={s}>{s}</option>)}
            </Select>
            <div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Colour</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {UNIT_COLORS.map(c => (
                  <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    style={{ width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer',
                      border: form.color === c ? '3px solid white' : '2px solid transparent' }} />
                ))}
              </div>
            </div>
            <Btn onClick={addUnit}>Add Unit</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// UNIT DETAIL (assignments, cats, exams, mastery)
// ══════════════════════════════════════════════════════════════════════════════
function UnitDetail({ unit, dispatch, onBack }) {
  const [tab, setTab] = useState('assignments');
  const [modal, setModal] = useState(null); // 'assignment'|'cat'|'exam'|'topic'
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const [topicInput, setTopicInput] = useState('');

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
    dispatch({ type: 'addTopic', unitId: unit.id, topic: { id: uid(), name: topicInput.trim(), mastery: 0, notes: '' } });
    setTopicInput('');
  };

  const assignments = unit.assignments || [];
  const cats = unit.cats || [];
  const exams = unit.exams || [];
  const topics = unit.topics || [];

  const tabStyle = (t) => ({
    padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'none',
    color: tab === t ? unit.color : C.muted, borderBottom: `2px solid ${tab === t ? unit.color : 'transparent'}`,
    fontFamily: 'inherit',
  });

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontSize: 13, marginBottom: 14, fontFamily: 'inherit' }}>← Back to units</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{ width: 6, height: 40, borderRadius: 3, background: unit.color }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, color: unit.color }}>{unit.code}</div>
          <div style={{ fontSize: 13, color: C.muted }}>{unit.name} · {unit.semester}</div>
        </div>
        <button onClick={() => dispatch({ type: 'removeUnit', id: unit.id })}
          style={{ marginLeft: 'auto', background: 'none', border: `1px solid ${C.red}44`, color: C.red, borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}>Remove unit</button>
      </div>

      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 18 }}>
        {[['assignments','📋 Assignments'],['cats','📝 CATs'],['exams','📚 Exams'],['mastery','🧠 Mastery']].map(([t, l]) => (
          <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>

      {/* ASSIGNMENTS */}
      {tab === 'assignments' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <Btn onClick={() => openAdd('assignment')}>+ Add assignment</Btn>
          </div>
          {assignments.length === 0 && <div style={{ color: C.muted, fontSize: 13 }}>No assignments yet.</div>}
          {assignments.map(a => {
            const pct = a.grade ? Math.round(parseFloat(a.grade) / (a.outOf || 100) * 100) : null;
            return (
              <Card key={a.id} style={{ marginBottom: 10, borderLeft: `3px solid ${a.submitted ? C.green : C.amber}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{a.title}</div>
                    {a.due && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Due: {a.due}</div>}
                    {a.notes && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{a.notes}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {pct !== null && <Badge label={`${pct}%`} color={pct >= 70 ? C.green : pct >= 50 ? C.amber : C.red} />}
                    <Badge label={a.submitted ? '✓ Submitted' : 'Pending'} color={a.submitted ? C.green : C.amber} />
                    <button onClick={() => openEdit('assignment', a)} style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontSize: 12 }}>Edit</button>
                  </div>
                </div>
                {a.grade && <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>Score: {a.grade}/{a.outOf}</div>}
              </Card>
            );
          })}
        </div>
      )}

      {/* CATS */}
      {tab === 'cats' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <Btn onClick={() => openAdd('cat')}>+ Add CAT</Btn>
          </div>
          {cats.length === 0 && <div style={{ color: C.muted, fontSize: 13 }}>No CATs added yet.</div>}
          {cats.map(c => {
            const pct = c.score ? Math.round(parseFloat(c.score) / (c.outOf || 30) * 100) : null;
            return (
              <Card key={c.id} style={{ marginBottom: 10, borderLeft: `3px solid ${pct !== null ? (pct >= 70 ? C.green : pct >= 50 ? C.amber : C.red) : C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.title}</div>
                    {c.date && <div style={{ fontSize: 12, color: C.muted }}>Date: {c.date}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {pct !== null ? <Badge label={`${c.score}/${c.outOf} (${pct}%)`} color={pct >= 70 ? C.green : pct >= 50 ? C.amber : C.red} /> : <Badge label="Not graded" color={C.muted} />}
                    <button onClick={() => openEdit('cat', c)} style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontSize: 12 }}>Edit</button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* EXAMS */}
      {tab === 'exams' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <Btn onClick={() => openAdd('exam')}>+ Add exam</Btn>
          </div>
          {exams.length === 0 && <div style={{ color: C.muted, fontSize: 13 }}>No exams added yet.</div>}
          {exams.map(e => {
            const pct = e.score ? Math.round(parseFloat(e.score) / (e.outOf || 70) * 100) : null;
            return (
              <Card key={e.id} style={{ marginBottom: 10, borderLeft: `3px solid ${C.red}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{e.title}</div>
                    {e.date && <div style={{ fontSize: 12, color: C.muted }}>Date: {e.date}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {pct !== null ? <Badge label={`${e.score}/${e.outOf} (${pct}%)`} color={pct >= 70 ? C.green : pct >= 40 ? C.amber : C.red} /> : <Badge label="Upcoming" color={C.muted} />}
                    <button onClick={() => openEdit('exam', e)} style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontSize: 12 }}>Edit</button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* MASTERY */}
      {tab === 'mastery' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <Input value={topicInput} onChange={setTopicInput} placeholder="Add topic e.g. Hypothesis testing" style={{ flex: 1, maxWidth: 320 }} />
            <Btn onClick={addTopic}>+ Add topic</Btn>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {MASTERY_LEVELS.map(m => (
              <span key={m.level} style={{ fontSize: 12, color: m.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 14 }}>{m.icon}</span>{m.label}
              </span>
            ))}
          </div>
          {topics.length === 0 && <div style={{ color: C.muted, fontSize: 13 }}>Add course topics to track your mastery level.</div>}
          {topics.map(topic => {
            const ml = MASTERY_LEVELS[topic.mastery || 0];
            return (
              <div key={topic.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 18, color: ml.color }}>{ml.icon}</span>
                <span style={{ flex: 1, fontSize: 14 }}>{topic.name}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {MASTERY_LEVELS.map(m => (
                    <button key={m.level} onClick={() => dispatch({ type: 'setMastery', unitId: unit.id, topicId: topic.id, level: m.level })}
                      style={{ width: 26, height: 26, borderRadius: '50%', border: `2px solid ${m.color}`, background: (topic.mastery || 0) >= m.level ? m.color : 'transparent', cursor: 'pointer', fontSize: 10 }} />
                  ))}
                </div>
                <button onClick={() => dispatch({ type: 'removeTopic', unitId: unit.id, topicId: topic.id })}
                  style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 14 }}>✕</button>
              </div>
            );
          })}
          {topics.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Overall mastery</div>
              <ProgressBar value={topics.reduce((s, t) => s + (t.mastery || 0), 0)} max={topics.length * 4} color={unit.color} height={10} />
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                {topics.filter(t => t.mastery === 4).length}/{topics.length} topics mastered
                {topics.filter(t => t.mastery === 4).length > 0 && <span style={{ color: C.amber }}> · +{topics.filter(t => t.mastery === 4).length * 25} XP earned</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* modals */}
      {modal === 'assignment' && (
        <Modal title={editItem ? 'Edit Assignment' : 'Add Assignment'} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Input value={form.title || ''} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="Title e.g. Project proposal" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Due date</div><Input type="date" value={form.due || ''} onChange={v => setForm(f => ({ ...f, due: v }))} /></div>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Out of</div><Input type="number" value={form.outOf || 100} onChange={v => setForm(f => ({ ...f, outOf: v }))} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Score (if graded)</div><Input type="number" value={form.grade || ''} onChange={v => setForm(f => ({ ...f, grade: v }))} placeholder="Leave blank if not yet" /></div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!form.submitted} onChange={e => setForm(f => ({ ...f, submitted: e.target.checked }))} />
                  Submitted
                </label>
              </div>
            </div>
            <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes..."
              style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: 10, fontSize: 13, resize: 'vertical', minHeight: 60, fontFamily: 'inherit' }} />
            <div style={{ fontSize: 11, color: C.amber }}>⭐ XP is awarded automatically on submission and grading</div>
            <Btn onClick={saveAssignment}>{editItem ? 'Save changes' : 'Add Assignment'}</Btn>
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
            <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Score (when you get it back)</div>
              <Input type="number" value={form.score || ''} onChange={v => setForm(f => ({ ...f, score: v }))} placeholder="Leave blank until graded" /></div>
            <div style={{ fontSize: 11, color: C.amber }}>⭐ XP awarded automatically when score is entered (pass: +40, distinction: +70)</div>
            <Btn onClick={saveCat}>{editItem ? 'Save changes' : 'Add CAT'}</Btn>
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
            <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Score (after results)</div>
              <Input type="number" value={form.score || ''} onChange={v => setForm(f => ({ ...f, score: v }))} placeholder="Leave blank until results" /></div>
            <div style={{ fontSize: 11, color: C.amber }}>⭐ XP awarded automatically (pass: +80, distinction: +120)</div>
            <Btn onClick={saveExam}>{editItem ? 'Save changes' : 'Add Exam'}</Btn>
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
  const [form, setForm] = useState({ day: 'Mon', time: '8:00', unitId: '', type: 'Lecture', duration: 1, notes: '', room: '' });
  const [showOneNote, setShowOneNote] = useState(false);

  const addSlot = () => {
    dispatch({ type: 'addSlot', slot: { id: uid(), ...form } });
    setShowAdd(false);
  };

  const slotsByDay = DAYS.map(day => ({
    day, slots: state.timetable.filter(s => s.day === day).sort((a, b) => a.time.localeCompare(b.time))
  }));

  const getUnit = (id) => state.units.find(u => u.id === id);

  // generate onenote text
  const oneNoteText = slotsByDay.map(({ day, slots }) => {
    if (!slots.length) return '';
    return `${day}:\n` + slots.map(s => {
      const u = getUnit(s.unitId);
      return `  ${s.time} – ${u ? u.code : 'Unknown'} (${s.type})${s.room ? ' @ ' + s.room : ''}${s.notes ? ' | ' + s.notes : ''}`;
    }).join('\n');
  }).filter(Boolean).join('\n\n');

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ color: C.muted, fontSize: 13 }}>{state.timetable.length} slots</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Btn outline onClick={() => setShowOneNote(o => !o)}>📋 Export for OneNote</Btn>
          {state.units.length > 0 && <Btn onClick={() => setShowAdd(true)}>+ Add slot</Btn>}
        </div>
      </div>

      {state.units.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ color: C.muted, fontSize: 13 }}>Add your units first, then build your timetable.</div>
        </Card>
      )}

      {showOneNote && (
        <Card style={{ marginBottom: 16, background: '#0d1117' }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>📋 Copy this into your OneNote timetable page</div>
          <pre style={{ fontSize: 12, color: C.muted, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{oneNoteText || 'No slots yet'}</pre>
        </Card>
      )}

      {/* grid */}
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
                        <div key={slot.id} style={{ background: u?.color + '33', border: `1px solid ${u?.color || C.border}`, borderRadius: 4, padding: '3px 6px', fontSize: 11, marginBottom: 2, cursor: 'pointer' }}
                          onClick={() => dispatch({ type: 'removeSlot', id: slot.id })} title="Click to remove">
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
        <Modal title="Add Timetable Slot" onClose={() => setShowAdd(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Day</div>
                <Select value={form.day} onChange={v => setForm(f => ({ ...f, day: v }))}>{DAYS.map(d => <option key={d}>{d}</option>)}</Select></div>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Time</div>
                <Select value={form.time} onChange={v => setForm(f => ({ ...f, time: v }))}>{TIMES.map(t => <option key={t}>{t}</option>)}</Select></div>
            </div>
            <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Unit</div>
              <Select value={form.unitId} onChange={v => setForm(f => ({ ...f, unitId: v }))}>
                <option value="">Select unit</option>
                {state.units.map(u => <option key={u.id} value={u.id}>{u.code} – {u.name}</option>)}
              </Select></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Type</div>
                <Select value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))}>
                  {['Lecture','Tutorial','Lab','Study','CAT','Exam'].map(t => <option key={t}>{t}</option>)}
                </Select></div>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Room / venue</div>
                <Input value={form.room} onChange={v => setForm(f => ({ ...f, room: v }))} placeholder="e.g. LH1" /></div>
            </div>
            <Input value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Notes (optional)" />
            <Btn onClick={addSlot} disabled={!form.unitId}>Add Slot</Btn>
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

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [state.aiHistory, loading]);

  const unitsSummary = state.units.map(u => {
    const pending = (u.assignments || []).filter(a => !a.submitted).length;
    const cats = (u.cats || []).length;
    const mastered = (u.topics || []).filter(t => t.mastery === 4).length;
    return `${u.code} (${u.name}): ${pending} pending assignments, ${cats} CATs, ${mastered}/${(u.topics||[]).length} topics mastered`;
  }).join('\n');

  const systemPrompt = `You are a friendly, knowledgeable academic assistant for a Data Science & Analytics student at JKUAT (Jomo Kenyatta University of Agriculture and Technology) in Kenya, currently in Year 3.

The student is also doing self-study during holidays covering: Python/Pandas, Power BI, SQL, React, data visualization, and preparing for internships.

Their current semester units:
${unitsSummary || 'No units added yet.'}

Their XP: ${state.xp} | Streak: ${state.streak} days | Tasks done: ${Object.values(state.checked).filter(Boolean).length}/45

You can help with:
- Explaining Data Science, Statistics, Programming, and Math concepts
- Assignment guidance (explain concepts, not write answers directly)
- CAT/exam revision strategies and practice questions
- Study planning and time management
- Internship advice relevant to Kenya tech market
- General academic support

Keep responses concise but thorough. Use examples when helpful. Encourage the student.`;

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    dispatch({ type: 'aiMessage', msg: userMsg });
    setInput('');
    setLoading(true);

    const messages = [...state.aiHistory, userMsg].map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: systemPrompt,
          messages,
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || 'Sorry, I could not get a response.';
      dispatch({ type: 'aiMessage', msg: { role: 'assistant', content: reply } });
    } catch {
      dispatch({ type: 'aiMessage', msg: { role: 'assistant', content: 'Network error — make sure you are connected and try again.' } });
    }
    setLoading(false);
  };

  const suggestions = [
    'Explain hypothesis testing with an example',
    'What SQL joins should I know for interviews?',
    'Help me revise for a Data Structures CAT',
    'Give me 5 practice questions on Python pandas',
    'How do I build a strong internship CV in Kenya?',
    'Explain the difference between supervised and unsupervised learning',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)', maxHeight: 700 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: C.muted }}>🤖 Powered by Claude · {state.aiQuestions || 0} questions asked</div>
        <Btn outline onClick={() => dispatch({ type: 'clearAI' })} style={{ fontSize: 12, padding: '4px 10px' }}>Clear chat</Btn>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 12 }}>
        {state.aiHistory.length === 0 && (
          <div>
            <Card style={{ textAlign: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🤖</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Your Study Assistant</div>
              <div style={{ color: C.muted, fontSize: 13 }}>Ask me anything about your units, assignments, or study strategies. I know your current units and progress.</div>
            </Card>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {suggestions.map(s => (
                <button key={s} onClick={() => setInput(s)} style={{
                  background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8,
                  padding: '10px 12px', fontSize: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', lineHeight: 1.4
                }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {state.aiHistory.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%', padding: '10px 14px', borderRadius: 10, fontSize: 13, lineHeight: 1.7,
              background: msg.role === 'user' ? C.accent : C.surface,
              color: msg.role === 'user' ? '#000' : C.text,
              border: msg.role === 'assistant' ? `1px solid ${C.border}` : 'none',
              whiteSpace: 'pre-wrap',
            }}>{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: C.muted }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
        <textarea value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask anything… (Enter to send, Shift+Enter for new line)"
          style={{ flex: 1, background: C.surface2, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: '10px 12px', fontSize: 13, resize: 'none', minHeight: 50, maxHeight: 120, fontFamily: 'inherit' }} />
        <Btn onClick={send} disabled={loading || !input.trim()} style={{ alignSelf: 'flex-end', padding: '10px 20px' }}>Send</Btn>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// EXISTING TABS (holiday tasks, calendar, timer, diary, reminders, resources, achievements)
// ══════════════════════════════════════════════════════════════════════════════
function TasksTab({ state, toggle }) {
  const [filterWeek, setFilterWeek] = useState('all');
  const [filterTrack, setFilterTrack] = useState('all');
  const filtered = TASKS.filter(t => (filterWeek === 'all' || t.week === +filterWeek) && (filterTrack === 'all' || t.track === filterTrack));
  const sel = { background: C.surface2, color: C.text, border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 13 };
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <select style={sel} value={filterWeek} onChange={e => setFilterWeek(e.target.value)}>
          <option value="all">All Weeks</option>
          {[1,2,3,4,5,6,7,8].map(w => <option key={w} value={w}>Week {w}</option>)}
        </select>
        <select style={sel} value={filterTrack} onChange={e => setFilterTrack(e.target.value)}>
          <option value="all">All Tracks</option>
          {TRACKS.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', color: C.muted, fontSize: 13, alignSelf: 'center' }}>{filtered.filter(t => state.checked[t.id]).length}/{filtered.length} done</span>
      </div>
      {[1,2,3,4,5,6,7,8].map(w => {
        const wTasks = filtered.filter(t => t.week === w);
        if (!wTasks.length) return null;
        const wDone = wTasks.filter(t => state.checked[t.id]).length;
        return (
          <div key={w} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{ fontWeight: 700, color: C.accent, fontFamily: 'Space Grotesk' }}>Week {w}</span>
              <div style={{ flex: 1 }}><ProgressBar value={wDone} max={wTasks.length} /></div>
              <span style={{ fontSize: 12, color: C.muted }}>{wDone}/{wTasks.length}</span>
            </div>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {wTasks.map((t, i) => {
                const tr = TRACKS.find(x => x.id === t.track);
                const done = !!state.checked[t.id];
                return (
                  <div key={t.id} onClick={() => toggle(t.id, t.xp, t.title)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    borderBottom: i < wTasks.length - 1 ? `1px solid ${C.border}` : 'none',
                    cursor: 'pointer', background: done ? 'rgba(63,185,80,0.05)' : 'transparent',
                  }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${done ? C.green : C.border}`, background: done ? C.green : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {done && <span style={{ color: '#000', fontSize: 13, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ flex: 1, fontSize: 14, textDecoration: done ? 'line-through' : 'none', color: done ? C.muted : C.text }}>{t.title}</span>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <Badge label={tr?.emoji + ' ' + tr?.label} color={tr?.color} />
                      <Badge label={`+${t.xp}xp`} color={C.amber} />
                      {t.link && <a href={t.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: C.accent, fontSize: 13 }}>↗</a>}
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        );
      })}
    </div>
  );
}

const MODES = [
  { id: 'work', label: '🍅 Focus', mins: 90 },
  { id: 'short', label: '☕ Short Break', mins: 25 },
  { id: 'long', label: '🌿 Long Break', mins: 50 },
  { id: 'deep', label: '🧠 Deep Work', mins: 180 },
];
function FocusTimer({ dispatch }) {
  const [modeIdx, setModeIdx] = useState(0);
  const [secs, setSecs] = useState(MODES[0].mins * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  const mode = MODES[modeIdx];
  useEffect(() => { setSecs(mode.mins * 60); setRunning(false); clearInterval(intervalRef.current); }, [modeIdx]);
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecs(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current); setRunning(false);
            dispatch({ type: 'focusDone', minutes: mode.mins, mode: mode.label });
            if ('Notification' in window && Notification.permission === 'granted')
              new Notification('🍅 Session Complete!', { body: `${mode.label} done. +10 XP earned!` });
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [running]);
  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const r = 80; const circ = 2 * Math.PI * r;
  const dash = circ - (((mode.mins * 60 - secs) / (mode.mins * 60)) * circ);
  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <Card style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
          {MODES.map((m, i) => <button key={m.id} onClick={() => setModeIdx(i)} style={{ background: i === modeIdx ? C.accent : C.surface2, color: i === modeIdx ? '#000' : C.text, border: `1px solid ${C.border}`, borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{m.label}</button>)}
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
        <div style={{ marginTop: 14, fontSize: 12, color: C.amber }}>⭐ Each completed session earns +10 XP automatically</div>
        <button onClick={() => 'Notification' in window && Notification.requestPermission()} style={{ marginTop: 10, background: 'transparent', color: C.muted, border: 'none', fontSize: 12, textDecoration: 'underline', cursor: 'pointer' }}>Enable notifications</button>
      </Card>
    </div>
  );
}

function CalendarTab({ state, dispatch }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [selected, setSelected] = useState(today());
  const [noteText, setNoteText] = useState('');
  const firstDay = new Date(month.y, month.m, 1).getDay();
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayKey = d => `${month.y}-${String(month.m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={() => setMonth(p => { const d = new Date(p.y, p.m-1); return {y:d.getFullYear(),m:d.getMonth()}; })} style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: '4px 10px', fontSize: 16, cursor: 'pointer' }}>‹</button>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18 }}>{MONTHS[month.m]} {month.y}</span>
          <button onClick={() => setMonth(p => { const d = new Date(p.y, p.m+1); return {y:d.getFullYear(),m:d.getMonth()}; })} style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: '4px 10px', fontSize: 16, cursor: 'pointer' }}>›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 8 }}>
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: 12, color: C.muted, fontWeight: 600 }}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {Array(firstDay).fill(null).map((_,i) => <div key={`e${i}`} />)}
          {Array(daysInMonth).fill(null).map((_,i) => {
            const d = i+1; const key = dayKey(d); const isToday = key === today(); const isSel = key === selected;
            const hasFocus = state.focusSessions.some(s => s.date === key);
            const hasNote = !!state.calNotes[key];
            const hasDeadline = state.units.some(u => [...(u.assignments||[]),...(u.cats||[]),...(u.exams||[])].some(item => (item.due || item.date) === key));
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
          {state.focusSessions.filter(s => s.date === selected).map((s,i) => <div key={i} style={{ fontSize: 13, color: C.purple, marginBottom: 4 }}>⏱ {s.minutes}min – {s.mode}</div>)}
          {state.units.map(u => {
            const items = [...(u.assignments||[]).filter(a=>(a.due||'')===selected), ...(u.cats||[]).filter(c=>(c.date||'')===selected), ...(u.exams||[]).filter(e=>(e.date||'')===selected)];
            return items.map(item => <div key={item.id} style={{ fontSize: 12, color: C.red, marginBottom: 2 }}>📌 {u.code}: {item.title}</div>);
          })}
          {state.calNotes[selected] && <div style={{ fontSize: 13, color: C.muted, marginTop: 6, whiteSpace: 'pre-wrap' }}>{state.calNotes[selected]}</div>}
        </Card>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Add note</div>
          <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="What happened today?" style={{ width: '100%', background: C.surface2, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: 10, fontSize: 13, resize: 'vertical', minHeight: 70, fontFamily: 'inherit' }} />
          <Btn onClick={() => { dispatch({ type: 'calNote', date: selected, text: noteText }); setNoteText(''); }} style={{ marginTop: 8, width: '100%' }}>Save</Btn>
        </Card>
      </div>
    </div>
  );
}

function DiaryTab({ state, dispatch }) {
  const [text, setText] = useState('');
  const entries = Object.entries(state.diary).sort((a,b) => b[0].localeCompare(a[0]));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
      <div>
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>📝 Today's reflection – {today()}</div>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="What did you learn? What challenged you? What are you proud of?"
            style={{ width: '100%', background: C.surface2, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: 12, fontSize: 14, resize: 'vertical', minHeight: 100, fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <span style={{ fontSize: 12, color: C.amber }}>⭐ +5 XP for each entry</span>
            <Btn onClick={() => { if (text.trim()) { dispatch({ type: 'diary', date: today(), text: text.trim() }); setText(''); } }}>Save Entry</Btn>
          </div>
        </Card>
        {entries.map(([date, text]) => (
          <Card key={date} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{date}</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{text}</p>
          </Card>
        ))}
      </div>
      <Card>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>💡 OneNote link</div>
        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, margin: 0 }}>Write quick reflections here, then expand in OneNote with mind maps, code snippets, and diagrams.<br /><br />Use the timetable export to paste your schedule into OneNote's timetable page.</p>
      </Card>
    </div>
  );
}

function RemindersTab({ state, dispatch }) {
  const [form, setForm] = useState({ title: '', date: '', time: '', type: 'study' });
  const sorted = [...state.reminders].sort((a,b) => a.date.localeCompare(b.date));
  const now = new Date();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <Card>
        <div style={{ fontWeight: 600, marginBottom: 14 }}>➕ Add Reminder</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Input value={form.title} onChange={v => setForm(f => ({...f, title: v}))} placeholder="What to remember..." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Input type="date" value={form.date} onChange={v => setForm(f => ({...f, date: v}))} />
            <Input type="time" value={form.time} onChange={v => setForm(f => ({...f, time: v}))} />
          </div>
          <Select value={form.type} onChange={v => setForm(f => ({...f, type: v}))}>
            {['study','assignment','cat','exam','apply','review','other'].map(t => <option key={t}>{t}</option>)}
          </Select>
          <Btn onClick={() => { if (!form.title || !form.date) return; dispatch({ type: 'addReminder', reminder: {...form, id: Date.now()} }); setForm({title:'',date:'',time:'',type:'study'}); }}>Set Reminder</Btn>
        </div>
      </Card>
      <Card>
        <div style={{ fontWeight: 600, marginBottom: 14 }}>🔔 All Reminders</div>
        {sorted.length === 0 && <p style={{ color: C.muted, fontSize: 13 }}>No reminders yet.</p>}
        {sorted.map(r => {
          const dt = new Date(`${r.date}T${r.time||'23:59'}`); const overdue = dt < now;
          return <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: `1px solid ${C.border}`, opacity: overdue ? 0.6 : 1 }}>
            <span style={{ fontSize: 18 }}>{r.type==='exam'?'📚':r.type==='cat'?'📝':r.type==='assignment'?'📋':r.type==='study'?'📖':'📌'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{r.title}</div>
              <div style={{ fontSize: 11, color: overdue ? C.red : C.muted }}>{overdue?'⚠ Overdue – ':''}{r.date}{r.time?' at '+r.time:''}</div>
            </div>
            <button onClick={() => dispatch({ type: 'removeReminder', id: r.id })} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 16, cursor: 'pointer' }}>✕</button>
          </div>;
        })}
      </Card>
    </div>
  );
}

function ResourcesTab() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
      {RESOURCES.map(cat => (
        <Card key={cat.category}>
          <div style={{ fontWeight: 700, marginBottom: 12, color: C.accent }}>{cat.category}</div>
          {cat.items.map(item => (
            <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', color: C.text, textDecoration: 'none', fontSize: 13, padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>↗ {item.name}</a>
          ))}
        </Card>
      ))}
    </div>
  );
}

function AchievementsTab({ state }) {
  const doneTasks = Object.values(state.checked).filter(Boolean).length;
  const dataDone = TASKS.filter(t => t.track==='data' && state.checked[t.id]).length;
  const webDone = TASKS.filter(t => t.track==='web' && state.checked[t.id]).length;
  const softDone = TASKS.filter(t => t.track==='soft' && state.checked[t.id]).length;
  const internDone = TASKS.filter(t => t.track==='intern' && state.checked[t.id]).length;
  const week1Done = TASKS.filter(t=>t.week===1).every(t=>state.checked[t.id]);
  const capstone = !!state.checked['t31'];
  const allCats = state.units.flatMap(u => u.cats || []);
  const catsPassed = allCats.filter(c => c.score && parseFloat(c.score)/(c.outOf||30)*100 >= 60).length;
  const allScores = [...state.units.flatMap(u=>(u.assignments||[]).map(a=>a.grade?parseFloat(a.grade)/(a.outOf||100)*100:0)), ...allCats.map(c=>c.score?parseFloat(c.score)/(c.outOf||30)*100:0)];
  const topScore = allScores.some(s => s >= 80);
  const d = { done: doneTasks, xp: state.xp, dataDone, webDone, softDone, internDone, week1Done, capstone, streak: state.streak, units: state.units.length, catsPassed, topScore, totalSessions: state.focusSessions.length, aiQuestions: state.aiQuestions || 0 };
  const unlocked = ACHIEVEMENTS.filter(a => a.condition(d)).length;
  return (
    <div>
      <div style={{ marginBottom: 16, color: C.muted, fontSize: 13 }}>{unlocked}/{ACHIEVEMENTS.length} achievements unlocked</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
        {ACHIEVEMENTS.map(a => {
          const ok = a.condition(d);
          return <Card key={a.id} style={{ textAlign: 'center', opacity: ok ? 1 : 0.4 }}>
            <div style={{ fontSize: 34, marginBottom: 6 }}>{a.icon}</div>
            <div style={{ fontWeight: 700, marginBottom: 4, color: ok ? C.text : C.muted }}>{a.title}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{a.desc}</div>
            {ok && <div style={{ marginTop: 8 }}><Badge label="Unlocked ✓" color={C.green} /></div>}
          </Card>;
        })}
      </div>
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
        <div style={{ fontWeight: 600, marginBottom: 14 }}>📜 XP History (last 200 events)</div>
        {log.length === 0 && <div style={{ color: C.muted, fontSize: 13 }}>No XP earned yet — complete tasks, focus sessions, or diary entries.</div>}
        {log.map((e, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
            <div>
              <span>{e.reason}</span>
              <span style={{ fontSize: 11, color: C.muted, marginLeft: 10 }}>{e.date}</span>
            </div>
            <span style={{ color: C.amber, fontWeight: 600, flexShrink: 0 }}>+{e.amount} XP</span>
          </div>
        ))}
      </Card>
      <div>
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>⭐ Total XP: {state.xp}</div>
          {Object.entries(byCategory).sort((a,b)=>b[1]-a[1]).map(([cat, xp]) => (
            <div key={cat} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>{cat}</span><span style={{ color: C.amber }}>{xp} XP</span>
              </div>
              <ProgressBar value={xp} max={state.xp} color={C.amber} />
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>📖 XP Rules</div>
          {[
            ['Holiday task', 'varies'],
            ['Focus session', '+10'],
            ['Diary entry', '+5'],
            ['Assignment submit', '+30'],
            ['Assignment grade A (70%+)', '+50'],
            ['Assignment grade B (60–69%)', '+35'],
            ['Assignment grade C (<60%)', '+20'],
            ['CAT pass (50%+)', '+40'],
            ['CAT distinction (70%+)', '+70'],
            ['Exam pass (40%+)', '+80'],
            ['Exam distinction (70%+)', '+120'],
            ['Topic mastered', '+25'],
          ].map(([label, val]) => (
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
  { id: 'dashboard',  label: '🏠 Dashboard',      group: 'general' },
  { id: 'xplog',      label: '⭐ XP & Progress',   group: 'general' },
  { id: 'units',      label: '🎓 Semester Units',   group: 'semester' },
  { id: 'timetable',  label: '🗓️ Timetable',        group: 'semester' },
  { id: 'ai',         label: '🤖 AI Assistant',     group: 'semester' },
  { id: 'tasks',      label: '✅ Holiday Tasks',    group: 'holiday' },
  { id: 'calendar',   label: '📅 Calendar',         group: 'holiday' },
  { id: 'timer',      label: '⏱ Focus Timer',       group: 'holiday' },
  { id: 'diary',      label: '📝 Diary',            group: 'holiday' },
  { id: 'reminders',  label: '🔔 Reminders',        group: 'holiday' },
  { id: 'resources',  label: '📚 Resources',        group: 'holiday' },
  { id: 'achieve',    label: '🏆 Achievements',     group: 'general' },
];

function AppInner() {
  const [tab, setTab] = useState('dashboard');
  const [state, dispatch] = useReducer(reducer, null, initState);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const t = today();
    if (state.lastVisit !== t) {
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const yKey = yesterday.toISOString().slice(0,10);
      const newStreak = state.lastVisit === yKey ? state.streak + 1 : 1;
      const next = { ...state, lastVisit: t, streak: newStreak };
      save(next);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      state.reminders.forEach(r => {
        const dt = new Date(`${r.date}T${r.time||'09:00'}`);
        if (Math.abs(now - dt) / 1000 < 35 && 'Notification' in window && Notification.permission === 'granted')
          new Notification('⏰ ' + r.title, { body: r.type });
      });
    }, 30000);
    return () => clearInterval(id);
  }, [state.reminders]);

  const toggle = useCallback((id, xp, title) => dispatch({ type: 'toggle', id, xp, title }), []);

  const groups = [
    { id: 'general', label: 'Overview' },
    { id: 'semester', label: 'Semester' },
    { id: 'holiday', label: 'Holiday' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* sidebar */}
      <div style={{ width: sidebarOpen ? 220 : 56, flexShrink: 0, background: C.surface, borderRight: `1px solid ${C.border}`, transition: 'width .2s', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 12px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>🗺️</span>
          {sidebarOpen && <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>Abby's Tracker</span>}
          <button onClick={() => setSidebarOpen(o => !o)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: C.muted, fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>{sidebarOpen ? '◂' : '▸'}</button>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {groups.map(g => (
            <div key={g.id}>
              {sidebarOpen && <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: '.08em', textTransform: 'uppercase', padding: '10px 14px 4px' }}>{g.label}</div>}
              {TABS.filter(t => t.group === g.id).map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '9px 14px', background: tab === t.id ? 'rgba(88,166,255,0.12)' : 'none', border: 'none', borderLeft: `3px solid ${tab === t.id ? C.accent : 'transparent'}`, color: tab === t.id ? C.accent : C.text, textAlign: 'left', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{t.label.slice(0,2)}</span>
                  {sidebarOpen && <span>{t.label.slice(3)}</span>}
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
          {tab === 'units'      && <UnitsTab state={state} dispatch={dispatch} />}
          {tab === 'timetable'  && <TimetableTab state={state} dispatch={dispatch} />}
          {tab === 'ai'         && <AITab state={state} dispatch={dispatch} />}
          {tab === 'tasks'      && <TasksTab state={state} toggle={toggle} />}
          {tab === 'calendar'   && <CalendarTab state={state} dispatch={dispatch} />}
          {tab === 'timer'      && <FocusTimer dispatch={dispatch} />}
          {tab === 'diary'      && <DiaryTab state={state} dispatch={dispatch} />}
          {tab === 'reminders'  && <RemindersTab state={state} dispatch={dispatch} />}
          {tab === 'resources'  && <ResourcesTab />}
          {tab === 'achieve'    && <AchievementsTab state={state} />}
        </div>
      </div>
    </div>
  );
}

// ─── SYNC PATCH (appended) ───────────────────────────────────────────────────
// Re-export App with Firebase sync wired in.
// The original export default function App() above remains intact as AppInner.

// ─── Synced App wrapper ───────────────────────────────────────────────────────
export default function App() {
  const { user, authLoading, syncStatus, signIn, signOut, saveToCloud, subscribeToCloud } = useSync();

  // wire saveToCloud so the reducer's save() calls go to Firestore
  useEffect(() => { _saveToCloud = saveToCloud; }, [saveToCloud]);

  if (authLoading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0d1117', flexDirection:'column', gap:16 }}>
        <div style={{ fontSize:32 }}>🗺️</div>
        <div style={{ color:'#7d8590', fontSize:14 }}>Loading your tracker…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0d1117', flexDirection:'column', gap:20 }}>
        <div style={{ fontSize:48 }}>🗺️</div>
        <div style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:24, color:'#e6edf3' }}>My GitAway Diary</div>
        <div style={{ color:'#7d8590', fontSize:14, maxWidth:320, textAlign:'center', lineHeight:1.6 }}>
          Sign in with Google to sync your progress across your phone, laptop, and any other device instantly.
        </div>
        <button onClick={signIn} style={{
          display:'flex', alignItems:'center', gap:12, padding:'12px 28px',
          background:'#fff', color:'#1a1a1a', border:'none', borderRadius:8,
          fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
          boxShadow:'0 2px 12px rgba(0,0,0,.4)'
        }}>
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.5 33.4 30 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c11 0 20-8 20-21 0-1.3-.2-2.7-.5-4z"/><path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.5 19.2 13.5 24 13.5c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.5 6.1 29.5 4 24 4c-7.2 0-13.4 3.9-16.7 9.7z"/><path fill="#FBBC05" d="M24 45c5.3 0 10.2-1.8 14-4.9l-6.5-5.3C29.5 36.5 27 37.5 24 37.5c-5.9 0-10.9-3.9-12.7-9.3l-7 5.4C7.8 41.1 15.3 45 24 45z"/><path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-.8 2.4-2.3 4.4-4.2 5.8l6.5 5.3C42 35.7 45 30.3 45 24c0-1.3-.2-2.7-.5-4z"/></svg>
          Continue with Google
        </button>
        <div style={{ color:'#7d8590', fontSize:12 }}>Your data is private and only visible to you.</div>
      </div>
    );
  }

  // Sync indicator bar (top of page when signed in)
  const syncColors = { syncing:'#d29922', synced:'#3fb950', error:'#f85149', offline:'#7d8590' };
  const syncLabels = { syncing:'Syncing…', synced:'Synced ✓', error:'Sync error', offline:'Local only' };

  return (
    <div style={{ position:'relative' }}>
      {/* thin sync bar at very top */}
      <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:2000, height:2, background: syncStatus==='synced'?'#3fb950': syncStatus==='syncing'?'#d29922':'#f85149', transition:'background .4s' }} />
      {/* user chip */}
      <div style={{ position:'fixed', top:6, right:12, zIndex:2001, display:'flex', alignItems:'center', gap:8, background:'rgba(22,27,34,.95)', border:'1px solid #30363d', borderRadius:20, padding:'4px 10px 4px 6px', fontSize:12 }}>
        {user.photoURL && <img src={user.photoURL} alt="" style={{ width:20, height:20, borderRadius:'50%' }} />}
        <span style={{ color:'#7d8590' }}>{user.displayName?.split(' ')[0]}</span>
        <span style={{ color:syncColors[syncStatus], fontSize:11 }}>· {syncLabels[syncStatus]}</span>
        <button onClick={signOut} style={{ background:'none', border:'none', color:'#7d8590', fontSize:11, cursor:'pointer', marginLeft:4 }}>Sign out</button>
      </div>
      <AppInner />
    </div>
  );
}
