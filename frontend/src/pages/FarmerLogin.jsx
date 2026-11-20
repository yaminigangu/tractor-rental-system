import { useState } from 'react';
import { translations } from '../translations';
import { saveRegisteredFarmer, findFarmerByMobile, findOwnerByMobile } from '../data/userData';
import {
  apiSendOtp,
  apiVerifyOtp,
  setStoredAuthToken,
  apiGetSessionToken,
  apiRegisterUser,
  apiLoginUser
} from '../api/apiClient';

export default function FarmerLogin({
  setActivePage,
  onGoBack,
  setCurrentFarmer,
  setOnboardingMobile,
  language = 'en',
  setLanguage,
  selectedLocation
}) {
  const t = translations[language] || translations.en;
  const isTe = language === 'te';

  const defaultVillage = selectedLocation
    ? (isTe ? (selectedLocation.villageTe || selectedLocation.village) : selectedLocation.village)
    : 'Hasanparthy';

  // Auth Mode: 'login' (existing user) or 'register' (first-time user)
  const [authMode, setAuthMode] = useState('login');

  // Login Method: 'password' (default credentials) or 'otp' (Message Central SMS OTP)
  const [loginMethod, setLoginMethod] = useState('password');

  // ----------------------------------------------------
  // FLOW 1: EXISTING USER LOGIN VIA PASSWORD & PERSISTENT SESSION
  // ----------------------------------------------------
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginNotice, setLoginNotice] = useState('');

  // OTP Login sub-flow
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtp, setLoginOtp] = useState('');
  const [loginVerificationId, setLoginVerificationId] = useState('');
  const [loginMatchedFarmer, setLoginMatchedFarmer] = useState(null);
  const [matchedOwnerHint, setMatchedOwnerHint] = useState(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // ----------------------------------------------------
  // FLOW 2: FIRST-TIME FARMER REGISTRATION
  // ----------------------------------------------------
  const [regFullName, setRegFullName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regVillage, setRegVillage] = useState(defaultVillage);
  const [regLandArea, setRegLandArea] = useState('3.0');
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);
  const [regError, setRegError] = useState('');
  const [regNotice, setRegNotice] = useState('');

  const toggleLanguage = () => {
    if (setLanguage) {
      setLanguage(prev => (prev === 'en' ? 'te' : 'en'));
    }
  };

  const cleanPhone = (val) => String(val || '').replace(/\D/g, '');

  const maskPhone = (phone) => {
    const p = cleanPhone(phone);
    if (p.length >= 10) {
      return `${p.slice(0, 2)}******${p.slice(-2)}`;
    }
    return p;
  };

  // Switch to Register flow from Login
  const handleSwitchToRegister = (prefillPhone) => {
    setAuthMode('register');
    setLoginError('');
    setLoginNotice('');
    setRegError('');
    setRegNotice('');
    if (prefillPhone) {
      setRegMobile(prefillPhone);
    }
  };

  // Switch to Login flow
  const handleSwitchToLogin = (prefillPhone) => {
    setAuthMode('login');
    setRegError('');
    setRegNotice('');
    setLoginError('');
    setLoginNotice('');
    if (prefillPhone) {
      setLoginIdentifier(prefillPhone);
      setLoginPhone(prefillPhone);
    }
  };

  // ====================================================
  // ACTION: Password Login with Remember Me & Session Storage
  // ====================================================
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginNotice('');

    const idVal = loginIdentifier.trim();
    if (!idVal) {
      setLoginError(isTe ? 'దయచేసి మీ మొబైల్ లేదా ఈమెయిల్ నమోదు చేయండి.' : 'Please enter your mobile number or email address.');
      return;
    }

    if (!loginPassword) {
      setLoginError(isTe ? 'దయచేసి మీ పాస్‌వర్డ్ నమోదు చేయండి.' : 'Please enter your account password.');
      return;
    }

    setIsSubmittingLogin(true);
    try {
      const res = await apiLoginUser({
        identifier: idVal,
        password: loginPassword,
        role: 'farmer',
        rememberMe
      });

      if (!res || !res.success) {
        setLoginError(
          res?.error ||
          (isTe ? 'లాగిన్ విఫలమైంది. దయచేసి వివరాలు సరిచూడండి.' : 'Login failed. Please verify your mobile/email and password.')
        );
        setIsSubmittingLogin(false);
        return;
      }

      // Session established with JWT
      if (res.token) {
        setStoredAuthToken(res.token, rememberMe);
      }

      const activeUser = res.user || {
        name: res.user?.name || idVal,
        mobile: res.user?.mobile || idVal,
        email: res.user?.email || '',
        village: res.user?.village || defaultVillage,
        landArea: res.user?.landArea || 3.0,
        isVerified: true
      };

      try {
        localStorage.setItem('agri_current_farmer', JSON.stringify(activeUser));
      } catch (err) {
        console.warn('Storage warning:', err);
      }

      if (setCurrentFarmer) {
        setCurrentFarmer(activeUser);
      }

      setLoginNotice(isTe ? '✓ విజయవంతంగా లాగిన్ అయ్యారు! స్వాగతం.' : '✓ Logged in successfully! Directing to fleet...');
      setTimeout(() => {
        setActivePage('find-tractor');
      }, 500);
    } catch (err) {
      setLoginError(err.message || 'Network error during login. Please try again.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  // ====================================================
  // ACTION: Register New Farmer with Validation & Auto-Login
  // ====================================================
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegNotice('');

    // Validations
    const nameVal = regFullName.trim();
    if (nameVal.length < 2) {
      setRegError(isTe ? 'దయచేసి సరైన రైతు పూర్తి పేరు నమోదు చేయండి (కనీసం 2 అక్షరాలు).' : 'Please enter a valid full name (at least 2 letters).');
      return;
    }

    const phoneVal = cleanPhone(regMobile);
    if (phoneVal.length !== 10) {
      setRegError(isTe ? 'దయచేసి ఖచ్చితమైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.' : 'Please enter an exact 10-digit mobile number.');
      return;
    }

    const emailVal = regEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
      setRegError(isTe ? 'దయచేసి సరైన ఈమెయిల్ చిరునామా నమోదు చేయండి (ఉదా: farmer@gmail.com).' : 'Please enter a valid email address (e.g. farmer@gmail.com).');
      return;
    }

    if (regPassword.length < 6) {
      setRegError(isTe ? 'పాస్‌వర్డ్ కనీసం 6 అక్షరాలు లేదా అంకెలు ఉండాలి.' : 'Password must be at least 6 characters long.');
      return;
    }

    setIsSubmittingReg(true);
    try {
      const payload = {
        name: nameVal,
        mobile: phoneVal,
        email: emailVal,
        password: regPassword,
        village: regVillage.trim() || defaultVillage,
        district: selectedLocation?.district || 'Hanamkonda',
        landArea: parseFloat(regLandArea) || 3.0,
        role: 'farmer'
      };

      const res = await apiRegisterUser(payload);

      if (!res || !res.success) {
        setRegError(
          res?.error ||
          (isTe ? 'నమోదు విఫలమైంది. ఈ మొబైల్ లేదా ఈమెయిల్ ఇప్పటికే వాడుకలో ఉండవచ్చు.' : 'Registration failed. This mobile or email might already be registered.')
        );
        setIsSubmittingReg(false);
        return;
      }

      // Auto-login upon successful registration
      if (res.token) {
        setStoredAuthToken(res.token, true);
      }

      const newFarmer = res.user || {
        id: res.user?.id || Date.now(),
        name: nameVal,
        mobile: phoneVal,
        email: emailVal,
        village: regVillage.trim() || defaultVillage,
        district: selectedLocation?.district || 'Hanamkonda',
        landArea: parseFloat(regLandArea) || 3.0,
        crops: ['Paddy', 'Cotton'],
        isVerified: true,
        registeredAt: new Date().toISOString().split('T')[0]
      };

      saveRegisteredFarmer(newFarmer);

      try {
        localStorage.setItem('agri_current_farmer', JSON.stringify(newFarmer));
      } catch (err) {
        console.warn('Storage warning:', err);
      }

      if (setCurrentFarmer) {
        setCurrentFarmer(newFarmer);
      }

      setRegNotice(isTe ? '✓ మీ రైతు ఖాతా విజయవంతంగా సృష్టించబడింది! స్వయంచాలకంగా లాగిన్ అవుతున్నారు...' : '✓ Account created successfully! Logging you in automatically...');
      setTimeout(() => {
        setActivePage('find-tractor');
      }, 700);
    } catch (err) {
      setRegError(err.message || 'Network error during registration. Please try again.');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  // ====================================================
  // OPTIONAL: Send Login OTP via Message Central VerifyNow
  // ====================================================
  const handleSendLoginOtp = async (e) => {
    if (e) e.preventDefault();
    setLoginError('');
    setLoginNotice('');

    const phone = cleanPhone(loginPhone);
    if (phone.length < 10) {
      setLoginError(isTe ? 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.' : 'Please enter a valid 10-digit mobile number.');
      return;
    }

    const matched = findFarmerByMobile(phone);
    if (!matched) {
      const matchedOwner = findOwnerByMobile(phone);
      if (matchedOwner) {
        setMatchedOwnerHint(matchedOwner);
        setLoginError(
          isTe
            ? `ఈ మొబైల్ (+91 ${phone}) వాహన యజమానిగా నమోదై ఉంది!`
            : `Mobile +91 ${phone} is registered as a Vehicle Owner!`
        );
        return;
      }

      setMatchedOwnerHint(null);
      setLoginError(
        isTe
          ? `మొబైల్ +91 ${phone} నమోదు కాలేదు. దయచేసి ఖాతా నమోదు చేసుకోండి.`
          : `Mobile +91 ${phone} is not registered. Please create a new account.`
      );
      return;
    }

    setMatchedOwnerHint(null);
    setLoginMatchedFarmer(matched);
    setIsSendingOtp(true);

    try {
      const res = await apiSendOtp({ mobileNumber: phone });
      setLoginVerificationId(res.verificationId || '');
      setLoginOtpSent(true);

      if (res.demoOtp) {
        setLoginOtp(res.demoOtp);
      } else {
        setLoginOtp('');
      }

      setLoginNotice(
        isTe
          ? `✓ +91 ${maskPhone(phone)} కి SMS ధృవీకరణ OTP పంపబడింది!`
          : `✓ Verification OTP sent to +91 ${maskPhone(phone)} via Message Central!`
      );
    } catch (err) {
      setLoginError(err.message || 'Failed to dispatch SMS OTP. Please retry.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyLoginOtp = async (e) => {
    if (e) e.preventDefault();
    setLoginError('');

    if (loginOtp.trim().length < 4) {
      setLoginError(isTe ? 'దయచేసి సరైన OTP కోడ్ నమోదు చేయండి.' : 'Please enter the OTP verification code.');
      return;
    }

    if (!loginMatchedFarmer) {
      setLoginError('Account session expired. Please re-enter your mobile number.');
      setLoginOtpSent(false);
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await apiVerifyOtp({
        verificationId: loginVerificationId,
        code: loginOtp.trim(),
        mobileNumber: loginMatchedFarmer.mobile,
      });

      if (!res.success || !res.verified) {
        setLoginError(res.error || (isTe ? 'తప్పుడు OTP కోడ్.' : 'Invalid OTP code. Please retry.'));
        setIsVerifyingOtp(false);
        return;
      }

      if (res.token) {
        setStoredAuthToken(res.token, true);
      } else {
        apiGetSessionToken(loginMatchedFarmer).catch(() => {});
      }

      try {
        localStorage.setItem('agri_current_farmer', JSON.stringify(loginMatchedFarmer));
      } catch (err) {
        console.warn(err);
      }

      if (setCurrentFarmer) {
        setCurrentFarmer(loginMatchedFarmer);
      }

      setActivePage('find-tractor');
    } catch (err) {
      setLoginError(err.message || 'OTP verification error. Please retry.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="signin-page-viewport page-anim">
      {/* Background Animated Floating Elements */}
      <div className="auth-bg-particles" aria-hidden="true">
        <span className="bg-particle p1">🌾</span>
        <span className="bg-particle p2">✨</span>
        <span className="bg-particle p3">🌱</span>
        <span className="bg-particle p4">🚜</span>
        <span className="bg-particle p5">✨</span>
        <span className="bg-particle p6">🌾</span>
      </div>

      <div className="signin-center-wrapper">
        {/* Top Header Bar */}
        <header className="signin-top-nav">
          <div className="signin-nav-left">
            <button
              type="button"
              className="signin-header-back-sq"
              onClick={onGoBack || (() => setActivePage('portal-select'))}
              title="Back to portal selection"
              aria-label="Back"
            >
              ←
            </button>
            <div className="signin-brand-group">
              <h1 className="signin-brand-title">AgriRent</h1>
              <span className="signin-brand-subtitle">
                {isTe ? 'రైతు అధికారిక పోర్టల్' : 'Farmer Official Portal'}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="signin-lang-pill"
            onClick={toggleLanguage}
            title={isTe ? 'Switch to English' : 'తెలుగులోకి మార్చండి'}
          >
            🌐 {isTe ? 'తెలుగు ▾' : 'English ▾'}
          </button>
        </header>

        {/* Main Card Container */}
        <main className="signin-card-container">
          <div className="signin-main-card">
            {/* Top Navigation Row: Back Button */}
            <div className="signin-card-top-row">
              <button
                type="button"
                className="signin-back-pill-btn"
                onClick={onGoBack || (() => setActivePage('portal-select'))}
              >
                ← {isTe ? 'పోర్టల్ ఎంపికకి వెనుకకు' : 'Back to Selection'}
              </button>
            </div>

            {/* Portal Badge */}
            <div className="signin-farmer-badge">
              <span className="signin-badge-avatar">👨‍🌾</span>
              <span>{isTe ? 'రైతు సురక్షిత ప్రవేశం' : 'Secure Farmer Authentication'}</span>
            </div>

            {/* Auth Mode Tabs Switcher */}
            <div className="auth-tabs-nav" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={authMode === 'login'}
                className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('login');
                  setLoginError('');
                  setLoginNotice('');
                  setLoginOtpSent(false);
                }}
              >
                <span>🔑</span>
                <span>{isTe ? 'ఖాతా లాగిన్' : 'Sign In'}</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={authMode === 'register'}
                className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('register');
                  setRegError('');
                  setRegNotice('');
                }}
              >
                <span>📝</span>
                <span>{isTe ? 'కొత్త ఖాతా నమోదు' : 'Register Account'}</span>
              </button>
            </div>

            {/* ====================================================
                TAB 1: EXISTING USER LOGIN
               ==================================================== */}
            {authMode === 'login' && (
              <div className="auth-tab-content page-anim">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <h2 className="signin-heading" style={{ fontSize: '22px', margin: 0 }}>
                      {isTe ? 'రైతు ఖాతా లాగిన్' : 'Farmer Sign In'}
                    </h2>
                    <p className="signin-description" style={{ margin: '4px 0 0 0' }}>
                      {loginMethod === 'password'
                        ? (isTe ? 'మీ నమోదిత ఆధారాలతో లాగిన్ అవ్వండి.' : 'Sign in using your mobile number/email and password.')
                        : (isTe ? 'మీ మొబైల్‌కు వచ్చే SMS OTP ద్వారా లాగిన్ అవ్వండి.' : 'Sign in using Message Central SMS OTP verification.')}
                    </p>
                  </div>

                  {/* Toggle between Password and OTP Login */}
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod(prev => (prev === 'password' ? 'otp' : 'password'));
                      setLoginError('');
                      setLoginNotice('');
                    }}
                    style={{
                      background: '#f1f8e9',
                      color: '#2e7d32',
                      border: '1px solid #c8e6c9',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {loginMethod === 'password' ? '📲 SMS OTP Mode' : '🔑 Password Mode'}
                  </button>
                </div>

                {loginNotice && (
                  <div className="signin-otp-banner page-anim" style={{ marginBottom: '14px' }}>
                    {loginNotice}
                  </div>
                )}

                {loginError && (
                  <div className="signin-error-box" style={{ marginBottom: '14px' }}>
                    ⚠️ {loginError}
                    {matchedOwnerHint && (
                      <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="signin-inline-action-btn"
                          onClick={() => setActivePage('owner-login')}
                        >
                          🚜 {isTe ? 'వాహన యజమాని పోర్టల్‌కి వెళ్లండి →' : 'Switch to Vehicle Owner Portal →'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {loginMethod === 'password' ? (
                  /* Form: Password Login with Remember Me */
                  <form onSubmit={handlePasswordLogin}>
                    {/* Identifier: Mobile or Email */}
                    <div className="signin-field-group">
                      <label className="signin-field-label">
                        {isTe ? 'మొబైల్ నంబర్ లేదా ఈమెయిల్ *' : 'Mobile Number or Email *'}
                      </label>
                      <div className="signin-field-input-box">
                        <span className="signin-input-icon">📱</span>
                        <input
                          type="text"
                          className="signin-input-text font-bold"
                          value={loginIdentifier}
                          onChange={(e) => {
                            setLoginIdentifier(e.target.value);
                            setLoginError('');
                          }}
                          placeholder={isTe ? 'ఉదా: 9848012345 లేదా farmer@gmail.com' : 'e.g. 9848012345 or farmer@gmail.com'}
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Password Field with Eye Toggle */}
                    <div className="signin-field-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label className="signin-field-label" style={{ margin: 0 }}>
                          {isTe ? 'పాస్‌వర్డ్ *' : 'Password *'}
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(p => !p)}
                          style={{ background: 'none', border: 'none', color: '#2e7d32', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                        >
                          {showLoginPassword ? (isTe ? 'దాచు 👁️' : 'Hide 👁️') : (isTe ? 'చూపించు 👁️' : 'Show 👁️')}
                        </button>
                      </div>
                      <div className="signin-field-input-box">
                        <span className="signin-input-icon">🔒</span>
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          className="signin-input-text"
                          value={loginPassword}
                          onChange={(e) => {
                            setLoginPassword(e.target.value);
                            setLoginError('');
                          }}
                          placeholder={isTe ? 'మీ ఖాతా పాస్‌వర్డ్' : 'Enter your account password'}
                          required
                        />
                      </div>
                    </div>

                    {/* Remember Me Checkbox */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '12px 0 16px 0' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#334155' }}>
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: '#2e7d32', cursor: 'pointer' }}
                        />
                        <span style={{ fontWeight: '600' }}>
                          {isTe ? 'నన్ను లాగిన్ లోనే ఉంచు (Remember Me)' : 'Keep me signed in (Remember Me)'}
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="signin-btn-forest-green"
                      disabled={isSubmittingLogin}
                    >
                      <span>
                        {isSubmittingLogin
                          ? (isTe ? 'సురక్షిత లాగిన్ అవుతోంది...' : 'Signing In Securely...')
                          : `✓ ${isTe ? 'ఖాతాలోకి ప్రవేశించండి' : 'Sign In to AgriRent'}`}
                      </span>
                    </button>
                  </form>
                ) : (
                  /* Form: OTP Login via Message Central */
                  <div>
                    {!loginOtpSent ? (
                      <form onSubmit={handleSendLoginOtp}>
                        <div className="signin-field-group">
                          <label className="signin-field-label">
                            {isTe ? 'నమోదిత 10-అంకెల మొబైల్ నంబర్ *' : 'Registered 10-Digit Mobile Number *'}
                          </label>
                          <div className="signin-field-input-box">
                            <span className="signin-flag-badge">🇮🇳 +91</span>
                            <input
                              type="tel"
                              maxLength={10}
                              className="signin-input-text font-bold"
                              value={loginPhone}
                              onChange={(e) => {
                                setLoginPhone(e.target.value.replace(/\D/g, ''));
                                setLoginError('');
                              }}
                              placeholder="9848012345"
                              required
                              autoFocus
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="signin-btn-forest-green"
                          style={{ marginTop: '14px' }}
                          disabled={isSendingOtp}
                        >
                          <span>{isSendingOtp ? (isTe ? 'SMS OTP పంపుతోంది...' : 'Sending SMS OTP...') : `📲 ${isTe ? 'SMS OTP పంపండి' : 'Send SMS Login OTP'}`}</span>
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyLoginOtp}>
                        <div className="signin-field-group signin-otp-block page-anim">
                          <div className="signin-otp-header-row">
                            <label className="signin-field-label" style={{ fontWeight: 800 }}>
                              {isTe ? 'OTP కోడ్ నమోదు చేయండి' : 'Enter 6-Digit Verification OTP'}
                            </label>
                            <button
                              type="button"
                              className="signin-change-phone-btn"
                              onClick={() => {
                                setLoginOtpSent(false);
                                setLoginError('');
                              }}
                            >
                              ✎ {isTe ? 'మొబైల్ మార్చండి' : 'Change Number'}
                            </button>
                          </div>

                          <input
                            type="text"
                            maxLength={8}
                            className="signin-otp-input"
                            value={loginOtp}
                            onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="••••••"
                            autoFocus
                          />
                        </div>

                        <button
                          type="submit"
                          className="signin-btn-forest-green"
                          style={{ marginTop: '14px' }}
                          disabled={isVerifyingOtp}
                        >
                          <span>{isVerifyingOtp ? (isTe ? 'ధృవీకరిస్తోంది...' : 'Verifying OTP...') : `🚀 ${isTe ? 'ధృవీకరించి ప్రవేశించండి' : 'Verify OTP & Sign In'}`}</span>
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* Footer Switcher */}
                <div className="auth-switch-box" style={{ marginTop: '20px' }}>
                  <span>{isTe ? 'ఖాతా లేదా? ' : "Don't have an account yet? "}</span>
                  <button
                    type="button"
                    className="auth-switch-link"
                    onClick={() => handleSwitchToRegister(loginIdentifier || loginPhone)}
                  >
                    {isTe ? 'కొత్త రైతు ఖాతా తెరవండి →' : 'Register New Account →'}
                  </button>
                </div>
              </div>
            )}

            {/* ====================================================
                TAB 2: NEW USER REGISTRATION
               ==================================================== */}
            {authMode === 'register' && (
              <div className="auth-tab-content page-anim">
                <h2 className="signin-heading" style={{ fontSize: '22px', margin: 0 }}>
                  {isTe ? 'కొత్త రైతు ఖాతా నమోదు' : 'New Farmer Registration'}
                </h2>
                <p className="signin-description" style={{ margin: '4px 0 16px 0' }}>
                  {isTe
                    ? 'ట్రాక్టర్లు మరియు యంత్రాలను అద్దెకు తీసుకోవడానికి ఉచితంగా నమోదు చేసుకోండి.'
                    : 'Register your account to rent tractors and farm machinery with 0% platform fee.'}
                </p>

                {regNotice && (
                  <div className="signin-otp-banner page-anim" style={{ marginBottom: '14px' }}>
                    {regNotice}
                  </div>
                )}

                {regError && (
                  <div className="signin-error-box" style={{ marginBottom: '14px' }}>
                    ⚠️ {regError}
                    {regError.includes('already registered') && (
                      <button
                        type="button"
                        className="signin-inline-action-btn"
                        onClick={() => handleSwitchToLogin(regMobile)}
                      >
                        🔑 {isTe ? 'లాగిన్ పేజీకి వెళ్లండి →' : 'Go to Sign In →'}
                      </button>
                    )}
                  </div>
                )}

                <form onSubmit={handleRegister}>
                  {/* Farmer Full Name */}
                  <div className="signin-field-group">
                    <label className="signin-field-label">
                      {isTe ? 'రైతు పూర్తి పేరు *' : 'Farmer Full Name *'}
                    </label>
                    <div className="signin-field-input-box">
                      <span className="signin-input-icon">👤</span>
                      <input
                        type="text"
                        className="signin-input-text font-bold"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder={isTe ? 'ఉదా: కొండల్ రావు' : 'e.g. Kondal Rao'}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* 10-Digit Mobile Number */}
                  <div className="signin-field-group">
                    <label className="signin-field-label">
                      {isTe ? '10-అంకెల మొబైల్ నంబర్ *' : '10-Digit Mobile Number *'}
                    </label>
                    <div className="signin-field-input-box">
                      <span className="signin-flag-badge">🇮🇳 +91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        className="signin-input-text font-bold"
                        value={regMobile}
                        onChange={(e) => {
                          setRegMobile(e.target.value.replace(/\D/g, ''));
                          setRegError('');
                        }}
                        placeholder="9848012345"
                        required
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="signin-field-group">
                    <label className="signin-field-label">
                      {isTe ? 'ఈమెయిల్ చిరునామా *' : 'Email Address *'}
                    </label>
                    <div className="signin-field-input-box">
                      <span className="signin-input-icon">✉️</span>
                      <input
                        type="email"
                        className="signin-input-text"
                        value={regEmail}
                        onChange={(e) => {
                          setRegEmail(e.target.value);
                          setRegError('');
                        }}
                        placeholder="farmer@gmail.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Password with Show/Hide Toggle */}
                  <div className="signin-field-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label className="signin-field-label" style={{ margin: 0 }}>
                        {isTe ? 'సురక్షిత పాస్‌వర్డ్ (కనీసం 6 అక్షరాలు) *' : 'Secure Password (Min. 6 Characters) *'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(p => !p)}
                        style={{ background: 'none', border: 'none', color: '#2e7d32', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                      >
                        {showRegPassword ? (isTe ? 'దాచు 👁️' : 'Hide 👁️') : (isTe ? 'చూపించు 👁️' : 'Show 👁️')}
                      </button>
                    </div>
                    <div className="signin-field-input-box">
                      <span className="signin-input-icon">🔒</span>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        className="signin-input-text"
                        value={regPassword}
                        onChange={(e) => {
                          setRegPassword(e.target.value);
                          setRegError('');
                        }}
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  {/* Village / Delivery Base & Land Area */}
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="signin-field-group">
                      <label className="signin-field-label">
                        {isTe ? 'గ్రామం / మండలం *' : 'Village / Mandal *'}
                      </label>
                      <div className="signin-field-input-box">
                        <span className="signin-input-icon">📍</span>
                        <input
                          type="text"
                          className="signin-input-text"
                          value={regVillage}
                          onChange={(e) => setRegVillage(e.target.value)}
                          placeholder="Hasanparthy"
                          required
                        />
                      </div>
                    </div>

                    <div className="signin-field-group">
                      <label className="signin-field-label">
                        {isTe ? 'సాగు విస్తీర్ణం (ఎకరాలు)' : 'Land Area (Acres)'}
                      </label>
                      <div className="signin-field-input-box">
                        <span className="signin-input-icon">🌾</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          className="signin-input-text"
                          value={regLandArea}
                          onChange={(e) => setRegLandArea(e.target.value)}
                          placeholder="3.0"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="signin-btn-forest-green"
                    style={{ marginTop: '14px' }}
                    disabled={isSubmittingReg}
                  >
                    <span>
                      {isSubmittingReg
                        ? (isTe ? 'ఖాతా సృష్టించబడుతోంది...' : 'Creating Account & Auto-Signing In...')
                        : `🚀 ${isTe ? 'ఖాతా నమోదు చేసి లాగిన్ అవ్వండి' : 'Create Account & Sign In'}`}
                    </span>
                  </button>
                </form>

                {/* Footer Switcher */}
                <div className="auth-switch-box" style={{ marginTop: '20px' }}>
                  <span>{isTe ? 'ఇప్పటికే ఖాతా ఉందా? ' : 'Already registered? '}</span>
                  <button
                    type="button"
                    className="auth-switch-link"
                    onClick={() => handleSwitchToLogin(regMobile)}
                  >
                    {isTe ? 'లాగిన్ అవ్వండి →' : 'Sign in to your account →'}
                  </button>
                </div>
              </div>
            )}

            {/* Guest Browsing Link */}
            <div className="signin-guest-link-box" style={{ marginTop: '18px' }}>
              <span className="signin-guest-prompt">
                {isTe ? 'కేవలం చూడాలనుకుంటున్నారా? ' : 'Just exploring? '}
              </span>
              <button
                type="button"
                className="signin-guest-btn"
                onClick={() => setActivePage('find-tractor')}
              >
                {isTe ? 'ట్రాక్టర్ మార్కెట్‌ప్లేస్‌ను అతిథిగా చూడండి →' : 'Explore Tractors Marketplace as Guest →'}
              </button>
            </div>
          </div>

          {/* Safety & Compliance Footer */}
          <footer className="signin-safety-footer">
            <span className="signin-shield-icon">🛡️</span>
            <span>
              {isTe
                ? 'తెలంగాణ రవాణా మరియు వ్యవసాయ భద్రతా సమాచార నిబంధనలకు అగ్రిరెంట్ కట్టుబడి ఉంటుంది.'
                : 'AgriRent adheres to Telangana transport & agriculture safety data norms.'}
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
