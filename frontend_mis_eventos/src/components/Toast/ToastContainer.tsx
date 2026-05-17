import { useToastStore } from '../../store/toastStore';
import type { Toast } from '../../store/toastStore';
import styles from './ToastContainer.module.css';

const ICONS: Record<Toast['type'], string> = {
  success: 'check_circle',
  error:   'error',
  info:    'info',
  warning: 'warning',
};

export default function ToastContainer() {
  const { toasts, remove } = useToastStore();

  return (
    <div className={styles.container} aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
          <span className={`material-symbols-outlined ${styles.icon}`}>{ICONS[t.type]}</span>
          <span className={styles.message}>{t.message}</span>
          <button className={styles.close} onClick={() => remove(t.id)} aria-label="Cerrar">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      ))}
    </div>
  );
}
