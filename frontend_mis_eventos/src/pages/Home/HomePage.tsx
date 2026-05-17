import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventsApi } from '../../api/events';
import { useRegisterEvent } from '../../hooks/useRegistrations';
import { useAuthStore } from '../../store/authStore';
import { useLenis } from '../../hooks/useLenis';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { useCounter } from '../../hooks/useCounter';
import SessionCard from '../../components/SessionCard/SessionCard';
import Marquee from '../../components/Marquee/Marquee';
import ParticleCanvas from '../../components/ParticleCanvas/ParticleCanvas';
import { getEventImage } from '../../utils/eventImages';
import type { Event } from '../../types';
import styles from './HomePage.module.css';

const STATS = [
  { target: 500, suffix: '+', label: 'Eventos realizados' },
  { target: 12000, suffix: '+', label: 'Asistentes registrados', format: true },
  { target: 80, suffix: '+', label: 'Artistas y DJs' },
  { target: 98, suffix: '%', label: 'Satisfacción del público' },
];

const HOW_IT_WORKS = [
  { icon: 'search', title: 'Explora', desc: 'Descubre los mejores eventos de tu ciudad — conciertos, fiestas, festivales y más.' },
  { icon: 'how_to_reg', title: 'Regístrate', desc: 'Asegura tu cupo en segundos. Sin filas, sin complicaciones.' },
  { icon: 'celebration', title: 'Disfruta', desc: 'Llega, muéstrate y vívelo al máximo. Así de simple.' },
];

