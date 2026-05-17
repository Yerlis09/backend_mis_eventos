import { useEventsList } from '../../hooks/useEvents';
import EventCard from '../../components/EventCard/EventCard';
import Pagination from '../../components/ui/Pagination/Pagination';
import styles from './EventsListPage.module.css';

export default function EventsListPage() {
  const { eventsPage, loading, error, searchQuery, currentPage, setSearchQuery, setCurrentPage } = useEventsList();

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading events...</div>
      ) : (
        <div className={styles.grid}>
          {eventsPage?.items.length === 0 ? (
            <div className={styles.empty}>
              <span className="material-symbols-outlined">event_busy</span>
              <p className={styles.emptyText}>No events found.</p>
            </div>
          ) : (
            eventsPage?.items.map((event) => <EventCard key={event.id} event={event} />)
          )}
        </div>
      )}

      {eventsPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={eventsPage.pages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
