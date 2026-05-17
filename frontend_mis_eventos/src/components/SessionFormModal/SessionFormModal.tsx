import { useEffect, useState } from 'react';
import { sessionsApi } from '../../api/sessions';
import { toast } from '../../store/toastStore';
import type { EventSession, SessionCreatePayload } from '../../types';
import styles from './SessionFormModal.module.css';

interface Props {
  eventId: number;
  session?: EventSession | null;
  onClose: () => void;
  onSaved: (session: EventSession, isNew: boolean) => void;
}

const toInputValue = (iso: string) => iso.slice(0, 16);
const toISO = (local: string) => new Date(local).toISOString();

export default function SessionFormModal({ eventId, session, onClose, onSaved }: Props) {
  const isEditing = Boolean(session);
  const [title, setTitle]       = useState(session?.title ?? '');
  const [speaker, setSpeaker]   = useState(session?.speaker ?? '');
  const [start, setStart]       = useState(session ? toInputValue(session.start_datetime) : '');
  const [end, setEnd]           = useState(session ? toInputValue(session.end_datetime) : '');
  const [capacity, setCapacity] = useState(String(session?.capacity ?? ''));
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!start || !end) { setError('Las fechas son obligatorias.'); return; }
    if (new Date(start) >= new Date(end)) {
      setError('La hora de inicio debe ser anterior a la hora de fin.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload: SessionCreatePayload = {
      title,
      speaker,
      start_datetime: toISO(start),
      end_datetime: toISO(end),
      capacity: Number(capacity),
    };

    try {
      let saved: EventSession;
      if (isEditing && session) {
        saved = await sessionsApi.update(eventId, session.id, payload);
        toast.success('Sesión actualizada correctamente.');
      } else {
        saved = await sessionsApi.create(eventId, payload);
        toast.success('¡Sesión creada con éxito!');
      }
      onSaved(saved, !isEditing);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      const msg = detail ?? 'Error al guardar la sesión.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isEditing ? 'Editar sesión' : 'Nueva sesión'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="s-title">Título *</label>
            <input
              id="s-title"
              className={styles.input}
              type="text"
              placeholder="ej. Keynote de apertura"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="s-speaker">Ponente / Speaker *</label>
            <input
              id="s-speaker"
              className={styles.input}
              type="text"
              placeholder="ej. Ana Martínez"
              value={speaker}
              onChange={(e) => setSpeaker(e.target.value)}
              required
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="s-start">Inicio *</label>
              <input
                id="s-start"
                className={styles.input}
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="s-end">Fin *</label>
              <input
                id="s-end"
                className={styles.input}
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="s-capacity">Capacidad *</label>
            <input
              id="s-capacity"
              className={styles.input}
              type="number"
              min={1}
              placeholder="ej. 100"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnSave} disabled={loading}>
              {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
