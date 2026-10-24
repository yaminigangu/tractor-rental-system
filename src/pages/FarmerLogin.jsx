import { useState } from 'react';
import { translations } from '../translations';
import { findFarmerByMobile } from '../data/userData';

export default function FarmerLogin({
  setActivePage,
  setCurrentFarmer,
  setOnboardingMobile,
  language = 'en'
}) {
  const t = translations[language] || translations.en;
  const isTe = language === 'te';

  const [mobile, setMobile] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const cleanMobile = mobile.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length < 10) {
      setErrorMsg(isTe ? 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.' : 'Please enter a valid 10-digit mobile number.');
      return;
    }

    // Check if farmer exists in registered records
    const existingFarmer = findFarmerByMobile(cleanMobile);

    if (existingFarmer) {
      // Existing farmer -> Login directly & go to Find Tractor
      if (setCurrentFarmer) {
        setCurrentFarmer(existingFarmer);
        try {
          localStorage.setItem('agri_current_farmer', JSON.stringify(existingFarmer));
        } catch (err) {
          console.warn(err);
        }
      }
      setActivePage('find-tractor');
    } else {
      // Farmer does NOT exist -> Immediately direct to Farmer Onboarding page!
      if (setOnboardingMobile) {
        setOnboardingMobile(cleanMobile);
      }
      setActivePage('farmer-onboarding');
    }
  };

  return (
    <div className="auth-screen-wrapper page-anim">
      <div className="auth-device-frame">
        <div className="auth-login-card page-anim">
          {/* Top Brand & Farmer Pill Header */}
          <div className="auth-brand-row">
            <div className="auth-brand-icon-box" style={{ background: '#ecfdf5', color: '#059669' }}>
              🌾
            </div>
            <span className="auth-brand-name">AGRIRENT</span>
            <span className="auth-role-badge" style={{ background: '#166534' }}>
              FARMER
            </span>
          </div>

          {/* Login Title & Subtitle */}
          <h1 className="auth-title">Login</h1>
          <p className="auth-subtitle">
            {isTe ? 'కొనసాగించడానికి మీ మొబైల్ నంబర్‌ను నమోదు చేయండి' : 'Enter your mobile number to continue'}
          </p>

          {/* Error Message */}
          {errorMsg && (
            <div className="captain-alert-error" style={{ marginBottom: '16px' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Mobile Number Input with +91 Prefix */}
          <form onSubmit={handleLogin}>
            <div className="auth-phone-input-box">
              <span className="auth-country-code">+91</span>
              <input
                type="tel"
                maxLength={10}
                className="auth-input-phone"
                placeholder="Enter mobile number"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value.replace(/\D/g, ''));
                  setErrorMsg('');
                }}
                autoFocus
              />
            </div>

            {/* Continue Button */}
            <button
              type="submit"
              className="auth-btn-continue"
              style={{ background: '#1b5e20' }}
            >
              <span>{isTe ? 'కొనసాగించండి' : 'Continue'}</span>
              <span>→</span>
            </button>
          </form>

          {/* Legal Disclaimer */}
          <p className="auth-legal-text">
            By continuing, you agree to our{' '}
            <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a> and{' '}
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>.
          </p>

          {/* Quick Demo Options for testing */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '8px', textAlign: 'center' }}>
              💡 FAST TESTING OPTIONS:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                type="button"
                className="btn btn-outline-white"
                style={{ fontSize: '11.5px', padding: '6px 10px', textAlign: 'left', color: '#166534', borderColor: '#bbf7d0' }}
                onClick={() => {
                  setMobile('9848022334');
                  setErrorMsg('');
                }}
              >
                ⚡ Existing Farmer: Kondal Rao (9848022334)
              </button>
              <button
                type="button"
                className="btn btn-outline-white"
                style={{ fontSize: '11.5px', padding: '6px 10px', textAlign: 'left', color: '#1e40af', borderColor: '#bfdbfe' }}
                onClick={() => {
                  setMobile('9848552134');
                  setErrorMsg('');
                }}
              >
                ⚡ Existing Farmer: Laxminarayana (9848552134)
              </button>
              <button
                type="button"
                className="btn btn-outline-white"
                style={{ fontSize: '11.5px', padding: '6px 10px', textAlign: 'left', color: '#d97706', borderColor: '#fde68a' }}
                onClick={() => {
                  setMobile('9700012345');
                  setErrorMsg('');
                  if (setOnboardingMobile) setOnboardingMobile('9700012345');
                  setActivePage('farmer-onboarding'); // Direct to Onboarding!
                }}
              >
                ⚡ New Farmer (+91 9700012345): Direct to Onboarding
              </button>
            </div>
          </div>

          {/* Switch to Tractor Owner Login */}
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: '#1b4958', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}
              onClick={() => setActivePage('owner-registration')}
            >
              🚜 {isTe ? 'ట్రాక్టర్ యజమాని / కెప్టెన్ లాగిన్ ఇక్కడ' : 'Are you a Tractor Owner? Captain Login here'}
            </button>
          </div>

          {/* Powered by tag */}
          <div className="auth-powered-by">
            powered by <strong>Aamblv Technologies</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
