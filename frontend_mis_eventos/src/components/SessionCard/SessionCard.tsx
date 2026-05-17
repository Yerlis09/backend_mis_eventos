import type { EventSession } from '../../types';
import styles from './SessionCard.module.css';

interface SessionCardProps {
  session: EventSession;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function SessionCard({ session }: SessionCardProps) {
  const start = formatTime(session.start_datetime);
  const end = formatTime(session.end_datetime);

  return (
    <div className={styles.card}>
      <div className={styles.left}>
        <div className={styles.icon}>
          <span className="material-symbols-outlined">event_note</span>
        </div>
        <div className={styles.info}>
          <h3 className={styles.title}>{session.title}</h3>
          <p className={styles.speaker}>Speaker: {session.speaker} · Capacity: {session.capacity}</p>
        </div>
      </div>
      <div className={styles.right}>
        <span className={styles.time}>{start} - {end}</span>
        <span className={styles.period}>
          {new Date(session.start_datetime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  );
}
