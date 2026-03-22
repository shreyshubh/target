import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [mainView, setMainView] = useState('syllabus'); // 'syllabus', 'attendance', 'todo'
  const [activeTab, setActiveTab] = useState(TRACKS[0].id);
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
        <button className={mainView === 'syllabus' ? "activeNav" : ''} onClick={() => setMainView('syllabus')}>Syllabus</button>
        <button className={mainView === 'attendance' ? "activeNav" : ''} onClick={() => setMainView('attendance')}>Attendance</button>
        <button className={mainView === 'todo' ? "activeNav" : ''} onClick={() => setMainView('todo')}>To-Do List</button>
      </div>

      {mainView === 'syllabus' && (
        <>
          {/* Save status toast */}
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
        </>
      )}

      {mainView === 'attendance' && (
        <main className="mainContent">
          <AttendanceManager />
        </main>
      )}

      {mainView === 'todo' && (
        <main className="mainContent">
          <TodoManager />
        </main>
      )}

    </div>
  );
}
