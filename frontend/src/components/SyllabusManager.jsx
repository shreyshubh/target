import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSyllabus, addTrack, updateTrack, deleteTrack } from '../api';
import styles from './SyllabusManager.module.css';

// ── Syllabus Templates ──────────────────────────────────────
const TEMPLATES = [
  {
    label: '🖥️ CS / Software Engineering',
    tracks: [
      { id: 'dsa', label: 'Data Structures & Algorithms', sections: [
        { title: 'Arrays & Strings', topics: ['Two-pointer', 'Sliding window', 'Prefix sums', 'Binary search'] },
        { title: 'Trees & Graphs', topics: ['BFS', 'DFS', 'Binary trees', 'Shortest paths'] },
      ]},
      { id: 'web', label: 'Web Development', sections: [
        { title: 'Frontend', topics: ['HTML/CSS', 'JavaScript', 'React', 'State management'] },
        { title: 'Backend', topics: ['Node.js', 'REST APIs', 'Databases', 'Authentication'] },
      ]},
    ],
  },
  {
    label: '📊 Data Science / ML',
    tracks: [
      { id: 'math', label: 'Mathematics', sections: [
        { title: 'Linear Algebra', topics: ['Vectors', 'Matrices', 'Eigenvalues', 'SVD'] },
        { title: 'Statistics', topics: ['Probability', 'Distributions', 'Hypothesis testing', 'Regression'] },
      ]},
      { id: 'ml', label: 'Machine Learning', sections: [
        { title: 'Supervised Learning', topics: ['Linear regression', 'Decision trees', 'SVM', 'Neural networks'] },
        { title: 'Unsupervised Learning', topics: ['K-means', 'PCA', 'DBSCAN', 'Autoencoders'] },
      ]},
    ],
  },
  {
    label: '📝 GATE / Competitive Exams',
    tracks: [
      { id: 'core-cs', label: 'Core CS', sections: [
        { title: 'Operating Systems', topics: ['Process management', 'Memory management', 'File systems', 'Deadlocks'] },
        { title: 'DBMS', topics: ['ER diagrams', 'Normalization', 'SQL', 'Transactions'] },
        { title: 'Computer Networks', topics: ['OSI model', 'TCP/IP', 'Routing', 'Network security'] },
      ]},
    ],
  },
];

