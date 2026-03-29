import React, { useMemo } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import 'react-calendar-heatmap/dist/styles.css';
import styles from './ActivityHeatmap.module.css';

// To calculate streaks, we scan backwards from today
function calculateStreaks(data) {
  if (!data || data.length === 0) return { currentStreak: 0, longestStreak: 0, totalActions: 0 };
  
  // Sort data strictly by date descending
  const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
  let totalActions = 0;
  
  // Build a fast lookup map
  const dateMap = {};
  sorted.forEach(d => {
    dateMap[d.date] = d.count;
    totalActions += d.count;
  });
  
  // 1. Current Streak
  let currentStreak = 0;
  let d = new Date();
  
  // We check today. If today has no activity, streak MIGHT be broken. 
  // However, it's common to count a streak as alive if yesterday was active (since today isn't over).
  let todayStr = d.toISOString().split('T')[0];
  d.setDate(d.getDate() - 1);
  let yesterdayStr = d.toISOString().split('T')[0];
  
  let checkDate = new Date(); // Start analyzing from today backwards
  let checkingToday = true;
  
  while (true) {
    let dateStr = checkDate.toISOString().split('T')[0];
    if (dateMap[dateStr] && dateMap[dateStr] > 0) {
      currentStreak++;
    } else if (checkingToday) {
      // If today is empty, we don't break the streak yet. We just move onto yesterday.
      // But if yesterday is also empty, the streak is 0.
    } else {
      break; // Streak broken
    }
    checkingToday = false;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // 2. Longest Streak
  let longestStreak = 0;
  let tempStreak = 0;
  
  // Get all dates between oldest log and today
  if (sorted.length > 0) {
    let oldestDateStr = sorted[sorted.length-1].date;
    let walkDate = new Date(oldestDateStr);
    let endDate = new Date();
    
    while (walkDate <= endDate) {
      let dStr = walkDate.toISOString().split('T')[0];
      if (dateMap[dStr] && dateMap[dStr] > 0) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
      walkDate.setDate(walkDate.getDate() + 1);
    }
  }
  
  return { currentStreak, longestStreak, totalActions };
}

export default function ActivityHeatmap({ activityData }) {
  // Activity data array of { date: 'YYYY-MM-DD', count: number }
  
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setDate(today.getDate() - 365);
  
  const formattedData = useMemo(() => {
    return (activityData || []).map(d => ({
      date: d.date,
      count: d.count
    }));
  }, [activityData]);
  
  const stats = useMemo(() => calculateStreaks(formattedData), [formattedData]);
  
  const getClassForValue = (value) => {
    if (!value || value.count === 0) return styles.colorEmpty;
    if (value.count === 1) return styles.colorScale1;
    if (value.count <= 3) return styles.colorScale2;
    if (value.count <= 6) return styles.colorScale3;
    return styles.colorScale4;
  };

  return (
    <div className={styles.heatmapCard}>
      <div className={styles.header}>
        <h3>Study Consistency</h3>
        <span className={styles.totalLogs}>{stats.totalActions} activities in the last year</span>
      </div>
      
      <div className={styles.streaksContainer}>
        <div className={styles.streakBox}>
          <span className={styles.streakVal}>{stats.currentStreak} <small>days</small></span>
          <span className={styles.streakLabel}>Current Streak</span>
        </div>
        <div className={styles.streakBox}>
          <span className={styles.streakVal}>{stats.longestStreak} <small>days</small></span>
          <span className={styles.streakLabel}>Longest Streak</span>
        </div>
      </div>

      <div className={styles.calendarWrapper}>
        <CalendarHeatmap
          startDate={oneYearAgo}
          endDate={today}
          values={formattedData}
          classForValue={getClassForValue}
          tooltipDataAttrs={(value) => {
            if (!value || !value.date) {
              return { 'data-tooltip-id': 'heatmap-tooltip', 'data-tooltip-content': 'No activity' };
            }
            return {
              'data-tooltip-id': 'heatmap-tooltip',
              'data-tooltip-content': `${value.count} activity on ${value.date}`,
            };
          }}
          showWeekdayLabels={true}
        />
        <ReactTooltip id="heatmap-tooltip" className={styles.tooltip} variant="dark" />
      </div>
    </div>
  );
}
