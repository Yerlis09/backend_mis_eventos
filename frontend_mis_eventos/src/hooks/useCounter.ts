import { useEffect, useRef, useState } from 'react';

export function useCounter(target: number, duration = 1800, startOnVisible = true) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!startOnVisible) { animateCount(); return; }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          animateCount();
          observer.unobserve(el);
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();

    function animateCount() {
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        setCount(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, [target, duration, startOnVisible]);

  return { count, ref };
}
