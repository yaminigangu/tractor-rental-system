import { useState } from 'react';

export default function SettingsModal({
  isOpen,
  onClose,
  language = 'en',
  setLanguage,
  currentUser,
  onSignOut
}) {
  if (!isOpen) return null;

  const isTe = language === 'te';
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [unit, setUnit] = useState('acres');

  return (
    <div className="native-modal-overlay" onClick={onClose}>
      <div className="native-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="native-modal-header">
          <div className="modal-header-left">
            <span className="modal-header-icon">⚙️</span>
            <div>
              <h2 className="modal-header-title">{isTe ? 'సెట్టింగ్‌లు' : 'Settings'}</h2>
              <p className="modal-header-sub">
                {isTe ? 'భాష, ప్రాధాన్యతలు & ఖాతా' : 'Language, preferences & session'}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-scroll-body">
          {/* Language Selection */}
          <div className="settings-section">
            <label className="native-label">{isTe ? 'యాప్ భాష ఎంచుకోండి' : 'App Language'}</label>
            <div className="lang-buttons-grid">
              <button
                type="button"
                className={`lang-choice-btn ${language === 'te' ? 'active' : ''}`}
                onClick={() => setLanguage('te')}
              >
                <span>🌾</span>
                <span className="lang-choice-name">తెలుగు</span>
                <span className="lang-choice-badge">తెలంగాణ ప్రాధాన్యత</span>
              </button>
              <button
                type="button"
                className={`lang-choice-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => setLanguage('en')}
              >
                <span>🇬🇧</span>
                <span className="lang-choice-name">English</span>
                <span className="lang-choice-badge">Standard</span>
              </button>
            </div>
          </div>

          {/* Land Units */}
          <div className="settings-section">
            <label className="native-label">{isTe ? 'భూమి కొలత యూనిట్' : 'Land Area Unit'}</label>
            <div className="unit-buttons-grid">
              <button
                type="button"
                className={`unit-btn ${unit === 'acres' ? 'active' : ''}`}
                onClick={() => setUnit('acres')}
              >
                {isTe ? 'ఎకరాలు (Acres)' : 'Acres'}
              </button>
              <button
                type="button"
                className={`unit-btn ${unit === 'guntas' ? 'active' : ''}`}
                onClick={() => setUnit('guntas')}
              >
                {isTe ? 'గుంటలు (Guntas)' : 'Guntas'}
              </button>
            </div>
          </div>

          {/* Notification Alerts */}
          <div className="settings-section">
            <div className="setting-toggle-row">
              <div>
                <div className="toggle-label font-bold">
                  {isTe ? 'WhatsApp & SMS హెచ్చరికలు' : 'WhatsApp & SMS Alerts'}
                </div>
                <div className="toggle-sub text-muted">
                  {isTe ? 'బుకింగ్ అంగీకారాలు మరియు డిస్పాచ్ సందేశాలు' : 'Instant rental dispatches & receipts'}
                </div>
              </div>
              <input
                type="checkbox"
                className="native-toggle"
                checked={alertsEnabled}
                onChange={(e) => setAlertsEnabled(e.target.checked)}
              />
            </div>
          </div>

          {currentUser && (
            <button
              type="button"
              className="native-btn-danger mt-4"
              onClick={() => {
                onClose();
                onSignOut();
              }}
            >
              🚪 {isTe ? 'ఖాతా నుండి నిష్క్రమించండి' : 'Sign Out of Account'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

