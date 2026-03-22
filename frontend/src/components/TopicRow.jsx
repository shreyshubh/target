import styles from './TopicRow.module.css';

export default function TopicRow({ topicKey, text, done, onToggle }) {
  return (
    <div
      className={`${styles.row} ${done ? styles.rowDone : ''}`}
      onClick={() => onToggle(topicKey)}
      role="checkbox"
      aria-checked={done}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? onToggle(topicKey) : null}
    >
      <div className={`${styles.check} ${done ? styles.checkDone : ''}`}>
        {done && <span className={styles.checkmark} />}
      </div>
      <span className={`${styles.text} ${done ? styles.textDone : ''}`}>{text}</span>
    </div>
  );
}
