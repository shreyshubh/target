import TopicRow from './TopicRow';
import styles from './TrackPanel.module.css';

export default function TrackPanel({ track, progress, onToggle }) {
  return (
    <div className={styles.panel}>
      {track.sections.map((section) => (
        <div key={section.title} className={styles.section}>
          <div className={styles.sectionTitle}>{section.title}</div>
          {section.topics.map((topic, i) => {
            const key = `${track.id}::${section.title}::${topic}`;
            return (
              <TopicRow
                key={key}
                topicKey={key}
                text={topic}
                done={!!progress[key]}
                onToggle={onToggle}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
