import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.brandName}>Mis Eventos</span>
          <span className={styles.copyright}>© 2024 Mis Eventos. All rights reserved.</span>
        </div>
        <div className={styles.links}>
          <a href="#" className={styles.link}>Privacy Policy</a>
          <a href="#" className={styles.link}>Terms of Service</a>
          <a href="#" className={styles.link}>Contact Support</a>
          <a href="#" className={styles.link}>About Us</a>
        </div>
      </div>
    </footer>
  );
}
