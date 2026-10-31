import { useState, useMemo, useEffect } from 'react';
import { translations } from '../translations';
import { saveRegisteredFarmer, findFarmerByMobile, findFarmerByIdentifier } from '../data/userData';

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

  // Check if a farmer previously signed up or logged in on this browser/device
  const [lastFarmer, setLastFarmer] = useState(() => {
    try {
      const saved = localStorage.getItem('agri_last_farmer');
      if (saved) return JSON.parse(saved);
      const curr = localStorage.getItem('agri_current_farmer');
      if (curr) return JSON.parse(curr);
    } catch {
      // ignore
    }
    return null;
  });

  // Form Fields: Start with last registered farmer if exists, otherwise blank for new visitor
  const [fullName, setFullName] = useState(() => lastFarmer?.name || '');
  const [mobileNumber, setMobileNumber] = useState(() => lastFarmer?.mobile || '');
  const [villageBase, setVillageBase] = useState(() => lastFarmer?.village || defaultVillage);

  // OTP State (Screenshot 2 -> Screenshot 3)
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('874885');
  const [alertNotice, setAlertNotice] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const toggleLanguage = () => {
    if (setLanguage) {
      setLanguage(prev => (prev === 'en' ? 'te' : 'en'));
    }
  };

  // Clean phone digits
  const cleanPhone = useMemo(() => mobileNumber.replace(/\D/g, ''), [mobileNumber]);

  // Real-time lookup: Is this person ALREADY a registered member in AgriRent?
  const recognizedFarmer = useMemo(() => {
    if (cleanPhone.length >= 10) {
      return findFarmerByMobile(cleanPhone);
    }
    return null;
  }, [cleanPhone]);

  // Check whether current entered phone is recognized as an existing member
  const isAlreadyPart = Boolean(
    recognizedFarmer || 
    (lastFarmer && cleanPhone.length >= 10 && cleanPhone === String(lastFarmer.mobile).replace(/\D/g, ''))
  );

  const activeMember = recognizedFarmer || (isAlreadyPart ? lastFarmer : null);

  // When a 10-digit number matches a registered member, auto-populate their registered name & village
  useEffect(() => {
    if (recognizedFarmer) {
      if (!fullName || fullName === 'N. Ramesh Kumar' || fullName !== recognizedFarmer.name) {
        setFullName(recognizedFarmer.name);
      }
      if (recognizedFarmer.village) {
        setVillageBase(recognizedFarmer.village);
      }
    }
  }, [recognizedFarmer]);

  // Complete 1-Tap Login for recognized returning member
  const handleOneTapLogin = (targetFarmer) => {
    setErrorMsg('');
    const farmerToLogin = targetFarmer || activeMember || {
      name: fullName.trim() || 'Farmer Member',
      mobile: cleanPhone || '9848012345',
      village: villageBase || defaultVillage,
      district: selectedLocation?.district || 'Hanamkonda',
      landArea: 3.5,
      crops: ['Paddy', 'Cotton'],
      isVerified: true,
      registeredAt: new Date().toISOString().split('T')[0]
    };

    // Save and mark as verified returning farmer
    saveRegisteredFarmer(farmerToLogin);
    try {
      localStorage.setItem('agri_last_farmer', JSON.stringify(farmerToLogin));
      localStorage.setItem('agri_current_farmer', JSON.stringify(farmerToLogin));
    } catch (err) {
      console.warn(err);
    }

    if (setCurrentFarmer) {
      setCurrentFarmer(farmerToLogin);
    }

    // Direct into Marketplace
    setActivePage('find-tractor');
  };

  // Trigger Send OTP for new farmer sign-up or manual verification
  const handleSendOtp = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (cleanPhone.length < 10) {
      setErrorMsg(isTe ? 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.' : 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setOtpSent(true);
    setEnteredOtp('874885');
    setAlertNotice(
      isTe
        ? `✓ 📲 ధృవీకరణ OTP +91 ${cleanPhone} కి పంపబడింది!`
        : `✓ 📲 Verification OTP sent to +91 ${cleanPhone}!`
    );
  };

  // Verify OTP and complete sign-up for new farmers
  const handleVerifyAndEnter = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (enteredOtp.trim().length < 4) {
      setErrorMsg(isTe ? 'దయచేసి 6 అంకెల OTP నమోదు చేయండి.' : 'Please enter the 6-digit OTP.');
      return;
    }

    const farmerRecord = {
      name: fullName.trim() || (isTe ? 'రైతు సభ్యుడు' : 'Farmer Member'),
      mobile: cleanPhone || '9848012345',
      village: villageBase || defaultVillage,
      district: selectedLocation?.district || 'Hanamkonda',
      landArea: 3.5,
      crops: ['Paddy', 'Cotton'],
      isVerified: true,
      registeredAt: new Date().toISOString().split('T')[0]
    };

    // Save newly signed-up farmer in database & remember as last farmer on this device
    saveRegisteredFarmer(farmerRecord);
    try {
      localStorage.setItem('agri_last_farmer', JSON.stringify(farmerRecord));
      localStorage.setItem('agri_current_farmer', JSON.stringify(farmerRecord));
    } catch (err) {
      console.warn(err);
    }

    if (setCurrentFarmer) {
      setCurrentFarmer(farmerRecord);
    }

    // Direct into Marketplace
    setActivePage('find-tractor');
  };

  // Quick Demo Auto-fill Toggle (Settings ⚙️ icon)
  const handleToggleDemoState = () => {
    if (mobileNumber) {
      // Clear for new user testing
      setFullName('');
      setMobileNumber('');
      setVillageBase(defaultVillage);
      setOtpSent(false);
      setErrorMsg('');
      setAlertNotice('');
    } else {
      // Fill demo registered member
      setFullName('N. Ramesh Kumar');
      setMobileNumber('9848012345');
      setVillageBase('Hasanparthy');
      setOtpSent(false);
      setErrorMsg('');
    }
  };

  return (
    <div className="signin-page-viewport page-anim">
      {/* Top Header Bar matching Screenshot 2 & 3 */}
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
              {isTe ? 'వ్యవసాయ యంత్రాల అద్దె వేదిక' : 'Farm Machinery Rental Platform'}
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

      {/* Main Container Card */}
      <main className="signin-card-container">
        {/* OTP Notification Banner (Screenshot 3) */}
        {otpSent && alertNotice && (
          <div className="signin-otp-banner page-anim">
            {alertNotice}
          </div>
        )}

        <div className="signin-main-card">
          {/* Top Row: Back to Selection & Blue Settings Gear */}
          <div className="signin-card-top-row">
            <button
              type="button"
              className="signin-back-pill-btn"
              onClick={() => setActivePage('portal-select')}
            >
              ← {isTe ? 'ఎంపికకి వెనుకకు' : 'Back to Selection'}
            </button>

            <button
              type="button"
              className="signin-gear-btn-blue"
              title={mobileNumber ? 'Clear for New Farmer sign-up test' : 'Auto-fill Demo Registered Farmer'}
              onClick={handleToggleDemoState}
              aria-label="Settings"
            >
              ⚙️
            </button>
          </div>

          {/* Farmer Sign-In Badge */}
          <div className="signin-farmer-badge">
            <span className="signin-badge-avatar">👨‍🌾</span>
            <span>{isTe ? 'రైతు మొబైల్ సైన్-ఇన్' : 'Farmer Mobile Sign-In'}</span>
          </div>

          {/* Title & Subtitle */}
          <h2 className="signin-heading" style={{ fontSize: '24px', marginTop: '4px' }}>
            {isTe ? 'ఫోన్ & OTP తో ప్రవేశించండి' : 'Enter with Phone & OTP'}
          </h2>
          <p className="signin-description" style={{ marginBottom: '16px' }}>
            {isTe
              ? 'తక్షణ ఫోన్ ధృవీకరణ. పాస్‌వర్డ్‌లు అవసరం లేదు.'
              : 'Instant phone verification. No passwords required.'}
          </p>

          {/* CASE 1: PROMINENT ONE-TAP LOGIN CARD FOR RETURNING SIGNED-UP MEMBER */}
          {lastFarmer && !otpSent && (
            <div className="signin-returning-farmer-card page-anim">
              <div className="returning-farmer-header">
                <div className="returning-avatar-circle">👨‍🌾</div>
                <div className="returning-text-col">
                  <span className="returning-tag">
                    ✓ {isTe ? 'గుర్తించబడిన రైతు సభ్యుడు' : 'Recognized Member'}
                  </span>
                  <strong className="returning-name">{lastFarmer.name}</strong>
                  <span className="returning-meta">
                    +91 {lastFarmer.mobile} • {lastFarmer.village}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="signin-returning-tap-btn"
                onClick={() => handleOneTapLogin(lastFarmer)}
              >
                <span>⚡ {isTe ? `1-ట్యాప్ లాగిన్ (${lastFarmer.name.split(' ')[0]}) →` : `1-Tap Login as ${lastFarmer.name.split(' ')[0]} →`}</span>
              </button>
            </div>
          )}

          {lastFarmer && !otpSent && (
            <div className="signin-or-divider">
              <span>{isTe ? 'లేదా మరొక నంబర్‌తో ప్రవేశించండి' : 'or sign in with another phone number'}</span>
            </div>
          )}

          {/* DYNAMIC MEMBER STATUS BANNER WHEN ENTERING PHONE */}
          {cleanPhone.length >= 10 && (
            <div className={`signin-recognized-status-banner page-anim ${isAlreadyPart ? 'is-member' : 'is-new'}`}>
              <span>{isAlreadyPart ? '✓' : '🌱'}</span>
              <span>
                {isAlreadyPart
                  ? (isTe 
                      ? `నమోదిత రైతు ఖాతా గుర్తించబడింది: స్వాగతం ${activeMember?.name || ''}!` 
                      : `Registered Member Account: Welcome back, ${activeMember?.name || ''}!`)
                  : (isTe
                      ? 'కొత్త రైతు నంబర్: ప్రవేశించడానికి OTP తో నమోదు చేసుకోండి.'
                      : 'New Farmer detected: Verify with OTP to complete sign-up.')}
              </span>
            </div>
          )}

          {errorMsg && <div className="signin-error-box">⚠️ {errorMsg}</div>}

          {/* Inputs Section */}
          <form onSubmit={otpSent ? handleVerifyAndEnter : (isAlreadyPart ? () => handleOneTapLogin() : handleSendOtp)}>
            {/* Field 1: Farmer Full Name */}
            <div className="signin-field-group">
              <label className="signin-field-label">
                {isTe ? 'రైతు పూర్తి పేరు' : 'Farmer Full Name'}
              </label>
              <div className="signin-field-input-box">
                <span className="signin-input-icon icon-person">👤</span>
                <input
                  type="text"
                  className="signin-input-text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. N. Ramesh Kumar"
                />
              </div>
            </div>

            {/* Field 2: 10-Digit Mobile Number * */}
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
                  value={mobileNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setMobileNumber(val);
                    setOtpSent(false);
                    setErrorMsg('');
                  }}
                  placeholder="9848012345"
                />
              </div>
            </div>

            {/* Field 3: Village / Delivery Base */}
            <div className="signin-field-group">
              <label className="signin-field-label">
                {isTe ? 'గ్రామం / డెలివరీ ప్రాంతం' : 'Village / Delivery Base'}
              </label>
              <div className="signin-field-input-box">
                <span className="signin-input-icon icon-pin">📍</span>
                <input
                  type="text"
                  className="signin-input-text"
                  value={villageBase}
                  onChange={(e) => setVillageBase(e.target.value)}
                  placeholder="e.g. Hasanparthy"
                />
              </div>
            </div>

            {/* OTP Step: 6-Digit Verification OTP (Screenshot 3) */}
            {otpSent && (
              <div className="signin-field-group signin-otp-block page-anim">
                <label className="signin-field-label" style={{ fontWeight: 800 }}>
                  {isTe ? '6-అంకెల ధృవీకరణ OTP నమోదు చేయండి' : 'Enter 6-Digit Verification OTP'}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  className="signin-otp-input"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="874885"
                  autoFocus
                />
                <span className="signin-demo-otp-hint">
                  {isTe ? 'డెమో OTP ప్రివ్యూ: 874885' : 'Demo OTP preview: 874885'}
                </span>
              </div>
            )}

            {/* DYNAMIC ACTION BUTTONS:
                - If ALREADY PART OF IT: Offers 1-Tap Login!
                - If NEW FARMER: Offers Send Verification OTP & complete sign-up. 1-Tap is hidden until they sign up! */}
            {!otpSent ? (
              isAlreadyPart ? (
                <>
                  <button
                    type="button"
                    className="signin-btn-forest-green"
                    style={{ background: '#15803d' }}
                    onClick={() => handleOneTapLogin()}
                  >
                    <span>⚡ {isTe ? `1-ట్యాప్ లాగిన్ (${(fullName || 'రైతు').split(' ')[0]}) →` : `1-Tap Login as ${(fullName || 'Farmer').split(' ')[0]} →`}</span>
                  </button>

                  <button
                    type="button"
                    className="signin-btn-quick-tap"
                    style={{ borderStyle: 'dashed' }}
                    onClick={handleSendOtp}
                  >
                    <span>📲 {isTe ? 'OTP ద్వారా ధృవీకరించి ప్రవేశించండి' : 'or Verify with SMS OTP instead'}</span>
                  </button>
                </>
              ) : (
                <button type="submit" className="signin-btn-forest-green">
                  <span>• {isTe ? 'ధృవీకరణ OTP పంపండి 📲' : 'Send Verification OTP 📲'}</span>
                </button>
              )
            ) : (
              <button type="submit" className="signin-btn-forest-green">
                <span>• {isTe ? 'ధృవీకరించి నమోదు పూర్తి చేయండి →' : 'Verify & Complete Sign-Up →'}</span>
              </button>
            )}
          </form>

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
  );
}
