import { useState } from 'react';
import { translations } from '../translations';
import { apiAdminLogin } from '../api/apiClient';

export default function AdminLogin({ onLoginSuccess, setActivePage, onGoBack, language = 'en' }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = translations[language] || translations.en;
  const isTe = language === 'te';

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await apiAdminLogin({ username, password });
      if (res && res.success && res.token) {
        onLoginSuccess();
        return;
      }
      // Local fallback if offline
      if (username.trim().toLowerCase() === 'admin' && password === 'admin123') {
        onLoginSuccess();
        return;
      }
      setErrorMsg(res?.error || t.invalidCreds);
    } catch {
      if (username.trim().toLowerCase() === 'admin' && password === 'admin123') {
        onLoginSuccess();
      } else {
        setErrorMsg(t.invalidCreds);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = () => {
    setUsername('admin');
    setPassword('admin123');
    setErrorMsg('');
  };

  return (
    <div className="page-anim" style={{ maxWidth: '480px', margin: '40px auto' }}>
      <div className="form-card-wrapper" style={{ borderTop: '4px solid var(--primary-700)' }}>
        <div className="form-header" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔐</div>
          <h3>{t.adminLoginTitle}</h3>
          <p>{t.adminLoginSubtitle}</p>
        </div>

        {errorMsg && (
          <div style={{
            background: '#ffebee',
            color: '#c62828',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '16px',
            border: '1px solid #ffcdd2'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="styled-form">
          <div className="form-group">
            <label htmlFor="adminUser">{t.adminUsername} *</label>
            <input
              id="adminUser"
              type="text"
              required
              placeholder="e.g. admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="adminPass">{t.adminPassword} *</label>
            <input
              id="adminPass"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary w-100" style={{ padding: '12px', fontSize: '15px' }}>
            {t.adminLoginBtn}
          </button>
        </form>

        <div style={{
          marginTop: '20px',
          padding: '12px',
          background: 'var(--primary-50)',
          borderRadius: 'var(--radius-sm)',
          border: '1px dashed var(--primary-300)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '12px', color: 'var(--primary-800)', fontWeight: '600', marginBottom: '8px' }}>
            💡 {t.demoCredsHint}
          </p>
          <button
            type="button"
            className="btn btn-outline-white"
            style={{
              borderColor: 'var(--primary-600)',
              color: 'var(--primary-700)',
              padding: '5px 12px',
              fontSize: '12px',
              background: 'white'
            }}
            onClick={handleFillDemo}
          >
            ⚡ {t.fillDemoCreds}
          </button>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            type="button"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px' }}
            onClick={onGoBack || (() => setActivePage('portal-select'))}
          >
            ← {isTe ? 'వెనుకకు వెళ్ళండి' : 'Go Back'}
          </button>
        </div>
      </div>
    </div>
  );
}
