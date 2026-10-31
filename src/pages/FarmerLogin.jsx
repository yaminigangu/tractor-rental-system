import { useState } from 'react';
import { translations } from '../translations';
import { saveRegisteredFarmer, findFarmerByMobile } from '../data/userData';

export default function FarmerLogin({
  setActivePage,
  setCurrentFarmer,
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

  // ----------------------------------------------------
  // FLOW 1: EXISTING FARMER LOGIN (Zero data leaked upfront)
  // ----------------------------------------------------
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtp, setLoginOtp] = useState('874885');
  const [loginMatchedFarmer, setLoginMatchedFarmer] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [loginNotice, setLoginNotice] = useState('');

  // ----------------------------------------------------
  // FLOW 2: FIRST-TIME FARMER REGISTRATION
  // ----------------------------------------------------
  const [regFullName, setRegFullName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regVillage, setRegVillage] = useState(defaultVillage);
  const [regLandArea, setRegLandArea] = useState('3.0');
  const [regOtpSent, setRegOtpSent] = useState(false);
  const [regOtp, setRegOtp] = useState('874885');
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

  // Switch to Register flow from Login if number is not found
  const handleSwitchToRegister = (prefillPhone) => {
    setAuthMode('register');
    setLoginError('');
    setLoginNotice('');
    setLoginOtpSent(false);
    if (prefillPhone) {
      setRegMobile(prefillPhone);
    }
  };

  // Switch to Login flow
  const handleSwitchToLogin = (prefillPhone) => {
    setAuthMode('login');
    setRegError('');
    setRegNotice('');
    setRegOtpSent(false);
    if (prefillPhone) {
      setLoginPhone(prefillPhone);
    }
  };

  // ----------------------------------------------------
  // STEP 1A: Existing User - Send Login OTP
  // ----------------------------------------------------
  const handleSendLoginOtp = (e) => {
    if (e) e.preventDefault();
    setLoginError('');
    setLoginNotice('');

    const phone = cleanPhone(loginPhone);
    if (phone.length < 10) {
      setLoginError(
        isTe
          ? 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.'
          : 'Please enter a valid 10-digit mobile number.'
      );
      return;
    }

    // Check database if this phone is registered in AgriRent
    const matched = findFarmerByMobile(phone);

    if (!matched) {
      // User is NOT registered yet!
      setLoginError(
        isTe
          ? `మొబైల్ నంబర్ +91 ${phone} అగ్రిరెంట్‌లో నమోదు కాలేదు. మీరు మొదటిసారి వస్తున్నారా? క్రింద నమోదు చేసుకోండి.`
          : `Mobile number +91 ${phone} is not registered on AgriRent. If you are a new farmer, please create an account.`
      );
      return;
    }

    // User is registered: send secure OTP
    setLoginMatchedFarmer(matched);
    setLoginOtpSent(true);
    setLoginOtp('874885');
    setLoginNotice(
      isTe
        ? `✓ +91 ${maskPhone(phone)} కి 6 అంకెల లాగిన్ OTP పంపబడింది!`
        : `✓ 6-Digit login OTP sent to +91 ${maskPhone(phone)}!`
    );
  };

  // ----------------------------------------------------
  // STEP 2A: Existing User - Verify OTP & Login Directly
  // ----------------------------------------------------
  const handleVerifyLoginOtp = (e) => {
    if (e) e.preventDefault();
    setLoginError('');

    if (loginOtp.trim().length < 4) {
      setLoginError(
        isTe
          ? 'దయచేసి సరైన 6 అంకెల OTP నమోదు చేయండి.'
          : 'Please enter the 6-digit OTP.'
      );
      return;
    }

    if (!loginMatchedFarmer) {
      setLoginError('Account session expired. Please re-enter your mobile number.');
      setLoginOtpSent(false);
      return;
    }

    // Secure Login: Save session and navigate into fleet
    try {
      localStorage.setItem('agri_current_farmer', JSON.stringify(loginMatchedFarmer));
    } catch (err) {
      console.warn(err);
    }

    if (setCurrentFarmer) {
      setCurrentFarmer(loginMatchedFarmer);
    }

    setActivePage('find-tractor');
  };

  // ----------------------------------------------------
  // STEP 1B: First-Time User - Send Sign-Up OTP
  // ----------------------------------------------------
  const handleSendRegOtp = (e) => {
    if (e) e.preventDefault();
    setRegError('');
    setRegNotice('');

    if (!regFullName.trim()) {
      setRegError(
        isTe ? 'దయచేసి రైతు పూర్తి పేరు నమోదు చేయండి.' : 'Please enter your full name.'
      );
      return;
    }

    const phone = cleanPhone(regMobile);
    if (phone.length < 10) {
      setRegError(
        isTe
          ? 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.'
          : 'Please enter a valid 10-digit mobile number.'
      );
      return;
    }

    // Check if phone is already registered
    const already = findFarmerByMobile(phone);
    if (already) {
      setRegError(
        isTe
          ? `ఈ మొబైల్ నంబర్ ఇప్పటికే నమోదు చేయబడింది! దయచేసి లాగిన్ ట్యాబ్ ఉపయోగించండి.`
          : `This mobile number is already registered! Please use the Existing User Login tab.`
      );
      return;
    }

    setRegOtpSent(true);
    setRegOtp('874885');
    setRegNotice(
      isTe
        ? `✓ +91 ${maskPhone(phone)} కి ధృవీకరణ OTP పంపబడింది!`
        : `✓ Verification OTP sent to +91 ${maskPhone(phone)}!`
    );
  };

  // ----------------------------------------------------
  // STEP 2B: First-Time User - Verify OTP & Create Account
  // ----------------------------------------------------
  const handleVerifyRegOtp = (e) => {
    if (e) e.preventDefault();
    setRegError('');

    if (regOtp.trim().length < 4) {
      setRegError(
        isTe
          ? 'దయచేసి సరైన 6 అంకెల OTP నమోదు చేయండి.'
          : 'Please enter the 6-digit OTP.'
      );
      return;
    }

    const newFarmer = {
      name: regFullName.trim(),
      mobile: cleanPhone(regMobile),
      village: regVillage.trim() || defaultVillage,
      district: selectedLocation?.district || 'Hanamkonda',
      landArea: parseFloat(regLandArea) || 3.0,
      crops: ['Paddy', 'Cotton'],
      isVerified: true,
      registeredAt: new Date().toISOString().split('T')[0]
    };

    // Save in AgriRent database
    saveRegisteredFarmer(newFarmer);

    try {
      localStorage.setItem('agri_current_farmer', JSON.stringify(newFarmer));
    } catch (err) {
      console.warn(err);
    }

    if (setCurrentFarmer) {
      setCurrentFarmer(newFarmer);
    }

    setActivePage('find-tractor');
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
                onClick={() => setActivePage('portal-select')}
                title="Back to portal selection"
                aria-label="Back"
              >
                ←
              </button>
              <div className="signin-brand-group">
                <h1 className="signin-brand-title">Agrirent</h1>
                <span className="signin-brand-subtitle">
                  {isTe ? 'రైతు మొబైల్ పోర్టల్' : 'Farmer Mobile Portal'}
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
                onClick={() => setActivePage('portal-select')}
              >
                ← {isTe ? 'ఎంపికకి వెనుకకు' : 'Back to Selection'}
              </button>
            </div>

            {/* Portal Badge */}
            <div className="signin-farmer-badge">
              <span className="signin-badge-avatar">👨‍🌾</span>
              <span>{isTe ? 'రైతు సురక్షిత ప్రవేశం' : 'Secure Farmer Access'}</span>
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
                <span>{isTe ? 'ఖాతా లాగిన్' : 'Existing User'}</span>
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
                  setRegOtpSent(false);
                }}
              >
                <span>📝</span>
                <span>{isTe ? 'మొదటిసారి నమోదు' : 'New Farmer Sign-Up'}</span>
              </button>
            </div>

            {/* ====================================================
                TAB 1: EXISTING USER LOGIN (SECURE & DIRECT)
               ==================================================== */}
            {authMode === 'login' && (
              <div className="auth-tab-content page-anim">
                <h2 className="signin-heading" style={{ fontSize: '22px', marginTop: '2px' }}>
                  {isTe ? 'రైతు ఖాతా లాగిన్' : 'Farmer Login'}
                </h2>
                <p className="signin-description" style={{ marginBottom: '16px' }}>
                  {isTe
                    ? 'మీ నమోదిత మొబైల్ నంబర్ ద్వారా సురక్షితంగా ప్రవేశించండి.'
                    : 'Enter your registered mobile number to receive a secure OTP.'}
                </p>

                {loginNotice && (
                  <div className="signin-otp-banner page-anim" style={{ marginBottom: '14px' }}>
                    {loginNotice}
                  </div>
                )}

                {loginError && (
                  <div className="signin-error-box" style={{ marginBottom: '14px' }}>
                    ⚠️ {loginError}
                    {!loginOtpSent && cleanPhone(loginPhone).length === 10 && (
                      <button
                        type="button"
                        className="signin-inline-action-btn"
                        onClick={() => handleSwitchToRegister(loginPhone)}
                      >
                        📝 {isTe ? 'మొదటిసారి రైతుగా నమోదు చేసుకోండి →' : 'Register as First-Time Farmer →'}
                      </button>
                    )}
                  </div>
                )}

                {!loginOtpSent ? (
                  /* Step 1: Enter Registered Mobile Number */
                  <form onSubmit={handleSendLoginOtp}>
                    <div className="signin-field-group">
                      <label className="signin-field-label">
                        {isTe ? 'నమోదిత మొబైల్ నంబర్ *' : 'Registered 10-Digit Mobile Number *'}
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
                          placeholder={isTe ? '10 అంకెల నంబర్' : 'Enter 10-digit number'}
                          autoFocus
                        />
                      </div>
                      <span className="signin-field-hint">
                        {isTe
                          ? 'అగ్రిరెంట్‌లో ఇప్పటికే నమోదైన ఫోన్ నంబర్‌ను నమోదు చేయండి.'
                          : 'Enter the mobile number linked to your AgriRent farmer account.'}
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="signin-btn-forest-green"
                      style={{ marginTop: '14px' }}
                    >
                      <span>📲 {isTe ? 'సురక్షిత లాగిన్ OTP పొందండి' : 'Get Secure Login OTP'}</span>
                    </button>
                  </form>
                ) : (
                  /* Step 2: Verify Login OTP */
                  <form onSubmit={handleVerifyLoginOtp}>
                    <div className="signin-field-group signin-otp-block page-anim">
                      <div className="signin-otp-header-row">
                        <label className="signin-field-label" style={{ fontWeight: 800 }}>
                          {isTe ? '6-అంకెల లాగిన్ OTP' : 'Enter 6-Digit Login OTP'}
                        </label>
                        <button
                          type="button"
                          className="signin-change-phone-btn"
                          onClick={() => {
                            setLoginOtpSent(false);
                            setLoginError('');
                          }}
                        >
                          ✎ {isTe ? 'నంబర్ మార్చండి' : 'Change Number'}
                        </button>
                      </div>

                      <input
                        type="text"
                        maxLength={6}
                        className="signin-otp-input"
                        value={loginOtp}
                        onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="874885"
                        autoFocus
                      />
                      <span className="signin-demo-otp-hint">
                        {isTe ? 'డెమో OTP ప్రివ్యూ: 874885' : 'Demo OTP preview: 874885'}
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="signin-btn-forest-green"
                      style={{ marginTop: '14px' }}
                    >
                      <span>🔓 {isTe ? 'ధృవీకరించి ప్రవేశించండి →' : 'Verify & Login Directly →'}</span>
                    </button>
                  </form>
                )}

                {/* Footer Switcher */}
                <div className="auth-switch-box">
                  <span>{isTe ? 'అగ్రిరెంట్‌కి కొత్తవారా? ' : 'First time using AgriRent? '}</span>
                  <button
                    type="button"
                    className="auth-switch-link"
                    onClick={() => handleSwitchToRegister(loginPhone)}
                  >
                    {isTe ? 'కొత్త రైతు ఖాతా తెరవండి →' : 'Create Farmer Account →'}
                  </button>
                </div>
              </div>
            )}

            {/* ====================================================
                TAB 2: FIRST-TIME USER SIGN-UP
               ==================================================== */}
            {authMode === 'register' && (
              <div className="auth-tab-content page-anim">
                <h2 className="signin-heading" style={{ fontSize: '22px', marginTop: '2px' }}>
                  {isTe ? 'మొదటిసారి రైతు నమోదు' : 'New Farmer Registration'}
                </h2>
                <p className="signin-description" style={{ marginBottom: '16px' }}>
                  {isTe
                    ? '0% కమీషన్‌తో ట్రాక్టర్లు అద్దెకు తీసుకోవడానికి ఉచితంగా నమోదు చేసుకోండి.'
                    : 'Register once to rent tractors & machinery at 0% platform fee.'}
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
                        🔑 {isTe ? 'లాగిన్ పేజీకి వెళ్లండి →' : 'Go to Login Tab →'}
                      </button>
                    )}
                  </div>
                )}

                {!regOtpSent ? (
                  /* Step 1: Sign-Up Form */
                  <form onSubmit={handleSendRegOtp}>
                    {/* Farmer Full Name */}
                    <div className="signin-field-group">
                      <label className="signin-field-label">
                        {isTe ? 'రైతు పూర్తి పేరు *' : 'Farmer Full Name *'}
                      </label>
                      <div className="signin-field-input-box">
                        <span className="signin-input-icon icon-person">👤</span>
                        <input
                          type="text"
                          className="signin-input-text"
                          value={regFullName}
                          onChange={(e) => setRegFullName(e.target.value)}
                          placeholder="e.g. Kondal Rao"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Mobile Number */}
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
                        />
                      </div>
                    </div>

                    {/* Village / Delivery Base */}
                    <div className="signin-field-group">
                      <label className="signin-field-label">
                        {isTe ? 'గ్రామం / డెలివరీ ప్రాంతం *' : 'Village / Delivery Base *'}
                      </label>
                      <div className="signin-field-input-box">
                        <span className="signin-input-icon icon-pin">📍</span>
                        <input
                          type="text"
                          className="signin-input-text"
                          value={regVillage}
                          onChange={(e) => setRegVillage(e.target.value)}
                          placeholder="e.g. Hasanparthy"
                        />
                      </div>
                    </div>

                    {/* Land Area */}
                    <div className="signin-field-group">
                      <label className="signin-field-label">
                        {isTe ? 'సాగు విస్తీర్ణం (ఎకరాలు)' : 'Land Size (Acres - Optional)'}
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
                          placeholder="e.g. 3.0"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="signin-btn-forest-green"
                      style={{ marginTop: '14px' }}
                    >
                      <span>📲 {isTe ? 'ధృవీకరణ OTP పంపండి' : 'Send Verification OTP'}</span>
                    </button>
                  </form>
                ) : (
                  /* Step 2: Verify Sign-Up OTP */
                  <form onSubmit={handleVerifyRegOtp}>
                    <div className="signin-field-group signin-otp-block page-anim">
                      <div className="signin-otp-header-row">
                        <label className="signin-field-label" style={{ fontWeight: 800 }}>
                          {isTe ? '6-అంకెల ధృవీకరణ OTP' : 'Enter 6-Digit Verification OTP'}
                        </label>
                        <button
                          type="button"
                          className="signin-change-phone-btn"
                          onClick={() => {
                            setRegOtpSent(false);
                            setRegError('');
                          }}
                        >
                          ✎ {isTe ? 'సవరించండి' : 'Edit Details'}
                        </button>
                      </div>

                      <input
                        type="text"
                        maxLength={6}
                        className="signin-otp-input"
                        value={regOtp}
                        onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="874885"
                        autoFocus
                      />
                      <span className="signin-demo-otp-hint">
                        {isTe ? 'డెమో OTP ప్రివ్యూ: 874885' : 'Demo OTP preview: 874885'}
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="signin-btn-forest-green"
                      style={{ marginTop: '14px' }}
                    >
                      <span>🚀 {isTe ? 'ధృవీకరించి ఖాతా పూర్తి చేయండి →' : 'Verify & Create Farmer Account →'}</span>
                    </button>
                  </form>
                )}

                {/* Footer Switcher */}
                <div className="auth-switch-box">
                  <span>{isTe ? 'ఇప్పటికే ఖాతా ఉందా? ' : 'Already have an account? '}</span>
                  <button
                    type="button"
                    className="auth-switch-link"
                    onClick={() => handleSwitchToLogin(regMobile)}
                  >
                    {isTe ? 'లాగిన్ అవ్వండి →' : 'Sign in here →'}
                  </button>
                </div>
              </div>
            )}

            {/* Guest Browsing Link */}
            <div className="signin-guest-link-box" style={{ marginTop: '18px' }}>
              <span className="signin-guest-prompt">
                {isTe ? 'కేవలం చూడాలనుకుంటున్నారా? ' : 'Just browsing? '}
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

          {/* Footer Norms Disclaimer */}
          <footer className="signin-safety-footer">
            <span className="signin-shield-icon">🛡️</span>
            <span>
              {isTe
                ? 'తెలంగాణ రవాణా మరియు వ్యవసాయ భద్రతా సమాచార నిబంధనలకు అగ్రిరెంట్ కట్టుబడి ఉంటుంది.'
                : 'Agrirent adheres to Telangana transport & agriculture safety data norms.'}
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
