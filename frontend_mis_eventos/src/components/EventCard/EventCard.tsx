import { useNavigate } from 'react-router-dom';
import type { Event } from '../../types';
import Badge from '../ui/Badge/Badge';
import { getEventImage } from '../../utils/eventImages';
import styles from './EventCard.module.css';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const navigate = useNavigate();

  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        <img className={styles.image} src={getEventImage(event.id)} alt={event.name} />
        <div className={styles.badgeWrapper}>
          <Badge status={event.status} />
        </div>
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{event.name}</h3>
        {event.description && (
          <p className={styles.description}>{event.description}</p>
        )}

        <div className={styles.meta}>
          <div className={styles.metaItem}>
            <span className="material-symbols-outlined">group</span>
            <span>Capacity: {event.capacity}</span>
          </div>
          <div className={styles.metaItem}>
            <span className="material-symbols-outlined">schedule</span>
            <span>Sessions: {event.sessions.length}</span>
          </div>
        </div>

        <button className={styles.btn} onClick={() => navigate(`/events/${event.id}`)}>
          View details
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </article>
  );
}