const FEATURED_DJS = [
  { name: 'Ana Martínez',  genre: 'Conferencista · Innovación', img: 'https://images.unsplash.com/photo-1571266028243-d220c6a87954?auto=format&fit=crop&w=400&q=80' },
  { name: 'Carlos Ruiz',   genre: 'Artista · Música en vivo',   img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=400&q=80' },
  { name: 'Sofía Vargas',  genre: 'Ponente · Emprendimiento',   img: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=400&q=80' },
  { name: 'Luis Herrera',  genre: 'Organizador · Festivales',   img: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=400&q=80' },
];

export default function HomePage() {
  const [featuredEvent, setFeaturedEvent] = useState<Event | null>(null);
  const [moreEvents, setMoreEvents] = useState<Event[]>([]);
  const [spotlightEvent, setSpotlightEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useLenis();

  useEffect(() => {
    eventsApi
      .list({ page: 1, size: 4, search: undefined })
      .then((page) => {
        const shuffled = [...page.items].sort(() => Math.random() - 0.5);
        setFeaturedEvent(page.items[0] ?? null);
        setMoreEvents(page.items.slice(1));
        setSpotlightEvent(shuffled[0] ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <span className={styles.loadingDot} />
        <span className={styles.loadingDot} />
        <span className={styles.loadingDot} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <HeroSection event={featuredEvent} isAuthenticated={isAuthenticated} />
      <Marquee />
      <StatsSection />
      <Marquee reverse />
      {featuredEvent && <FeaturedEventSection event={featuredEvent} isAuthenticated={isAuthenticated} />}
      {moreEvents.length > 0 && <MoreEventsSection events={moreEvents} />}
      <HowItWorksSection />
      <DJsSection />
      {spotlightEvent && (
        <SpotlightSection event={spotlightEvent} isAuthenticated={isAuthenticated} />
      )}
      <CTASection isAuthenticated={isAuthenticated} onExplore={() => navigate('/events')} />
    </div>
  );
}

/* ── Hero ── */
function HeroSection({ event, isAuthenticated }: { event: Event | null; isAuthenticated: boolean }) {
  const { register, loading: regLoading, success: registered } = useRegisterEvent(event?.id ?? 0);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.classList.add(styles.heroTitleVisible);
  }, []);

  return (
    <section className={styles.hero}>
      <div className={styles.heroBg}>
        {event ? (
          <img
            className={styles.heroImg}
            src={getEventImage(event.id)}
            alt={event?.name ?? 'evento'}
          />
        ) : (
          <div className={styles.heroBgFallback} />
        )}
        <div className={styles.heroOverlay} />
        <div className={styles.heroNoise} />
      </div>

      <ParticleCanvas />
      <div className={styles.heroBgText} aria-hidden>EVENTS</div>

      <div className={styles.heroContent}>
        <span className={styles.heroPill}>
          <span className="material-symbols-outlined">bolt</span>
          Próximo evento
        </span>

        <h1 ref={titleRef} className={styles.heroTitle}>
          {event ? event.name : 'El party del año te espera'}
        </h1>

        {event?.description && (
          <p className={styles.heroDesc}>{event.description}</p>
        )}

        <div className={styles.heroMeta}>
          <div className={styles.heroMetaChip}>
            <span className="material-symbols-outlined">group</span>
            {event ? `${event.capacity} cupos` : '500 cupos'}
          </div>
          <div className={styles.heroMetaChip}>
            <span className="material-symbols-outlined">music_note</span>
            {event ? `${event.sessions.length} sesiones` : '3 sesiones'}
          </div>
          <div className={styles.heroMetaChip}>
            <span className="material-symbols-outlined">location_on</span>
            Neon District
          </div>
        </div>

        <div className={styles.heroActions}>
          {isAuthenticated && event?.status === 'published' ? (
            <button className={styles.btnPrimary} onClick={register} disabled={regLoading}>
              {registered ? '¡Registrado!' : regLoading ? 'Procesando...' : 'Reservar mi cupo'}
            </button>
          ) : !isAuthenticated ? (
            <Link to="/login" className={styles.btnPrimary}>Reservar mi cupo</Link>
          ) : null}
          <Link to="/events" className={styles.btnOutline}>Ver todos los eventos</Link>
        </div>
      </div>

      <div className={styles.heroScroll}>
        <span className={styles.heroScrollLine} />
        <span className={styles.heroScrollText}>Scroll</span>
      </div>
    </section>
  );
}

/* ── Stats ── */
function StatCounter({ target, suffix, label, format }: { target: number; suffix: string; label: string; format?: boolean }) {
  const { count, ref } = useCounter(target, 2000);
  const display = format && count >= 1000 ? `${(count / 1000).toFixed(1)}K` : String(count);
  return (
    <div className={styles.statItem}>
      <span ref={ref} className={styles.statValue}>{display}{suffix}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

function StatsSection() {
  const ref = useScrollReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`${styles.stats} reveal-block`}>
      {STATS.map((s) => <StatCounter key={s.label} {...s} />)}
    </div>
  );
}

/* ── Featured event detail ── */
function FeaturedEventSection({ event, isAuthenticated }: { event: Event; isAuthenticated: boolean }) {
  const { register, unregister, loading: regLoading, success: registered } = useRegisterEvent(event.id);
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref} className={`${styles.featuredSection} reveal-block`}>
      <div className={styles.featuredGrid}>
        <div className={styles.featuredImg}>
          <img src={getEventImage(event.id)} alt={event.name} />
          <div className={styles.featuredImgOverlay} />
          <span className={styles.featuredBadge}>{capitalize(event.status)}</span>
        </div>

        <div className={styles.featuredInfo}>
          <p className={styles.sectionLabel}>Evento destacado</p>
          <h2 className={styles.featuredTitle}>{event.name}</h2>
          {event.description && (
            <p className={styles.featuredDesc}>{event.description}</p>
          )}

          <div className={styles.featuredStats}>
            <div className={styles.featuredStat}>
              <span className={styles.featuredStatNum}>{event.capacity}</span>
              <span className={styles.featuredStatLabel}>Capacidad</span>
            </div>
            <div className={styles.featuredDivider} />
            <div className={styles.featuredStat}>
              <span className={styles.featuredStatNum}>{event.sessions.length}</span>
              <span className={styles.featuredStatLabel}>Sesiones</span>
            </div>
          </div>

          <div className={styles.featuredActions}>
            {isAuthenticated && event.status === 'published' && (
              registered ? (
                <button className={styles.btnSecondary} onClick={unregister} disabled={regLoading}>
                  {regLoading ? 'Procesando...' : 'Cancelar registro'}
                </button>
              ) : (
                <button className={styles.btnPrimary} onClick={register} disabled={regLoading}>
                  {regLoading ? 'Procesando...' : 'Registrarme ahora'}
                </button>
              )
            )}
            <Link to={`/events/${event.id}`} className={styles.btnOutline}>Ver detalles</Link>
          </div>

          {event.sessions.length > 0 && (
            <div className={styles.sessionsList}>
              <p className={styles.sessionsLabel}>Sesiones programadas</p>
              {event.sessions.map((s) => <SessionCard key={s.id} session={s} />)}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── More events ── */
function MoreEventsSection({ events }: { events: Event[] }) {
  const ref = useScrollReveal<HTMLElement>();
  const navigate = useNavigate();

  return (
    <section ref={ref} className={`${styles.moreSection} reveal-block`}>
      <div className={styles.sectionHeader}>
        <p className={styles.sectionLabel}>Próximamente</p>
        <h2 className={styles.sectionTitle}>Más eventos que no te puedes perder</h2>
      </div>

      <div className={styles.moreGrid}>
        {events.map((ev) => (
          <article key={ev.id} className={styles.moreCard} onClick={() => navigate(`/events/${ev.id}`)}>
            <div className={styles.moreCardImg}>
              <img src={getEventImage(ev.id)} alt={ev.name} />
              <div className={styles.moreCardOverlay} />
              <span className={styles.moreCardBadge}>{capitalize(ev.status)}</span>
            </div>
            <div className={styles.moreCardBody}>
              <h3 className={styles.moreCardTitle}>{ev.name}</h3>
              {ev.description && <p className={styles.moreCardDesc}>{ev.description}</p>}
              <div className={styles.moreCardMeta}>
                <span><span className="material-symbols-outlined">group</span>{ev.capacity}</span>
                <span><span className="material-symbols-outlined">music_note</span>{ev.sessions.length} sesiones</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.moreCta}>
        <Link to="/events" className={styles.btnOutline}>Ver todos los eventos</Link>
      </div>
    </section>
  );
}

/* ── How it works ── */
function HowItWorksSection() {
  const ref = useScrollReveal<HTMLElement>();
  return (
    <section ref={ref} className={`${styles.howSection} reveal-block`}>
      <div className={styles.sectionHeader}>
        <p className={styles.sectionLabel}>¿Cómo funciona?</p>
        <h2 className={styles.sectionTitle}>Tres pasos y ya estás dentro</h2>
      </div>
      <div className={styles.howGrid}>
        {HOW_IT_WORKS.map((step, i) => (
          <div key={step.title} className={styles.howCard}>
            <div className={styles.howNumber}>{String(i + 1).padStart(2, '0')}</div>
            <span className={`material-symbols-outlined ${styles.howIcon}`}>{step.icon}</span>
            <h3 className={styles.howTitle}>{step.title}</h3>
            <p className={styles.howDesc}>{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── DJs / Artists ── */
function DJsSection() {
  const ref = useScrollReveal<HTMLElement>();
  return (
    <section ref={ref} className={`${styles.djsSection} reveal-block`}>
      <div className={styles.sectionHeader}>
        <p className={styles.sectionLabel}>Destacados</p>
        <h2 className={styles.sectionTitle}>Ponentes y organizadores del momento</h2>
      </div>
      <div className={styles.djsGrid}>
        {FEATURED_DJS.map((dj) => (
          <div key={dj.name} className={styles.djCard}>
            <div className={styles.djImgWrapper}>
              <img src={dj.img} alt={dj.name} className={styles.djImg} />
              <div className={styles.djOverlay} />
            </div>
            <div className={styles.djInfo}>
              <p className={styles.djName}>{dj.name}</p>
              <p className={styles.djGenre}>{dj.genre}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Spotlight ── */
function SpotlightSection({ event, isAuthenticated }: { event: Event; isAuthenticated: boolean }) {
  const ref = useScrollReveal<HTMLElement>();
  const { register, loading: regLoading, success: registered } = useRegisterEvent(event.id);
  const filled = Math.min(Math.floor(Math.random() * 60) + 30, 95);

  return (
    <section ref={ref} className={`${styles.spotlight} reveal-block`}>
      <div className={styles.spotlightImg}>
        <img src={getEventImage(event.id + 3)} alt={event.name} />
        <div className={styles.spotlightImgOverlay} />
        <div className={styles.spotlightLabel}>
          <span className={styles.spotlightPulse} />
          En vivo próximamente
        </div>
      </div>

      <div className={styles.spotlightContent}>
        <p className={styles.spotlightEyebrow}>No te lo pierdas</p>
        <h2 className={styles.spotlightTitle}>{event.name}</h2>

        {event.description && (
          <p className={styles.spotlightDesc}>{event.description}</p>
        )}

        <div className={styles.spotlightCapacity}>
          <div className={styles.spotlightCapRow}>
            <span className={styles.spotlightCapLabel}>Cupos ocupados</span>
            <span className={styles.spotlightCapValue}>{filled}%</span>
          </div>
          <div className={styles.spotlightBar}>
            <div className={styles.spotlightBarFill} style={{ width: `${filled}%` }} />
          </div>
          <span className={styles.spotlightCapSub}>
            Quedan {Math.round(event.capacity * (1 - filled / 100))} de {event.capacity} lugares
          </span>
        </div>

        <div className={styles.spotlightActions}>
          {isAuthenticated && event.status === 'published' ? (
            <button className={styles.btnPrimary} onClick={register} disabled={regLoading || registered}>
              {registered ? '¡Ya estás registrado!' : regLoading ? 'Procesando...' : 'Asegurar mi lugar'}
            </button>
          ) : !isAuthenticated ? (
            <Link to="/login" className={styles.btnPrimary}>Asegurar mi lugar</Link>
          ) : null}
          <Link to={`/events/${event.id}`} className={styles.spotlightLink}>
            Ver detalles
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>

        <div className={styles.spotlightTrust}>
          <div className={styles.spotlightAvatars}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.spotlightAvatar} style={{ zIndex: 4 - i }}>
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <span className={styles.spotlightTrustText}>
            +{Math.round(event.capacity * filled / 100)} personas ya confirmaron
          </span>
        </div>
      </div>
    </section>
  );
}

/* ── CTA ── */
function CTASection({ isAuthenticated, onExplore }: { isAuthenticated: boolean; onExplore: () => void }) {
  const ref = useScrollReveal<HTMLElement>();
  return (
    <section ref={ref} className={`${styles.ctaSection} reveal-block`}>
      <div className={styles.ctaInner}>
        <span className={`material-symbols-outlined ${styles.ctaIcon}`}>celebration</span>
        <h2 className={styles.ctaTitle}>¿Listo para vivir la experiencia?</h2>
        <p className={styles.ctaDesc}>
          Miles de personas ya están registradas. No te quedes por fuera del mejor party del año.
        </p>
        <div className={styles.ctaActions}>
          {isAuthenticated ? (
            <button className={styles.btnPrimary} onClick={onExplore}>Explorar eventos</button>
          ) : (
            <>
              <Link to="/login" className={styles.btnPrimary}>Crear cuenta gratis</Link>
              <button className={styles.btnGhost} onClick={onExplore}>Explorar eventos</button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
