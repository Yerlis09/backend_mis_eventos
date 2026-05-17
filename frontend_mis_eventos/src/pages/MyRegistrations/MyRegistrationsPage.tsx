import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMyRegistrations } from '../../hooks/useRegistrations';
import { useAuthStore } from '../../store/authStore';
import Pagination from '../../components/ui/Pagination/Pagination';
import styles from './MyRegistrationsPage.module.css';

export default function MyRegistrationsPage() {
  const { isAuthenticated } = useAuthStore();
  const [page, setPage] = useState(1);
  const { data, loading, error } = useMyRegistrations(page);
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className={styles.page}>
        <div className={styles.unauthCard}>
          <span className="material-symbols-outlined">lock</span>
          <p className={styles.unauthText}>You need to be logged in to see your registrations.</p>
          <Link to="/login" className={styles.loginBtn}>Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Registrations</h1>
        <p className={styles.subtitle}>Events you're registered for.</p>
      </div>

      {loading && <div className={styles.loading}>Loading...</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && (
        <>
          {data?.items.length === 0 ? (
            <div className={styles.empty}>
              <span className="material-symbols-outlined">event_busy</span>
              <p className={styles.emptyText}>You haven't registered for any events yet.</p>
            </div>
          ) : (
            <div className={styles.list}>
              {data?.items.map((reg) => (
                <div key={reg.id} className={styles.card}>
                  <div className={styles.cardLeft}>
                    <div className={styles.cardIcon}>
                      <span className="material-symbols-outlined">event</span>
                    </div>
                    <div>
                      <p className={styles.cardTitle}>Event #{reg.event_id}</p>
                      <p className={styles.cardDate}>
                        Registered: {new Date(reg.registered_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    className={styles.viewBtn}
                    onClick={() => navigate(`/events/${reg.event_id}`)}
                  >
                    View
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {data && (
            <Pagination currentPage={page} totalPages={data.pages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
