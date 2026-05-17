import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventsApi } from '../../api/events';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';
import type { EventStatus } from '../../types';
import styles from './EventFormPage.module.css';

export default function EventFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');
  const [status, setStatus] = useState<EventStatus>('draft');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carga datos si es edición
  useEffect(() => {
    if (!id) return;
    eventsApi.getById(Number(id)).then((ev) => {
      setName(ev.name);
      setDescription(ev.description ?? '');
      setCapacity(String(ev.capacity));
      setStatus(ev.status);
    });
  }, [id]);

  if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
    return (
      <div className={styles.page}>
        <div className={styles.forbidden}>
          <span className="material-symbols-outlined">lock</span>
          <p>Solo organizadores y administradores pueden crear o editar eventos.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name,
        description: description || undefined,
        capacity: Number(capacity),
        status,
      };
      if (isEditing) {
        await eventsApi.update(Number(id), payload);
        toast.success('Evento actualizado correctamente.');
      } else {
        await eventsApi.create(payload);
        toast.success('¡Evento creado con éxito!');
      }
      navigate('/events');
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      const msg = detail ?? 'Error al guardar el evento.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{isEditing ? 'Edit Event' : 'Create Event'}</h1>
        <p className={styles.subtitle}>
          {isEditing ? 'Update the event details below.' : 'Fill in the details to create a new event.'}
        </p>
      </div>

      <div className={styles.card}>
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="name">Event Name *</label>
            <input
              id="name"
              className={styles.input}
              type="text"
              placeholder="e.g. Global Tech Summit 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="description">Description</label>
            <textarea
              id="description"
              className={styles.textarea}
              placeholder="Describe the event..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="capacity">Capacity *</label>
              <input
                id="capacity"
                className={styles.input}
                type="number"
                min={0}
                placeholder="e.g. 200"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="status">Status</label>
              <select
                id="status"
                className={styles.select}
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button type="submit" className={styles.btnSubmit} disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
