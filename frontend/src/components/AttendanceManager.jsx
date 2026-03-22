import React, { useState, useMemo } from 'react';
import { useAttendance } from '../hooks/useAttendance';
import styles from './AttendanceManager.module.css';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AttendanceManager() {
  const { data, isLoading, isError, updateSubjects, updateTimetable, updateDailyRecord, toggleHoliday } = useAttendance();
  const [activeTab, setActiveTab] = useState('entry'); // 'setup', 'entry', 'analytics'
  
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  
  const [newSubject, setNewSubject] = useState('');

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    const subjId = 'sub_' + Date.now();
    const updatedSubjects = [...data.subjects, { id: subjId, name: newSubject.trim(), totalClasses: 0, attendedClasses: 0 }];
    try {
      await updateSubjects(updatedSubjects);
      setNewSubject('');
    } catch (err) { console.error(err); }
  };

  const handleManualSubjectUpdate = async (id, field, value) => {
    const val = parseInt(value, 10);
    if (isNaN(val) || val < 0) return;
    const updatedSubjects = data.subjects.map((s) => (s.id === id ? { ...s, [field]: val } : s));
    try { await updateSubjects(updatedSubjects); } catch (err) { console.error(err); }
  };

  const handleDeleteSubject = async (id) => {
    if(!window.confirm("Delete this subject?")) return;
    const updatedSubjects = data.subjects.filter((s) => s.id !== id);
    const updatedTimetable = { ...data.timetable };
    for (let day in updatedTimetable) {
      updatedTimetable[day] = updatedTimetable[day].filter((sid) => sid !== id);
    }
    try {
      await updateSubjects(updatedSubjects);
      await updateTimetable(updatedTimetable);
    } catch (err) { console.error(err); }
  };

  const handleToggleTimetable = async (dayIndex, subjectId) => {
    const list = data.timetable[dayIndex] || [];
    const updatedList = list.includes(subjectId)
      ? list.filter((id) => id !== subjectId)
      : [...list, subjectId];
    try { await updateTimetable({ ...data.timetable, [dayIndex]: updatedList }); } catch(err) { console.error(err); }
  };

  const handleReorder = async (dayIndex, currentIndex, direction) => {
    const list = [...(data.timetable[dayIndex] || [])];
    const newIndex = currentIndex + direction;
    if (newIndex < 0 || newIndex >= list.length) return;
    
    const temp = list[currentIndex];
    list[currentIndex] = list[newIndex];
    list[newIndex] = temp;

    try { await updateTimetable({ ...data.timetable, [dayIndex]: list }); } catch(err) { console.error(err); }
  };

  const handleMarkAttendance = async (subjectId, status) => {
    try { await updateDailyRecord({ date: selectedDate, subjectId, status }); } catch(err) { console.error(err); }
  };

  const handleToggleHoliday = async () => {
    try { await toggleHoliday(selectedDate); } catch(err) { console.error(err); }
  };

  const analytics = useMemo(() => {
    const stats = {};
    if (!data.subjects) return { list: [], overallPercentage: 0, overallTotal: 0, overallAttended: 0 };

    data.subjects.forEach(s => {
      stats[s.id] = { name: s.name, total: parseFloat(s.totalClasses) || 0, attended: parseFloat(s.attendedClasses) || 0 };
    });

    const holidays = data.holidays || [];

    Object.keys(data.records || {}).forEach(date => {
      if (holidays.includes(date)) return; // Exclude holidays
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
      const percentage = item.total === 0 ? 0 : Number(((item.attended / item.total) * 100).toFixed(2));
      return { ...item, percentage };
    });

    const overallPercentage = overallTotal === 0 ? 0 : Number(((overallAttended / overallTotal) * 100).toFixed(2));

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
            {(() => {
              const activeIds = data.timetable[dIdx] || [];
              const activeSubjects = activeIds.map(id => data.subjects.find(s => s.id === id)).filter(Boolean);
              const inactiveSubjects = data.subjects.filter(s => !activeIds.includes(s.id));

              return (
                <>
                  {activeSubjects.map((s, index) => (
                    <div key={s.id} className={`${styles.timeSlot} ${styles.activeSlot}`}>
                      <div className={styles.slotContent} onClick={() => handleToggleTimetable(dIdx, s.id)}>
                        {s.name}
                      </div>
                      <div className={styles.reorderBtns}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleReorder(dIdx, index, -1); }}
                          disabled={index === 0}
                          className={styles.reorderBtn}
                          title="Move Up"
                        >▲</button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleReorder(dIdx, index, 1); }}
                          disabled={index === activeSubjects.length - 1}
                          className={styles.reorderBtn}
                          title="Move Down"
                        >▼</button>
                      </div>
                    </div>
                  ))}
                  {inactiveSubjects.map(s => (
                    <div key={s.id} className={styles.timeSlot} onClick={() => handleToggleTimetable(dIdx, s.id)}>
                      <div className={styles.slotContent}>
                        {s.name}
                      </div>
                    </div>
                  ))}
                </>
              );
            })()}
          </div>
        ))}
      </div>
    </div>
  );

  const renderEntryTab = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    const localDayOfWeek = localDate.getDay();

    const scheduledSubjectIds = data.timetable[localDayOfWeek] || [];
    const scheduledSubjects = scheduledSubjectIds.map(id => data.subjects.find(s => s.id === id)).filter(Boolean);
    
    const dayRecords = (data.records || {})[selectedDate] || {};
    const isHoliday = (data.holidays || []).includes(selectedDate);

    return (
      <div className={styles.entryContainer}>
        <div className={styles.datePickerWrap}>
          <label>Select Date:</label>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className={styles.dateInput}
            max={new Date().toISOString().split('T')[0]} 
          />
          <div className={styles.dayNameDisplay}>{DAYS[localDayOfWeek]}</div>
          <button 
            className={`${styles.holidayBtn} ${isHoliday ? styles.holidayActive : ''}`}
            onClick={handleToggleHoliday}
          >
            {isHoliday ? '🌴 Holiday' : 'Mark as Holiday'}
          </button>
        </div>

        {isHoliday ? (
          <div className={styles.holidayState}>
            <h3>Enjoy your Holiday! 🌴</h3>
            <p>Classes scheduled for today won't count towards your total attendance counts.</p>
          </div>
        ) : scheduledSubjects.length === 0 ? (
          <div className={styles.emptyState}>No classes scheduled for this day in the timetable.</div>
        ) : (
          <div className={styles.classList}>
            {scheduledSubjects.map(s => {
              const status = dayRecords[s.id];
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

  const renderCalendarGrid = () => {
    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const daysArray = Array.from({length: daysInMonth}, (_, i) => {
      let d = new Date(year, month, i + 1);
      const offset = d.getTimezoneOffset()
      d = new Date(d.getTime() - (offset*60*1000))
      return d.toISOString().split('T')[0]
    });

    return (
      <div className={styles.calendarContainer}>
        <h3 className={styles.subjectBreakdownTitle}>This Month Calendar</h3>
        <div className={styles.calendarGrid}>
          {daysArray.map(dateStr => {
            const isHol = (data.holidays || []).includes(dateStr);
            const r = (data.records || {})[dateStr] || {};
            const keys = Object.keys(r);
            let stateClass = styles.calNeutral;
            if (isHol) {
              stateClass = styles.calHoliday;
            } else if (keys.length > 0) {
              const presents = keys.filter(k => r[k] === 'present').length;
              if (presents === keys.length && presents > 0) stateClass = styles.calAllPresent;
              else if (presents > 0) stateClass = styles.calSomePresent;
              else stateClass = styles.calAbsent;
            }
            return (
              <div key={dateStr} className={`${styles.calDay} ${stateClass}`} title={dateStr}>
                {dateStr.split('-')[2]}
              </div>
            );
          })}
        </div>
        <div className={styles.calLegend}>
          <span className={styles.calAllPresent}>All Present</span>
          <span className={styles.calSomePresent}>Partial</span>
          <span className={styles.calAbsent}>Absent</span>
          <span className={styles.calHoliday}>Holiday</span>
        </div>
      </div>
    );
  };

  const renderAnalyticsTab = () => (
    <div className={styles.analyticsContainer}>
      <div className={styles.overallStat}>
        <h3>Overall Regular Attendance</h3>
        <div className={`${styles.bigCircle} ${
          analytics.overallPercentage < 65 ? styles.dangerCircle :
          analytics.overallPercentage < 75 ? styles.warningCircle :
          styles.successCircle
        }`}>
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
                className={`${styles.statBar} ${
                  s.percentage < 65 ? styles.dangerBar : 
                  s.percentage < 75 ? styles.warningBar : 
                  styles.successBar
                }`} 
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
      
      {renderCalendarGrid()}
    </div>
  );

  if (isLoading) return <div className={styles.loading}>Loading Attendance Data...</div>;
  if (isError) return <div className={styles.loading}>Error loading data.</div>;

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
