import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import ActivityHeatmap from './ActivityHeatmap';
import MotivationalQuote from './MotivationalQuote';
import { fetchSyllabus, fetchProgress } from '../api';

const COLORS = ['#00cec9', '#6c5ce7', '#fdcb6e', '#ff7675', '#00b894', '#0984e3'];

export default function AnalyticsDashboard() {
  const [activityData, setActivityData] = useState([]);
  const [studyStats, setStudyStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch syllabus & progress via react-query
  const { data: syllabusData, isLoading: syllabusLoading } = useQuery({ queryKey: ['syllabus'], queryFn: fetchSyllabus });
  const { data: progressInfo, isLoading: progressLoading } = useQuery({ queryKey: ['progress'], queryFn: fetchProgress });

  useEffect(() => {
    async function fetchData() {
      try {
        const BASE_URL = import.meta.env.VITE_API_URL || '/api';
        const [actRes, studyRes] = await Promise.all([
          fetch(`${BASE_URL}/analytics/activity`, { credentials: 'include' }),
          fetch(`${BASE_URL}/study/stats`, { credentials: 'include' })
        ]);
        const actData = await actRes.json();
        const studyData = await studyRes.json();
        
        setActivityData(Array.isArray(actData) ? actData : []);
        setStudyStats(studyData || {});
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const tracks = syllabusData?.tracks || [];
  const progress = progressInfo?.progress || {};

  // 1. Prepare data for Recharts (Study Hours)
  const chartData = useMemo(() => {
    return tracks.map((track, i) => {
      const minutes = studyStats[track.id] || 0;
      return {
        name: track.label,
        hours: Number((minutes / 60).toFixed(1)), // convert min to hours
        color: COLORS[i % COLORS.length]
      };
    }).filter(d => d.hours > 0);
  }, [tracks, studyStats]);

  // 2. Prepare Deadline Calculator logic
  const deadlines = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    return tracks.filter(t => t.examDate).map(track => {
      let totalTopics = 0;
      let completedTopics = 0;
      
      (track.sections || []).forEach(sec => {
        (sec.topics || []).forEach(top => {
          totalTopics++;
          if (progress[`${track.id}::${sec.title}::${top}`]) {
            completedTopics++;
          }
        });
      });
      
      const exam = new Date(track.examDate);
      const daysLeft = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
      const remainingTopics = totalTopics - completedTopics;
      
      let statusString = "";
      let statusColor = "#b2bec3";
      
      if (remainingTopics === 0) {
        statusString = "✅ Completed!";
        statusColor = "#00b894";
      } else if (daysLeft < 0) {
        statusString = "⚠️ Exam passed";
        statusColor = "#ff7675";
      } else if (daysLeft === 0) {
        statusString = `🔥 Exam is TODAY! (${remainingTopics} left)`;
        statusColor = "#d63031";
      } else {
        const topicsPerWeek = (remainingTopics / (daysLeft / 7)).toFixed(1);
        statusString = `Deadline in ${daysLeft} days. Study ${topicsPerWeek} topics/week.`;
        statusColor = daysLeft < 14 ? "#fdcb6e" : "#0984e3";
      }

      return {
        id: track.id,
        label: track.label,
        remainingTopics,
        statusString,
        statusColor
      };
    });
  }, [tracks, progress]);

  const isDataLoading = loading || syllabusLoading || progressLoading;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px', paddingBottom: '80px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', color: '#fff', margin: '0 0 8px 0' }}>Your Dashboard</h2>
        <p style={{ color: '#b2bec3', margin: 0 }}>Track your consistency, review your stats, and build study habits.</p>
      </div>

      {isDataLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6c5ce7' }}>Loading your analytics... ⏳</div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          
          <MotivationalQuote />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            {/* Box 1: Recharts Hours Studied */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#fff' }}>Time Spent Studying</h3>
              {chartData.length === 0 ? (
                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                  No Pomodoro sessions logged yet.
                </div>
              ) : (
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer>
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{fill: '#b2bec3', fontSize: 12}} />
                      <YAxis stroke="rgba(255,255,255,0.5)" tick={{fill: '#b2bec3', fontSize: 12}} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'rgba(45, 52, 54, 0.95)', border: 'none', borderRadius: '8px', color: '#fff' }}
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      />
                      <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Box 2: Deadline Calculator */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#fff' }}>Exam Target Tracker</h3>
              {deadlines.length === 0 ? (
                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', textAlign: 'center', padding: '0 20px' }}>
                  Set a Target Date for your subjects in the Syllabus Manager to see deadlines.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
                  {deadlines.map(d => (
                    <div key={d.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: `4px solid ${d.statusColor}` }}>
                      <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{d.label}</div>
                      <div style={{ color: d.statusColor, fontSize: '13px', marginTop: '6px', fontWeight: 500 }}>
                        {d.statusString}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Box 3: Heatmap */}
          <ActivityHeatmap activityData={activityData} />
        </motion.div>
      )}
    </div>
  );
}
