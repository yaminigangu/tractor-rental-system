import { useState } from 'react';
import { translations } from '../translations';
import { saveRegisteredOwner, findOwnerByIdentifier } from '../data/userData';

export default function OwnerRegistration({
  setTractors,
  setActivePage,
  language = 'en',
  setLanguage,
  currentOwner,
  setCurrentOwner,
  selectedLocation
}) {
  const t = translations[language] || translations.en;
  const isTe = language === 'te';

  const defaultVillage = selectedLocation
    ? (isTe ? (selectedLocation.villageTe || selectedLocation.village) : selectedLocation.village)
    : 'Hasanparthy';
  const defaultDistrict = selectedLocation?.district || 'Hanumakonda';

  // Check if owner previously registered on this device
  const [lastOwner, setLastOwner] = useState(() => {
    try {
      const saved = localStorage.getItem('agri_last_owner');
      if (saved) return JSON.parse(saved);
      const curr = localStorage.getItem('agri_current_owner');
      if (curr) return JSON.parse(curr);
    } catch {
      // ignore
    }
    return null;
  });

  // Active Tab: 'kyc' (4-Step KYC Authentication) or 'login' (Returning Owner Login)
  const [activeTab, setActiveTab] = useState('kyc');

  // Multi-step progress (1: Identity, 2: Vehicle RC, 3: Bank/UPI, 4: Machinery)
  const [currentStep, setCurrentStep] = useState(1);
  const [otpSent, setOtpSent] = useState(true); // Pre-sent by default as shown in Screenshot 1
  const [enteredOtp, setEnteredOtp] = useState('354498');
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Returning owner input
  const [returningQuery, setReturningQuery] = useState('');

  // Form State (Exact match to Screenshots 1 - 4)
  const [formData, setFormData] = useState({
    // Step 1: Owner Mobile & Identity
    fullName: 'G. Srinivas Rao',
    mobile: '9440156789',

    // Step 2: Tractor RC & Vehicle Specs
    rcNumber: 'TS 03 AB 4589',
    dlNumber: 'TS-03-2018-004521',
    engineHp: '48',
    regYear: '2023',

    // Step 3: Payout Details
    upiId: '9440156789@ybl',
    bankAccount: '50100456123489',
    ifscCode: 'HDFC0000123',

    // Step 4: Machinery Specs & Location
    brand: 'Swaraj',
    modelSpecs: '744 FE High Torque (48 HP)',
    district: defaultDistrict,
    mandalBase: defaultVillage,
    whereabouts: 'Hasanparthy Rythu Vedika & Market Yard',
    priceHour: 900,
    priceAcre: 1800,
    implements: ['Ploughing', 'Rotavator', 'Trailer Services'],
    selectedPhoto: '/tractor4.jpeg',
    photoName: 'Swaraj 744 FE XT'
  });

  const brandOptions = [
    'Mahindra',
    'Swaraj',
    'John Deere',
    'Sonalika',
    'Massey Ferguson',
    'Eicher',
    'New Holland',
    'Farmtrac',
    'Kubota'
  ];

  const implementOptions = [
    { id: 'Ploughing', label: isTe ? 'దుక్కి దున్నడం' : 'Ploughing' },
    { id: 'Rotavator', label: isTe ? 'రొటవేటర్' : 'Rotavator' },
    { id: 'Cultivator', label: isTe ? 'కల్టివేటర్' : 'Cultivator' },
    { id: 'Trailer Services', label: isTe ? 'ట్రాలీ రవాణా' : 'Trailer Services' },
    { id: 'Corn Harvester', label: isTe ? 'మొక్కజొన్న కోత' : 'Corn Harvester' },
    { id: 'Straw Baler', label: isTe ? 'గడ్డి బెయిలర్' : 'Straw Baler' },
    { id: 'Corn Seeder', label: isTe ? 'విత్తన యంత్రం' : 'Corn Seeder' },
    { id: 'Other Work', label: isTe ? 'ఇతర పనులు' : 'Other Work' }
  ];

  const photoOptions = [
    { id: 'Mahindra 575 DI', label: 'Mahindra 575 DI (Red)', src: '/images/mahindra_575.jpg' },
    { id: 'Mahindra 475 DI XP Plus', label: 'Mahindra 475 DI XP Plus (Red)', src: '/tractor1.jpeg' },
    { id: 'Swaraj 744 FE XT', label: 'Swaraj 744 FE XT (Blue)', src: '/tractor4.jpeg' },
    { id: 'John Deere 5310', label: 'John Deere 5310 (Green)', src: '/images/john_deere_5310.jpg' },
    { id: 'John Deere 5075E', label: 'John Deere 5075E 4WD (Green)', src: '/tractor3.jpeg' },
    { id: 'Massey Ferguson 241 DI', label: 'Massey Ferguson 241 DI (Red)', src: '/tractor5.jpeg' },
    { id: 'Eicher 380 Super DI', label: 'Eicher 380 Super DI (Silver)', src: '/eicher_380_clean.jpg' },
    { id: 'Sonalika DI 745', label: 'Sonalika DI 745 (Blue)', src: '/tractor6.jpeg' },
    { id: 'Sonalika Tiger DI 55', label: 'Sonalika Tiger 55 (Blue)', src: '/sonalika_tiger_55.jpg' },
    { id: 'Farmtrac 60 Powermaxx', label: 'Farmtrac 60 (Blue)', src: '/farmtrac_60.jpg' },
    { id: 'New Holland 3630', label: 'New Holland 3630 (Blue)', src: '/new_holland_3630.jpg' },
    { id: 'Kubota MU4501', label: 'Kubota MU4501 4WD (Orange)', src: '/tractor7.jpeg' }
  ];

  const handleInputChange = (field, val) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: val };
      // Auto-sync photo when brand changes if not manually set to a specific model
      if (field === 'brand') {
        const brandMatch = {
          'Mahindra': { src: '/images/mahindra_575.jpg', name: 'Mahindra 575 DI' },
          'Swaraj': { src: '/tractor4.jpeg', name: 'Swaraj 744 FE XT' },
          'John Deere': { src: '/images/john_deere_5310.jpg', name: 'John Deere 5310' },
          'Massey Ferguson': { src: '/tractor5.jpeg', name: 'Massey Ferguson 241 DI' },
          'Eicher': { src: '/eicher_380_clean.jpg', name: 'Eicher 380 Super DI' },
          'Sonalika': { src: '/tractor6.jpeg', name: 'Sonalika DI 745' },
          'Farmtrac': { src: '/farmtrac_60.jpg', name: 'Farmtrac 60 Powermaxx' },
          'New Holland': { src: '/new_holland_3630.jpg', name: 'New Holland 3630' },
          'Kubota': { src: '/tractor7.jpeg', name: 'Kubota MU4501' }
        }[val];
        if (brandMatch) {
          updated.selectedPhoto = brandMatch.src;
          updated.photoName = brandMatch.name;
        }
      }
      return updated;
    });
    setErrorMsg('');
  };

  const handleImplementToggle = (itemId) => {
    setFormData(prev => {
      const exists = prev.implements.includes(itemId);
      const updated = exists
        ? prev.implements.filter(i => i !== itemId)
        : [...prev.implements, itemId];
      return { ...prev, implements: updated };
    });
  };

  const toggleLanguage = () => {
    if (setLanguage) {
      setLanguage(prev => (prev === 'en' ? 'te' : 'en'));
    }
  };

  // Demo auto-fill helper
  const handleFillDemo = () => {
    setFormData({
      fullName: 'G. Srinivas Rao',
      mobile: '9440156789',
      rcNumber: 'TS 03 AB 4589',
      dlNumber: 'TS-03-2018-004521',
      engineHp: '48',
      regYear: '2023',
      upiId: '9440156789@ybl',
      bankAccount: '50100456123489',
      ifscCode: 'HDFC0000123',
      brand: 'Swaraj',
      modelSpecs: '744 FE High Torque (48 HP)',
      district: defaultDistrict,
      mandalBase: defaultVillage,
      whereabouts: 'Hasanparthy Rythu Vedika & Market Yard',
      priceHour: 900,
      priceAcre: 1800,
      implements: ['Ploughing', 'Rotavator', 'Trailer Services'],
      selectedPhoto: '/tractor4.jpeg',
      photoName: 'Swaraj 744 FE XT'
    });
    setEnteredOtp('354498');
    setErrorMsg('');
  };

  // Step 1: Verify OTP and advance to Step 2
  const handleVerifyOtp = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!formData.fullName.trim()) {
      setErrorMsg(isTe ? 'దయచేసి యజమాని పూర్తి పేరు నమోదు చేయండి.' : 'Please enter Owner Full Name.');
      return;
    }
    const cleanPhone = formData.mobile.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg(isTe ? 'దయచేసి 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.' : 'Please enter 10-digit mobile number.');
      return;
    }
    if (enteredOtp.trim().length < 4) {
      setErrorMsg(isTe ? 'దయచేసి OTP నమోదు చేయండి.' : 'Please enter the 6-digit OTP code.');
      return;
    }

    setCurrentStep(2);
  };

  // Step 2: Next to Payout Details
  const handleNextPayout = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!formData.rcNumber.trim()) {
      setErrorMsg(isTe ? 'దయచేసి వాహన RC నంబర్ నమోదు చేయండి.' : 'Please enter Tractor RC Registration Number.');
      return;
    }
    setCurrentStep(3);
  };

  // Step 3: Next to Machinery Details
  const handleNextMachinery = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!formData.upiId.trim() && !formData.bankAccount.trim()) {
      setErrorMsg(isTe ? 'దయచేసి UPI ID లేదా బ్యాంక్ ఖాతా నంబర్ నమోదు చేయండి.' : 'Please enter UPI ID or Bank Account.');
      return;
    }
    setCurrentStep(4);
  };

  // Step 4: Final Submit & Enter Marketplace / Inbox
  const handleCompleteKyc = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    // Prevent duplicated brand name in model
    let cleanModel = (formData.modelSpecs || '').trim();
    if (cleanModel.toLowerCase().startsWith(formData.brand.toLowerCase())) {
      cleanModel = cleanModel.slice(formData.brand.length).trim();
    }
    const fullTractorTitle = cleanModel 
      ? `${formData.brand} ${cleanModel}` 
      : formData.brand;

    // Pick accurate photo matching the model and brand
    let resolvedPhoto = formData.selectedPhoto;
    const lowerModel = (formData.modelSpecs || '').toLowerCase();
    const lowerBrand = (formData.brand || '').toLowerCase();
    if (lowerModel.includes('575') || (lowerBrand.includes('mahindra') && lowerModel.includes('sarpanch'))) {
      resolvedPhoto = '/images/mahindra_575.jpg';
    } else if (lowerModel.includes('475')) {
      resolvedPhoto = '/tractor1.jpeg';
    } else if (lowerModel.includes('744') || (lowerBrand.includes('swaraj') && lowerModel.includes('xt'))) {
      resolvedPhoto = '/tractor4.jpeg';
    } else if (lowerModel.includes('735')) {
      resolvedPhoto = '/tractor8.jpg';
    } else if (lowerModel.includes('5310')) {
      resolvedPhoto = '/images/john_deere_5310.jpg';
    } else if (lowerModel.includes('5075')) {
      resolvedPhoto = '/tractor3.jpeg';
    } else if (lowerModel.includes('380') || lowerBrand.includes('eicher')) {
      resolvedPhoto = '/eicher_380_clean.jpg';
    } else if (lowerModel.includes('farmtrac') || lowerModel.includes('60')) {
      resolvedPhoto = '/farmtrac_60.jpg';
    } else if (lowerModel.includes('3630') || lowerBrand.includes('new holland')) {
      resolvedPhoto = '/new_holland_3630.jpg';
    } else if (lowerModel.includes('tiger')) {
      resolvedPhoto = '/sonalika_tiger_55.jpg';
    } else if (lowerBrand.includes('kubota')) {
      resolvedPhoto = '/tractor7.jpeg';
    } else if (!resolvedPhoto || resolvedPhoto === '/tractor2.jpeg') {
      resolvedPhoto = '/images/mahindra_575.jpg';
    }

    const newOwnerRecord = {
      fullName: formData.fullName.trim(),
      owner: formData.fullName.trim(),
      mobile: formData.mobile,
      brand: formData.brand,
      tractorModel: fullTractorTitle,
      vehicleNumber: formData.rcNumber.toUpperCase(),
      pricing: Number(formData.priceHour) || 900,
      priceAcre: Number(formData.priceAcre) || 1800,
      village: formData.mandalBase,
      district: formData.district,
      whereabouts: formData.whereabouts,
      engineHp: formData.engineHp,
      regYear: formData.regYear,
      dlNumber: formData.dlNumber,
      rcNumber: formData.rcNumber.toUpperCase(),
      bankAccount: formData.bankAccount,
      ifscCode: formData.ifscCode,
      upiId: formData.upiId,
      photo: resolvedPhoto,
      isVerified: true,
      registeredAt: new Date().toISOString().split('T')[0]
    };

    saveRegisteredOwner(newOwnerRecord);

    const newTractorEntry = {
      id: Date.now(),
      owner: formData.fullName.trim(),
      mobile: formData.mobile,
      location: formData.mandalBase,
      district: formData.district,
      brand: formData.brand,
      model: cleanModel || formData.modelSpecs,
      equipment: formData.implements.join(', '),
      pricing: Number(formData.priceHour) || 900,
      priceAcre: Number(formData.priceAcre) || 1800,
      engineHp: formData.engineHp,
      availability: 'Available',
      photo: resolvedPhoto,
      rating: 4.9,
      jobsDone: 24,
      registeredAt: new Date().toLocaleDateString(),
      vehicleNumber: formData.rcNumber.toUpperCase(),
      isCaptainVerified: true,
      distanceKm: 1.0,
      dispatchMins: 13
    };

    if (setTractors) {
      setTractors(prev => [newTractorEntry, ...(Array.isArray(prev) ? prev : [])]);
    }

    if (setCurrentOwner) {
      setCurrentOwner(newOwnerRecord);
      try {
        localStorage.setItem('agri_last_owner', JSON.stringify(newOwnerRecord));
        localStorage.setItem('agri_current_owner', JSON.stringify(newOwnerRecord));
      } catch (err) {
        console.warn(err);
      }
    }

    // Direct into Marketplace Fleet (Screenshot 5)
    setActivePage('find-tractor');
  };

  // Instant 1-Tap Login for recognized returning owner
  const handleOneTapOwnerLogin = (targetOwner) => {
    const ownerToLogin = targetOwner || lastOwner;
    if (!ownerToLogin) return;

    if (setCurrentOwner) {
      setCurrentOwner(ownerToLogin);
    }
    try {
      localStorage.setItem('agri_last_owner', JSON.stringify(ownerToLogin));
      localStorage.setItem('agri_current_owner', JSON.stringify(ownerToLogin));
    } catch (err) {
      console.warn(err);
    }
    setActivePage('owner-inbox');
  };

  // Returning owner login handler
  const handleReturningLogin = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const cleanInput = returningQuery.trim();
    if (!cleanInput) {
      setErrorMsg(isTe ? 'దయచేసి మీ మొబైల్ లేదా RC నంబర్ నమోదు చేయండి.' : 'Please enter mobile or RC number.');
      return;
    }

    const existing = findOwnerByIdentifier(cleanInput);
    if (existing) {
      if (setCurrentOwner) {
        setCurrentOwner(existing);
        try {
          localStorage.setItem('agri_last_owner', JSON.stringify(existing));
          localStorage.setItem('agri_current_owner', JSON.stringify(existing));
        } catch (err) {
          console.warn(err);
        }
      }
      setActivePage('owner-inbox');
    } else {
      setErrorMsg(isTe ? 'నమోదైన యజమాని కనుగొనబడలేదు. దయచేసి 4-దశల KYC ని పూర్తి చేయండి.' : 'Owner not found. Please complete the 4-step KYC authentication.');
      setActiveTab('kyc');
      setCurrentStep(1);
    }
  };

  return (
    <div className="signin-page-viewport page-anim">
      {/* Top Header Bar matching Screenshots 1 - 4 */}
      <header className="signin-top-nav">
        <div className="signin-nav-left">
          <button
            type="button"
            className="signin-header-back-sq"
            onClick={() => setActivePage('portal-select')}
            title="Back to selection"
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

      {/* Main Container Card matching Screenshots */}
      <main className="signin-card-container">
        {/* OTP Notification Banner (Step 1) */}
        {activeTab === 'kyc' && currentStep === 1 && (
          <div className="signin-otp-banner page-anim">
            ✓ 📲 {isTe ? `ధృవీకరణ OTP +91 ${formData.mobile} కి పంపబడింది!` : `Verification OTP sent to +91 ${formData.mobile}!`}
          </div>
        )}

        <div className="signin-main-card">
          {/* Top Row: Back to Selection */}
          <div className="signin-card-top-row">
            <button
              type="button"
              className="signin-back-pill-btn"
              onClick={() => setActivePage('portal-select')}
            >
              ← {isTe ? 'ఎంపికకి వెనుకకు' : 'Back to Selection'}
            </button>
          </div>

          {/* RETURNING OWNER 1-TAP LOGIN CARD (If recognized member on device) */}
          {lastOwner && (
            <div className="signin-returning-farmer-card page-anim" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)', borderColor: '#93c5fd' }}>
              <div className="returning-farmer-header">
                <div className="returning-avatar-circle" style={{ background: '#dbeafe', borderColor: '#bfdbfe' }}>🚜</div>
                <div className="returning-text-col">
                  <span className="returning-tag" style={{ color: '#1d4ed8' }}>
                    ✓ {isTe ? 'నమోదిత వాహన యజమాని' : 'Recognized Vehicle Owner'}
                  </span>
                  <strong className="returning-name">{lastOwner.fullName || lastOwner.owner}</strong>
                  <span className="returning-meta">
                    {lastOwner.tractorModel || 'Tractor'} • {lastOwner.vehicleNumber || lastOwner.rcNumber} • +91 {lastOwner.mobile}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="signin-returning-tap-btn"
                style={{ background: '#1d4ed8' }}
                onClick={() => handleOneTapOwnerLogin(lastOwner)}
              >
                <span>⚡ {isTe ? `1-ట్యాప్ ఓనర్ లాగిన్ (${(lastOwner.fullName || 'Owner').split(' ')[0]}) →` : `1-Tap Login to Owner Inbox (${(lastOwner.fullName || 'Owner').split(' ')[0]}) →`}</span>
              </button>
            </div>
          )}

          {/* Segmented Switcher Pill Bar (4-Step KYC Authentication vs Returning Owner Login) */}
          <div className="portal-tabs-pill" style={{ marginBottom: '16px' }}>
            <button
              type="button"
              className={`portal-tab-btn ${activeTab === 'kyc' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('kyc');
                setErrorMsg('');
              }}
            >
              ⚡ {isTe ? '4-దశల KYC ధృవీకరణ' : '4-Step KYC Authentication'}
            </button>
            <button
              type="button"
              className={`portal-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('login');
                setErrorMsg('');
              }}
            >
              🔑 {isTe ? 'వాహన యజమాని లాగిన్' : 'Returning Vehicle Owner Login'}
            </button>
          </div>

          {errorMsg && <div className="signin-error-box">⚠️ {errorMsg}</div>}

          {/* ========================================================
              TAB 1: 4-STEP KYC FLOW
              ======================================================== */}
          {activeTab === 'kyc' && (
            <div className="page-anim">
              {/* Stepper 4-Circles (Identity, Vehicle RC, Bank/UPI, Machinery) */}
              <div className="owner-stepper-track">
                {[
                  { step: 1, label: isTe ? 'గుర్తింపు' : 'Identity' },
                  { step: 2, label: isTe ? 'వాహన RC' : 'Vehicle RC' },
                  { step: 3, label: isTe ? 'బ్యాంక్/UPI' : 'Bank/UPI' },
                  { step: 4, label: isTe ? 'యంత్రాలు' : 'Machinery' }
                ].map((s) => {
                  const isPassed = currentStep > s.step;
                  const isCurrent = currentStep === s.step;
                  return (
                    <div 
                      key={s.step} 
                      className="owner-step-item"
                      onClick={() => s.step < currentStep && setCurrentStep(s.step)}
                    >
                      <div className={`owner-circle-node ${isPassed ? 'passed' : ''} ${isCurrent ? 'current' : ''}`}>
                        {isPassed ? '✓' : s.step}
                      </div>
                      <span className={`owner-step-caption ${isCurrent ? 'current' : ''} ${isPassed ? 'passed' : ''}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* ----------------------------------------------------
                  STEP 1 OF 4: Owner Mobile & Identity (Screenshot 1)
                  ---------------------------------------------------- */}
              {currentStep === 1 && (
                <form onSubmit={handleVerifyOtp} className="page-anim">
                  <div className="owner-step-header">
                    <span className="owner-step-mini-tag">
                      {isTe ? 'దశ 1 / 4' : 'STEP 1 OF 4'}
                    </span>
                    <h3 className="owner-step-main-title">
                      {isTe ? 'యజమాని మొబైల్ & గుర్తింపు' : 'Owner Mobile & Identity'}
                    </h3>
                  </div>

                  <div className="signin-field-group">
                    <label className="signin-field-label">
                      {isTe ? 'యజమాని పూర్తి పేరు (RC ప్రకారం) *' : 'Owner Full Name (as on RC) *'}
                    </label>
                    <div className="signin-field-input-box">
                      <span className="signin-input-icon icon-person">👤</span>
                      <input
                        type="text"
                        className="signin-input-text font-bold"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        placeholder="e.g. G. Srinivas Rao"
                        autoFocus
                      />
                    </div>
                  </div>

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
                        value={formData.mobile}
                        onChange={(e) => handleInputChange('mobile', e.target.value.replace(/\D/g, ''))}
                        placeholder="9440156789"
                      />
                    </div>
                  </div>

                  <div className="signin-field-group signin-otp-block">
                    <label className="signin-field-label" style={{ fontWeight: 800 }}>
                      {isTe ? '6-అంకెల OTP కోడ్ నమోదు చేయండి' : 'Enter 6-Digit OTP Code'}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      className="signin-otp-input"
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="354498"
                    />
                    <span className="signin-demo-otp-hint">
                      {isTe ? 'డెమో OTP ప్రివ్యూ: 354498' : 'Demo OTP preview: 354498'}
                    </span>
                  </div>

                  <button type="submit" className="owner-btn-primary-blue">
                    <span>{isTe ? 'OTP ధృవీకరించి కొనసాగించండి →' : 'Verify OTP & Continue →'}</span>
                  </button>
                </form>
              )}

              {/* ----------------------------------------------------
                  STEP 2 OF 4: Tractor RC & Vehicle Specs (Screenshot 2)
                  ---------------------------------------------------- */}
              {currentStep === 2 && (
                <form onSubmit={handleNextPayout} className="page-anim">
                  <div className="owner-step-header">
                    <span className="owner-step-mini-tag">
                      {isTe ? 'దశ 2 / 4' : 'STEP 2 OF 4'}
                    </span>
                    <h3 className="owner-step-main-title">
                      {isTe ? 'ట్రాక్టర్ RC & వాహన వివరాలు' : 'Tractor RC & Vehicle Specs'}
                    </h3>
                  </div>

                  <div className="signin-field-group">
                    <label className="signin-field-label">
                      {isTe ? 'ట్రాక్టర్ RC రిజిస్ట్రేషన్ నంబర్ (తెలంగాణ RTO) *' : 'Tractor RC Registration Number (Telangana RTO) *'}
                    </label>
                    <div className="signin-field-input-box">
                      <span className="owner-bullet">•</span>
                      <input
                        type="text"
                        className="signin-input-text font-bold uppercase"
                        value={formData.rcNumber}
                        onChange={(e) => handleInputChange('rcNumber', e.target.value.toUpperCase())}
                        placeholder="TS 03 AB 4589"
                        autoFocus
                      />
                    </div>
                    <div className="owner-verified-note">
                      🔒 {isTe ? 'తెలంగాణ రవాణా RTO రికార్డుల ప్రకారం ధృవీకరించబడింది.' : 'Verified against Telangana Transport RTO records.'}
                    </div>
                  </div>

                  <div className="signin-field-group">
                    <label className="signin-field-label">
                      {isTe ? 'డ్రైవింగ్ లైసెన్స్ / ఆధార్ (ఐచ్ఛికం)' : 'Driving License / Aadhaar (Optional)'}
                    </label>
                    <div className="signin-field-input-box">
                      <span className="owner-bullet">•</span>
                      <input
                        type="text"
                        className="signin-input-text font-bold uppercase"
                        value={formData.dlNumber}
                        onChange={(e) => handleInputChange('dlNumber', e.target.value.toUpperCase())}
                        placeholder="TS-03-2018-004521"
                      />
                    </div>
                  </div>

                  <div className="owner-two-col-grid">
                    <div className="signin-field-group">
                      <label className="signin-field-label">
                        {isTe ? 'ఇంజిన్ HP *' : 'Engine HP *'}
                      </label>
                      <div className="signin-field-input-box">
                        <input
                          type="number"
                          className="signin-input-text font-bold text-center"
                          value={formData.engineHp}
                          onChange={(e) => handleInputChange('engineHp', e.target.value)}
                          placeholder="48"
                        />
                      </div>
                    </div>

                    <div className="signin-field-group">
                      <label className="signin-field-label">
                        {isTe ? 'రిజిస్ట్రేషన్ సంవత్సరం *' : 'Reg. Year *'}
                      </label>
                      <div className="signin-field-input-box">
                        <input
                          type="number"
                          className="signin-input-text font-bold text-center"
                          value={formData.regYear}
                          onChange={(e) => handleInputChange('regYear', e.target.value)}
                          placeholder="2023"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="owner-actions-flex">
                    <button
                      type="button"
                      className="owner-btn-back-white"
                      onClick={() => setCurrentStep(1)}
                    >
                      ← {isTe ? 'వెనుకకు' : 'Back'}
                    </button>
                    <button type="submit" className="owner-btn-primary-blue flex-2">
                      <span>{isTe ? 'తరువాత: చెల్లింపు వివరాలు →' : 'Next: Payout Details →'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* ----------------------------------------------------
                  STEP 3 OF 4: Farmer Rental Payout Account (Screenshot 3 & 4)
                  ---------------------------------------------------- */}
              {currentStep === 3 && (
                <form onSubmit={handleNextMachinery} className="page-anim">
                  <div className="owner-step-header">
                    <span className="owner-step-mini-tag">
                      {isTe ? 'దశ 3 / 4' : 'STEP 3 OF 4'}
                    </span>
                    <h3 className="owner-step-main-title">
                      {isTe ? 'రైతు అద్దె చెల్లింపు ఖాతా' : 'Farmer Rental Payout Account'}
                    </h3>
                  </div>

                  {/* Shield Notification Note */}
                  <div className="owner-payout-shield-card">
                    <span className="owner-shield-icon">🛡️</span>
                    <span>
                      {isTe
                        ? 'పని పూర్తయిన వెంటనే అద్దె ఆదాయం నేరుగా ఈ ఖాతాకు జమ చేయబడుతుంది.'
                        : 'Rental earnings are credited directly to this account upon job completion.'}
                    </span>
                  </div>

                  {/* UPI ID Field */}
                  <div className="signin-field-group">
                    <label className="signin-field-label">
                      {isTe ? 'తక్షణ డైరెక్ట్ క్రెడిట్ కోసం UPI ID *' : 'UPI ID for Instant Direct Credit *'}
                    </label>
                    <div className="signin-field-input-box">
                      <span className="owner-upi-prefix">UPI:</span>
                      <input
                        type="text"
                        className="signin-input-text font-bold"
                        value={formData.upiId}
                        onChange={(e) => handleInputChange('upiId', e.target.value)}
                        placeholder="9440156789@ybl"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="owner-or-divider">
                    <span>— {isTe ? 'లేదా బ్యాంక్ ఖాతా' : 'OR BANK ACCOUNT'} —</span>
                  </div>

                  {/* Bank Account */}
                  <div className="signin-field-group">
                    <label className="signin-field-label">
                      {isTe ? 'బ్యాంక్ ఖాతా నంబర్' : 'Bank Account Number'}
                    </label>
                    <div className="signin-field-input-box">
                      <span className="owner-bullet">•</span>
                      <input
                        type="text"
                        className="signin-input-text font-bold"
                        value={formData.bankAccount}
                        onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                        placeholder="50100456123489"
                      />
                    </div>
                  </div>

                  {/* IFSC Code */}
                  <div className="signin-field-group">
                    <label className="signin-field-label">
                      {isTe ? 'IFSC కోడ్' : 'IFSC Code'}
                    </label>
                    <div className="signin-field-input-box">
                      <input
                        type="text"
                        className="signin-input-text font-bold uppercase"
                        value={formData.ifscCode}
                        onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
                        placeholder="HDFC0000123"
                      />
                    </div>
                  </div>

                  <div className="owner-actions-flex">
                    <button
                      type="button"
                      className="owner-btn-back-white"
                      onClick={() => setCurrentStep(2)}
                    >
                      ← {isTe ? 'వెనుకకు' : 'Back'}
                    </button>
                    <button type="submit" className="owner-btn-primary-blue flex-2">
                      <span>{isTe ? 'తరువాత: యంత్రాల వివరాలు →' : 'Next: Machinery Details →'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* ----------------------------------------------------
                  STEP 4 OF 4: Machinery Specs & Location (Screenshot 5 & 6)
                  ---------------------------------------------------- */}
              {currentStep === 4 && (
                <form onSubmit={handleCompleteKyc} className="page-anim">
                  <div className="owner-step-header">
                    <span className="owner-step-mini-tag">
                      {isTe ? 'దశ 4 / 4' : 'STEP 4 OF 4'}
                    </span>
                    <h3 className="owner-step-main-title">
                      {isTe ? 'యంత్రాల వివరాలు & లొకేషన్' : 'Machinery Specs & Location'}
                    </h3>
                  </div>

                  {/* Tractor Brand Chips */}
                  <div className="signin-field-group">
                    <label className="signin-field-label">
                      {isTe ? 'ట్రాక్టర్ బ్రాండ్ *' : 'Tractor Brand *'}
                    </label>
                    <div className="owner-brand-chips-row">
                      {brandOptions.map((brand) => (
                        <button
                          key={brand}
                          type="button"
                          className={`owner-chip-btn ${formData.brand === brand ? 'active' : ''}`}
                          onClick={() => handleInputChange('brand', brand)}
                        >
                          {brand}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Model & Specs */}
                  <div className="signin-field-group">
                    <label className="signin-field-label">
                      {isTe ? 'మోడల్ & స్పెసిఫికేషన్లు *' : 'Model & Specs *'}
                    </label>
                    <div className="signin-field-input-box">
                      <input
                        type="text"
                        className="signin-input-text font-bold"
                        value={formData.modelSpecs}
                        onChange={(e) => handleInputChange('modelSpecs', e.target.value)}
                        placeholder="744 FE High Torque (48 HP)"
                      />
                    </div>
                  </div>

                  {/* District & Mandal */}
                  <div className="owner-two-col-grid">
                    <div className="signin-field-group">
                      <label className="signin-field-label">
                        {isTe ? 'జిల్లా *' : 'District *'}
                      </label>
                      <div className="signin-field-input-box">
                        <input
                          type="text"
                          className="signin-input-text font-bold"
                          value={formData.district}
                          onChange={(e) => handleInputChange('district', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="signin-field-group">
                      <label className="signin-field-label">
                        {isTe ? 'మండలం / బేస్ *' : 'Mandal / Base *'}
                      </label>
                      <div className="signin-field-input-box">
                        <input
                          type="text"
                          className="signin-input-text font-bold"
                          value={formData.mandalBase}
                          onChange={(e) => handleInputChange('mandalBase', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stationed Whereabouts */}
                  <div className="signin-field-group">
                    <label className="signin-field-label">
                      {isTe ? 'నిలిపి ఉంచే స్థలం (Whereabouts) *' : 'Stationed Whereabouts *'}
                    </label>
                    <div className="signin-field-input-box">
                      <span className="owner-bullet">•</span>
                      <input
                        type="text"
                        className="signin-input-text font-bold"
                        value={formData.whereabouts}
                        onChange={(e) => handleInputChange('whereabouts', e.target.value)}
                        placeholder="Hasanparthy Rythu Vedika & Market Yard"
                      />
                    </div>
                  </div>

                  {/* Pricing (Price/Hour and Price/Acre) */}
                  <div className="owner-two-col-grid">
                    <div className="signin-field-group">
                      <label className="signin-field-label">
                        {isTe ? 'ధర / గంటకు (₹)' : 'Price / Hour (₹)'}
                      </label>
                      <div className="signin-field-input-box">
                        <input
                          type="number"
                          className="signin-input-text font-bold text-center"
                          value={formData.priceHour}
                          onChange={(e) => handleInputChange('priceHour', e.target.value)}
                          placeholder="900"
                        />
                      </div>
                    </div>
                    <div className="signin-field-group">
                      <label className="signin-field-label">
                        {isTe ? 'ధర / ఎకరానికి (₹)' : 'Price / Acre (₹)'}
                      </label>
                      <div className="signin-field-input-box">
                        <input
                          type="number"
                          className="signin-input-text font-bold text-center"
                          value={formData.priceAcre}
                          onChange={(e) => handleInputChange('priceAcre', e.target.value)}
                          placeholder="1800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Attached Implements & Services */}
                  <div className="signin-field-group">
                    <label className="signin-field-label">
                      {isTe ? 'అనుసంధానించబడిన పరికరాలు & సేవలు' : 'Attached Implements & Services'}
                    </label>
                    <div className="owner-implements-grid">
                      {implementOptions.map((item) => {
                        const isSelected = formData.implements.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={`owner-implement-btn ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleImplementToggle(item.id)}
                          >
                            {isSelected ? '✓ ' : '+ '}
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Machinery Photo */}
                  <div className="signin-field-group">
                    <label className="signin-field-label">
                      {isTe ? 'యంత్రం ఫోటో' : 'Machinery Photo'}
                    </label>
                    <div className="owner-photos-horizontal">
                      {photoOptions.map((photo) => {
                        const isSelected = formData.photoName === photo.id;
                        return (
                          <div
                            key={photo.id}
                            className={`owner-photo-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              handleInputChange('photoName', photo.id);
                              handleInputChange('selectedPhoto', photo.src);
                            }}
                          >
                            <img src={photo.src} alt={photo.label} className="owner-tractor-thumb" />
                            <span className="owner-photo-caption">{photo.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="owner-actions-flex" style={{ marginTop: '22px' }}>
                    <button
                      type="button"
                      className="owner-btn-back-white"
                      onClick={() => setCurrentStep(3)}
                    >
                      ← {isTe ? 'వెనుకకు' : 'Back'}
                    </button>
                    <button
                      type="submit"
                      className="owner-btn-complete-green flex-2"
                    >
                      <span>{isTe ? '4-దశల KYC పూర్తి చేసి లాగిన్ అవ్వండి →' : 'Complete 4-Step KYC & Login →'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 2: RETURNING OWNER LOGIN
              ======================================================== */}
          {activeTab === 'login' && (
            <form onSubmit={handleReturningLogin} className="page-anim">
              <div className="owner-step-header">
                <span className="owner-step-mini-tag">RETURNING OWNER</span>
                <h3 className="owner-step-main-title">
                  {isTe ? 'మీ మొబైల్ లేదా RC నంబర్‌తో ప్రవేశించండి' : 'Enter with Mobile or Vehicle RC'}
                </h3>
              </div>

              <div className="signin-field-group">
                <label className="signin-field-label">
                  {isTe ? 'మొబైల్ లేదా వాహన RC నంబర్ *' : 'Registered Mobile or RC Number *'}
                </label>
                <div className="signin-field-input-box">
                  <span className="signin-input-icon">🔑</span>
                  <input
                    type="text"
                    className="signin-input-text font-bold"
                    placeholder="e.g. 9440156789 or TS 03 AB 4589"
                    value={returningQuery}
                    onChange={(e) => {
                      setReturningQuery(e.target.value);
                      setErrorMsg('');
                    }}
                    autoFocus
                  />
                </div>
              </div>

              {returningQuery.trim() && (() => {
                const matched = findOwnerByIdentifier(returningQuery.trim());
                if (matched) {
                  return (
                    <div className="signin-recognized-status-banner is-member page-anim" style={{ marginTop: '10px' }}>
                      <span>✓</span>
                      <span>
                        {isTe
                          ? `నమోదిత యజమాని గుర్తించబడ్డారు: ${matched.fullName || matched.owner} (${matched.vehicleNumber || matched.rcNumber})`
                          : `Registered Owner Recognized: ${matched.fullName || matched.owner} (${matched.vehicleNumber || matched.rcNumber})`}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              <button type="submit" className="owner-btn-primary-blue" style={{ marginTop: '14px' }}>
                <span>
                  {(() => {
                    const matched = returningQuery.trim() ? findOwnerByIdentifier(returningQuery.trim()) : null;
                    if (matched) {
                      return `⚡ ${isTe ? '1-ట్యాప్ ఓనర్ లాగిన్' : '1-Tap Owner Login'} (${(matched.fullName || 'Owner').split(' ')[0]}) →`;
                    }
                    return isTe ? 'ఓనర్ ఇన్‌బాక్స్‌లోకి లాగిన్ అవ్వండి →' : 'Login to Owner Inbox →';
                  })()}
                </span>
              </button>

              <div className="sancharoo-demo-box" style={{ marginTop: '20px' }}>
                <span className="sancharoo-demo-title">💡 TEST WITH REGISTERED OWNER:</span>
                <button
                  type="button"
                  className="sancharoo-demo-item"
                  onClick={() => setReturningQuery('9876543210')}
                >
                  ⚡ Ramesh Kumar (9876543210) — TS 04 AB 7890
                </button>
              </div>
            </form>
          )}

          {/* Guest Browsing Link */}
          <div className="signin-guest-link-box" style={{ marginTop: '20px' }}>
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

        {/* Footer Safety Norms */}
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
