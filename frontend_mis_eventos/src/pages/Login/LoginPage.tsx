import { useState } from 'react';
import { useLogin, useRegister } from '../../hooks/useAuth';
import styles from './LoginPage.module.css';

type Tab = 'login' | 'register';

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('login');

  return (
    <div className={styles.page}>
      <div className={styles.glow} />
      <div className={styles.container}>
        <div className={styles.brand}>
          <div className={styles.logoBox}>
            <span className="material-symbols-outlined">event</span>
          </div>
          <h1 className={styles.brandName}>Mis Eventos</h1>
          <p className={styles.brandTagline}>Manage your experiences.</p>
        </div>

        <div className={styles.card}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab === 'login' ? styles.tabActive : ''}`}
              onClick={() => setTab('login')}
            >
              Login
            </button>
            <button
              className={`${styles.tab} ${tab === 'register' ? styles.tabActive : ''}`}
              onClick={() => setTab('register')}
            >
              Register
            </button>
          </div>

          {tab === 'login' ? <LoginForm /> : <RegisterForm onSuccess={() => setTab('login')} />}
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const { login, loading, error } = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.fieldGroup}>
        <div className={styles.labelRow}>
          <label className={styles.label} htmlFor="email">Email Address</label>
        </div>
        <div className={styles.inputWrapper}>
          <span className={`material-symbols-outlined ${styles.inputIcon}`}>mail</span>
          <input
            id="email"
            className={styles.input}
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <div className={styles.labelRow}>
          <label className={styles.label} htmlFor="password">Password</label>
          <a href="#" className={styles.forgotLink}>Forgot?</a>
        </div>
        <div className={styles.inputWrapper}>
          <span className={`material-symbols-outlined ${styles.inputIcon}`}>lock</span>
          <input
            id="password"
            className={styles.input}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      </div>

      <button className={styles.submitBtn} type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login to Account'}
        <span className="material-symbols-outlined">login</span>
      </button>
    </form>
  );
}

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const { register, loading, error } = useRegister();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register({ full_name: fullName, email, password });
    onSuccess();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="fullName">Full Name</label>
        <div className={styles.inputWrapper}>
          <span className={`material-symbols-outlined ${styles.inputIcon}`}>person</span>
          <input
            id="fullName"
            className={styles.input}
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="reg-email">Email Address</label>
        <div className={styles.inputWrapper}>
          <span className={`material-symbols-outlined ${styles.inputIcon}`}>mail</span>
          <input
            id="reg-email"
            className={styles.input}
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="reg-password">Password</label>
        <div className={styles.inputWrapper}>
          <span className={`material-symbols-outlined ${styles.inputIcon}`}>lock</span>
          <input
            id="reg-password"
            className={styles.input}
            type="password"
            placeholder="Min 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
      </div>

      <button className={styles.submitBtn} type="submit" disabled={loading}>
        {loading ? 'Creating account...' : 'Create Account'}
        <span className="material-symbols-outlined">person_add</span>
      </button>
    </form>
  );
}
