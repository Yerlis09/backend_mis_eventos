import type { EventStatus } from '../../../types';
import styles from './Badge.module.css';

interface BadgeProps {
  status: EventStatus;
}

const labelMap: Record<EventStatus, string> = {
  published: 'Published',
  draft: 'Draft',
  cancelled: 'Cancelled',
};

export default function Badge({ status }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      {labelMap[status]}
    </span>
  );
}
