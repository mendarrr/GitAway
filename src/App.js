import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TASKS, TRACKS, RESOURCES, ACHIEVEMENTS } from './data';

// ─── helpers ───────────────────────────────────────────────────────────────
const STORAGE_KEY = 'roadmap_v2';
const today = () => new Date().toISOString().slice(0, 10);

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}
function save(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

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
  };
}

// ─── colour helpers ────────────────────────────────────────────────────────
const trackColor = (id) => TRACKS.find(t => t.id === id)?.color || '#58a6ff';

// ─── tiny components ───────────────────────────────────────────────────────
function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: 20, ...style
    }}>{children}</div>
  );
}

function Badge({ label, color = 'var(--accent)' }) {
  return (
    <span style={{
      background: color + '22', color, fontSize: 11, fontWeight: 600,
      padding: '2px 8px', borderRadius: 20, border: `1px solid ${color}44`
    }}>{label}</span>
  );
}

function ProgressBar({ value, max, color = 'var(--accent)', height = 6 }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ background: 'var(--border)', borderRadius: height, height, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: height, transition: 'width .4s ease' }} />
    </div>
  );
}

// ─── DASHBOARD ─────────────────────────────────────────────────────────────
function Dashboard({ state }) {
  const totalTasks = TASKS.length;
  const doneTasks = Object.values(state.checked).filter(Boolean).length;
  const pct = Math.round((doneTasks / totalTasks) * 100);
  const totalXp = TASKS.reduce((s, t) => s + (state.checked[t.id] ? t.xp : 0), 0);
  const sessions = state.focusSessions.length;

  const todayTasks = TASKS.filter(t => {
    const w = Math.ceil((new Date() - new Date('2025-06-28')) / 604800000);
    return t.week === Math.max(1, Math.min(8, w));
  }).slice(0, 5);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { label: 'Tasks Done', value: `${doneTasks}/${totalTasks}`, color: 'var(--accent)' },
          { label: 'Total XP', value: totalXp, color: 'var(--green)' },
          { label: 'Focus Sessions', value: sessions, color: 'var(--purple)' },
          { label: 'Day Streak', value: `${state.streak}🔥`, color: 'var(--amber)' },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: 'Space Grotesk' }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* overall progress */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontWeight: 600 }}>Overall Progress</span>
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{pct}%</span>
        </div>
        <ProgressBar value={doneTasks} max={totalTasks} height={12} />
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {TRACKS.map(tr => {
            const all = TASKS.filter(t => t.track === tr.id);
            const done = all.filter(t => state.checked[t.id]).length;
            return (
              <div key={tr.id}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{tr.emoji} {tr.label}</div>
                <ProgressBar value={done} max={all.length} color={tr.color} />
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{done}/{all.length}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* today's suggested tasks */}
      <Card>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>📋 Suggested Tasks This Week</div>
        {todayTasks.map(t => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
            borderBottom: '1px solid var(--border)', opacity: state.checked[t.id] ? 0.5 : 1
          }}>
            <span style={{ color: state.checked[t.id] ? 'var(--green)' : 'var(--muted)', fontSize: 16 }}>
              {state.checked[t.id] ? '✅' : '⭕'}
            </span>
            <span style={{ flex: 1, textDecoration: state.checked[t.id] ? 'line-through' : 'none', fontSize: 14 }}>{t.title}</span>
            <Badge label={`+${t.xp}xp`} color={trackColor(t.track)} />
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── TASKS TAB ─────────────────────────────────────────────────────────────
function TasksTab({ state, toggle }) {
  const [filterWeek, setFilterWeek] = useState('all');
  const [filterTrack, setFilterTrack] = useState('all');

  const filtered = TASKS.filter(t =>
    (filterWeek === 'all' || t.week === +filterWeek) &&
    (filterTrack === 'all' || t.track === filterTrack)
  );

  const sel = { background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', fontSize: 13 };

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
        <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 13, alignSelf: 'center' }}>
          {filtered.filter(t => state.checked[t.id]).length}/{filtered.length} done
        </span>
      </div>

      {[1,2,3,4,5,6,7,8].map(w => {
        const wTasks = filtered.filter(t => t.week === w);
        if (!wTasks.length) return null;
        const wDone = wTasks.filter(t => state.checked[t.id]).length;
        return (
          <div key={w} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--accent)' }}>Week {w}</span>
              <ProgressBar value={wDone} max={wTasks.length} style={{ flex: 1 }} />
              <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{wDone}/{wTasks.length}</span>
            </div>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {wTasks.map((t, i) => {
                const tr = TRACKS.find(x => x.id === t.track);
                const done = !!state.checked[t.id];
                return (
                  <div key={t.id} onClick={() => toggle(t.id, t.xp)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    borderBottom: i < wTasks.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer', transition: 'background .15s',
                    background: done ? 'rgba(63,185,80,0.05)' : 'transparent',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = done ? 'rgba(63,185,80,0.05)' : 'transparent'}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: 6, border: `2px solid ${done ? 'var(--green)' : 'var(--border)'}`,
                      background: done ? 'var(--green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'all .2s'
                    }}>
                      {done && <span style={{ color: '#000', fontSize: 13, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ flex: 1, fontSize: 14, textDecoration: done ? 'line-through' : 'none', color: done ? 'var(--muted)' : 'var(--text)' }}>
                      {t.title}
                    </span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      <Badge label={tr?.emoji + ' ' + tr?.label} color={tr?.color} />
                      <Badge label={`+${t.xp}xp`} color="var(--amber)" />
                      {t.link && (
                        <a href={t.link} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ color: 'var(--accent)', fontSize: 13, textDecoration: 'none' }}>↗</a>
                      )}
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

// ─── CALENDAR TAB ──────────────────────────────────────────────────────────
function CalendarTab({ state, dispatch }) {
  const [month, setMonth] = useState(() => {
    const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [selected, setSelected] = useState(today());
  const [noteText, setNoteText] = useState('');

  const firstDay = new Date(month.y, month.m, 1).getDay();
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const dayKey = (d) => `${month.y}-${String(month.m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  const saveNote = () => {
    dispatch({ type: 'calNote', date: selected, text: noteText });
    setNoteText('');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
      <Card>
        {/* month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={() => setMonth(p => { const d = new Date(p.y, p.m-1); return {y:d.getFullYear(),m:d.getMonth()}; })}
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '4px 10px', fontSize: 16 }}>‹</button>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18 }}>{MONTHS[month.m]} {month.y}</span>
          <button onClick={() => setMonth(p => { const d = new Date(p.y, p.m+1); return {y:d.getFullYear(),m:d.getMonth()}; })}
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '4px 10px', fontSize: 16 }}>›</button>
        </div>
        {/* day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 8 }}>
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{d}</div>
          ))}
        </div>
        {/* days grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const d = i + 1;
            const key = dayKey(d);
            const isToday = key === today();
            const isSel = key === selected;
            const hasFocus = state.focusSessions.some(s => s.date === key);
            const hasNote = !!state.calNotes[key];
            const hasTask = Object.entries(state.checked).some(([id, v]) => v && TASKS.find(t=>t.id===id));
            return (
              <div key={d} onClick={() => setSelected(key)}
                style={{
                  aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', borderRadius: 8, cursor: 'pointer',
                  background: isSel ? 'var(--accent)' : isToday ? 'rgba(88,166,255,0.15)' : 'var(--surface2)',
                  border: isToday ? '2px solid var(--accent)' : '2px solid transparent',
                  color: isSel ? '#000' : 'var(--text)', fontWeight: isToday ? 700 : 400, fontSize: 13,
                  transition: 'all .15s',
                }}>
                {d}
                <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                  {hasFocus && <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSel ? '#000' : 'var(--purple)' }} />}
                  {hasNote && <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSel ? '#000' : 'var(--amber)' }} />}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 12, fontSize: 11, color: 'var(--muted)' }}>
          <span>🟣 focus session</span><span>🟡 note</span>
        </div>
      </Card>

      {/* side panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>📅 {selected}</div>
          {state.focusSessions.filter(s => s.date === selected).map((s, i) => (
            <div key={i} style={{ fontSize: 13, color: 'var(--purple)', marginBottom: 4 }}>⏱ {s.minutes}min focus – {s.mode}</div>
          ))}
          {state.calNotes[selected] && (
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8, whiteSpace: 'pre-wrap' }}>{state.calNotes[selected]}</div>
          )}
        </Card>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>Add Note for {selected}</div>
          <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
            placeholder="What did you do / learn today?"
            style={{
              width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
              color: 'var(--text)', borderRadius: 6, padding: 10, fontSize: 13, resize: 'vertical', minHeight: 80
            }} />
          <button onClick={saveNote} style={{
            marginTop: 8, width: '100%', background: 'var(--accent)', color: '#000',
            border: 'none', borderRadius: 6, padding: '8px 0', fontWeight: 600, fontSize: 13
          }}>Save Note</button>
        </Card>
      </div>
    </div>
  );
}

// ─── FOCUS TIMER ───────────────────────────────────────────────────────────
const MODES = [
  { id: 'work', label: '🍅 Focus', mins: 25 },
  { id: 'short', label: '☕ Short Break', mins: 5 },
  { id: 'long', label: '🌿 Long Break', mins: 15 },
  { id: 'deep', label: '🧠 Deep Work', mins: 50 },
];

function FocusTimer({ dispatch }) {
  const [modeIdx, setModeIdx] = useState(0);
  const [secs, setSecs] = useState(MODES[0].mins * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  const mode = MODES[modeIdx];

  useEffect(() => {
    setSecs(mode.mins * 60);
    setRunning(false);
    clearInterval(intervalRef.current);
  }, [modeIdx]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecs(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            dispatch({ type: 'focusDone', minutes: mode.mins, mode: mode.label });
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('🍅 Session Complete!', { body: `${mode.label} session finished. Great work!` });
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const total = mode.mins * 60;
  const pct = ((total - secs) / total) * 100;
  const r = 80;
  const circ = 2 * Math.PI * r;
  const dash = circ - (pct / 100) * circ;

  const requestNotif = () => {
    if ('Notification' in window) Notification.requestPermission();
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <Card style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
          {MODES.map((m, i) => (
            <button key={m.id} onClick={() => setModeIdx(i)} style={{
              background: i === modeIdx ? 'var(--accent)' : 'var(--surface2)',
              color: i === modeIdx ? '#000' : 'var(--text)',
              border: '1px solid var(--border)', borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600
            }}>{m.label}</button>
          ))}
        </div>

        {/* circular timer */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
          <svg width={200} height={200} viewBox="0 0 200 200">
            <circle cx={100} cy={100} r={r} fill="none" stroke="var(--border)" strokeWidth={10} />
            <circle cx={100} cy={100} r={r} fill="none" stroke="var(--accent)" strokeWidth={10}
              strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
              transform="rotate(-90 100 100)" style={{ transition: 'stroke-dashoffset .5s' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: 38, fontWeight: 700 }}>{fmt(secs)}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{mode.label}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={() => setRunning(r => !r)} style={{
            background: running ? 'var(--red)' : 'var(--green)', color: '#000',
            border: 'none', borderRadius: 8, padding: '10px 32px', fontWeight: 700, fontSize: 15
          }}>{running ? 'Pause' : 'Start'}</button>
          <button onClick={() => { setSecs(mode.mins * 60); setRunning(false); }} style={{
            background: 'var(--surface2)', color: 'var(--text)',
            border: '1px solid var(--border)', borderRadius: 8, padding: '10px 20px', fontSize: 15
          }}>Reset</button>
        </div>
        <button onClick={requestNotif} style={{
          marginTop: 16, background: 'transparent', color: 'var(--muted)',
          border: 'none', fontSize: 12, textDecoration: 'underline', cursor: 'pointer'
        }}>Enable desktop notifications</button>
      </Card>
    </div>
  );
}

// ─── DIARY TAB ─────────────────────────────────────────────────────────────
function DiaryTab({ state, dispatch }) {
  const [text, setText] = useState('');
  const todayKey = today();

  const save = () => {
    if (!text.trim()) return;
    dispatch({ type: 'diary', date: todayKey, text: text.trim() });
    setText('');
  };

  const entries = Object.entries(state.diary).sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
      <div>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>📝 Today's Reflection – {todayKey}</div>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="What did you learn today? What challenged you? What are you proud of?"
            style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: 12, fontSize: 14, resize: 'vertical', minHeight: 120 }} />
          <button onClick={save} style={{
            marginTop: 10, background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600
          }}>Save Entry (+5 XP)</button>
        </Card>

        {entries.map(([date, text]) => (
          <Card key={date} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>{date}</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{text}</p>
          </Card>
        ))}
      </div>
      <div>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>💡 OneNote Companion</div>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
            Use this diary for quick daily reflections, then expand in OneNote with your mind maps.<br /><br />
            <strong style={{ color: 'var(--text)' }}>Suggested OneNote Structure:</strong>
          </p>
          <ul style={{ marginTop: 10, paddingLeft: 16, fontSize: 13, color: 'var(--muted)', lineHeight: 2 }}>
            <li>📓 Holiday Roadmap (Notebook)</li>
            <li>&nbsp;&nbsp;📂 Week 1 – Foundations</li>
            <li>&nbsp;&nbsp;&nbsp;&nbsp;📄 Data & Python notes</li>
            <li>&nbsp;&nbsp;&nbsp;&nbsp;📄 SQL practice log</li>
            <li>&nbsp;&nbsp;📂 Week 2 – BI Tools</li>
            <li>&nbsp;&nbsp;&nbsp;&nbsp;📄 Power BI learnings</li>
            <li>&nbsp;&nbsp;📂 Resources & Links</li>
            <li>&nbsp;&nbsp;📂 Interview Prep</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

// ─── REMINDERS TAB ─────────────────────────────────────────────────────────
function RemindersTab({ state, dispatch }) {
  const [form, setForm] = useState({ title: '', date: '', time: '', type: 'study' });
  const types = ['study', 'apply', 'break', 'review', 'other'];

  const add = () => {
    if (!form.title || !form.date) return;
    dispatch({ type: 'addReminder', reminder: { ...form, id: Date.now() } });
    setForm({ title: '', date: '', time: '', type: 'study' });
  };

  const inp = { background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '8px 10px', fontSize: 13 };

  const now = new Date();
  const sorted = [...state.reminders].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <Card>
        <div style={{ fontWeight: 600, marginBottom: 14 }}>➕ Add Reminder</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input placeholder="What to remember..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={{ ...inp, width: '100%' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inp} />
            <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} style={inp} />
          </div>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ ...inp, width: '100%' }}>
            {types.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
          </select>
          <button onClick={add} style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 6, padding: '9px 0', fontWeight: 600, fontSize: 14 }}>
            Set Reminder
          </button>
        </div>
      </Card>

      <Card>
        <div style={{ fontWeight: 600, marginBottom: 14 }}>🔔 All Reminders</div>
        {sorted.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>No reminders yet.</p>}
        {sorted.map(r => {
          const dt = new Date(`${r.date}T${r.time || '23:59'}`);
          const overdue = dt < now;
          return (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0',
              borderBottom: '1px solid var(--border)', opacity: overdue ? 0.6 : 1
            }}>
              <div style={{ fontSize: 20 }}>
                {r.type === 'study' ? '📚' : r.type === 'apply' ? '📨' : r.type === 'break' ? '☕' : r.type === 'review' ? '🔍' : '📌'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: overdue ? 'var(--red)' : 'var(--muted)', marginTop: 2 }}>
                  {overdue ? '⚠ Overdue – ' : ''}{r.date}{r.time ? ' at ' + r.time : ''}
                </div>
              </div>
              <button onClick={() => dispatch({ type: 'removeReminder', id: r.id })} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ─── RESOURCES TAB ─────────────────────────────────────────────────────────
function ResourcesTab() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
      {RESOURCES.map(cat => (
        <Card key={cat.category}>
          <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--accent)' }}>{cat.category}</div>
          {cat.items.map(item => (
            <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer" style={{
              display: 'block', color: 'var(--text)', textDecoration: 'none', fontSize: 13,
              padding: '6px 0', borderBottom: '1px solid var(--border)', lineHeight: 1.4
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}
            >
              ↗ {item.name}
            </a>
          ))}
        </Card>
      ))}
    </div>
  );
}

// ─── ACHIEVEMENTS TAB ──────────────────────────────────────────────────────
function AchievementsTab({ state }) {
  const checked = state.checked;
  const totalXp = TASKS.reduce((s, t) => s + (checked[t.id] ? t.xp : 0), 0);
  const doneTasks = Object.values(checked).filter(Boolean).length;
  const dataDone = TASKS.filter(t => t.track === 'data' && checked[t.id]).length;
  const webDone = TASKS.filter(t => t.track === 'web' && checked[t.id]).length;
  const softDone = TASKS.filter(t => t.track === 'soft' && checked[t.id]).length;
  const internDone = TASKS.filter(t => t.track === 'intern' && checked[t.id]).length;
  const week1Tasks = TASKS.filter(t => t.week === 1);
  const week1Done = week1Tasks.every(t => checked[t.id]);
  const capstone = !!checked['t31'];

  const d = { done: doneTasks, xp: totalXp, dataDone, webDone, softDone, internDone, week1Done, capstone, streak: state.streak };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
      {ACHIEVEMENTS.map(a => {
        const unlocked = a.condition(d);
        return (
          <Card key={a.id} style={{ textAlign: 'center', opacity: unlocked ? 1 : 0.45, transition: 'opacity .2s' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>{a.icon}</div>
            <div style={{ fontWeight: 700, marginBottom: 4, color: unlocked ? 'var(--text)' : 'var(--muted)' }}>{a.title}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{a.desc}</div>
            {unlocked && <div style={{ marginTop: 8 }}><Badge label="Unlocked ✓" color="var(--green)" /></div>}
          </Card>
        );
      })}
    </div>
  );
}

// ─── ROOT APP ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: '🏠 Dashboard' },
  { id: 'tasks',     label: '✅ Tasks' },
  { id: 'calendar',  label: '📅 Calendar' },
  { id: 'timer',     label: '⏱ Focus Timer' },
  { id: 'diary',     label: '📝 Diary' },
  { id: 'reminders', label: '🔔 Reminders' },
  { id: 'resources', label: '📚 Resources' },
  { id: 'achieve',   label: '🏆 Achievements' },
];

function reducer(state, action) {
  let next;
  switch (action.type) {
    case 'toggle': {
      const was = !!state.checked[action.id];
      const xpDelta = was ? -action.xp : action.xp;
      next = { ...state, checked: { ...state.checked, [action.id]: !was }, xp: state.xp + xpDelta };
      break;
    }
    case 'diary': next = { ...state, diary: { ...state.diary, [action.date]: action.text }, xp: state.xp + 5 }; break;
    case 'calNote': next = { ...state, calNotes: { ...state.calNotes, [action.date]: action.text } }; break;
    case 'focusDone':
      next = { ...state, xp: state.xp + 10, focusSessions: [...state.focusSessions, { date: today(), minutes: action.minutes, mode: action.mode }] };
      break;
    case 'addReminder': next = { ...state, reminders: [...state.reminders, action.reminder] }; break;
    case 'removeReminder': next = { ...state, reminders: state.reminders.filter(r => r.id !== action.id) }; break;
    default: return state;
  }
  save(next);
  return next;
}

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [state, dispatch] = React.useReducer(reducer, null, initState);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // streak tracking
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

  // reminder check
  useEffect(() => {
    const check = () => {
      const now = new Date();
      state.reminders.forEach(r => {
        const dt = new Date(`${r.date}T${r.time || '09:00'}`);
        const diff = Math.abs(now - dt) / 1000;
        if (diff < 35 && diff > 5 && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('⏰ Reminder', { body: r.title });
        }
      });
    };
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [state.reminders]);

  const toggle = useCallback((id, xp) => dispatch({ type: 'toggle', id, xp }), []);

  const totalXp = TASKS.reduce((s, t) => s + (state.checked[t.id] ? t.xp : 0), 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* sidebar */}
      <div style={{
        width: sidebarOpen ? 220 : 56, flexShrink: 0, background: 'var(--surface)',
        borderRight: '1px solid var(--border)', transition: 'width .2s ease',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        <div style={{ padding: '18px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>🗺️</span>
          {sidebarOpen && <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap' }}>Holiday Roadmap</span>}
          <button onClick={() => setSidebarOpen(o => !o)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--muted)', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>
            {sidebarOpen ? '◂' : '▸'}
          </button>
        </div>
        <nav style={{ flex: 1, padding: '10px 0' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 14px',
              background: tab === t.id ? 'rgba(88,166,255,0.12)' : 'none',
              border: 'none', borderLeft: `3px solid ${tab === t.id ? 'var(--accent)' : 'transparent'}`,
              color: tab === t.id ? 'var(--accent)' : 'var(--text)', textAlign: 'left',
              fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .1s'
            }}>
              <span style={{ fontSize: 17, flexShrink: 0 }}>{t.label.slice(0, 2)}</span>
              {sidebarOpen && <span>{t.label.slice(3)}</span>}
            </button>
          ))}
        </nav>
        {sidebarOpen && (
          <div style={{ padding: 14, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Total XP</div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, color: 'var(--amber)' }}>{totalXp} ⭐</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Streak: {state.streak}🔥</div>
          </div>
        )}
      </div>

      {/* main */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22 }}>
              {TABS.find(t => t.id === tab)?.label}
            </h1>
          </div>

          {tab === 'dashboard'  && <Dashboard state={state} />}
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
