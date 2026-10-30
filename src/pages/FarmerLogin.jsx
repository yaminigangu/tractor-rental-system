import { useState } from 'react';
import { translations } from '../translations';
import { saveRegisteredFarmer, findFarmerByIdentifier } from '../data/userData';

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

  // Form Fields (Exact match to Screenshot 2 & 3)
  const [fullName, setFullName] = useState('N. Ramesh Kumar');
  const [mobileNumber, setMobileNumber] = useState('9848012345');
  const [villageBase, setVillageBase] = useState(defaultVillage);

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

  // Trigger Send OTP (transitions to Screenshot 3)
  const handleSendOtp = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const cleanPhone = mobileNumber.replace(/\D/g, '');
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

  // Complete Login with Farmer session & route to Marketplace
  const handleVerifyAndEnter = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (enteredOtp.trim().length < 4) {
      setErrorMsg(isTe ? 'దయచేసి 6 అంకెల OTP నమోదు చేయండి.' : 'Please enter the 6-digit OTP.');
      return;
    }

    const cleanPhone = mobileNumber.replace(/\D/g, '');
    const farmerRecord = {
      name: fullName.trim() || 'N. Ramesh Kumar',
      mobile: cleanPhone || '9848012345',
      village: villageBase || 'Hasanparthy',
      district: selectedLocation?.district || 'Hanamkonda',
      landArea: 3.5,
      crops: ['Paddy', 'Cotton'],
      isVerified: true,
      registeredAt: new Date().toISOString().split('T')[0]
    };

    // Save in storage
    saveRegisteredFarmer(farmerRecord);
    if (setCurrentFarmer) {
      setCurrentFarmer(farmerRecord);
      try {
        localStorage.setItem('agri_current_farmer', JSON.stringify(farmerRecord));
      } catch (err) {
        console.warn(err);
      }
    }

    // Direct into Marketplace (Screenshot 4)
    setActivePage('find-tractor');
  };

  // Instant 1-Tap Login
  const handleQuickOneTap = () => {
    const quickFarmer = {
      name: fullName.trim() || 'N. Ramesh Kumar',
      mobile: mobileNumber.replace(/\D/g, '') || '9848012345',
      village: villageBase || 'Hasanparthy',
      district: selectedLocation?.district || 'Hanamkonda',
      landArea: 3.5,
      crops: ['Paddy', 'Cotton'],
      isVerified: true,
      registeredAt: new Date().toISOString().split('T')[0]
    };

    saveRegisteredFarmer(quickFarmer);
    if (setCurrentFarmer) {
      setCurrentFarmer(quickFarmer);
      try {
        localStorage.setItem('agri_current_farmer', JSON.stringify(quickFarmer));
      } catch (err) {
        console.warn(err);
      }
    }
    setActivePage('find-tractor');
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

      {/* Main Container Card matching Screenshot 2 & 3 */}
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
              title="Quick auto-fill demo profile"
              onClick={() => {
                setFullName('N. Ramesh Kumar');
                setMobileNumber('9848012345');
                setVillageBase('Hasanparthy');
              }}
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
          <p className="signin-description" style={{ marginBottom: '18px' }}>
            {isTe
              ? 'తక్షణ ఫోన్ ధృవీకరణ. పాస్‌వర్డ్‌లు అవసరం లేదు.'
              : 'Instant phone verification. No passwords required.'}
          </p>

          {errorMsg && <div className="signin-error-box">⚠️ {errorMsg}</div>}

          {/* Inputs Section */}
          <form onSubmit={otpSent ? handleVerifyAndEnter : handleSendOtp}>
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
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
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

            {/* OPTIONAL STEP: 6-Digit OTP Box (Appears after clicking Send OTP - Screenshot 3) */}
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

            {/* Main Action Button (Screenshot 2: Send OTP / Screenshot 3: Verify & Enter) */}
            {!otpSent ? (
              <button type="submit" className="signin-btn-forest-green">
                <span>• {isTe ? 'ధృవీకరణ OTP పంపండి 📲' : 'Send Verification OTP 📲'}</span>
              </button>
            ) : (
              <button type="submit" className="signin-btn-forest-green">
                <span>• {isTe ? 'ధృవీకరించి మార్కెట్‌ప్లేస్‌లో ప్రవేశించండి →' : 'Verify & Enter Marketplace →'}</span>
              </button>
            )}

            {/* Secondary Button: Quick Farmer 1-Tap Login */}
            <button
              type="button"
              className="signin-btn-quick-tap"
              onClick={handleQuickOneTap}
            >
              <span>⚡ {isTe ? 'త్వరిత రైతు 1-ట్యాప్ లాగిన్' : 'Quick Farmer 1-Tap Login'}</span>
            </button>
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
