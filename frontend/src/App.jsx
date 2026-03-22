import { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import TRACKS from './data/tracks';
import { fetchProgress, saveProgress } from './api';
import Header from './components/Header';
import Tabs from './components/Tabs';
import TrackPanel from './components/TrackPanel';
import TodoManager from './components/TodoManager';
import AttendanceManager from './components/AttendanceManager';
import styles from './App.module.css';
import './AppNav.css';

// Build the initial flat progress map from track data
function buildInitialProgress() {
  const map = {};
  TRACKS.forEach((track) => {
    track.sections.forEach((section) => {
      section.topics.forEach((_, i) => {
        map[`${track.id}::${section.title}::${i}`] = false;
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

const DEBOUNCE_MS = 800;

export default function App() {
  const [activeTab, setActiveTab] = useState(TRACKS[0].id);
  const location = useLocation();
  const [progress, setProgress] = useState(buildInitialProgress);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);

  // Load saved progress on mount
  useEffect(() => {
    fetchProgress()
      .then((savedProgress) => {
        if (savedProgress && Object.keys(savedProgress).length > 0) {
          setProgress((prev) => ({ ...prev, ...savedProgress }));
        }
      })
      .catch((err) => console.error('Failed to load progress:', err))
      .finally(() => setLoading(false));
  }, []);

  // Debounced auto-save whenever progress changes (but not on initial load)
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
  const activeTrack = TRACKS.find((t) => t.id === activeTab);

  return (
    <div className={styles.app}>
      <Header done={done} total={total} />
      
      <div className="mainNav">
        <NavLink to="/syllabus" className={({ isActive }) => isActive ? "activeNav" : ""}>Syllabus</NavLink>
        <NavLink to="/attendance" className={({ isActive }) => isActive ? "activeNav" : ""}>Attendance</NavLink>
        <NavLink to="/todo" className={({ isActive }) => isActive ? "activeNav" : ""}>To-Do List</NavLink>
      </div>

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/syllabus" element={
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}>
              <div className={`${styles.toast} ${styles[saveStatus]}`}>
              {saveStatus === 'saving' && '⏳ Saving…'}
              {saveStatus === 'saved' && '✅ Progress saved'}
              {saveStatus === 'error' && '❌ Save failed — check connection'}
            </div>
            <Tabs tracks={TRACKS} activeId={activeTab} onSelect={setActiveTab} />
            {loading ? (
              <div className={styles.loading}>Loading your progress…</div>
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

          <Route path="*" element={<Navigate to="/syllabus" replace />} />
        </Routes>
      </AnimatePresence>

    </div>
  );
}
