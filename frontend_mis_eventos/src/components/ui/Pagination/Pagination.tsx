import styles from './Pagination.module.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPageList(currentPage, totalPages);

  return (
    <nav className={styles.nav}>
      <button
        className={styles.iconBtn}
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Página anterior"
      >
        <span className="material-symbols-outlined">chevron_left</span>
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className={styles.dots}>...</span>
        ) : (
          <button
            key={p}
            className={`${styles.page} ${p === currentPage ? styles.pageActive : ''}`}
            onClick={() => onPageChange(p as number)}
          >
            {p}
          </button>
        ),
      )}

      <button
        className={styles.iconBtn}
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Página siguiente"
      >
        <span className="material-symbols-outlined">chevron_right</span>
      </button>
    </nav>
  );
}

function buildPageList(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | string)[] = [1];

  if (current > 3) pages.push('...');

  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p);
  }

  if (current < total - 2) pages.push('...');
  pages.push(total);

  return pages;
}
