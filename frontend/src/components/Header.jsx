import styles from './Header.module.css';

export default function Header({ done, total }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <header className={styles.header}>
      <div className={styles.titleRow}>
        <div>
          <h1 className={styles.title}>CS Master Syllabus</h1>
          <p className={styles.subtitle}>
            Your complete checklist for placements, GATE &amp; top MS admissions
          </p>
        </div>
        <div className={styles.pctBadge}>{pct}%</div>
      </div>
      <div className={styles.barWrap}>
        <div className={styles.barFill} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.label}>
        {done} / {total} topics completed
      </div>
    </header>
  );
}
