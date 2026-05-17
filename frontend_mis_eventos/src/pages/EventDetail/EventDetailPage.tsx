import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEventDetail } from '../../hooks/useEvents';
import { useRegisterEvent } from '../../hooks/useRegistrations';
import { useAuthStore } from '../../store/authStore';
import { eventsApi } from '../../api/events';
import { sessionsApi } from '../../api/sessions';
import { toast } from '../../store/toastStore';
import Badge from '../../components/ui/Badge/Badge';
import SessionCard from '../../components/SessionCard/SessionCard';
import SessionFormModal from '../../components/SessionFormModal/SessionFormModal';
import { getEventImage } from '../../utils/eventImages';
import type { EventSession } from '../../types';
import styles from './EventDetailPage.module.css';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const { event, loading, error } = useEventDetail(eventId);
  const { isAuthenticated, user } = useAuthStore();
  const { register, unregister, loading: regLoading, error: regError, success: registered } = useRegisterEvent(eventId);
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<EventSession[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<EventSession | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingEvent, setDeletingEvent] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDeleteEvent = async () => {
    if (!confirm(`¿Eliminar el evento "${event?.name}"? Esta acción no se puede deshacer.`)) return;
    setDeletingEvent(true);
    try {
      await eventsApi.remove(eventId);
      toast.success('Evento eliminado correctamente.');
      navigate('/events');
    } catch {
      toast.error('No se pudo eliminar el evento.');
      setDeletingEvent(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.skeleton}>
        {/* Hero skeleton */}
        <div className={styles.skeletonHero}>
          <div className={styles.skeletonHeroOverlay} />
          <div className={styles.skeletonHeroContent}>
            <div className={`${styles.skeletonBlock} ${styles.skeletonBadge}`} />
            <div className={`${styles.skeletonBlock} ${styles.skeletonTitle}`} />
            <div className={`${styles.skeletonBlock} ${styles.skeletonSubtitle}`} />
            <div className={styles.skeletonChips}>
              <div className={`${styles.skeletonBlock} ${styles.skeletonChip}`} />
              <div className={`${styles.skeletonBlock} ${styles.skeletonChip}`} />
              <div className={`${styles.skeletonBlock} ${styles.skeletonChip}`} />
            </div>
          </div>
          {/* Animated scan line */}
          <div className={styles.skeletonScan} />
        </div>

        {/* Stats strip skeleton */}
        <div className={styles.skeletonStrip}>
          {[0,1,2,3].map((i) => (
            <div key={i} className={styles.skeletonStripItem}>
              <div className={`${styles.skeletonBlock} ${styles.skeletonStatNum}`} />
              <div className={`${styles.skeletonBlock} ${styles.skeletonStatLabel}`} />
            </div>
          ))}
        </div>

        {/* Grid skeleton */}
        <div className={styles.skeletonGrid}>
          {/* Sessions */}
          <div className={styles.skeletonSessions}>
            <div className={`${styles.skeletonBlock} ${styles.skeletonSectionTitle}`} />
            {[0,1,2].map((i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonCardDot} />
                <div className={styles.skeletonCardBody}>
                  <div className={`${styles.skeletonBlock} ${styles.skeletonCardTitle}`} />
                  <div className={`${styles.skeletonBlock} ${styles.skeletonCardLine}`} />
                  <div className={`${styles.skeletonBlock} ${styles.skeletonCardLine} ${styles.skeletonCardLineShort}`} />
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className={styles.skeletonSidebar}>
            <div className={styles.skeletonSideCard} />
            <div className={`${styles.skeletonSideCard} ${styles.skeletonSideCardSm}`} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className={styles.errorScreen}>
        <span className="material-symbols-outlined">event_busy</span>
        <p>Evento no encontrado.</p>
        <Link to="/events" className={styles.errorLink}>Volver a eventos</Link>
      </div>
    );
  }

  const canEdit = user?.role === 'admin' || user?.role === 'organizer';

  // sessions state: null = use what came from the event fetch; set after mutations
  const displaySessions = sessions ?? event.sessions;

  const handleSaved = (saved: EventSession, isNew: boolean) => {
    setSessions(isNew
      ? [...displaySessions, saved]
      : displaySessions.map((s) => (s.id === saved.id ? saved : s)),
    );
    setModalOpen(false);
    setEditingSession(null);
  };

  const handleDelete = async (sessionId: number) => {
    if (!confirm('¿Eliminar esta sesión?')) return;
    setDeletingId(sessionId);
    try {
      await sessionsApi.remove(eventId, sessionId);
      setSessions(displaySessions.filter((s) => s.id !== sessionId));
      toast.success('Sesión eliminada.');
    } catch {
      toast.error('No se pudo eliminar la sesión.');
    } finally {
      setDeletingId(null);
    }
  };

  const openNew  = () => { setEditingSession(null); setModalOpen(true); };
  const openEdit = (s: EventSession) => { setEditingSession(s); setModalOpen(true); };

  const pageUrl = window.location.href;
  const shareText = `¡Mira este evento: ${event.name}!`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    toast.success('Enlace copiado al portapapeles.');
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${pageUrl}`)}`;

  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <img className={styles.heroImg} src={getEventImage(event.id)} alt={event.name} />
          <div className={styles.heroOverlay} />
        </div>

        {/* Breadcrumb */}
        <div className={styles.heroTop}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <span className="material-symbols-outlined">arrow_back</span>
            Volver
          </button>
          {canEdit && (
            <div className={styles.heroTopActions}>
              <Link to={`/events/${event.id}/edit`} className={styles.editBtn}>
                <span className="material-symbols-outlined">edit</span>
                Editar
              </Link>
              <button
                className={styles.deleteBtn}
                onClick={handleDeleteEvent}
                disabled={deletingEvent}
              >
                <span className="material-symbols-outlined">delete</span>
                {deletingEvent ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          )}
        </div>

        <div className={styles.heroContent}>
          <div className={styles.heroBadgeRow}>
            <Badge status={event.status} />
            <span className={styles.heroId}>#{event.id}</span>
          </div>

          <h1 className={styles.heroTitle}>{event.name}</h1>

          {event.description && (
            <p className={styles.heroDesc}>{event.description}</p>
          )}

          <div className={styles.heroChips}>
            <span className={styles.heroChip}>
              <span className="material-symbols-outlined">group</span>
              {event.capacity} participantes
            </span>
            <span className={styles.heroChip}>
              <span className="material-symbols-outlined">calendar_month</span>
              {displaySessions.length} sesiones
            </span>
            <span className={styles.heroChip}>
              <span className="material-symbols-outlined">location_on</span>
              Digital Innovation Hub
            </span>
          </div>
        </div>
      </section>

      {/* ── Quick stats strip ── */}
      <div className={styles.statsStrip}>
        <div className={styles.statStripItem}>
          <span className={styles.statStripNum}>{event.capacity}</span>
          <span className={styles.statStripLabel}>Capacidad total</span>
        </div>
        <div className={styles.statStripDivider} />
        <div className={styles.statStripItem}>
          <span className={styles.statStripNum}>{displaySessions.length}</span>
          <span className={styles.statStripLabel}>Sesiones</span>
        </div>
        <div className={styles.statStripDivider} />
        <div className={styles.statStripItem}>
          <span className={styles.statStripNum}>{capitalize(event.status)}</span>
          <span className={styles.statStripLabel}>Estado</span>
        </div>
        <div className={styles.statStripDivider} />
        <div className={styles.statStripItem}>
          <span className={styles.statStripNum}>Gratis</span>
          <span className={styles.statStripLabel}>Entrada</span>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className={styles.grid}>

        {/* Sessions column */}
        <div>
          <div className={styles.sectionHeading}>
            <span className="material-symbols-outlined">schedule</span>
            <h2>Agenda del evento</h2>
            <span className={styles.sessionCount}>{displaySessions.length}</span>
            {canEdit && (
              <button className={styles.addSessionBtn} onClick={openNew}>
                <span className="material-symbols-outlined">add</span>
                Añadir sesión
              </button>
            )}
          </div>

          {displaySessions.length === 0 ? (
            <div className={styles.emptySessions}>
              <span className="material-symbols-outlined">event_note</span>
              <p>Aún no hay sesiones programadas.</p>
              {canEdit
                ? <button className={styles.emptyAddBtn} onClick={openNew}>+ Crear primera sesión</button>
                : <span>Vuelve pronto para ver la agenda completa.</span>
              }
            </div>
          ) : (
            <div className={styles.sessionsList}>
              {displaySessions.map((s, i) => (
                <div key={s.id} className={styles.sessionRow}>
                  <div className={styles.sessionTimeline}>
                    <div className={styles.sessionDot} />
                    {i < displaySessions.length - 1 && <div className={styles.sessionLine} />}
                  </div>
                  <div className={styles.sessionCardWrapper}>
                    <SessionCard session={s} />
                    {canEdit && (
                      <div className={styles.sessionActions}>
                        <button className={styles.sessionEditBtn} onClick={() => openEdit(s)}>
                          <span className="material-symbols-outlined">edit</span>
                          Editar
                        </button>
                        <button
                          className={styles.sessionDeleteBtn}
                          onClick={() => handleDelete(s.id)}
                          disabled={deletingId === s.id}
                        >
                          <span className="material-symbols-outlined">delete</span>
                          {deletingId === s.id ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* About section */}
          {event.description && (
            <div className={styles.aboutSection}>
              <div className={styles.sectionHeading}>
                <span className="material-symbols-outlined">info</span>
                <h2>Acerca del evento</h2>
              </div>
              <div className={styles.aboutCard}>
                <p className={styles.aboutText}>{event.description}</p>
                <div className={styles.aboutTags}>
                  <span className={styles.tag}>Presencial</span>
                  <span className={styles.tag}>Registro gratuito</span>
                  <span className={styles.tag}>Cupos limitados</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky sidebar */}
        <aside className={styles.sidebar}>

          {/* Registration ticket card */}
          <div className={styles.ticketCard}>
            <div className={styles.ticketTop}>
              <p className={styles.ticketLabel}>Tu entrada</p>
              <span className={styles.ticketPrice}>GRATIS</span>
            </div>

            <div className={styles.ticketDivider}>
              <div className={styles.ticketNotch} />
              <div className={styles.ticketDash} />
              <div className={styles.ticketNotch} />
            </div>

            <div className={styles.ticketBody}>
              <div className={styles.ticketMeta}>
                <div className={styles.ticketMetaItem}>
                  <span className="material-symbols-outlined">event</span>
                  <div>
                    <p className={styles.ticketMetaLabel}>Evento</p>
                    <p className={styles.ticketMetaValue}>{event.name}</p>
                  </div>
                </div>
                <div className={styles.ticketMetaItem}>
                  <span className="material-symbols-outlined">group</span>
                  <div>
                    <p className={styles.ticketMetaLabel}>Capacidad</p>
                    <p className={styles.ticketMetaValue}>{event.capacity} personas</p>
                  </div>
                </div>
              </div>

              {regError && (
                <p className={styles.regError}>{regError}</p>
              )}

              {isAuthenticated && event.status === 'published' ? (
                registered ? (
                  <div className={styles.registeredState}>
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>¡Ya estás registrado!</span>
                    <button className={styles.cancelBtn} onClick={unregister} disabled={regLoading}>
                      {regLoading ? 'Procesando...' : 'Cancelar registro'}
                    </button>
                  </div>
                ) : (
                  <button className={styles.registerBtn} onClick={register} disabled={regLoading}>
                    <span className="material-symbols-outlined">confirmation_number</span>
                    {regLoading ? 'Procesando...' : 'Reservar entrada'}
                  </button>
                )
              ) : !isAuthenticated ? (
                <Link to="/login" className={styles.registerBtn}>
                  <span className="material-symbols-outlined">confirmation_number</span>
                  Inicia sesión para registrarte
                </Link>
              ) : (
                <div className={styles.unavailableMsg}>
                  <span className="material-symbols-outlined">info</span>
                  Registro no disponible
                </div>
              )}

              <button className={styles.calendarBtn}>
                <span className="material-symbols-outlined">calendar_add_on</span>
                Guardar en calendario
              </button>
            </div>
          </div>

          {/* Organizer card */}
          <div className={styles.sideCard}>
            <p className={styles.sideCardLabel}>ORGANIZADOR</p>
            <div className={styles.organizerRow}>
              <div className={styles.organizerAvatar}>
                <span className="material-symbols-outlined">person</span>
              </div>
              <div>
                <p className={styles.organizerName}>Mis Eventos Team</p>
                <p className={styles.organizerBadge}>
                  <span className="material-symbols-outlined">verified</span>
                  Organizador verificado
                </p>
              </div>
            </div>
          </div>

          {/* Share card */}
          <div className={styles.sideCard}>
            <p className={styles.sideCardLabel}>COMPARTIR EVENTO</p>

            <button className={styles.copyLinkBtn} onClick={handleCopy}>
              <span className="material-symbols-outlined">
                {copied ? 'check' : 'link'}
              </span>
              {copied ? '¡Copiado!' : 'Copiar enlace'}
            </button>

            <a
              className={`${styles.shareBtn} ${styles.shareBtnWa}`}
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Compartir en WhatsApp"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.557 4.126 1.527 5.855L.057 23.012a.75.75 0 0 0 .932.932l5.157-1.47A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.734 9.734 0 0 1-4.963-1.357l-.355-.212-3.684 1.05 1.05-3.684-.212-.355A9.734 9.734 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
              </svg>
              Compartir en WhatsApp
            </a>
          </div>

        </aside>
      </div>

      {modalOpen && (
        <SessionFormModal
          eventId={eventId}
          session={editingSession}
          onClose={() => { setModalOpen(false); setEditingSession(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
