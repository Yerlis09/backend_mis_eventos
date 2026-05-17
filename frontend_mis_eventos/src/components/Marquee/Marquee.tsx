import styles from './Marquee.module.css';

const ITEMS = [
  'CONCIERTOS', 'CONFERENCIAS', 'FESTIVALES', 'TALLERES', 'NETWORKING',
  'EXPOSICIONES', 'LANZAMIENTOS', 'GALAS', 'SEMINARIOS', 'EXPERIENCIAS',
];

export default function Marquee({ reverse = false }: { reverse?: boolean }) {
  return (
    <div className={`${styles.wrapper} ${reverse ? styles.reverse : ''}`}>
      <div className={styles.track}>
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <span key={i} className={styles.item}>
            {item}
            <span className={styles.dot}>•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
