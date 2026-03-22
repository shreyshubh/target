import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchAttendance,
  updateSubjects,
  updateTimetable,
  updateDailyRecord,
  saveBulkRecords
} from '../api';
import styles from './AttendanceManager.module.css';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AttendanceManager() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ subjects: [], timetable: {}, records: {} });
  const [activeTab, setActiveTab] = useState('entry'); // 'setup', 'entry', 'analytics'

  // Entry tab state
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  // Setup tab state
  const [newSubject, setNewSubject] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const resp = await fetchAttendance();
      setData(resp);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    const subjId = 'sub_' + Date.now();
    const newSubjObj = { id: subjId, name: newSubject.trim(), totalClasses: 0, attendedClasses: 0 };
    const updatedSubjects = [...data.subjects, newSubjObj];
    try {
      setData((prev) => ({ ...prev, subjects: updatedSubjects }));
      await updateSubjects(updatedSubjects);
      setNewSubject('');
    } catch (err) {
      console.error(err);
      loadData();
    }
  };

  const handleManualSubjectUpdate = async (id, field, value) => {
    const val = parseInt(value, 10);
    if (isNaN(val) || val < 0) return;
    const updatedSubjects = data.subjects.map((s) => (s.id === id ? { ...s, [field]: val } : s));
    setData((prev) => ({ ...prev, subjects: updatedSubjects }));
    try {
      await updateSubjects(updatedSubjects);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubject = async (id) => {
    if(!window.confirm("Delete this subject?")) return;
    const updatedSubjects = data.subjects.filter((s) => s.id !== id);
    // Also remove from timetable
    const updatedTimetable = { ...data.timetable };
    for (let day in updatedTimetable) {
      updatedTimetable[day] = updatedTimetable[day].filter((sid) => sid !== id);
    }
    setData((prev) => ({ ...prev, subjects: updatedSubjects, timetable: updatedTimetable }));
    try {
      await updateSubjects(updatedSubjects);
      await updateTimetable(updatedTimetable);
    } catch (err) {
      console.error(err);
      loadData();
    }
  };

  const handleToggleTimetable = async (dayIndex, subjectId) => {
    const list = data.timetable[dayIndex] || [];
    const updatedList = list.includes(subjectId)
      ? list.filter((id) => id !== subjectId)
      : [...list, subjectId];
      
    const updatedTimetable = { ...data.timetable, [dayIndex]: updatedList };
    setData((prev) => ({ ...prev, timetable: updatedTimetable }));
    try {
      await updateTimetable(updatedTimetable);
    } catch(err) {
      console.error(err);
      loadData();
    }
  };

  const handleMarkAttendance = async (subjectId, status) => {
    try {
      // Optimistic update
      const currentRecords = data.records || {};
      const dateRecords = currentRecords[selectedDate] || {};
      
      const updatedRecords = {
        ...currentRecords,
        [selectedDate]: { ...dateRecords, [subjectId]: status }
      };

      setData((prev) => ({ ...prev, records: updatedRecords }));
      await updateDailyRecord(selectedDate, subjectId, status);
    } catch (err) {
      console.error(err);
      loadData();
    }
  };

  // Compute analytics
  const analytics = useMemo(() => {
    const stats = {};
    data.subjects.forEach(s => {
      stats[s.id] = { name: s.name, total: parseFloat(s.totalClasses) || 0, attended: parseFloat(s.attendedClasses) || 0 };
    });

    // Add daily records to stats
    Object.keys(data.records || {}).forEach(date => {
      const dayData = data.records[date];
      Object.keys(dayData).forEach(subjId => {
        if (!stats[subjId]) return;
        stats[subjId].total += 1;
        if (dayData[subjId] === 'present') {
          stats[subjId].attended += 1;
        }
      });
    });

    let overallTotal = 0;
    let overallAttended = 0;

    const list = Object.values(stats).map(item => {
      overallTotal += item.total;
      overallAttended += item.attended;
      const percentage = item.total === 0 ? 0 : Math.round((item.attended / item.total) * 100);
      return { ...item, percentage };
    });

    const overallPercentage = overallTotal === 0 ? 0 : Math.round((overallAttended / overallTotal) * 100);

    return { list, overallPercentage, overallTotal, overallAttended };
  }, [data]);

  const renderSetupTab = () => (
    <div className={styles.setupContainer}>
      <h3>1. Manage Subjects</h3>
      <form onSubmit={handleAddSubject} className={styles.addForm}>
        <input 
          value={newSubject} 
          onChange={(e) => setNewSubject(e.target.value)} 
          placeholder="New subject name" 
          className={styles.input}
        />
        <button type="submit" className={styles.btn}>Add Subject</button>
      </form>

      <div className={styles.subjectList}>
        {data.subjects.map(s => (
          <div key={s.id} className={styles.subjectCard}>
            <div className={styles.subjectHeader}>
              <strong>{s.name}</strong>
              <button className={styles.deleteBtn} onClick={() => handleDeleteSubject(s.id)}>✕</button>
            </div>
            <div className={styles.manualEntry}>
              <label>
                Pre-feed Total:
                <input 
                  type="number" 
                  value={s.totalClasses} 
                  onChange={(e) => handleManualSubjectUpdate(s.id, 'totalClasses', e.target.value)} 
                />
              </label>
              <label>
                Pre-feed Attended:
                <input 
                  type="number" 
                  value={s.attendedClasses} 
                  onChange={(e) => handleManualSubjectUpdate(s.id, 'attendedClasses', e.target.value)} 
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <h3 className={styles.timetableTitle}>2. Weekly Timetable</h3>
      <div className={styles.timetableGrid}>
        {DAYS.map((day, dIdx) => (
          <div key={day} className={styles.dayCol}>
            <div className={styles.dayHead}>{day}</div>
            {data.subjects.map(s => {
              const isActive = (data.timetable[dIdx] || []).includes(s.id);
              return (
                <div 
                  key={s.id} 
                  className={`${styles.timeSlot} ${isActive ? styles.activeSlot : ''}`}
                  onClick={() => handleToggleTimetable(dIdx, s.id)}
                >
                  {s.name}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  const renderEntryTab = () => {
    const dayOfWeek = new Date(selectedDate).getDay(); // 0 is Sunday
    // Adjust logic if timezone affects getDay, but assuming local inputs work fine since input type="date" yields YYYY-MM-DD
    
    // Proper local date parsing to get the correct day of the week
    const [year, month, day] = selectedDate.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    const localDayOfWeek = localDate.getDay();

    const scheduledSubjectIds = data.timetable[localDayOfWeek] || [];
    const scheduledSubjects = data.subjects.filter(s => scheduledSubjectIds.includes(s.id));
    
    const dayRecords = (data.records || {})[selectedDate] || {};

    return (
      <div className={styles.entryContainer}>
        <div className={styles.datePickerWrap}>
          <label>Select Date:</label>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className={styles.dateInput}
            max={new Date().toISOString().split('T')[0]} // Max today
          />
          <div className={styles.dayNameDisplay}>{DAYS[localDayOfWeek]}</div>
        </div>

        {scheduledSubjects.length === 0 ? (
          <div className={styles.emptyState}>No classes scheduled for this day in the timetable.</div>
        ) : (
          <div className={styles.classList}>
            {scheduledSubjects.map(s => {
              const status = dayRecords[s.id]; // 'present' | 'absent' | undefined
              return (
                <div key={s.id} className={styles.classItem}>
                  <div className={styles.className}>{s.name}</div>
                  <div className={styles.actionBtns}>
                    <button 
                      className={`${styles.statusBtn} ${status === 'present' ? styles.presentActive : ''}`}
                      onClick={() => handleMarkAttendance(s.id, 'present')}
                    >
                      Present
                    </button>
                    <button 
                      className={`${styles.statusBtn} ${status === 'absent' ? styles.absentActive : ''}`}
                      onClick={() => handleMarkAttendance(s.id, 'absent')}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderAnalyticsTab = () => (
    <div className={styles.analyticsContainer}>
      <div className={styles.overallStat}>
        <h3>Overall Attendance</h3>
        <div className={styles.bigCircle}>
          <span className={styles.percentageText}>{analytics.overallPercentage}%</span>
          <span className={styles.fractionText}>{analytics.overallAttended} / {analytics.overallTotal}</span>
        </div>
      </div>

      <h3 className={styles.subjectBreakdownTitle}>Subject Breakdown</h3>
      <div className={styles.statsGrid}>
        {analytics.list.map(s => (
          <div key={s.name} className={styles.statCard}>
            <div className={styles.statName}>{s.name}</div>
            <div className={styles.statBarWrap}>
              <div 
                className={`${styles.statBar} ${s.percentage < 75 ? styles.dangerBar : ''}`} 
                style={{ width: `${Math.min(s.percentage, 100)}%` }}
              ></div>
            </div>
            <div className={styles.statNumbers}>
              <span>{s.percentage}%</span>
              <span>{s.attended} / {s.total}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) return <div className={styles.loading}>Loading Attendance Data...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.tabHeader}>
        <button className={activeTab === 'entry' ? styles.activeTabBtn : ''} onClick={() => setActiveTab('entry')}>Daily Entry</button>
        <button className={activeTab === 'analytics' ? styles.activeTabBtn : ''} onClick={() => setActiveTab('analytics')}>Analytics</button>
        <button className={activeTab === 'setup' ? styles.activeTabBtn : ''} onClick={() => setActiveTab('setup')}>Setup & Timetable</button>
      </div>
      
      <div className={styles.tabContent}>
        {activeTab === 'entry' && renderEntryTab()}
        {activeTab === 'setup' && renderSetupTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </div>
    </div>
  );
}
