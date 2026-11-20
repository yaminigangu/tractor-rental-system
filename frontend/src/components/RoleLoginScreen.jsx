import { useState, useMemo } from 'react';
import { findFarmerByMobile, saveRegisteredFarmer } from '../data/userData';

export default function RoleLoginScreen({
  language = 'en',
  setLanguage,
  onLoginFarmer,
  onLoginOwner,
  onContinueAsGuest,
  onOpenSettings,
  defaultDistrict = 'Hanumakonda',
  defaultMandal = 'Hasanparthy'
}) {
  const isTe = language === 'te';

  // Screen State: null (Dual Login Selection) | 'farmer' | 'owner'
  const [activeRole, setActiveRole] = useState(null);

  // Common Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // --------------------------------------------------------------------------
  // FARMER STATE
  // --------------------------------------------------------------------------
  const [farmerPhone, setFarmerPhone] = useState('9848012345');
  const [farmerName, setFarmerName] = useState('N. Ramesh Kumar');
  const [farmerVillage, setFarmerVillage] = useState('Hasanparthy');
  const [farmerOtp, setFarmerOtp] = useState('');
  const [farmerOtpSent, setFarmerOtpSent] = useState(false);
  const [farmerOtpPreview, setFarmerOtpPreview] = useState('874885');

  const cleanFarmerPhone = useMemo(() => farmerPhone.replace(/\D/g, '').slice(-10), [farmerPhone]);
  const recognizedFarmer = useMemo(() => {
    if (cleanFarmerPhone.length >= 10) {
      return findFarmerByMobile(cleanFarmerPhone);
    }
    return null;
  }, [cleanFarmerPhone]);

  // --------------------------------------------------------------------------
  // TRACTOR OWNER 4-STEP STATE
  // --------------------------------------------------------------------------
  const [ownerMode, setOwnerMode] = useState('4step'); // '4step' | 'quick'
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Owner Identity & Mobile OTP
  const [ownerName, setOwnerName] = useState('G. Srinivas Rao');
  const [ownerPhone, setOwnerPhone] = useState('9440156789');
  const [ownerOtp, setOwnerOtp] = useState('');
  const [ownerOtpSent, setOwnerOtpSent] = useState(false);
  const [ownerOtpPreview, setOwnerOtpPreview] = useState('354498');
  const [step1Verified, setStep1Verified] = useState(false);

  // Step 2: Vehicle RC & Specs
  const [rcNumber, setRcNumber] = useState('TS 03 AB 4589');
  const [engineHp, setEngineHp] = useState('48');
  const [regYear, setRegYear] = useState('2023');
  const [dlNumber, setDlNumber] = useState('TS-03-2018-004521');

  // Step 3: Payout Banking & UPI
  const [upiId, setUpiId] = useState('9440156789@ybl');
  const [bankAccount, setBankAccount] = useState('50100456123489');
  const [ifscCode, setIfscCode] = useState('HDFC0000123');

  // Step 4: Machinery Specs & Location
  const [brand, setBrand] = useState('Swaraj');
  const [model, setModel] = useState('744 FE High Torque (48 HP)');
  const [district, setDistrict] = useState(defaultDistrict);
  const [mandal, setMandal] = useState(defaultMandal);
  const [whereabouts, setWhereabouts] = useState('Hasanparthy Rythu Vedika & Market Yard');
  const [ratePerHour, setRatePerHour] = useState('900');
  const [ratePerAcre, setRatePerAcre] = useState('1800');
  const [selectedImplements, setSelectedImplements] = useState([
    'Ploughing',
    'Rotavator',
    'Trailer Services'
  ]);
  const [selectedImage, setSelectedImage] = useState('/images/swaraj_blue.jpg');

  const brands = ['Mahindra', 'Swaraj', 'John Deere', 'Sonalika', 'Massey Ferguson'];

  const availableImplements = [
    { key: 'Ploughing', en: 'Ploughing', te: 'దుక్కి దున్నడం' },
    { key: 'Rotavator', en: 'Rotavator', te: 'రోటవేటర్' },
    { key: 'Cultivator', en: 'Cultivator', te: 'కల్టివేటర్' },
    { key: 'Trailer Services', en: 'Trailer Services', te: 'ట్రాలీ రవాణా' },
    { key: 'Corn Harvester', en: 'Corn Harvester', te: 'మొక్కజొన్న హార్వెస్టర్' },
    { key: 'Straw Baler', en: 'Straw Baler', te: 'గడ్డి చుట్టే యంత్రం' },
    { key: 'Corn Seeder', en: 'Corn Seeder', te: 'విత్తనాలు నాటే యంత్రం' },
    { key: 'Other Agricultural Work', en: 'Other Work', te: 'ఇతర పనులు' }
  ];

  const samplePhotos = [
    { title: 'Swaraj Blue Tractor', url: '/images/swaraj_blue.jpg' },
    { title: 'Mahindra 575 DI', url: '/images/mahindra_575.jpg' },
    { title: 'John Deere 5310', url: '/images/john_deere_5310.jpg' },
    { title: 'Massey Ferguson', url: '/images/massey_ferguson.jpg' }
  ];

  const toggleImplement = (key) => {
    if (selectedImplements.includes(key)) {
      setSelectedImplements(selectedImplements.filter((i) => i !== key));
    } else {
      setSelectedImplements([...selectedImplements, key]);
    }
  };

  // --------------------------------------------------------------------------
  // FARMER ACTIONS
  // --------------------------------------------------------------------------
  const handleFarmerSendOtp = () => {
    const cleanPhone = farmerPhone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg(isTe ? 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి' : 'Please enter a valid 10-digit mobile number');
      return;
    }
    setErrorMsg('');
    setFarmerOtpSent(true);
    setFarmerOtpPreview('874885');
    setFarmerOtp('874885');
    setSuccessMsg(isTe ? `✓ 📲 +91 ${cleanPhone} కి వెరిఫికేషన్ OTP పంపబడింది!` : `✓ 📲 Verification OTP sent to +91 ${cleanPhone}!`);
  };

  const handleFarmerVerify = () => {
    const cleanPhone = farmerPhone.replace(/\D/g, '').slice(-10);
    if (!farmerOtp.trim()) {
      setErrorMsg(isTe ? 'దయచేసి OTP నమోదు చేయండి' : 'Please enter the verification OTP');
      return;
    }
    const user = {
      id: 201,
      name: farmerName.trim() || 'Farmer Member',
      phone: cleanPhone || '9848012345',
      role: 'farmer',
      village: farmerVillage || 'Hasanparthy',
      mandal: 'Hasanparthy',
      district: 'Hanumakonda',
      isVerified: true
    };
    saveRegisteredFarmer(user);
    try {
      localStorage.setItem('agri_last_farmer', JSON.stringify(user));
    } catch (e) {
      console.warn(e);
    }
    onLoginFarmer(user);
  };

  const handleQuickFarmerLogin = () => {
    const user = recognizedFarmer ? {
      id: 201,
      name: recognizedFarmer.name,
      phone: cleanFarmerPhone,
      role: 'farmer',
      village: recognizedFarmer.village || 'Hasanparthy',
      mandal: 'Hasanparthy',
      district: 'Hanumakonda',
      isVerified: true
    } : {
      id: 201,
      name: 'N. Ramesh Kumar',
      phone: '9848012345',
      role: 'farmer',
      village: 'Hasanparthy',
      mandal: 'Hasanparthy',
      district: 'Hanumakonda',
      isVerified: true
    };
    try {
      localStorage.setItem('agri_last_farmer', JSON.stringify(user));
    } catch (e) {
      console.warn(e);
    }
    onLoginFarmer(user);
  };

  // --------------------------------------------------------------------------
  // OWNER 4-STEP ACTIONS
  // --------------------------------------------------------------------------
  const handleOwnerSendStep1Otp = () => {
    const cleanPhone = ownerPhone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg(isTe ? 'దయచేసి సరైన మొబైల్ నంబర్ నమోదు చేయండి' : 'Please enter a valid mobile number');
      return;
    }
    setErrorMsg('');
    setOwnerOtpSent(true);
    setOwnerOtpPreview('354498');
    setOwnerOtp('354498');
    setSuccessMsg(isTe ? `✓ 📲 +91 ${cleanPhone} కి OTP పంపబడింది!` : `✓ 📲 Verification OTP sent to +91 ${cleanPhone}!`);
  };

  const handleOwnerVerifyStep1 = () => {
    if (!ownerOtp.trim()) {
      setErrorMsg(isTe ? 'దయచేసి OTP నమోదు చేయండి' : 'Please enter the verification OTP');
      return;
    }
    setStep1Verified(true);
    setErrorMsg('');
    setSuccessMsg('');
    setCurrentStep(2);
  };

  const handleComplete4Step = () => {
    const user = {
      id: 501,
      name: ownerName.trim() || 'G. Srinivas Rao',
      phone: ownerPhone.replace(/\D/g, '').slice(-10) || '9440156789',
      role: 'owner',
      village: mandal,
      mandal: mandal,
      district: district,
      rc_number: rcNumber,
      isVerified: true,
      tractor: {
        brand,
        model,
        hp: Number(engineHp) || 48,
        implements: selectedImplements,
        ratePerHour: Number(ratePerHour) || 900,
        ratePerAcre: Number(ratePerAcre) || 1800,
        image_url: selectedImage,
        whereabouts
      }
    };
    onLoginOwner(user);
  };

  const handleReturningOwnerLogin = () => {
    const user = {
      id: 501,
      name: 'G. Srinivas Rao',
      phone: '9440156789',
      role: 'owner',
      village: 'Hasanparthy',
      mandal: 'Hasanparthy',
      district: 'Hanumakonda',
      rc_number: 'TS 03 AB 4589',
      isVerified: true
    };
    onLoginOwner(user);
  };

  return (
    <div className="native-login-container">
      {/* Top Header Matching Screenshots 2, 3, 4 */}
      <header className="native-login-header">
        <div className="native-header-left">
          {activeRole !== null && (
            <button
              type="button"
              className="native-back-arrow"
              onClick={() => {
                setActiveRole(null);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              title={isTe ? 'వెనుకకు' : 'Back to Selection'}
            >
              ←
            </button>
          )}
          <div className="native-brand-box">
            <span className="native-brand-icon">🌾</span>
            <div>
              <div className="native-brand-title">Agrirent</div>
              <div className="native-brand-sub">
                {isTe ? 'వ్యవసాయ యంత్రాల అద్దె వేదిక' : 'Farm Machinery Rental Platform'}
              </div>
            </div>
          </div>
        </div>

        <div className="native-header-right">
          <button
            type="button"
            className="native-lang-pill"
            onClick={() => setLanguage(language === 'en' ? 'te' : 'en')}
            title="Switch Language"
          >
            <span>🌐</span>
            <span>{language === 'en' ? 'తెలుగు' : 'English ▾'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="native-login-body">
        {/* Top Alerts */}
        {errorMsg && (
          <div className="native-alert error-banner">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="native-alert success-banner">
            <span>✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* VIEW 1: DUAL ROLE GATEWAY SELECTION (Screenshot 3)                  */}
        {/* ------------------------------------------------------------------ */}
        {activeRole === null && (
          <div className="native-card role-select-card">
            {/* Floating Settings Button in Card Top-Right */}
            <button
              type="button"
              className="card-gear-btn"
              onClick={onOpenSettings}
              title="Settings"
            >
              ⚙️
            </button>

            {/* Verified Badge */}
            <div className="district-verified-badge">
              <span className="badge-check">✓</span>
              <span>{isTe ? '33 తెలంగాణ జిల్లాలు ధృవీకరించబడ్డాయి' : '33 Telangana Districts Verified'}</span>
            </div>

            <h1 className="welcome-title">
              {isTe ? 'స్వాగతం! మీ సైన్-ఇన్ ఎంచుకోండి' : 'Welcome! Choose Your Sign-In'}
            </h1>
            <p className="welcome-sub">
              {isTe
                ? 'సమీపంలోని ట్రాక్టర్లను అద్దెకు తీసుకోవడానికి లేదా సురక్షిత అద్దె ఆదాయం సంపాదించడానికి సైన్ ఇన్ చేయండి.'
                : 'Sign in to rent nearby tractors or register machinery to earn guaranteed rental income.'}
            </p>

            <div className="role-choices-stack">
              {/* Option 1: Farmer */}
              <button
                type="button"
                className="role-card-btn farmer-role-card"
                onClick={() => {
                  setActiveRole('farmer');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
              >
                <div className="role-icon-box farmer-icon-box">
                  <span className="role-emoji">👨‍🌾</span>
                </div>
                <div className="role-card-info">
                  <h3 className="role-card-title text-green">
                    {isTe ? 'రైతు సైన్-ఇన్' : 'Farmer Sign-In'}
                  </h3>
                  <p className="role-card-sub">
                    {isTe ? 'యంత్రాలను అద్దెకు తీసుకోండి' : 'Rent Machinery'}
                  </p>
                </div>
              </button>

              {/* Option 2: Tractor Owner */}
              <button
                type="button"
                className="role-card-btn owner-role-card"
                onClick={() => {
                  setActiveRole('owner');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
              >
                <div className="role-icon-box owner-icon-box">
                  <span className="role-emoji">🚜</span>
                </div>
                <div className="role-card-info">
                  <h3 className="role-card-title text-blue">
                    {isTe ? 'ట్రాక్టర్ యజమాని' : 'Tractor Owner'}
                  </h3>
                  <p className="role-card-sub">
                    {isTe ? '4-దశల KYC ధృవీకరణ' : '4-Step KYC Verification'}
                  </p>
                </div>
              </button>
            </div>

            {/* Guest Browsing Link */}
            <button
              type="button"
              className="guest-browse-link"
              onClick={onContinueAsGuest}
            >
              {isTe
                ? 'కేవలం చూడాలనుకుంటున్నారా? అతిథిగా మార్కెట్‌ప్లేస్‌ను అన్వేషించండి →'
                : 'Just browsing? Explore Tractors Marketplace as Guest →'}
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* VIEW 2: FARMER SIGN-IN (Screenshot 4)                               */}
        {/* ------------------------------------------------------------------ */}
        {activeRole === 'farmer' && (
          <div className="native-card farmer-form-card">
            <div className="card-top-action-row">
              <button
                type="button"
                className="back-pill-btn"
                onClick={() => {
                  setActiveRole(null);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
              >
                ← {isTe ? 'ఎంపికకు తిరిగి వెళ్లండి' : 'Back to Selection'}
              </button>

              <button
                type="button"
                className="card-gear-btn-blue"
                onClick={onOpenSettings}
                title="Settings"
              >
                ⚙️
              </button>
            </div>

            <div className="farmer-badge-pill">
              <span>👨‍🌾</span>
              <span>{isTe ? 'రైతు మొబైల్ సైన్-ఇన్' : 'Farmer Mobile Sign-In'}</span>
            </div>

            <h2 className="portal-title">
              {isTe ? 'ఫోన్ & OTP ద్వారా ప్రవేశించండి' : 'Enter with Phone & OTP'}
            </h2>
            <p className="portal-sub">
              {isTe ? 'తక్షణ ఫోన్ ధృవీకరణ. పాస్‌వర్డ్‌లు అవసరం లేదు.' : 'Instant phone verification. No passwords required.'}
            </p>

            <div className="native-form-fields">
              {/* Field 1: Farmer Full Name */}
              <div className="native-field-group">
                <label className="native-label">
                  {isTe ? 'రైతు పూర్తి పేరు' : 'Farmer Full Name'}
                </label>
                <div className="native-input-box">
                  <span className="native-input-icon">👤</span>
                  <input
                    type="text"
                    className="native-input"
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    placeholder={isTe ? 'రైతు పేరు' : 'Farmer Full Name'}
                  />
                </div>
              </div>

              {/* Field 2: 10-Digit Mobile Number */}
              <div className="native-field-group">
                <label className="native-label">
                  {isTe ? '10-అంకెల మొబైల్ నంబర్ *' : '10-Digit Mobile Number *'}
                </label>
                <div className="native-input-box">
                  <span className="native-input-prefix">🇮🇳 +91</span>
                  <input
                    type="tel"
                    className="native-input"
                    value={farmerPhone}
                    onChange={(e) => setFarmerPhone(e.target.value)}
                    placeholder="9848012345"
                    maxLength={10}
                  />
                </div>
              </div>

              {/* Field 3: Village / Delivery Base */}
              <div className="native-field-group">
                <label className="native-label">
                  {isTe ? 'గ్రామం / డెలివరీ స్థానం' : 'Village / Delivery Base'}
                </label>
                <div className="native-input-box">
                  <span className="native-input-icon">📍</span>
                  <input
                    type="text"
                    className="native-input"
                    value={farmerVillage}
                    onChange={(e) => setFarmerVillage(e.target.value)}
                    placeholder="Hasanparthy"
                  />
                </div>
              </div>

              {/* OTP Input Section (When OTP sent) */}
              {farmerOtpSent && (
                <div className="otp-verification-section">
                  <label className="native-label">
                    {isTe ? '6-అంకెల OTP కోడ్ నమోదు చేయండి' : 'Enter 6-Digit OTP Code'}
                  </label>
                  <div className="otp-digit-boxes">
                    <input
                      type="text"
                      className="native-otp-input"
                      value={farmerOtp}
                      onChange={(e) => setFarmerOtp(e.target.value)}
                      placeholder="8 7 4 8 8 5"
                      maxLength={6}
                    />
                  </div>
                  <div className="demo-otp-caption">
                    {isTe ? `డెమో OTP ప్రివ్యూ: ${farmerOtpPreview}` : `Demo OTP preview: ${farmerOtpPreview}`}
                  </div>
                </div>
              )}

              {/* Primary Action Button */}
              {!farmerOtpSent ? (
                recognizedFarmer ? (
                  <>
                    <button
                      type="button"
                      className="native-btn-primary green-bg"
                      onClick={handleQuickFarmerLogin}
                    >
                      ⚡ {isTe ? `1-ట్యాప్ లాగిన్ (${recognizedFarmer.name.split(' ')[0]})` : `1-Tap Login as ${recognizedFarmer.name.split(' ')[0]}`}
                    </button>
                    <button
                      type="button"
                      className="native-btn-secondary green-outline"
                      onClick={handleFarmerSendOtp}
                    >
                      📲 {isTe ? 'OTP ద్వారా ప్రవేశించండి' : 'or Verify with SMS OTP instead'}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="native-btn-primary green-bg"
                    onClick={handleFarmerSendOtp}
                  >
                    • {isTe ? 'ధృవీకరణ OTP పంపండి 📲' : 'Send Verification OTP 📲'}
                  </button>
                )
              ) : (
                <button
                  type="button"
                  className="native-btn-primary green-bg"
                  onClick={handleFarmerVerify}
                >
                  {isTe ? 'ధృవీకరించి నమోదు పూర్తి చేయండి →' : 'Verify & Complete Sign-Up →'}
                </button>
              )}

              {/* Guest Browsing Link */}
              <button
                type="button"
                className="guest-browse-link"
                onClick={onContinueAsGuest}
              >
                {isTe
                  ? 'కేవలం చూడాలనుకుంటున్నారా? అతిథిగా మార్కెట్‌ప్లేస్‌ను అన్వేషించండి →'
                  : 'Just browsing? Explore Tractors Marketplace as Guest →'}
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* VIEW 3: TRACTOR OWNER PORTAL (Screenshots 2, 7, 8, 9)              */}
        {/* ------------------------------------------------------------------ */}
        {activeRole === 'owner' && (
          <div className="native-card owner-form-card">
            <div className="card-top-action-row">
              <button
                type="button"
                className="back-pill-btn"
                onClick={() => {
                  setActiveRole(null);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
              >
                ← {isTe ? 'ఎంపికకు తిరిగి వెళ్లండి' : 'Back to Selection'}
              </button>

              <button
                type="button"
                className="card-gear-btn-blue"
                onClick={onOpenSettings}
                title="Settings"
              >
                ⚙️
              </button>
            </div>

            <div className="owner-top-icon">
              <span>🚜</span>
            </div>

            <h2 className="portal-title">
              {isTe ? 'ట్రాక్టర్ యజమాని పోర్టల్' : 'Tractor Owner Portal'}
            </h2>
            <p className="portal-sub">
              {isTe
                ? '33 తెలంగాణ జిల్లాల్లో యంత్రాలను జాబితా చేయడానికి మరియు బుకింగ్ అభ్యర్థనలను స్వీకరించడానికి 4-దశల KYC ధృవీకరణను పూర్తి చేయండి'
                : 'Complete 4-Step KYC verification to list machinery and receive booking requests across 33 Telangana districts'}
            </p>

            {/* Switcher Tab: 4-Step KYC vs Returning Owner Login */}
            <div className="owner-mode-switcher">
              <button
                type="button"
                className={`mode-tab-btn ${ownerMode === '4step' ? 'active' : ''}`}
                onClick={() => setOwnerMode('4step')}
              >
                ⚡ {isTe ? '4-దశల KYC నమోదు' : '4-Step KYC Register'}
              </button>
              <button
                type="button"
                className={`mode-tab-btn ${ownerMode === 'quick' ? 'active' : ''}`}
                onClick={() => setOwnerMode('quick')}
              >
                🔑 {isTe ? 'తిరిగి వచ్చిన యజమాని లాగిన్' : 'Returning Owner Login'}
              </button>
            </div>

            {/* RETURNING OWNER LOGIN TAB */}
            {ownerMode === 'quick' ? (
              <div className="returning-owner-flow">
                <div className="native-field-group">
                  <label className="native-label">
                    {isTe ? 'రిజిస్టర్డ్ యజమాని మొబైల్ నంబర్ *' : 'Registered Owner Mobile Number *'}
                  </label>
                  <div className="native-input-box">
                    <span className="native-input-prefix">🇮🇳 +91</span>
                    <input
                      type="tel"
                      className="native-input"
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      placeholder="9440156789"
                    />
                  </div>
                </div>

                <div className="native-field-group">
                  <label className="native-label">
                    {isTe ? 'OTP కోడ్ నమోదు చేయండి' : 'Enter OTP Code'}
                  </label>
                  <div className="native-input-box">
                    <input
                      type="text"
                      className="native-input"
                      value="354498"
                      readOnly
                    />
                  </div>
                  <div className="demo-otp-caption">Demo OTP: 354498</div>
                </div>

                <button
                  type="button"
                  className="native-btn-primary blue-bg"
                  onClick={handleReturningOwnerLogin}
                >
                  {isTe ? 'యజమానిగా ప్రవేశించండి →' : 'Login as Owner →'}
                </button>
              </div>
            ) : (
              /* 4-STEP KYC FLOW */
              <div className="kyc-4step-flow">
                {/* 4-Step Stepper Indicator */}
                <div className="kyc-stepper-row">
                  <div className={`kyc-step-item ${currentStep === 1 ? 'current' : currentStep > 1 ? 'completed' : ''}`}>
                    <div className="step-circle">{currentStep > 1 ? '✓' : '1'}</div>
                    <span className="step-label">{isTe ? 'గుర్తింపు' : 'Identity'}</span>
                  </div>
                  <div className={`kyc-step-item ${currentStep === 2 ? 'current' : currentStep > 2 ? 'completed' : ''}`}>
                    <div className="step-circle">{currentStep > 2 ? '✓' : '2'}</div>
                    <span className="step-label">{isTe ? 'వాహనం RC' : 'Vehicle RC'}</span>
                  </div>
                  <div className={`kyc-step-item ${currentStep === 3 ? 'current' : currentStep > 3 ? 'completed' : ''}`}>
                    <div className="step-circle">{currentStep > 3 ? '✓' : '3'}</div>
                    <span className="step-label">{isTe ? 'బ్యాంక్/UPI' : 'Bank/UPI'}</span>
                  </div>
                  <div className={`kyc-step-item ${currentStep === 4 ? 'current' : ''}`}>
                    <div className="step-circle">4</div>
                    <span className="step-label">{isTe ? 'యంత్రాలు' : 'Machinery'}</span>
                  </div>
                </div>

                {/* STEP 1: OWNER MOBILE & IDENTITY (Screenshot 7) */}
                {currentStep === 1 && (
                  <div className="kyc-step-content">
                    <div className="step-count-badge">
                      {isTe ? 'దశ 1/4' : 'STEP 1 OF 4'}
                    </div>
                    <h3 className="step-header-title">
                      {isTe ? 'యజమాని మొబైల్ & గుర్తింపు' : 'Owner Mobile & Identity'}
                    </h3>

                    <div className="native-field-group">
                      <label className="native-label">
                        {isTe ? 'యజమాని పూర్తి పేరు (RC ప్రకారం) *' : 'Owner Full Name (as on RC) *'}
                      </label>
                      <div className="native-input-box">
                        <span className="native-input-icon">👤</span>
                        <input
                          type="text"
                          className="native-input"
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          placeholder="G. Srinivas Rao"
                        />
                      </div>
                    </div>

                    <div className="native-field-group">
                      <label className="native-label">
                        {isTe ? '10-అంకెల మొబైల్ నంబర్ *' : '10-Digit Mobile Number *'}
                      </label>
                      <div className="native-input-box">
                        <span className="native-input-prefix">🇮🇳 +91</span>
                        <input
                          type="tel"
                          className="native-input"
                          value={ownerPhone}
                          onChange={(e) => setOwnerPhone(e.target.value)}
                          placeholder="9440156789"
                          maxLength={10}
                        />
                      </div>
                    </div>

                    <div className="native-field-group">
                      <label className="native-label">
                        {isTe ? '6-అంకెల OTP కోడ్ నమోదు చేయండి' : 'Enter 6-Digit OTP Code'}
                      </label>
                      <div className="otp-digit-boxes">
                        <input
                          type="text"
                          className="native-otp-input"
                          value={ownerOtp || '354498'}
                          onChange={(e) => setOwnerOtp(e.target.value)}
                          placeholder="3 5 4 4 9 8"
                          maxLength={6}
                        />
                      </div>
                      <div className="demo-otp-caption">
                        {isTe ? `డెమో OTP ప్రివ్యూ: ${ownerOtpPreview}` : `Demo OTP preview: ${ownerOtpPreview}`}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="native-btn-primary blue-bg"
                      onClick={handleOwnerVerifyStep1}
                    >
                      {isTe ? 'OTP ధృవీకరించి కొనసాగించండి →' : 'Verify OTP & Continue →'}
                    </button>
                  </div>
                )}

                {/* STEP 2: TRACTOR RC & VEHICLE SPECS (Screenshot 8) */}
                {currentStep === 2 && (
                  <div className="kyc-step-content">
                    <div className="step-count-badge">
                      {isTe ? 'దశ 2/4' : 'STEP 2 OF 4'}
                    </div>
                    <h3 className="step-header-title">
                      {isTe ? 'ట్రాక్టర్ RC & వాహన వివరాలు' : 'Tractor RC & Vehicle Specs'}
                    </h3>

                    <div className="native-field-group">
                      <label className="native-label">
                        {isTe ? 'ట్రాక్టర్ RC రిజిస్ట్రేషన్ నంబర్ (తెలంగాణ RTO) *' : 'Tractor RC Registration Number (Telangana RTO) *'}
                      </label>
                      <div className="native-input-box">
                        <span className="native-bullet">•</span>
                        <input
                          type="text"
                          className="native-input font-bold"
                          value={rcNumber}
                          onChange={(e) => setRcNumber(e.target.value.toUpperCase())}
                          placeholder="TS 03 AB 4589"
                        />
                      </div>
                      <div className="verified-rto-notice">
                        🔒 {isTe ? 'తెలంగాణ రవాణా RTO రికార్డులతో ధృవీకరించబడింది.' : 'Verified against Telangana Transport RTO records.'}
                      </div>
                    </div>

                    <div className="native-field-group">
                      <label className="native-label">
                        {isTe ? 'డ్రైవింగ్ లైసెన్స్ / ఆధార్ (ఐచ్ఛికం)' : 'Driving License / Aadhaar (Optional)'}
                      </label>
                      <div className="native-input-box">
                        <span className="native-bullet">•</span>
                        <input
                          type="text"
                          className="native-input"
                          value={dlNumber}
                          onChange={(e) => setDlNumber(e.target.value)}
                          placeholder="TS-03-2018-004521"
                        />
                      </div>
                    </div>

                    <div className="two-col-grid">
                      <div className="native-field-group">
                        <label className="native-label">
                          {isTe ? 'ఇంజిన్ HP *' : 'Engine HP *'}
                        </label>
                        <input
                          type="number"
                          className="native-input text-center"
                          value={engineHp}
                          onChange={(e) => setEngineHp(e.target.value)}
                          placeholder="48"
                        />
                      </div>

                      <div className="native-field-group">
                        <label className="native-label">
                          {isTe ? 'నమోదు సంవత్సరం *' : 'Reg. Year *'}
                        </label>
                        <input
                          type="number"
                          className="native-input text-center"
                          value={regYear}
                          onChange={(e) => setRegYear(e.target.value)}
                          placeholder="2023"
                        />
                      </div>
                    </div>

                    <div className="step-actions-row">
                      <button
                        type="button"
                        className="native-btn-back"
                        onClick={() => setCurrentStep(1)}
                      >
                        ← {isTe ? 'వెనుకకు' : 'Back'}
                      </button>
                      <button
                        type="button"
                        className="native-btn-primary blue-bg flex-1"
                        onClick={() => setCurrentStep(3)}
                      >
                        {isTe ? 'తదుపరి: చెల్లింపు వివరాలు →' : 'Next: Payout Details →'}
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: PAYOUT ACCOUNT */}
                {currentStep === 3 && (
                  <div className="kyc-step-content">
                    <div className="step-count-badge">
                      {isTe ? 'దశ 3/4' : 'STEP 3 OF 4'}
                    </div>
                    <h3 className="step-header-title">
                      {isTe ? 'రైతు అద్దె చెల్లింపు ఖాతా' : 'Farmer Rental Payout Account'}
                    </h3>

                    <div className="verified-rto-notice mb-3">
                      🛡️ {isTe ? 'అద్దె సంపాదన సురక్షితంగా జమ చేయబడే బ్యాంక్ ఖాతా లేదా UPI ID.' : 'Bank Account or UPI ID where rental earnings will be credited safely.'}
                    </div>

                    <div className="native-field-group">
                      <label className="native-label">
                        UPI ID (GooglePay / PhonePe / Paytm)
                      </label>
                      <input
                        type="text"
                        className="native-input"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="9440156789@ybl"
                      />
                    </div>

                    <div className="native-field-group">
                      <label className="native-label">
                        {isTe ? 'బ్యాంక్ ఖాతా సంఖ్య *' : 'Bank Account Number *'}
                      </label>
                      <input
                        type="text"
                        className="native-input"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        placeholder="50100456123489"
                      />
                    </div>

                    <div className="native-field-group">
                      <label className="native-label">
                        {isTe ? 'బ్యాంక్ IFSC కోడ్ *' : 'Bank IFSC Code *'}
                      </label>
                      <input
                        type="text"
                        className="native-input"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                        placeholder="HDFC0000123"
                      />
                    </div>

                    <div className="step-actions-row">
                      <button
                        type="button"
                        className="native-btn-back"
                        onClick={() => setCurrentStep(2)}
                      >
                        ← {isTe ? 'వెనుకకు' : 'Back'}
                      </button>
                      <button
                        type="button"
                        className="native-btn-primary blue-bg flex-1"
                        onClick={() => setCurrentStep(4)}
                      >
                        {isTe ? 'తదుపరి: యంత్రాల వివరాలు →' : 'Next: Machinery Details →'}
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: MACHINERY SPECS & LOCATION (Screenshot 9) */}
                {currentStep === 4 && (
                  <div className="kyc-step-content">
                    <div className="step-count-badge">
                      {isTe ? 'దశ 4/4' : 'STEP 4 OF 4'}
                    </div>
                    <h3 className="step-header-title">
                      {isTe ? 'యంత్రాల వివరాలు & స్థానం' : 'Machinery Specs & Location'}
                    </h3>

                    <div className="native-field-group">
                      <label className="native-label">
                        {isTe ? 'ట్రాక్టర్ బ్రాండ్ ఎంపిక' : 'Tractor Brand'}
                      </label>
                      <div className="brand-chips-wrap">
                        {brands.map((b) => (
                          <button
                            key={b}
                            type="button"
                            className={`brand-chip ${brand === b ? 'active' : ''}`}
                            onClick={() => setBrand(b)}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="native-field-group">
                      <label className="native-label">
                        {isTe ? 'మోడల్ & ఎడిషన్ *' : 'Model & Edition *'}
                      </label>
                      <input
                        type="text"
                        className="native-input"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="744 FE High Torque (48 HP)"
                      />
                    </div>

                    <div className="two-col-grid">
                      <div className="native-field-group">
                        <label className="native-label">
                          {isTe ? 'జిల్లా *' : 'District *'}
                        </label>
                        <input
                          type="text"
                          className="native-input"
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          placeholder="Hanumakonda"
                        />
                      </div>

                      <div className="native-field-group">
                        <label className="native-label">
                          {isTe ? 'మండలం / బేస్ *' : 'Mandal / Base *'}
                        </label>
                        <input
                          type="text"
                          className="native-input"
                          value={mandal}
                          onChange={(e) => setMandal(e.target.value)}
                          placeholder="Hasanparthy"
                        />
                      </div>
                    </div>

                    <div className="native-field-group">
                      <label className="native-label">
                        {isTe ? 'ఉంచిన ప్రదేశం *' : 'Stationed Whereabouts *'}
                      </label>
                      <div className="native-input-box">
                        <span className="native-bullet">•</span>
                        <input
                          type="text"
                          className="native-input"
                          value={whereabouts}
                          onChange={(e) => setWhereabouts(e.target.value)}
                          placeholder="Hasanparthy Rythu Vedika & Market Yard"
                        />
                      </div>
                    </div>

                    <div className="two-col-grid">
                      <div className="native-field-group">
                        <label className="native-label">
                          {isTe ? 'ధర / గంటకు (₹) *' : 'Price / Hour (₹) *'}
                        </label>
                        <input
                          type="number"
                          className="native-input"
                          value={ratePerHour}
                          onChange={(e) => setRatePerHour(e.target.value)}
                          placeholder="900"
                        />
                      </div>

                      <div className="native-field-group">
                        <label className="native-label">
                          {isTe ? 'ధర / ఎకరాకు (₹) *' : 'Price / Acre (₹) *'}
                        </label>
                        <input
                          type="number"
                          className="native-input"
                          value={ratePerAcre}
                          onChange={(e) => setRatePerAcre(e.target.value)}
                          placeholder="1800"
                        />
                      </div>
                    </div>

                    {/* Implements */}
                    <div className="native-field-group">
                      <label className="native-label">
                        {isTe ? 'అటాచ్ చేసిన పరికరాలు & సేవలు' : 'Attached Implements & Services'}
                      </label>
                      <div className="implements-grid">
                        {availableImplements.map((impl) => {
                          const isSelected = selectedImplements.includes(impl.key);
                          return (
                            <button
                              key={impl.key}
                              type="button"
                              className={`implement-chip ${isSelected ? 'selected' : ''}`}
                              onClick={() => toggleImplement(impl.key)}
                            >
                              <span>{isSelected ? '✓' : '+'}</span>
                              <span>{isTe ? impl.te : impl.en}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Machinery Photos */}
                    <div className="native-field-group">
                      <label className="native-label">
                        {isTe ? 'యంత్రాల ఫోటో ఎంపిక' : 'Machinery Photo'}
                      </label>
                      <div className="sample-photos-row">
                        {samplePhotos.map((photo) => (
                          <div
                            key={photo.title}
                            className={`photo-chip-card ${selectedImage === photo.url ? 'active' : ''}`}
                            onClick={() => setSelectedImage(photo.url)}
                          >
                            <img src={photo.url} alt={photo.title} className="photo-thumb" />
                            <span className="photo-title">{photo.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="step-actions-row">
                      <button
                        type="button"
                        className="native-btn-back"
                        onClick={() => setCurrentStep(3)}
                      >
                        ← {isTe ? 'వెనుకకు' : 'Back'}
                      </button>
                      <button
                        type="button"
                        className="native-btn-primary green-bg flex-1"
                        onClick={handleComplete4Step}
                      >
                        {isTe ? '4-దశల KYC పూర్తి చేసి ప్రవేశించండి →' : 'Complete 4-Step KYC & Login →'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Guest Browsing Link */}
            <button
              type="button"
              className="guest-browse-link"
              onClick={onContinueAsGuest}
            >
              {isTe
                ? 'కేవలం చూడాలనుకుంటున్నారా? అతిథిగా మార్కెట్‌ప్లేస్‌ను అన్వేషించండి →'
                : 'Just browsing? Explore Tractors Marketplace as Guest →'}
            </button>
          </div>
        )}

        {/* Safety Data Footer Matching Screenshots */}
        <footer className="native-safety-footer">
          <span className="shield-icon">🛡️</span>
          <span>
            {isTe
              ? 'అగ్రిరెంట్ తెలంగాణ రవాణా & వ్యవసాయ భద్రతా సమాచార నిబంధనలకు కట్టుబడి ఉంటుంది.'
              : 'Agrirent adheres to Telangana transport & agriculture safety data norms.'}
          </span>
        </footer>
      </div>
    </div>
  );
}

