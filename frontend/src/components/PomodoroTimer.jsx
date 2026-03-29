import React, { useState, useEffect, useRef } from 'react';
import styles from './PomodoroTimer.module.css';
import { useQuery } from '@tanstack/react-query';
import { fetchSyllabus } from '../api';
import { useAuth } from '../context/AuthContext';

// Add saveStudySession to api.js instead of importing here for now, we will do it inline or add it to api.js

export default function PomodoroTimer() {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 mins
  const [isActive, setIsActive] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  
  const timerRef = useRef(null);

  const { data: syllabusData } = useQuery({
    queryKey: ['syllabus'],
    queryFn: fetchSyllabus,
  });
  
  const tracks = syllabusData?.tracks || [];

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  const handleComplete = async () => {
    setIsActive(false);
    
    if (selectedSubject) {
      // Inline API Call to save session
      try {
        const BASE_URL = import.meta.env.VITE_API_URL || '/api';
        const dateStr = new Date().toISOString().split('T')[0];
        
        await fetch(`${BASE_URL}/study`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjectId: selectedSubject,
            date: dateStr,
            durationMinutes: 25
          })
        });
        
        alert(`Awesome! Logged 25 minutes of study for ${tracks.find(t=>t.id === selectedSubject)?.label || 'this subject'}.`);
      } catch (err) {
        console.error("Failed to save study session", err);
        alert("Session completed, but failed to save to database. Are you online?");
      }
    } else {
      alert("Pomodoro complete! (No subject was selected to log the time).");
    }
    
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!isOpen) {
    return (
      <button className={styles.floatingFab} onClick={() => setIsOpen(true)}>
        ⏱️ Pomodoro
      </button>
    );
  }

  return (
    <div className={styles.timerWidget}>
      <div className={styles.header}>
        <h4>Focus Timer</h4>
        <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>✕</button>
      </div>
      
      <div className={styles.timeDisplay}>
        {formatTime(timeLeft)}
      </div>
      
      <select 
        className={styles.subjectSelect} 
        value={selectedSubject} 
        onChange={(e) => setSelectedSubject(e.target.value)}
        disabled={isActive}
      >
        <option value="">-- Select Subject to Log --</option>
        {tracks.map(t => (
          <option key={t.id} value={t.id}>{t.label}</option>
        ))}
      </select>

      <div className={styles.controls}>
        <button className={styles.mainBtn} onClick={toggleTimer}>
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button className={styles.resetBtn} onClick={resetTimer}>Reset</button>
      </div>
    </div>
  );
}
