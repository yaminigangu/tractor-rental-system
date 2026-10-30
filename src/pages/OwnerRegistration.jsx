import { useState } from 'react';
import { translations } from '../translations';
import { saveRegisteredOwner, findOwnerByIdentifier } from '../data/userData';

export default function OwnerRegistration({
  setTractors,
  setActivePage,
  language = 'en',
  currentOwner,
  setCurrentOwner,
  selectedLocation
}) {
  const t = translations[language] || translations.en;
  const isTe = language === 'te';

  // Current view: 'login' (Starting screen) or 'register' (4 Steps KYC) or 'verified' (Success)
  const [viewMode, setViewMode] = useState('login');

  // Multi-step progress (1: Personal, 2: Vehicle, 3: Identity, 4: Documents)
  const [currentStep, setCurrentStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [registeredData, setRegisteredData] = useState(null);

  // Login input state
  const [loginPhone, setLoginPhone] = useState('');

  // Default village string from active location
  const defaultVillage = selectedLocation
    ? `${isTe ? (selectedLocation.villageTe || selectedLocation.village) : selectedLocation.village}, ${isTe ? (selectedLocation.districtTe || selectedLocation.district) : selectedLocation.district}`
    : 'Hasanparthy, Hanamkonda';

  // 4-Step Registration Form State (Matching Screenshots 1-5)
  const [formData, setFormData] = useState({
    // Step 1: Personal & General
    fullName: '',
    dob: '',
    gender: 'Male',
    referralCode: '',
    mobile: '',

    // Step 2: Vehicle Details
    vehicleType: 'Tractor',
    tractorModel: 'Mahindra 575 DI XP Plus',
    vehicleNumber: '',

    // Step 3: Identity Numbers
    drivingLicenseNumber: '',
    vehicleRcNumber: '',
    aadhaarNumber: '',

    // Step 4: Document Verification Files
    selfiePhoto: '',
    dlFrontPhoto: '',
    rcFrontPhoto: '',
    rcBackPhoto: '',

    // Financial & Machinery Extras
    pricing: 1200,
    villageLocation: defaultVillage,
    bankAccount: '',
    upiId: ''
  });

  const vehicleOptions = [
    { id: 'Tractor', label: isTe ? 'ట్రాక్టర్ (Tractor)' : 'Tractor' },
    { id: 'Mini Tractor', label: isTe ? 'మినీ ట్రాక్టర్ (Mini Tractor)' : 'Mini Tractor' },
    { id: 'Corn Harvester', label: isTe ? 'మొక్కజొన్న కోత యంత్రం (Corn Harvester)' : 'Corn Harvester' },
    { id: 'Round Straw Baler', label: isTe ? 'రౌండ్ స్ట్రా బెయిలర్ (Straw Baler)' : 'Round Straw Baler' },
    { id: 'Power Tiller', label: isTe ? 'పవర్ టిల్లర్ (Power Tiller)' : 'Power Tiller' },
    { id: 'Corn Seeder', label: isTe ? 'హ్యాండ్ కార్న్ సీడర్ (Corn Seeder)' : 'Corn Seeder' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrorMsg('');
  };

  // File Upload Handler with live base64 preview
  const handleFileUpload = (field, e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Demo auto-fill helper for instant 1-click testing
  const handleFillDemo = (type) => {
    if (type === 'existing') {
      setLoginPhone('9876543210');
      setErrorMsg('');
      setSuccessNotice('💡 Demo Owner: Ramesh Kumar (+91 9876543210) loaded. Click Continue to log in!');
    } else if (type === 'new') {
      setLoginPhone('9849001122');
      setErrorMsg('');
      setSuccessNotice('💡 New Owner Phone (+91 9849001122) set. Click Continue to start 4-Step Registration!');
    } else {
      // Auto-fill all 4 steps for quick verification
      setFormData({
        fullName: 'Ramesh Kumar',
        dob: '1988-06-15',
        gender: 'Male',
        referralCode: 'AGRI2026',
        mobile: loginPhone || '9876543210',
        vehicleType: 'Tractor',
        tractorModel: 'Mahindra 575 DI XP Plus',
        vehicleNumber: 'TS 04 AB 7890',
        drivingLicenseNumber: 'DL-0420120045612',
        vehicleRcNumber: 'TS 04 AB 7890',
        aadhaarNumber: '458912349012',
        selfiePhoto: '/tractor1.jpeg',
        dlFrontPhoto: '/tractor2.jpeg',
        rcFrontPhoto: '/tractor3.jpeg',
        rcBackPhoto: '',
        pricing: 1200,
        villageLocation: defaultVillage,
        bankAccount: '5010045678912',
        upiId: '9876543210@ybl'
      });
      setErrorMsg('');
      setSuccessNotice('💡 Sample KYC data loaded into all 4 steps!');
    }
  };

  // =========================================================================
  // LOGIN SUBMIT: If owner exists -> direct login. If not -> start 4 steps!
  // =========================================================================
  const handleLoginSubmit = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessNotice('');

    const cleanInput = loginPhone.trim();
    if (!cleanInput) {
      setErrorMsg(isTe ? 'దయచేసి మీ మొబైల్ నంబర్ నమోదు చేయండి.' : 'Please enter your mobile number.');
      return;
    }

    const digits = cleanInput.replace(/\D/g, '');
    if (digits.length < 10) {
      setErrorMsg(isTe ? 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.' : 'Please enter a valid 10-digit mobile number.');
      return;
    }

    // Check if owner exists in registered database
    const existingOwner = findOwnerByIdentifier(digits);

    if (existingOwner) {
      // EXISTING OWNER -> Directly Log In!
      if (setCurrentOwner) {
        setCurrentOwner(existingOwner);
        try {
          localStorage.setItem('agri_current_owner', JSON.stringify(existingOwner));
        } catch (err) {
          console.warn(err);
        }
      }
      setSuccessNotice(
        isTe
          ? `స్వాగతం ${existingOwner.fullName}! మీ ఓనర్ ఇన్‌బాక్స్‌కి రీడైరెక్ట్ అవుతోంది...`
          : `Welcome back, ${existingOwner.fullName}! Logging you in directly to Owner Inbox...`
      );
      setTimeout(() => {
        setActivePage('owner-inbox');
      }, 700);
    } else {
      // NEW OWNER -> Auto-direct to Step 1 of 4-step KYC registration!
      setFormData(prev => ({
        ...prev,
        mobile: digits.slice(-10)
      }));
      setSuccessNotice(
        isTe
          ? 'మీరు కొత్త యజమానిగా గుర్తించబడ్డారు! దయచేసి క్రింది 4-దశల KYC రిజిస్ట్రేషన్ పూర్తి చేయండి.'
          : 'New owner detected! Please complete your 4-step KYC registration.'
      );
      setViewMode('register');
      setCurrentStep(1);
    }
  };

  // =========================================================================
  // 4-STEP REGISTRATION NAVIGATION & VALIDATION
  // =========================================================================
  const handleStepNext = () => {
    setErrorMsg('');
    setSuccessNotice('');

    if (currentStep === 1) {
      if (!formData.fullName.trim()) {
        setErrorMsg(isTe ? 'దయచేసి పూర్తి పేరు నమోదు చేయండి.' : 'Please enter your full name.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!formData.vehicleNumber.trim()) {
        setErrorMsg(isTe ? 'దయచేసి వాహనం నంబర్ నమోదు చేయండి.' : 'Please enter vehicle number.');
        return;
      }
      // Auto sync vehicle number with RC number for convenience
      if (!formData.vehicleRcNumber) {
        setFormData(prev => ({ ...prev, vehicleRcNumber: prev.vehicleNumber.toUpperCase() }));
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!formData.drivingLicenseNumber.trim()) {
        setErrorMsg(isTe ? 'దయచేసి డ్రైవింగ్ లైసెన్స్ నంబర్ నమోదు చేయండి.' : 'Please enter driving license number.');
        return;
      }
      if (!formData.vehicleRcNumber.trim()) {
        setErrorMsg(isTe ? 'దయచేసి వాహన RC నంబర్ నమోదు చేయండి.' : 'Please enter vehicle RC number.');
        return;
      }
      if (!formData.aadhaarNumber.trim() || formData.aadhaarNumber.replace(/\D/g, '').length < 12) {
        setErrorMsg(isTe ? 'దయచేసి 12 అంకెల ఆధార్ నంబర్ నమోదు చేయండి.' : 'Please enter valid 12-digit Aadhaar number.');
        return;
      }
      setCurrentStep(4);
    }
  };

  const handleStepBack = () => {
    setErrorMsg('');
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      // Back to starting login screen
      setViewMode('login');
    }
  };

  // STEP 4 FINAL SUBMIT
  const handleFinalSubmit = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    let machinePhoto = '/tractor1.jpeg';
    if (formData.vehicleType === 'Corn Harvester') machinePhoto = '/corn_harvester.jpg';
    else if (formData.vehicleType === 'Round Straw Baler') machinePhoto = '/straw_baler.jpg';
    else if (formData.vehicleType === 'Corn Seeder') machinePhoto = '/corn_seeder.jpg';
    else if (formData.selfiePhoto && formData.selfiePhoto.startsWith('data:image')) machinePhoto = formData.selfiePhoto;

    const newOwnerRecord = {
      fullName: formData.fullName.trim(),
      owner: formData.fullName.trim(),
      mobile: formData.mobile || loginPhone || '9876543210',
      dob: formData.dob || '1990-01-01',
      gender: formData.gender,
      referralCode: formData.referralCode,
      vehicleType: formData.vehicleType,
      tractorModel: formData.tractorModel || `${formData.vehicleType} Standard`,
      vehicleNumber: formData.vehicleNumber.toUpperCase(),
      pricing: Number(formData.pricing) || 1200,
      village: formData.villageLocation,
      district: selectedLocation?.district || 'Telangana',
      dlNumber: formData.drivingLicenseNumber.toUpperCase(),
      rcNumber: (formData.vehicleRcNumber || formData.vehicleNumber).toUpperCase(),
      aadhaarNumber: formData.aadhaarNumber,
      bankAccount: formData.bankAccount || '5010045678912',
      upiId: formData.upiId || `${formData.mobile || '9876543210'}@upi`,
      photo: machinePhoto,
      selfiePhoto: formData.selfiePhoto || machinePhoto,
      dlPhoto: formData.dlFrontPhoto || machinePhoto,
      rcFrontPhoto: formData.rcFrontPhoto || machinePhoto,
      rcBackPhoto: formData.rcBackPhoto || machinePhoto,
      isVerified: true,
      registeredAt: new Date().toISOString().split('T')[0]
    };

    saveRegisteredOwner(newOwnerRecord);

    const newTractorEntry = {
      id: Date.now(),
      owner: formData.fullName.trim(),
      mobile: newOwnerRecord.mobile,
      location: formData.villageLocation,
      brand: formData.vehicleType === 'Tractor' ? 'Mahindra' : formData.vehicleType,
      model: formData.tractorModel || formData.vehicleType,
      equipment: 'Ploughing, Rotavator, Cultivator',
      pricing: Number(formData.pricing) || 1200,
      availability: 'Available',
      photo: machinePhoto,
      rating: 5.0,
      jobsDone: 0,
      registeredAt: new Date().toLocaleDateString(),
      vehicleNumber: formData.vehicleNumber.toUpperCase(),
      isCaptainVerified: true,
      distanceKm: 0.8
    };

    if (setTractors) {
      setTractors(prev => [newTractorEntry, ...(Array.isArray(prev) ? prev : [])]);
    }

    if (setCurrentOwner) {
      setCurrentOwner(newOwnerRecord);
      try {
        localStorage.setItem('agri_current_owner', JSON.stringify(newOwnerRecord));
      } catch (err) {
        console.warn(err);
      }
    }

    setRegisteredData(newOwnerRecord);
    setViewMode('verified');
  };

  // =========================================================================
  // RENDER VIEW 1: STARTING LOGIN SCREEN (MATCHES IMAGE 6 EXACTLY)
  // =========================================================================
  if (viewMode === 'login') {
    return (
      <div className="sancharoo-backdrop page-anim">
        <div className="sancharoo-login-card">
          {/* Top Brand Header Badge (User specified "AgriRent Tractor Owner") */}
          <div className="sancharoo-header-row">
            <div className="sancharoo-icon-sq">
              <span className="sancharoo-sq-icon">🚜</span>
            </div>
            <span className="sancharoo-brand-name">AGRIRENT</span>
            <span className="sancharoo-pill-badge">
              {isTe ? 'ట్రాక్టర్ యజమాని' : 'TRACTOR OWNER'}
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
                type="tel"
                maxLength={10}
                className="sancharoo-phone-field"
                placeholder={isTe ? 'మొబైల్ నంబర్ నమోదు చేయండి' : 'Enter mobile number'}
                value={loginPhone}
                onChange={(e) => {
                  setLoginPhone(e.target.value.replace(/\D/g, ''));
                  setErrorMsg('');
                }}
                autoFocus
              />
            </div>

            <button type="submit" className="sancharoo-btn-submit">
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

          {/* Direct link to start registration */}
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button
              type="button"
              className="sancharoo-link-btn"
              onClick={() => {
                setViewMode('register');
                setCurrentStep(1);
              }}
            >
              ⚡ {isTe ? 'కొత్త యజమాని? 4-దశల KYC రిజిస్ట్రేషన్ ప్రారంభించండి' : 'New Tractor Owner? Start 4-Step KYC Registration'}
            </button>
          </div>

          {/* Fast Testing Options */}
          <div className="sancharoo-demo-box">
            <span className="sancharoo-demo-title">💡 FAST TESTING OPTIONS:</span>
            <button
              type="button"
              className="sancharoo-demo-item"
              onClick={() => handleFillDemo('existing')}
            >
              ⚡ Existing Owner: Ramesh Kumar (9876543210)
            </button>
            <button
              type="button"
              className="sancharoo-demo-item"
              onClick={() => handleFillDemo('new')}
            >
              ⚡ New Owner (+91 9849001122): Start 4 Steps
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
  // RENDER VIEW 2: 4-STEP REGISTRATION FLOW (MATCHES IMAGES 1, 2, 3, 4, 5)
  // =========================================================================
  if (viewMode === 'register') {
    return (
      <div className="captain-reg-backdrop page-anim">
        <div className="captain-reg-card">
          {/* Top Header matching user's screenshots */}
          <div className="captain-header-area">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1 className="captain-reg-title">
                {isTe ? 'కెప్టెన్ రిజిస్ట్రేషన్' : 'Captain Registration'}
              </h1>
              <button
                type="button"
                className="captain-demo-btn"
                onClick={() => handleFillDemo('all')}
                title="Auto-fill sample data for all 4 steps"
              >
                ⚙️ Demo Fill
              </button>
            </div>
            <div className="captain-step-indicator">
              {isTe ? `దశ ${currentStep} / 4` : `Step ${currentStep} of 4`}
            </div>
            {/* Horizontal Teal Progress Bar */}
            <div className="captain-progress-bar-track">
              <div
                className="captain-progress-bar-fill"
                style={{ width: `${currentStep * 25}%` }}
              />
            </div>
          </div>

          {/* Alert messages */}
          {errorMsg && <div className="captain-alert-error">⚠️ {errorMsg}</div>}
          {successNotice && <div className="captain-alert-success">{successNotice}</div>}

          {/* Inner Form Card */}
          <div className="captain-inner-card">
            {/* =========================================================
                STEP 1: Full Name, DOB, Gender, Referral Code
                ========================================================= */}
            {currentStep === 1 && (
              <div className="captain-step-content page-anim">
                <div className="captain-input-wrap">
                  <input
                    type="text"
                    className="captain-input-plain"
                    placeholder={isTe ? 'పూర్తి పేరు నమోదు చేయండి' : 'Enter full name'}
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="captain-field-block">
                  <label className="captain-field-label">
                    {isTe ? 'పుట్టిన తేదీ' : 'Date of Birth'}
                  </label>
                  <input
                    type="date"
                    className="captain-input-field"
                    value={formData.dob}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                  />
                </div>

                <div className="captain-field-block">
                  <label className="captain-field-label">
                    {isTe ? 'లింగం' : 'Gender'}
                  </label>
                  <div className="captain-gender-row">
                    {['Male', 'Female', 'Other'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        className={`captain-gender-pill ${formData.gender === g ? 'active' : ''}`}
                        onClick={() => handleInputChange('gender', g)}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="captain-field-block">
                  <label className="captain-field-label">
                    {isTe ? 'రిఫరల్ కోడ్ (ఐచ్ఛికం)' : 'Referral Code (Optional)'}
                  </label>
                  <input
                    type="text"
                    className="captain-input-field"
                    placeholder="ENTER REFERRAL CODE"
                    value={formData.referralCode}
                    onChange={(e) => handleInputChange('referralCode', e.target.value.toUpperCase())}
                  />
                </div>

                <div className="captain-divider" />

                <div className="captain-actions-row">
                  <button
                    type="button"
                    className="captain-btn-back"
                    onClick={handleStepBack}
                  >
                    ‹ {isTe ? 'లాగిన్‌కి వెళ్లండి' : 'Back to Login'}
                  </button>
                  <button
                    type="button"
                    className="captain-btn-continue"
                    onClick={handleStepNext}
                  >
                    {isTe ? 'కొనసాగించండి >' : 'Continue >'}
                  </button>
                </div>
              </div>
            )}

            {/* =========================================================
                STEP 2: Vehicle Details (Vehicle Type, Vehicle Number)
                ========================================================= */}
            {currentStep === 2 && (
              <div className="captain-step-content page-anim">
                <div className="captain-section-heading">
                  <span className="captain-heading-icon">🚗</span>
                  <h3 className="captain-heading-text">
                    {isTe ? 'వాహన వివరాలు' : 'Vehicle Details'}
                  </h3>
                </div>

                <div className="captain-field-block">
                  <label className="captain-field-label">
                    {isTe ? 'వాహనం రకం' : 'Vehicle Type'}
                  </label>
                  <select
                    className="captain-select-field"
                    value={formData.vehicleType}
                    onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                  >
                    {vehicleOptions.map((v) => (
                      <option key={v.id} value={v.id}>{v.label}</option>
                    ))}
                  </select>
                </div>

                <div className="captain-field-block">
                  <label className="captain-field-label">
                    {isTe ? 'ట్రాక్టర్ / యంత్రం మోడల్' : 'Machine Model'}
                  </label>
                  <input
                    type="text"
                    className="captain-input-field"
                    placeholder="e.g. Mahindra 575 DI XP Plus"
                    value={formData.tractorModel}
                    onChange={(e) => handleInputChange('tractorModel', e.target.value)}
                  />
                </div>

                <div className="captain-field-block">
                  <label className="captain-field-label">
                    {isTe ? 'వాహనం నంబర్' : 'Vehicle Number'}
                  </label>
                  <input
                    type="text"
                    className="captain-input-field"
                    placeholder="FSGDSSGG"
                    value={formData.vehicleNumber}
                    onChange={(e) => handleInputChange('vehicleNumber', e.target.value.toUpperCase())}
                  />
                </div>

                <div className="captain-divider" />

                <div className="captain-actions-row">
                  <button type="button" className="captain-btn-back" onClick={handleStepBack}>
                    ‹ {isTe ? 'వెనుకకు' : 'Back'}
                  </button>
                  <button type="button" className="captain-btn-continue" onClick={handleStepNext}>
                    {isTe ? 'కొనసాగించండి >' : 'Continue >'}
                  </button>
                </div>
              </div>
            )}

            {/* =========================================================
                STEP 3: Identity Numbers (DL, RC, Aadhaar)
                ========================================================= */}
            {currentStep === 3 && (
              <div className="captain-step-content page-anim">
                <div className="captain-section-heading">
                  <span className="captain-heading-icon">🛡️</span>
                  <h3 className="captain-heading-text">
                    {isTe ? 'గుర్తింపు నంబర్లు' : 'Identity Numbers'}
                  </h3>
                </div>

                <div className="captain-field-block">
                  <label className="captain-field-label">
                    {isTe ? 'డ్రైవింగ్ లైసెన్స్ నంబర్' : 'Driving License Number'}
                  </label>
                  <input
                    type="text"
                    className="captain-input-field"
                    placeholder="3543645645"
                    value={formData.drivingLicenseNumber}
                    onChange={(e) => handleInputChange('drivingLicenseNumber', e.target.value.toUpperCase())}
                  />
                </div>

                <div className="captain-field-block">
                  <label className="captain-field-label">
                    {isTe ? 'వాహన RC నంబర్' : 'Vehicle RC Number'}
                  </label>
                  <input
                    type="text"
                    className="captain-input-field"
                    placeholder="SCFFEE"
                    value={formData.vehicleRcNumber}
                    onChange={(e) => handleInputChange('vehicleRcNumber', e.target.value.toUpperCase())}
                  />
                </div>

                <div className="captain-field-block">
                  <label className="captain-field-label">
                    {isTe ? 'ఆధార్ నంబర్' : 'Aadhaar Number'}
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    className="captain-input-field"
                    placeholder="123456789054"
                    value={formData.aadhaarNumber}
                    onChange={(e) => handleInputChange('aadhaarNumber', e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <div className="captain-divider" />

                <div className="captain-actions-row">
                  <button type="button" className="captain-btn-back" onClick={handleStepBack}>
                    ‹ {isTe ? 'వెనుకకు' : 'Back'}
                  </button>
                  <button type="button" className="captain-btn-continue" onClick={handleStepNext}>
                    {isTe ? 'కొనసాగించండి >' : 'Continue >'}
                  </button>
                </div>
              </div>
            )}

            {/* =========================================================
                STEP 4: Document Verification Files (Selfie, DL, RC Front, RC Back)
                ========================================================= */}
            {currentStep === 4 && (
              <div className="captain-step-content page-anim">
                <div className="captain-section-heading">
                  <span className="captain-heading-icon">📄</span>
                  <h3 className="captain-heading-text">
                    {isTe ? 'పత్రాల ధృవీకరణ ఫైల్స్' : 'Document Verification Files'}
                  </h3>
                </div>

                {/* 1. Selfie Photo */}
                <div className="captain-upload-card">
                  <label className="captain-field-label">
                    {isTe ? 'సెల్ఫీ ఫోటో *' : 'Selfie Photo *'}
                  </label>
                  <label className={`captain-dropzone ${formData.selfiePhoto ? 'uploaded' : ''}`}>
                    <input
                      type="file"
                      accept="image/*"
                      className="captain-file-input"
                      onChange={(e) => handleFileUpload('selfiePhoto', e)}
                    />
                    {formData.selfiePhoto ? (
                      <div className="captain-preview">
                        <img src={formData.selfiePhoto} alt="Selfie" className="captain-thumb" />
                        <span className="captain-uploaded-tag">✓ {isTe ? 'సెల్ఫీ అప్‌లోడ్ అయింది' : 'Selfie Uploaded'}</span>
                      </div>
                    ) : (
                      <div className="captain-dropzone-inner">
                        <span className="captain-drop-icon">📷</span>
                        <span className="captain-drop-text">
                          {isTe ? 'సెల్ఫీ ఫోటో తీయండి / అప్‌లోడ్ చేయండి' : 'Capture/Upload Selfie'}
                        </span>
                      </div>
                    )}
                  </label>
                </div>

                {/* 2. Driving License Front Side */}
                <div className="captain-upload-card">
                  <label className="captain-field-label">
                    {isTe ? 'డ్రైవింగ్ లైసెన్స్ ముందు భాగం *' : 'Driving License Front Side *'}
                  </label>
                  <label className={`captain-dropzone ${formData.dlFrontPhoto ? 'uploaded' : ''}`}>
                    <input
                      type="file"
                      accept="image/*"
                      className="captain-file-input"
                      onChange={(e) => handleFileUpload('dlFrontPhoto', e)}
                    />
                    {formData.dlFrontPhoto ? (
                      <div className="captain-preview">
                        <img src={formData.dlFrontPhoto} alt="DL" className="captain-thumb" />
                        <span className="captain-uploaded-tag">✓ {isTe ? 'DL ముందు భాగం అప్‌లోడ్ అయింది' : 'DL Front Uploaded'}</span>
                      </div>
                    ) : (
                      <div className="captain-dropzone-inner">
                        <span className="captain-drop-icon">☁️</span>
                        <span className="captain-drop-text">
                          {isTe ? 'DL ముందు భాగం అప్‌లోడ్ చేయండి' : 'Upload DL Front'}
                        </span>
                      </div>
                    )}
                  </label>
                </div>

                {/* 3. RC Front Side */}
                <div className="captain-upload-card">
                  <label className="captain-field-label">
                    {isTe ? 'RC ముందు భాగం *' : 'RC Front Side *'}
                  </label>
                  <label className={`captain-dropzone ${formData.rcFrontPhoto ? 'uploaded' : ''}`}>
                    <input
                      type="file"
                      accept="image/*"
                      className="captain-file-input"
                      onChange={(e) => handleFileUpload('rcFrontPhoto', e)}
                    />
                    {formData.rcFrontPhoto ? (
                      <div className="captain-preview">
                        <img src={formData.rcFrontPhoto} alt="RC Front" className="captain-thumb" />
                        <span className="captain-uploaded-tag">✓ {isTe ? 'RC ముందు భాగం అప్‌లోడ్ అయింది' : 'RC Front Uploaded'}</span>
                      </div>
                    ) : (
                      <div className="captain-dropzone-inner">
                        <span className="captain-drop-icon">☁️</span>
                        <span className="captain-drop-text">
                          {isTe ? 'RC ముందు భాగం అప్‌లోడ్ చేయండి' : 'Upload RC Front'}
                        </span>
                      </div>
                    )}
                  </label>
                </div>

                {/* 4. RC Back Side (Optional) */}
                <div className="captain-upload-card">
                  <label className="captain-field-label">
                    {isTe ? 'RC వెనుక భాగం (ఐచ్ఛికం)' : 'RC Back Side (Optional)'}
                  </label>
                  <label className={`captain-dropzone ${formData.rcBackPhoto ? 'uploaded' : ''}`}>
                    <input
                      type="file"
                      accept="image/*"
                      className="captain-file-input"
                      onChange={(e) => handleFileUpload('rcBackPhoto', e)}
                    />
                    {formData.rcBackPhoto ? (
                      <div className="captain-preview">
                        <img src={formData.rcBackPhoto} alt="RC Back" className="captain-thumb" />
                        <span className="captain-uploaded-tag">✓ {isTe ? 'RC వెనుక భాగం అప్‌లోడ్ అయింది' : 'RC Back Uploaded'}</span>
                      </div>
                    ) : (
                      <div className="captain-dropzone-inner">
                        <span className="captain-drop-icon">☁️</span>
                        <span className="captain-drop-text">
                          {isTe ? 'RC వెనుక భాగం అప్‌లోడ్ చేయండి' : 'Upload RC Back'}
                        </span>
                      </div>
                    )}
                  </label>
                </div>

                {/* Rate & Village confirmation */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                  <div className="captain-field-block">
                    <label className="captain-field-label">{isTe ? 'గంటకు ధర (₹/Hr)' : 'Hourly Rate (₹/Hr)'}</label>
                    <input
                      type="number"
                      className="captain-input-field"
                      value={formData.pricing}
                      onChange={(e) => handleInputChange('pricing', e.target.value)}
                    />
                  </div>
                  <div className="captain-field-block">
                    <label className="captain-field-label">{isTe ? 'లొకేషన్' : 'Location'}</label>
                    <input
                      type="text"
                      className="captain-input-field"
                      value={formData.villageLocation}
                      onChange={(e) => handleInputChange('villageLocation', e.target.value)}
                    />
                  </div>
                </div>

                <div className="captain-divider" />

                <div className="captain-actions-row">
                  <button type="button" className="captain-btn-back" onClick={handleStepBack}>
                    ‹ {isTe ? 'వెనుకకు' : 'Back'}
                  </button>
                  <button
                    type="button"
                    className="captain-btn-submit"
                    onClick={handleFinalSubmit}
                  >
                    {isTe ? 'పత్రాలను సమర్పించండి' : 'Submit Documents'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER VIEW 3: KYC VERIFICATION SUCCESS CARD
  // =========================================================================
  return (
    <div className="captain-reg-backdrop page-anim">
      <div className="captain-reg-card" style={{ textAlign: 'center' }}>
        <div className="captain-success-badge">
          <span>✓</span>
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>
          {isTe ? 'KYC ధృవీకరణ విజయవంతమైంది!' : 'KYC Verification Successful!'}
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.5, marginBottom: '20px' }}>
          {isTe
            ? `అభినందనలు ${registeredData?.fullName}! మీ ట్రాక్టర్ (${registeredData?.vehicleNumber}) విజయవంతంగా నమోదు చేయబడింది.`
            : `Congratulations ${registeredData?.fullName}! Your machine (${registeredData?.vehicleNumber}) has been verified and listed on AgriRent.`}
        </p>

        <div className="captain-summary-card">
          <div className="captain-summary-row">
            <span>Owner Name:</span>
            <strong>{registeredData?.fullName}</strong>
          </div>
          <div className="captain-summary-row">
            <span>Machine Type:</span>
            <strong>{registeredData?.vehicleType}</strong>
          </div>
          <div className="captain-summary-row">
            <span>Vehicle RC:</span>
            <strong>{registeredData?.vehicleNumber}</strong>
          </div>
          <div className="captain-summary-row">
            <span>Hourly Rental:</span>
            <strong>₹{registeredData?.pricing}/hr</strong>
          </div>
          <div className="captain-summary-row">
            <span>Location:</span>
            <strong>{registeredData?.village}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
          <button
            type="button"
            className="captain-btn-continue"
            onClick={() => setActivePage('owner-inbox')}
          >
            {isTe ? 'ఓనర్ ఇన్‌బాక్స్‌కి వెళ్లండి →' : 'Go to Owner Inbox →'}
          </button>
          <button
            type="button"
            className="captain-btn-back"
            onClick={() => setActivePage('find-tractor')}
          >
            {isTe ? 'ఫ్లీట్ చూడండి' : 'View Fleet'}
          </button>
        </div>
      </div>
    </div>
  );
}
