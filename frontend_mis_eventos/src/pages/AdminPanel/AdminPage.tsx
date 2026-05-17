import { useState } from 'react';
import { useAdminUsers } from '../../hooks/useAdmin';
import { useAuthStore } from '../../store/authStore';
import Pagination from '../../components/ui/Pagination/Pagination';
import type { UserRole } from '../../types';
import styles from './AdminPage.module.css';

export default function AdminPage() {
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const { data, loading, error, updateRole, toggleActive } = useAdminUsers(page);

  if (user?.role !== 'admin') {
    return (
      <div className={styles.page}>
        <div className={styles.forbidden}>
          <span className="material-symbols-outlined">lock</span>
          <p>Access restricted to administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>User Management</h1>
          {data && (
            <span className={styles.totalBadge}>{data.total} total users</span>
          )}
        </div>
        <div className={styles.searchWrapper}>
          <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search by email..."
          />
        </div>
      </div>

      {loading && <div className={styles.loading}>Loading users...</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && data && (
        <div className={styles.tableWrapper}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.th}>Email</th>
                  <th className={styles.th}>Name</th>
                  <th className={styles.th}>Role</th>
                  <th className={`${styles.th} ${styles.thCenter}`}>Active</th>
                  <th className={styles.th}>Change Role</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Toggle</th>
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {data.items.map((u) => (
                  <tr key={u.id}>
                    <td className={styles.td}>{u.email}</td>
                    <td className={styles.td}>{u.full_name}</td>
                    <td className={styles.td}>
                      <span className={`${styles.roleBadge} ${styles[`role${capitalize(u.role)}`]}`}>
                        {capitalize(u.role)}
                      </span>
                    </td>
                    <td className={`${styles.td} ${styles.tdCenter}`}>
                      <div className={styles.dotWrapper}>
                        <div className={`${styles.dot} ${u.is_active ? styles.dotActive : styles.dotInactive}`} />
                      </div>
                    </td>
                    <td className={styles.td}>
                      <select
                        className={styles.roleSelect}
                        value={u.role}
                        onChange={(e) => updateRole(u.id, e.target.value as UserRole)}
                      >
                        <option value="attendee">Attendee</option>
                        <option value="organizer">Organizer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className={`${styles.td} ${styles.tdRight}`}>
                      <label className={styles.toggleLabel}>
                        <input
                          className={styles.toggleInput}
                          type="checkbox"
                          checked={u.is_active}
                          onChange={(e) => toggleActive(u.id, e.target.checked)}
                        />
                        <div className={styles.toggleTrack} />
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.tableFooter}>
            <p className={styles.footerInfo}>
              Showing <strong>{(page - 1) * 10 + 1}–{Math.min(page * 10, data.total)}</strong> of{' '}
              <strong>{data.total}</strong> users
            </p>
            <Pagination currentPage={page} totalPages={data.pages} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