export default function SyllabusManager() {
  const queryClient = useQueryClient();
  const [newTrackLabel, setNewTrackLabel] = useState('');
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [addingSectionTo, setAddingSectionTo] = useState(null);
  const [addingTopicTo, setAddingTopicTo] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const { data: syllabusData, isLoading } = useQuery({
    queryKey: ['syllabus'],
    queryFn: fetchSyllabus,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['syllabus'] });

  const addTrackMutation = useMutation({
    mutationFn: ({ id, label }) => addTrack(id, label),
    onSuccess: invalidate,
  });

  const updateTrackMutation = useMutation({
    mutationFn: ({ trackId, data }) => updateTrack(trackId, data),
    onSuccess: invalidate,
  });

  const deleteTrackMutation = useMutation({
    mutationFn: (trackId) => deleteTrack(trackId),
    onSuccess: invalidate,
  });

  const tracks = syllabusData?.tracks || [];

  const handleAddTrack = async (e) => {
    e.preventDefault();
    if (!newTrackLabel.trim()) return;
    const id = newTrackLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    try {
      await addTrackMutation.mutateAsync({ id, label: newTrackLabel.trim() });
      setNewTrackLabel('');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteTrack = async (trackId, label) => {
    if (!window.confirm(`Delete subject "${label}" and all its sections?`)) return;
    try {
      await deleteTrackMutation.mutateAsync(trackId);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddSection = async (trackId) => {
    if (!newSectionTitle.trim()) return;
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;
    const updatedSections = [...track.sections, { title: newSectionTitle.trim(), topics: [] }];
    try {
      await updateTrackMutation.mutateAsync({ trackId, data: { sections: updatedSections } });
      setNewSectionTitle('');
      setAddingSectionTo(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteSection = async (trackId, sectionIndex) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;
    if (!window.confirm(`Delete section "${track.sections[sectionIndex].title}"?`)) return;
    const updatedSections = track.sections.filter((_, i) => i !== sectionIndex);
    try {
      await updateTrackMutation.mutateAsync({ trackId, data: { sections: updatedSections } });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddTopic = async (trackId, sectionIndex) => {
    if (!newTopic.trim()) return;
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;
    const updatedSections = track.sections.map((s, i) => {
      if (i === sectionIndex) {
        return { ...s, topics: [...s.topics, newTopic.trim()] };
      }
      return s;
    });
    try {
      await updateTrackMutation.mutateAsync({ trackId, data: { sections: updatedSections } });
      setNewTopic('');
      setAddingTopicTo(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteTopic = async (trackId, sectionIndex, topicIndex) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;
    const updatedSections = track.sections.map((s, i) => {
      if (i === sectionIndex) {
        return { ...s, topics: s.topics.filter((_, j) => j !== topicIndex) };
      }
      return s;
    });
    try {
      await updateTrackMutation.mutateAsync({ trackId, data: { sections: updatedSections } });
    } catch (err) {
      alert(err.message);
    }
  };

  // ── Apply template ──────────────────────────────────────
  const handleApplyTemplate = async (template) => {
    if (tracks.length > 0) {
      if (!window.confirm('This will ADD template subjects to your existing syllabus. Continue?')) return;
    }
    try {
      for (const t of template.tracks) {
        const exists = tracks.some(existing => existing.id === t.id);
        if (!exists) {
          await addTrackMutation.mutateAsync({ id: t.id, label: t.label });
          // Add sections to the newly created track
          await updateTrackMutation.mutateAsync({ trackId: t.id, data: { sections: t.sections } });
        }
      }
      setShowTemplates(false);
    } catch (err) {
      alert(err.message);
    }
  };

  if (isLoading) return <div className={styles.loading}>Loading syllabus...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>📝 Manage Your Syllabus</h2>
        <p className={styles.subtitle}>Add subjects and organize topics to track your learning progress</p>
      </div>

      {/* Add new subject */}
      <form onSubmit={handleAddTrack} className={styles.addForm}>
        <input
          value={newTrackLabel}
          onChange={(e) => setNewTrackLabel(e.target.value)}
          placeholder="Add a new subject (e.g., Data Structures, Web Dev...)"
          className={styles.input}
        />
        <button type="submit" className={styles.addBtn} disabled={addTrackMutation.isPending}>
          + Add Subject
        </button>
        <button type="button" onClick={() => setShowTemplates(!showTemplates)} className={styles.templateBtn}>
          📋 Templates
        </button>
      </form>

      {/* Templates */}
      {showTemplates && (
        <div className={styles.templateList}>
          <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600 }}>Quick-start Templates</h4>
          {TEMPLATES.map((tpl, i) => (
            <div key={i} className={styles.templateCard} onClick={() => handleApplyTemplate(tpl)}>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{tpl.label}</div>
              <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '2px' }}>
                {tpl.tracks.map(t => t.label).join(', ')}
              </div>
            </div>
          ))}
        </div>
      )}

      {tracks.length === 0 && !showTemplates && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📚</div>
          <p>No subjects yet. Add your first subject above or use a template!</p>
        </div>
      )}

      {/* Track list */}
      <div className={styles.trackList}>
        {tracks.map((track) => (
          <div key={track.id} className={styles.trackCard}>
            <div className={styles.trackHeader}>
              <h3 className={styles.trackLabel}>{track.label}</h3>
              <div className={styles.trackActions}>
                <span className={styles.badge}>{track.sections.length} sections</span>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDeleteTrack(track.id, track.label)}
                  title="Delete subject"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Sections */}
            <div className={styles.sectionList}>
              {track.sections.map((section, sIdx) => (
                <div key={sIdx} className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h4 className={styles.sectionTitle}>{section.title}</h4>
                    <div className={styles.sectionActions}>
                      <span className={styles.topicCount}>{section.topics.length} topics</span>
                      <button
                        className={styles.smallBtn}
                        onClick={() => setAddingTopicTo(
                          addingTopicTo?.trackId === track.id && addingTopicTo?.sectionIndex === sIdx
                            ? null
                            : { trackId: track.id, sectionIndex: sIdx }
                        )}
                      >
                        + Topic
                      </button>
                      <button
                        className={styles.deleteSectionBtn}
                        onClick={() => handleDeleteSection(track.id, sIdx)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Add topic form */}
                  {addingTopicTo?.trackId === track.id && addingTopicTo?.sectionIndex === sIdx && (
                    <div className={styles.inlineForm}>
                      <input
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        placeholder="New topic name..."
                        className={styles.inlineInput}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTopic(track.id, sIdx)}
                      />
                      <button className={styles.inlineBtn} onClick={() => handleAddTopic(track.id, sIdx)}>Add</button>
                    </div>
                  )}

                  {/* Topics */}
                  <div className={styles.topicList}>
                    {section.topics.map((topic, tIdx) => (
                      <div key={tIdx} className={styles.topicItem}>
                        <span className={styles.topicText}>• {topic}</span>
                        <button
                          className={styles.topicDeleteBtn}
                          onClick={() => handleDeleteTopic(track.id, sIdx, tIdx)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Add section */}
            {addingSectionTo === track.id ? (
              <div className={styles.inlineForm}>
                <input
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="New section title..."
                  className={styles.inlineInput}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSection(track.id)}
                />
                <button className={styles.inlineBtn} onClick={() => handleAddSection(track.id)}>Add</button>
                <button className={styles.cancelBtn} onClick={() => { setAddingSectionTo(null); setNewSectionTitle(''); }}>Cancel</button>
              </div>
            ) : (
              <button
                className={styles.addSectionBtn}
                onClick={() => setAddingSectionTo(track.id)}
              >
                + Add Section
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
