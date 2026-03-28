import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { fetchProgress, saveProgress, fetchSyllabus } from './api';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import Tabs from './components/Tabs';
import TrackPanel from './components/TrackPanel';
import TodoManager from './components/TodoManager';
import AttendanceManager from './components/AttendanceManager';
import SyllabusManager from './components/SyllabusManager';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import styles from './App.module.css';
import './AppNav.css';

// Build progress keys using topic name (not index) to prevent orphaning
function buildInitialProgress(tracks) {
  const map = {};
  (tracks || []).forEach((track) => {
    (track.sections || []).forEach((section) => {
      (section.topics || []).forEach((topic) => {
        map[`${track.id}::${section.title}::${topic}`] = false;
      });
    });
  });
  return map;
}

function countProgress(progress) {
  const keys = Object.keys(progress);
  const done = keys.filter((k) => progress[k]).length;
  return { total: keys.length, done };
}

// Get per-track progress counts
function getTrackProgress(tracks, progress) {
  return (tracks || []).map((track) => {
    let total = 0, done = 0;
    (track.sections || []).forEach((section) => {
      (section.topics || []).forEach((topic) => {
        const key = `${track.id}::${section.title}::${topic}`;
        total++;
        if (progress[key]) done++;
      });
    });
    return { id: track.id, done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
  });
}

const DEBOUNCE_MS = 800;

// ── Search component ────────────────────────────────────────
function SearchBar({ tracks, progress, onToggle }) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const matches = [];
    (tracks || []).forEach((track) => {
      (track.sections || []).forEach((section) => {
        (section.topics || []).forEach((topic) => {
          if (topic.toLowerCase().includes(q) || section.title.toLowerCase().includes(q)) {
            const key = `${track.id}::${section.title}::${topic}`;
            matches.push({
              key,
              topic,
              section: section.title,
              track: track.label,
              done: !!progress[key],
            });
          }
        });
      });
    });
    return matches.slice(0, 20);
  }, [query, tracks, progress]);

  return (
    <div style={{ padding: '12px 16px' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍 Search topics across all subjects..."
        style={{
          width: '100%', padding: '10px 16px', border: '2px solid #dfe6e9',
          borderRadius: '12px', fontSize: '14px', outline: 'none', fontFamily: 'inherit',
          background: 'rgba(255,255,255,0.05)', color: 'inherit',
        }}
      />
      {results.length > 0 && (
        <div style={{ marginTop: '8px', maxHeight: '300px', overflowY: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
          {results.map((r) => (
            <div key={r.key} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer',
            }}
              onClick={() => onToggle(r.key)}
            >
              <span style={{ fontSize: '16px' }}>{r.done ? '✅' : '⬜'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{r.topic}</div>
                <div style={{ fontSize: '11px', opacity: 0.5 }}>{r.track} → {r.section}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {query.trim() && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '16px', opacity: 0.4, fontSize: '13px' }}>No topics found</div>
      )}
    </div>
  );
}

// ── Protected Layout (the main app after login) ─────────────
function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Fetch syllabus from API
  const { data: syllabusData, isLoading: syllabusLoading } = useQuery({
    queryKey: ['syllabus'],
    queryFn: fetchSyllabus,
  });

  // Stable reference for tracks to prevent infinite loop
  const TRACKS = useMemo(() => syllabusData?.tracks || [], [syllabusData]);
  
  const [activeTab, setActiveTab] = useState('');
  const [progress, setProgress] = useState({});
  const [saveStatus, setSaveStatus] = useState('idle');
  const [loading, setLoading] = useState(true);
  const [manageSyllabus, setManageSyllabus] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const debounceRef = useRef(null);

  // Set initial active tab when tracks load
  useEffect(() => {
    if (TRACKS.length > 0 && !activeTab) {
      setActiveTab(TRACKS[0].id);
    }
  }, [TRACKS, activeTab]);

  // Build initial progress and load saved progress
  useEffect(() => {
    if (syllabusLoading) return;
    const initial = buildInitialProgress(TRACKS);
    setProgress(initial);

    fetchProgress()
      .then((savedProgress) => {
        if (savedProgress && Object.keys(savedProgress).length > 0) {
          setProgress((prev) => {
            const merged = { ...prev };

            // Build index→name lookup for migration of old keys
            const indexToNameKey = {};
            (TRACKS || []).forEach((track) => {
              (track.sections || []).forEach((section) => {
                (section.topics || []).forEach((topic, i) => {
                  indexToNameKey[`${track.id}::${section.title}::${i}`] = `${track.id}::${section.title}::${topic}`;
                });
              });
            });

            for (const [key, value] of Object.entries(savedProgress)) {
              if (key in merged) {
                // Key exists in current syllabus — apply it
                merged[key] = value;
              } else if (indexToNameKey[key] && indexToNameKey[key] in merged) {
                // Old index-based key — migrate to new name-based key
                merged[indexToNameKey[key]] = value;
              }
              // Otherwise, orphaned key — discard
            }
            return merged;
          });
        }
      })
      .catch((err) => console.error('Failed to load progress:', err))
      .finally(() => setLoading(false));
  }, [syllabusLoading, TRACKS]);

  const triggerSave = useCallback((newProgress) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus('saving');
    debounceRef.current = setTimeout(async () => {
      try {
        await saveProgress(newProgress);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('Save failed:', err);
        setSaveStatus('error');
      }
    }, DEBOUNCE_MS);
  }, []);

  const handleToggle = useCallback((key) => {
    setProgress((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      triggerSave(next);
      return next;
    });
  }, [triggerSave]);

  const { done, total } = countProgress(progress);
  const trackProgressList = getTrackProgress(TRACKS, progress);
  const activeTrack = TRACKS.find((t) => t.id === activeTab);

  // Export syllabus as JSON
  const handleExport = () => {
    const data = JSON.stringify({ tracks: TRACKS, exportDate: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syllabus-${user?.username || 'export'}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.app}>
      <Header done={done} total={total} />
      
      {/* User bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 16px', background: 'rgba(108,92,231,0.06)', borderBottom: '1px solid rgba(108,92,231,0.1)', fontSize: '13px' }}>
        <span style={{ color: '#6c5ce7', fontWeight: 500 }}>👤 {user?.username}</span>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <NavLink to="/settings" style={{ color: '#636e72', textDecoration: 'none', fontSize: '13px' }}>⚙️ Settings</NavLink>
          <button
            onClick={logout}
            style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontWeight: 500, fontSize: '13px', fontFamily: 'inherit' }}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mainNav">
        <NavLink to="/syllabus" className={({ isActive }) => isActive ? "activeNav" : ""}>Syllabus</NavLink>
        <NavLink to="/attendance" className={({ isActive }) => isActive ? "activeNav" : ""}>Attendance</NavLink>
        <NavLink to="/todo" className={({ isActive }) => isActive ? "activeNav" : ""}>To-Do List</NavLink>
      </div>

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/syllabus" element={
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 16px 0', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => setShowSearch(!showSearch)} style={{ padding: '6px 14px', background: showSearch ? '#6c5ce7' : 'rgba(108,92,231,0.1)', color: showSearch ? '#fff' : '#6c5ce7', border: '1px solid rgba(108,92,231,0.2)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: 'inherit' }}>
                  🔍 Search
                </button>
                <button onClick={handleExport} style={{ padding: '6px 14px', background: 'rgba(0,206,201,0.1)', color: '#00cec9', border: '1px solid rgba(0,206,201,0.2)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: 'inherit' }}>
                  📥 Export
                </button>
                <button
                  onClick={() => setManageSyllabus(!manageSyllabus)}
                  style={{
                    padding: '6px 14px',
                    background: manageSyllabus ? '#6c5ce7' : 'rgba(108,92,231,0.1)',
                    color: manageSyllabus ? '#fff' : '#6c5ce7',
                    border: '1px solid rgba(108,92,231,0.2)',
                    borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: 'inherit',
                  }}
                >
                  {manageSyllabus ? '← Back to Progress' : '⚙️ Manage Syllabus'}
                </button>
              </div>

              {showSearch && <SearchBar tracks={TRACKS} progress={progress} onToggle={handleToggle} />}

              {manageSyllabus ? (
                <SyllabusManager />
              ) : (
                <>
                  <div className={`${styles.toast} ${styles[saveStatus]}`}>
                    {saveStatus === 'saving' && '⏳ Saving…'}
                    {saveStatus === 'saved' && '✅ Progress saved'}
                    {saveStatus === 'error' && '❌ Save failed — check connection'}
                  </div>

                  {/* Per-track progress bars */}
                  {TRACKS.length > 0 && trackProgressList.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', padding: '8px 16px', overflowX: 'auto', flexWrap: 'wrap' }}>
                      {trackProgressList.map((tp) => (
                        <div key={tp.id} onClick={() => setActiveTab(tp.id)} style={{
                          cursor: 'pointer', padding: '6px 12px', borderRadius: '8px', fontSize: '11px',
                          background: tp.id === activeTab ? 'rgba(108,92,231,0.15)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${tp.id === activeTab ? 'rgba(108,92,231,0.3)' : 'rgba(255,255,255,0.08)'}`,
                          minWidth: '80px', textAlign: 'center',
                        }}>
                          <div style={{ fontWeight: 600, color: tp.percent === 100 ? '#00cec9' : '#a29bfe' }}>{tp.percent}%</div>
                          <div style={{ opacity: 0.5, whiteSpace: 'nowrap' }}>{tp.done}/{tp.total}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {TRACKS.length > 0 && (
                    <Tabs tracks={TRACKS} activeId={activeTab} onSelect={setActiveTab} />
                  )}
                  {syllabusLoading || loading ? (
                    <div className={styles.loading}>Loading your progress…</div>
                  ) : TRACKS.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#b2bec3' }}>
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>📚</div>
                      <h3 style={{ color: '#636e72', margin: '0 0 8px' }}>No Syllabus Yet</h3>
                      <p>Click "Manage Syllabus" to add your subjects and topics.</p>
                    </div>
                  ) : (
                    <main className={styles.main}>
                      {activeTrack && (
                        <TrackPanel
                          track={activeTrack}
                          progress={progress}
                          onToggle={handleToggle}
                        />
                      )}
                    </main>
                  )}
                </>
              )}
            </motion.div>
          } />
          
          <Route path="/attendance" element={
            <motion.main className="mainContent" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}>
              <AttendanceManager />
            </motion.main>
          } />
          
          <Route path="/todo" element={
            <motion.main className="mainContent" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}>
              <TodoManager />
            </motion.main>
          } />

          <Route path="/settings" element={
            <motion.main className="mainContent" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}>
              <SettingsPage />
            </motion.main>
          } />

          <Route path="*" element={<Navigate to="/syllabus" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

// ── Main App with Auth Routing ───────────────────────────────
export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/syllabus" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/syllabus" replace /> : <RegisterPage />} />
      <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/syllabus" replace /> : <ForgotPasswordPage />} />
      <Route path="/*" element={isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}
