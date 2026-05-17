import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import styles from './NavBar.module.css';

const ROLE_LABEL: Record<string, string> = {
  attendee: 'Asistente',
  organizer: 'Organizador',
  admin: 'Administrador',
};

export default function NavBar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(!isHome);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isHome) { setScrolled(true); return; }
    setScrolled(window.scrollY > 60);
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className={`${styles.header} ${scrolled ? styles.headerScrolled : styles.headerTransparent}`}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <NavLink to="/events" className={styles.logo}>Mis Eventos</NavLink>
          <nav className={styles.nav}>
            <NavLink
              to="/events"
              className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}
            >
              Events
            </NavLink>
            {isAuthenticated && (
              <NavLink
                to="/my-registrations"
                className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}
              >
                My Registrations
              </NavLink>
            )}
            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}
              >
                Admin Panel
              </NavLink>
            )}
          </nav>
        </div>

        <div className={styles.right}>
          {isAuthenticated && (user?.role === 'organizer' || user?.role === 'admin') && (
            <button className={styles.btnCreate} onClick={() => navigate('/events/new')}>
              Create Event
            </button>
          )}
          <div className={styles.actions}>
            {isAuthenticated ? (
              <div className={styles.avatarWrapper} ref={menuRef}>
                <div
                  className={styles.avatar}
                  title={user?.full_name ?? undefined}
                  onClick={() => setMenuOpen((o) => !o)}
                >
                  {user?.full_name?.charAt(0).toUpperCase() ?? 'U'}
                </div>

                {menuOpen && (
                  <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                      <div className={styles.dropdownAvatar}>
                        {user?.full_name?.charAt(0).toUpperCase() ?? 'U'}
                      </div>
                      <div>
                        <p className={styles.dropdownName}>{user?.full_name}</p>
                        <p className={styles.dropdownEmail}>{user?.email}</p>
                      </div>
                    </div>

                    <div className={styles.dropdownDivider} />

                    <div className={styles.dropdownRole}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>badge</span>
                      <div>
                        <p className={styles.dropdownRoleLabel}>Rol</p>
                        <p className={styles.dropdownRoleValue}>
                          {ROLE_LABEL[user?.role ?? ''] ?? user?.role}
                        </p>
                      </div>
                    </div>

                    <div className={styles.dropdownDivider} />

                    <button className={styles.dropdownLogout} onClick={handleLogout}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <NavLink to="/login" className={styles.btnLogin}>
                Login
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
