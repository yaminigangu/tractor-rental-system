import { useState } from 'react';
import { translations } from '../translations';
import { findFarmerByIdentifier, saveRegisteredFarmer } from '../data/userData';

export default function FarmerLogin({
  setActivePage,
  setCurrentFarmer,
  setOnboardingMobile,
  language = 'en',
  selectedLocation
}) {
  const t = translations[language] || translations.en;
  const isTe = language === 'te';

  const defaultVillage = selectedLocation
    ? `${isTe ? (selectedLocation.villageTe || selectedLocation.village) : selectedLocation.village}, ${isTe ? (selectedLocation.districtTe || selectedLocation.district) : selectedLocation.district}`
    : 'Hasanparthy, Hanamkonda';

  // Current view: 'login' (Starting screen) or 'onboarding' (1-minute profile setup)
  const [viewMode, setViewMode] = useState('login');

  // Login input state: phone number or farmer name
  const [loginQuery, setLoginQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // New Farmer Onboarding Form State
  const [onboardingData, setOnboardingData] = useState({
    name: '',
    mobile: '',
    village: defaultVillage,
    landArea: 2.5,
    crops: ['Paddy', 'Cotton'],
    passbookNo: ''
  });

  const cropOptions = [
    { id: 'Paddy', label: isTe ? 'వరి (Paddy)' : 'Paddy (వరి)' },
    { id: 'Cotton', label: isTe ? 'పత్తి (Cotton)' : 'Cotton (పత్తి)' },
    { id: 'Maize', label: isTe ? 'మొక్కజొన్న (Maize)' : 'Maize / Corn (మొక్కజొన్న)' },
    { id: 'Chilli', label: isTe ? 'మిరప (Chilli)' : 'Chilli (మిరప)' },
    { id: 'Turmeric', label: isTe ? 'పసుపు (Turmeric)' : 'Turmeric (పసుపు)' },
    { id: 'Vegetables', label: isTe ? 'కూరగాయలు (Vegetables)' : 'Vegetables (కూరగాయలు)' },
  ];

  const handleCropToggle = (cropId) => {
    setOnboardingData(prev => {
      const exists = prev.crops.includes(cropId);
      const updated = exists
        ? prev.crops.filter(c => c !== cropId)
        : [...prev.crops, cropId];
      return { ...prev, crops: updated };
    });
  };

  // Demo auto-fill helper
  const handleFillDemo = (type) => {
    if (type === 'kondal') {
      setLoginQuery('9848022334');
      setErrorMsg('');
      setSuccessNotice('💡 Demo Farmer: Kondal Rao (9848022334) loaded. Click Continue to log in!');
    } else if (type === 'laxmi') {
      setLoginQuery('9848552134');
      setErrorMsg('');
      setSuccessNotice('💡 Demo Farmer: Laxminarayana (9848552134) loaded. Click Continue to log in!');
    } else if (type === 'new') {
      setLoginQuery('9700012345');
      setErrorMsg('');
      setSuccessNotice('💡 New Farmer (+91 9700012345) loaded. Click Continue to start Onboarding!');
    } else {
      // Auto-fill onboarding form
      setOnboardingData({
        name: 'Srinivas Rao',
        mobile: loginQuery || '9700012345',
        village: defaultVillage,
        landArea: 3.5,
        crops: ['Paddy', 'Maize', 'Cotton'],
        passbookNo: 'TS-WGL-55412'
      });
      setErrorMsg('');
      setSuccessNotice('💡 Sample new farmer profile filled! Click Complete Onboarding.');
    }
  };

  // =========================================================================
  // LOGIN SUBMIT: If farmer exists -> direct login. If not -> onboarding!
  // =========================================================================
  const handleLoginSubmit = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessNotice('');

    const cleanInput = loginQuery.trim();
    if (!cleanInput) {
      setErrorMsg(isTe ? 'దయచేసి మీ మొబైల్ నంబర్ లేదా పేరు నమోదు చేయండి.' : 'Please enter your mobile number or farmer name.');
      return;
    }

    // Check if farmer exists in database
    const existingFarmer = findFarmerByIdentifier(cleanInput);

    if (existingFarmer) {
      // EXISTING FARMER -> Direct Login to Fleet!
      if (setCurrentFarmer) {
        setCurrentFarmer(existingFarmer);
        try {
          localStorage.setItem('agri_current_farmer', JSON.stringify(existingFarmer));
        } catch (err) {
          console.warn(err);
        }
      }
      setSuccessNotice(
        isTe
          ? `స్వాగతం ${existingFarmer.name}! మీ ఖాతాలోకి లాగిన్ అవుతోంది...`
          : `Welcome back, ${existingFarmer.name}! Logging you in directly to fleet...`
      );
      setTimeout(() => {
        setActivePage('find-tractor');
      }, 700);
    } else {
      // NEW FARMER -> Direct to 1-minute Onboarding Screen!
      const digits = cleanInput.replace(/\D/g, '');
      const initialPhone = digits.length >= 10 ? digits.slice(-10) : '';
      const initialName = !initialPhone && isNaN(cleanInput) ? cleanInput : '';

      setOnboardingData(prev => ({
        ...prev,
        mobile: initialPhone || prev.mobile,
        name: initialName || prev.name
      }));

      setSuccessNotice(
        isTe
          ? 'మీరు మొదటిసారి లాగిన్ అవుతున్నారు! దయచేసి క్రింది 1-నిమిషం ప్రొఫైల్ పూర్తి చేయండి.'
          : 'First-time user detected! Please complete your quick 1-minute profile below.'
      );
      setViewMode('onboarding');
    }
  };

  // =========================================================================
  // ONBOARDING SUBMIT: Save and route to tractor fleet
  // =========================================================================
  const handleOnboardingSubmit = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!onboardingData.name.trim()) {
      setErrorMsg(isTe ? 'దయచేసి రైతు పూర్తి పేరు నమోదు చేయండి.' : 'Please enter your full name.');
      return;
    }

    const cleanMobile = onboardingData.mobile.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length < 10) {
      setErrorMsg(isTe ? 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.' : 'Please enter a valid 10-digit mobile number.');
      return;
    }

    const newFarmer = {
      name: onboardingData.name.trim(),
      mobile: cleanMobile,
      village: onboardingData.village,
      district: selectedLocation?.district || 'Telangana',
      landArea: Number(onboardingData.landArea) || 2.5,
      crops: onboardingData.crops,
      passbookNo: onboardingData.passbookNo.trim(),
      isVerified: true,
      registeredAt: new Date().toISOString().split('T')[0]
    };

    saveRegisteredFarmer(newFarmer);

    if (setCurrentFarmer) {
      setCurrentFarmer(newFarmer);
      try {
        localStorage.setItem('agri_current_farmer', JSON.stringify(newFarmer));
      } catch (err) {
        console.warn(err);
      }
    }

    setSuccessNotice(
      isTe
        ? `ప్రొఫైల్ పూర్తయింది, ${newFarmer.name}! ఫ్లీట్ పేజీకి వెళ్తున్నారు...`
        : `Profile complete, ${newFarmer.name}! Taking you to tractor fleet...`
    );
    setTimeout(() => {
      setActivePage('find-tractor');
    }, 700);
  };

  // =========================================================================
  // RENDER VIEW 1: FARMER LOGIN SCREEN (MATCHES IMAGE 7 EXACTLY)
  // =========================================================================
  if (viewMode === 'login') {
    return (
      <div className="sancharoo-backdrop page-anim">
        <div className="sancharoo-login-card">
          {/* Top Brand Header Badge */}
          <div className="sancharoo-header-row">
            <div className="sancharoo-icon-sq" style={{ background: '#ecfdf5' }}>
              <span className="sancharoo-sq-icon">🌾</span>
            </div>
            <span className="sancharoo-brand-name">AGRIRENT</span>
            <span className="sancharoo-pill-badge" style={{ background: '#166534' }}>
              {isTe ? 'రైతు' : 'FARMER'}
            </span>
          </div>

          {/* Title & Subtitle */}
          <h1 className="sancharoo-title">{isTe ? 'లాగిన్' : 'Login'}</h1>
          <p className="sancharoo-sub">
            {isTe ? 'కొనసాగించడానికి మీ మొబైల్ నంబర్ నమోదు చేయండి' : 'Enter your mobile number to continue'}
          </p>

          {/* Error / Success Notifications */}
          {errorMsg && <div className="sancharoo-alert-error">⚠️ {errorMsg}</div>}
          {successNotice && <div className="sancharoo-alert-success">{successNotice}</div>}

          {/* Mobile Number Input with +91 */}
          <form onSubmit={handleLoginSubmit}>
            <div className="sancharoo-phone-box">
              <span className="sancharoo-dial-code">+91</span>
              <input
                type="text"
                className="sancharoo-phone-field"
                placeholder={isTe ? 'మొబైల్ నంబర్ లేదా పేరు నమోదు చేయండి' : 'Enter mobile number or name'}
                value={loginQuery}
                onChange={(e) => {
                  setLoginQuery(e.target.value);
                  setErrorMsg('');
                }}
                autoFocus
              />
            </div>

            <button type="submit" className="sancharoo-btn-submit" style={{ background: '#15803d' }}>
              {isTe ? 'కొనసాగించండి →' : 'Continue →'}
            </button>
          </form>

          {/* Terms Disclaimer */}
          <p className="sancharoo-terms-text">
            {isTe ? (
              <>కొనసాగడం ద్వారా, మీరు మా <a href="#terms">నిబంధనలు</a> మరియు <a href="#privacy">గోప్యతా విధానాన్ని</a> అంగీకరిస్తున్నారు.</>
            ) : (
              <>By continuing, you agree to our <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.</>
            )}
          </p>

          {/* Fast Testing Options */}
          <div className="sancharoo-demo-box">
            <span className="sancharoo-demo-title">💡 FAST TESTING OPTIONS:</span>
            <button
              type="button"
              className="sancharoo-demo-item"
              onClick={() => handleFillDemo('kondal')}
            >
              ⚡ Existing Farmer: Kondal Rao (9848022334)
            </button>
            <button
              type="button"
              className="sancharoo-demo-item"
              onClick={() => handleFillDemo('laxmi')}
            >
              ⚡ Existing Farmer: Laxminarayana (9848552134)
            </button>
            <button
              type="button"
              className="sancharoo-demo-item"
              onClick={() => handleFillDemo('new')}
            >
              ⚡ New Farmer (+91 9700012345): Direct to Onboarding
            </button>
          </div>

          <div className="sancharoo-powered-footer">
            powered by <strong>AgriRent Technologies</strong>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER VIEW 2: NEW FARMER ONBOARDING SCREEN
  // =========================================================================
  return (
    <div className="captain-reg-backdrop page-anim">
      <div className="captain-reg-card">
        {/* Header */}
        <div className="captain-header-area">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="sancharoo-icon-sq" style={{ width: '36px', height: '36px', background: '#ecfdf5', fontSize: '18px' }}>
                🌾
              </div>
              <h1 className="captain-reg-title" style={{ fontSize: '22px' }}>
                {isTe ? 'రైతు నమోదు (ఆన్‌బోర్డింగ్)' : 'Farmer Onboarding'}
              </h1>
            </div>
            <button
              type="button"
              className="captain-demo-btn"
              onClick={() => handleFillDemo('all')}
              title="Auto-fill sample onboarding details"
            >
              ⚙️ Demo Fill
            </button>
          </div>
          <div className="captain-step-indicator">
            {isTe
              ? 'తెలంగాణలో ధృవీకరించబడిన ట్రాక్టర్లను బుక్ చేయడానికి 1-నిమిషం ప్రొఫైల్ పూర్తి చేయండి'
              : 'Complete quick 1-minute profile to book verified machinery across Telangana'}
          </div>
        </div>

        {/* Notifications */}
        {errorMsg && <div className="captain-alert-error">⚠️ {errorMsg}</div>}
        {successNotice && <div className="captain-alert-success">{successNotice}</div>}

        {/* Form Container */}
        <div className="captain-inner-card">
          <form onSubmit={handleOnboardingSubmit}>
            <div className="captain-field-block">
              <label className="captain-field-label">
                {isTe ? 'రైతు పూర్తి పేరు *' : 'Farmer Full Name *'}
              </label>
              <input
                type="text"
                className="captain-input-field"
                placeholder={isTe ? 'ఉదా. కొండల్ రావు' : 'e.g. Kondal Rao / Srinivas Rao'}
                value={onboardingData.name}
                onChange={(e) => {
                  setOnboardingData(prev => ({ ...prev, name: e.target.value }));
                  setErrorMsg('');
                }}
                autoFocus
              />
            </div>

            <div className="captain-field-block">
              <label className="captain-field-label">
                {isTe ? 'మొబైల్ నంబర్ *' : 'Mobile Number *'}
              </label>
              <div className="sancharoo-phone-box" style={{ background: '#f8fafc', padding: '10px 14px' }}>
                <span className="sancharoo-dial-code">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  className="sancharoo-phone-field"
                  placeholder="10-digit mobile number"
                  value={onboardingData.mobile}
                  onChange={(e) => {
                    setOnboardingData(prev => ({ ...prev, mobile: e.target.value.replace(/\D/g, '') }));
                    setErrorMsg('');
                  }}
                />
              </div>
            </div>

            <div className="captain-field-block">
              <label className="captain-field-label">
                {isTe ? 'గ్రామం / మండలం *' : 'Village / Mandal *'}
              </label>
              <input
                type="text"
                className="captain-input-field"
                value={onboardingData.village}
                onChange={(e) => setOnboardingData(prev => ({ ...prev, village: e.target.value }))}
              />
            </div>

            <div className="captain-field-block">
              <label className="captain-field-label">
                {isTe ? 'వ్యవసాయ భూమి (ఎకరాలు)' : 'Agricultural Land (Acres)'}
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                className="captain-input-field"
                value={onboardingData.landArea}
                onChange={(e) => setOnboardingData(prev => ({ ...prev, landArea: e.target.value }))}
              />
            </div>

            <div className="captain-field-block">
              <label className="captain-field-label">
                {isTe ? 'పండించే ప్రధాన పంటలు' : 'Primary Crops Grown'}
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                {cropOptions.map((crop) => (
                  <button
                    key={crop.id}
                    type="button"
                    className={`captain-gender-pill ${onboardingData.crops.includes(crop.id) ? 'active' : ''}`}
                    style={{
                      flex: 'none',
                      padding: '8px 14px',
                      fontSize: '12.5px',
                      background: onboardingData.crops.includes(crop.id) ? '#166534' : '#ffffff',
                      borderColor: onboardingData.crops.includes(crop.id) ? '#166534' : '#cbd5e1'
                    }}
                    onClick={() => handleCropToggle(crop.id)}
                  >
                    {onboardingData.crops.includes(crop.id) ? '✓ ' : '+ '}
                    {crop.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="captain-field-block">
              <label className="captain-field-label">
                {isTe ? 'పట్టాదారు పాస్‌బుక్ / ఆధార్ నంబర్ (ఐచ్ఛికం)' : 'Pattadar Passbook / Aadhaar (Optional)'}
              </label>
              <input
                type="text"
                className="captain-input-field"
                placeholder="e.g. TS-WGL-55412"
                value={onboardingData.passbookNo}
                onChange={(e) => setOnboardingData(prev => ({ ...prev, passbookNo: e.target.value }))}
              />
            </div>

            <div className="captain-divider" />

            <div className="captain-actions-row">
              <button
                type="button"
                className="captain-btn-back"
                onClick={() => setViewMode('login')}
              >
                ‹ {isTe ? 'లాగిన్‌కి వెళ్లండి' : 'Back to Login'}
              </button>
              <button
                type="submit"
                className="captain-btn-submit"
                style={{ background: '#15803d' }}
              >
                {isTe ? 'నమోదు పూర్తి చేసి బుక్ చేయండి →' : 'Complete Profile & Book →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
