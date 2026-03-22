import styles from './Tabs.module.css';

export default function Tabs({ tracks, activeId, onSelect }) {
  return (
    <nav className={styles.tabs} role="tablist">
      {tracks.map((track) => (
        <button
          key={track.id}
          role="tab"
          aria-selected={track.id === activeId}
          className={`${styles.tab} ${track.id === activeId ? styles.active : ''}`}
          onClick={() => onSelect(track.id)}
        >
          {track.label}
        </button>
      ))}
    </nav>
  );
}
