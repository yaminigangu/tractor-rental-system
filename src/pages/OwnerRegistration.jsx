import { useState } from 'react';
import { translations } from '../translations';
import { ALL_LOCATIONS_LIST } from '../data/telanganaLocations';
import { saveRegisteredOwner, findOwnerByMobile } from '../data/userData';

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

  // Step 0: Starting Login Screen (matching user screenshot)
  // Step 1: Captain Registration Step 1 of 4 (Personal Details)
  // Step 2: Captain Registration Step 2 of 4 (Vehicle Details)
  // Step 3: Captain Registration Step 3 of 4 (Identity Numbers)
  // Step 4: Captain Registration Step 4 of 4 (Document Verification Files)
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Default village string from active location
  const defaultVillage = selectedLocation
    ? `${isTe ? (selectedLocation.villageTe || selectedLocation.village) : selectedLocation.village}, ${isTe ? (selectedLocation.districtTe || selectedLocation.district) : selectedLocation.district}`
    : 'Hasanparthy, Hanamkonda';

  // Login & Multi-step Registration Form State
  const [formData, setFormData] = useState({
    // Step 0 / Login
    mobile: '',

    // Step 1: Personal Details
    fullName: '',
    dob: '',
    gender: 'Male', // 'Male', 'Female', 'Other'
    referralCode: '',

    // Step 2: Vehicle Details
    vehicleType: 'Tractor', // 'Tractor', 'Corn Harvester', 'Round Straw Baler', 'Corn Seeder', 'Power Tiller', 'Mini Tractor'
    tractorModel: 'Mahindra 575 DI XP Plus',
    vehicleNumber: '',
    pricing: 1200,
    villageLocation: defaultVillage,
    equipmentList: ['Ploughing', 'Rotavator'],

    // Step 3: Identity Numbers
    drivingLicenseNumber: '',
    vehicleRcNumber: '',
    aadhaarNumber: '',

    // Step 4: Document Verification Files
    selfiePhoto: '',
    drivingLicenseFront: '',
    rcFront: '',
    rcBack: '',
  });

  const vehicleTypes = [
    { id: 'Tractor', label: isTe ? '🚜 సాధారణ ట్రాక్టర్ (Tractor)' : '🚜 Tractor' },
    { id: 'Corn Harvester', label: isTe ? '🌽 మొక్కజొన్న కోత యంత్రం (Corn Harvester)' : '🌽 Corn Harvester' },
    { id: 'Round Straw Baler', label: isTe ? '📦 రౌండ్ స్ట్రా బెయిలర్ (Straw Baler)' : '📦 Round Straw Baler' },
    { id: 'Corn Seeder', label: isTe ? '🌱 హ్యాండ్ కార్న్ సీడర్ (Corn Seeder)' : '🌱 Hand Push Corn Seeder' },
    { id: 'Power Tiller', label: isTe ? '⚙️ పవర్ టిల్లర్ (Power Tiller)' : '⚙️ Power Tiller' },
    { id: 'Mini Tractor', label: isTe ? '🚜 మినీ ట్రాక్టర్ (Mini Tractor)' : '🚜 Mini Tractor' },
  ];

  const standardEquipments = [
    { id: 'Ploughing', label: isTe ? 'దుక్కి దున్నడం (Ploughing)' : 'Ploughing' },
    { id: 'Rotavator', label: isTe ? 'రొటవేటర్ (Rotavator)' : 'Rotavator' },
    { id: 'Cultivator', label: isTe ? 'కల్టివేటర్ (Cultivator)' : 'Cultivator' },
    { id: 'Trailer Services', label: isTe ? 'ట్రాలీ రవాణా (Trailer Services)' : 'Trailer Services' },
    { id: 'Corn Harvester', label: isTe ? 'మొక్కజొన్న కోత (Corn Harvester)' : 'Corn Harvester' },
    { id: 'Straw Baler', label: isTe ? 'గడ్డి చుట్టడం (Straw Baler)' : 'Straw Baler' },
    { id: 'Corn Seeder', label: isTe ? 'విత్తనాలు నాటడం (Corn Seeder)' : 'Corn Seeder' },
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrorMsg('');
  };

  const handleEquipmentToggle = (itemId) => {
    setFormData(prev => {
      const exists = prev.equipmentList.includes(itemId);
      const updated = exists
        ? prev.equipmentList.filter(eq => eq !== itemId)
        : [...prev.equipmentList, itemId];
      return { ...prev, equipmentList: updated };
    });
  };

  // File Upload Helper with Base64 Preview
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

  // Step 0: Handle Initial Login Screen Continue
  const handleLoginContinue = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const cleanMobile = formData.mobile.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length < 10) {
      setErrorMsg(isTe ? 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.' : 'Please enter a valid 10-digit mobile number to continue.');
      return;
    }

    // Check if this owner already exists in registered database
    const existingOwner = findOwnerByMobile(cleanMobile);
    if (existingOwner) {
      // Existing Captain -> Log in directly & redirect to owner-inbox
      if (setCurrentOwner) {
        setCurrentOwner(existingOwner);
        try {
          localStorage.setItem('agri_current_owner', JSON.stringify(existingOwner));
        } catch (err) {
          console.warn(err);
        }
      }
      setActivePage('owner-inbox');
    } else {
      // New Tractor Owner -> Proceed directly to 4-step verification!
      setCurrentStep(1);
    }
  };

  // Demo auto-fill helper for instant testing
  const handleFillDemo = () => {
    setFormData({
      mobile: '9849123456',
      fullName: 'Ramesh Goud',
      dob: '1990-05-14',
      gender: 'Male',
      referralCode: 'AGRI2026',
      vehicleType: 'Tractor',
      tractorModel: 'Mahindra 575 DI XP Plus',
      vehicleNumber: 'TS 04 AB 9876',
      pricing: 1200,
      villageLocation: defaultVillage,
      equipmentList: ['Ploughing', 'Rotavator', 'Cultivator'],
      drivingLicenseNumber: '3543645645',
      vehicleRcNumber: 'SCFFEEE',
      aadhaarNumber: '123456789054',
      selfiePhoto: '/tractor1.jpeg',
      drivingLicenseFront: '/tractor2.jpeg',
      rcFront: '/tractor3.jpeg',
      rcBack: '/tractor4.jpeg',
    });
    setErrorMsg('');
  };

  // Step Navigation Validation
  const handleNextStep = () => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!formData.fullName.trim()) {
        setErrorMsg(isTe ? 'దయచేసి మీ పూర్తి పేరు నమోదు చేయండి.' : 'Please enter your full name.');
        return;
      }
      if (!formData.dob) {
        setErrorMsg(isTe ? 'దయచేసి పుట్టిన తేదీని ఎంచుకోండి.' : 'Please select your Date of Birth.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!formData.vehicleNumber.trim()) {
        setErrorMsg(isTe ? 'దయచేసి మీ వాహనం / ట్రాక్టర్ రిజిస్ట్రేషన్ నంబర్ నమోదు చేయండి.' : 'Please enter your vehicle / tractor registration number.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!formData.drivingLicenseNumber.trim()) {
        setErrorMsg(isTe ? 'దయచేసి డ్రైవింగ్ లైసెన్స్ నంబర్ నమోదు చేయండి.' : 'Please enter your Driving License number.');
        return;
      }
      if (!formData.vehicleRcNumber.trim()) {
        setErrorMsg(isTe ? 'దయచేసి వాహన RC నంబర్ నమోదు చేయండి.' : 'Please enter your Vehicle RC number.');
        return;
      }
      if (!formData.aadhaarNumber.trim() || formData.aadhaarNumber.replace(/\D/g, '').length < 12) {
        setErrorMsg(isTe ? 'దయచేసి 12 అంకెల ఆధార్ నంబర్ నమోదు చేయండి.' : 'Please enter valid 12-digit Aadhaar number.');
        return;
      }
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    setErrorMsg('');
    if (currentStep === 1) {
      setCurrentStep(0); // Back to starting login screen
    } else if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Step 4 Final Submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.selfiePhoto) {
      setErrorMsg(isTe ? 'దయచేసి మీ సెల్ఫీ ఫోటో అప్‌లోడ్ చేయండి.' : 'Please upload your Selfie photo.');
      return;
    }
    if (!formData.drivingLicenseFront) {
      setErrorMsg(isTe ? 'దయచేసి డ్రైవింగ్ లైసెన్స్ ముందు భాగం ఫోటో అప్‌లోడ్ చేయండి.' : 'Please upload your Driving License Front Side photo.');
      return;
    }
    if (!formData.rcFront) {
      setErrorMsg(isTe ? 'దయచేసి వాహన RC ముందు భాగం ఫోటో అప్‌లోడ్ చేయండి.' : 'Please upload your Vehicle RC Front Side photo.');
      return;
    }

    let machinePhoto = '/tractor1.jpeg';
    if (formData.vehicleType === 'Corn Harvester') machinePhoto = '/corn_harvester.jpg';
    else if (formData.vehicleType === 'Round Straw Baler') machinePhoto = '/straw_baler.jpg';
    else if (formData.vehicleType === 'Corn Seeder') machinePhoto = '/corn_seeder.jpg';
    else if (formData.selfiePhoto && formData.selfiePhoto.startsWith('data:image')) machinePhoto = formData.selfiePhoto;

    const newOwnerRecord = {
      fullName: formData.fullName,
      owner: formData.fullName,
      mobile: formData.mobile,
      dob: formData.dob,
      gender: formData.gender,
      referralCode: formData.referralCode,
      vehicleType: formData.vehicleType,
      tractorModel: formData.tractorModel || `${formData.vehicleType} Standard`,
      vehicleNumber: formData.vehicleNumber.toUpperCase(),
      pricing: Number(formData.pricing) || 1200,
      village: formData.villageLocation,
      district: selectedLocation?.district || 'Telangana',
      dlNumber: formData.drivingLicenseNumber,
      rcNumber: formData.vehicleRcNumber.toUpperCase(),
      aadhaarNumber: formData.aadhaarNumber,
      photo: machinePhoto,
      selfiePhoto: formData.selfiePhoto,
      dlPhoto: formData.drivingLicenseFront,
      rcFrontPhoto: formData.rcFront,
      rcBackPhoto: formData.rcBack,
      isVerified: true,
      registeredAt: new Date().toISOString().split('T')[0]
    };

    saveRegisteredOwner(newOwnerRecord);

    const newTractorEntry = {
      id: Date.now(),
      owner: formData.fullName,
      mobile: formData.mobile,
      location: formData.villageLocation,
      brand: formData.vehicleType === 'Tractor' ? 'Mahindra' : formData.vehicleType,
      model: formData.tractorModel || formData.vehicleType,
      equipment: formData.equipmentList.join(', ') || formData.vehicleType,
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

    setSuccessData(newOwnerRecord);
  };

  return (
    <div className="auth-screen-wrapper page-anim">
      {/* Outer Mobile Device Frame with Dark Backdrop */}
      <div className="auth-device-frame">
        {/* ========================================================
            STEP 0: STARTING SCREEN (EXACT MATCH TO USER SCREENSHOT)
            ======================================================== */}
        {currentStep === 0 && (
          <div className="auth-login-card page-anim">
            {/* Top Brand & Tractor Owner Pill Header */}
            <div className="auth-brand-row">
              <div className="auth-brand-icon-box" style={{ background: '#ecfdf5', color: '#166534' }}>
                🚜
              </div>
              <span className="auth-brand-name">AGRIRENT</span>
              <span className="auth-role-badge" style={{ background: '#166534', letterSpacing: '0.5px' }}>
                TRACTOR OWNER
              </span>
            </div>

            {/* Login Title & Subtitle */}
            <h1 className="auth-title">Login</h1>
            <p className="auth-subtitle">Enter your mobile number to continue</p>

            {/* Error Message */}
            {errorMsg && (
              <div className="captain-alert-error" style={{ marginBottom: '16px' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Mobile Number Input with +91 Prefix */}
            <form onSubmit={handleLoginContinue}>
              <div className="auth-phone-input-box">
                <span className="auth-country-code">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  className="auth-input-phone"
                  placeholder="Enter mobile number"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
              </div>

              {/* Continue Button */}
              <button
                type="submit"
                className="auth-btn-continue"
                style={{ background: '#1b5e20' }}
              >
                <span>Continue</span>
                <span>→</span>
              </button>
            </form>

            {/* Legal Disclaimer */}
            <p className="auth-legal-text">
              By continuing, you agree to our{' '}
              <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a> and{' '}
              <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>.
            </p>

            {/* Quick Demo Options */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '8px', textAlign: 'center' }}>
                💡 FAST TESTING OPTIONS:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-outline-white"
                  style={{ fontSize: '11.5px', padding: '6px 10px', textAlign: 'left', color: '#166534', borderColor: '#cbd5e1' }}
                  onClick={() => {
                    handleInputChange('mobile', '9876543210');
                    setErrorMsg('');
                  }}
                >
                  ⚡ Existing Owner: Ramesh Kumar (9876543210)
                </button>
                <button
                  type="button"
                  className="btn btn-outline-white"
                  style={{ fontSize: '11.5px', padding: '6px 10px', textAlign: 'left', color: '#00a86b', borderColor: '#cbd5e1' }}
                  onClick={() => {
                    handleInputChange('mobile', '9849001122');
                    setErrorMsg('');
                    setCurrentStep(1); // Proceed directly to 4-step verification!
                  }}
                >
                  ⚡ New Tractor Owner (+91 9849001122): Start 4 Steps
                </button>
              </div>
            </div>

            {/* Powered by tag */}
            <div className="auth-powered-by">
              powered by <strong>Aamblv Technologies</strong>
            </div>
          </div>
        )}

        {/* ========================================================
            STEPS 1 TO 4: 4-STEP CAPTAIN REGISTRATION VERIFICATION
            ======================================================== */}
        {currentStep > 0 && (
          <div className="captain-mobile-card-inner page-anim">
            {/* Step Header with Title, Step Indicator & Progress Bar */}
            <div className="captain-card-header">
              <div className="captain-title-row">
                <h2>{isTe ? 'ట్రాక్టర్ యజమాని నమోదు' : 'Tractor Owner Registration'}</h2>
                <button
                  type="button"
                  className="captain-login-link-btn"
                  onClick={() => setCurrentStep(0)}
                  title={isTe ? 'మొబైల్ లాగిన్‌కి తిరిగి వెళ్లండి' : 'Back to Mobile Login'}
                >
                  ← {isTe ? 'లాగిన్' : 'Login'}
                </button>
              </div>
              <div className="captain-step-indicator">
                {isTe ? `దశ ${currentStep} / 4` : `Step ${currentStep} of 4`}
              </div>
              <div className="captain-progress-track">
                <div
                  className="captain-progress-bar"
                  style={{ width: `${currentStep * 25}%` }}
                />
              </div>
            </div>

            {/* Error Alert Box */}
            {errorMsg && (
              <div className="captain-alert-error">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Step 1 of 4: Personal Details */}
            {currentStep === 1 && (
              <div className="captain-step-content page-anim">
                <div className="captain-form-group">
                  <input
                    type="text"
                    className="captain-input"
                    placeholder="Enter full name"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="captain-form-group">
                  <label className="captain-label">Date of Birth</label>
                  <input
                    type="date"
                    className="captain-input"
                    value={formData.dob}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                  />
                </div>

                <div className="captain-form-group">
                  <label className="captain-label">Gender</label>
                  <div className="captain-gender-row">
                    {['Male', 'Female', 'Other'].map((genderOption) => (
                      <button
                        key={genderOption}
                        type="button"
                        className={`captain-gender-btn ${formData.gender === genderOption ? 'active' : ''}`}
                        onClick={() => handleInputChange('gender', genderOption)}
                      >
                        {genderOption}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="captain-form-group">
                  <label className="captain-label">Referral Code (Optional)</label>
                  <input
                    type="text"
                    className="captain-input"
                    placeholder="ENTER REFERRAL CODE"
                    value={formData.referralCode}
                    onChange={(e) => handleInputChange('referralCode', e.target.value.toUpperCase())}
                  />
                </div>

                <div className="captain-footer-actions">
                  <button
                    type="button"
                    className="captain-btn-continue w-100"
                    onClick={handleNextStep}
                  >
                    Continue &gt;
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 of 4: Vehicle Details */}
            {currentStep === 2 && (
              <div className="captain-step-content page-anim">
                <div className="captain-section-title">
                  <span className="captain-section-icon">🚗</span>
                  <span>Vehicle Details</span>
                </div>

                <div className="captain-form-group">
                  <label className="captain-label">Vehicle Type</label>
                  <select
                    className="captain-select"
                    value={formData.vehicleType}
                    onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                  >
                    {vehicleTypes.map((vt) => (
                      <option key={vt.id} value={vt.id}>
                        {vt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="captain-form-group">
                  <label className="captain-label">Tractor / Machine Model</label>
                  <input
                    type="text"
                    className="captain-input"
                    placeholder="e.g. Mahindra 575 DI / Swaraj 744 FE"
                    value={formData.tractorModel}
                    onChange={(e) => handleInputChange('tractorModel', e.target.value)}
                  />
                </div>

                <div className="captain-form-group">
                  <label className="captain-label">Vehicle Number</label>
                  <input
                    type="text"
                    className="captain-input"
                    placeholder="FSGDSSGG (e.g. TS 04 AB 1234)"
                    value={formData.vehicleNumber}
                    onChange={(e) => handleInputChange('vehicleNumber', e.target.value.toUpperCase())}
                  />
                </div>

                <div className="captain-form-group">
                  <label className="captain-label">Hourly Rental Rate (₹/Hr)</label>
                  <input
                    type="number"
                    className="captain-input"
                    value={formData.pricing}
                    onChange={(e) => handleInputChange('pricing', e.target.value)}
                  />
                </div>

                <div className="captain-form-group">
                  <label className="captain-label">Village / Locality</label>
                  <input
                    type="text"
                    className="captain-input"
                    value={formData.villageLocation}
                    onChange={(e) => handleInputChange('villageLocation', e.target.value)}
                  />
                </div>

                <div className="captain-footer-actions split">
                  <button
                    type="button"
                    className="captain-btn-back"
                    onClick={handlePrevStep}
                  >
                    &lt; Back
                  </button>
                  <button
                    type="button"
                    className="captain-btn-continue"
                    onClick={handleNextStep}
                  >
                    Continue &gt;
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 of 4: Identity Numbers */}
            {currentStep === 3 && (
              <div className="captain-step-content page-anim">
                <div className="captain-section-title">
                  <span className="captain-section-icon">🛡️</span>
                  <span>Identity Numbers</span>
                </div>

                <div className="captain-form-group">
                  <label className="captain-label">Driving License Number</label>
                  <input
                    type="text"
                    className="captain-input"
                    placeholder="3543645645"
                    value={formData.drivingLicenseNumber}
                    onChange={(e) => handleInputChange('drivingLicenseNumber', e.target.value.toUpperCase())}
                  />
                </div>

                <div className="captain-form-group">
                  <label className="captain-label">Vehicle RC Number</label>
                  <input
                    type="text"
                    className="captain-input"
                    placeholder="SCFFEEE"
                    value={formData.vehicleRcNumber}
                    onChange={(e) => handleInputChange('vehicleRcNumber', e.target.value.toUpperCase())}
                  />
                </div>

                <div className="captain-form-group">
                  <label className="captain-label">Aadhaar Number</label>
                  <input
                    type="text"
                    maxLength={12}
                    className="captain-input"
                    placeholder="123456789054"
                    value={formData.aadhaarNumber}
                    onChange={(e) => handleInputChange('aadhaarNumber', e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <div className="captain-footer-actions split">
                  <button
                    type="button"
                    className="captain-btn-back"
                    onClick={handlePrevStep}
                  >
                    &lt; Back
                  </button>
                  <button
                    type="button"
                    className="captain-btn-continue"
                    onClick={handleNextStep}
                  >
                    Continue &gt;
                  </button>
                </div>
              </div>
            )}

            {/* Step 4 of 4: Document Verification Files */}
            {currentStep === 4 && (
              <div className="captain-step-content page-anim">
                <div className="captain-section-title">
                  <span className="captain-section-icon">📄</span>
                  <span>Document Verification Files</span>
                </div>

                {/* Upload 1: Selfie Photo */}
                <div className="captain-upload-card">
                  <label className="captain-label">Selfie Photo *</label>
                  <label className={`captain-upload-dropzone ${formData.selfiePhoto ? 'has-file' : ''}`}>
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      className="captain-hidden-input"
                      onChange={(e) => handleFileUpload('selfiePhoto', e)}
                    />
                    {formData.selfiePhoto ? (
                      <div className="captain-preview-container">
                        <img src={formData.selfiePhoto} alt="Selfie preview" className="captain-doc-thumb" />
                        <span className="captain-preview-label">✓ Selfie Photo Ready</span>
                      </div>
                    ) : (
                      <div className="captain-dropzone-content">
                        <div className="captain-dropzone-icon">📷</div>
                        <span className="captain-dropzone-text">Capture/Upload Selfie</span>
                      </div>
                    )}
                  </label>
                </div>

                {/* Upload 2: DL Front */}
                <div className="captain-upload-card">
                  <label className="captain-label">Driving License Front Side *</label>
                  <label className={`captain-upload-dropzone ${formData.drivingLicenseFront ? 'has-file' : ''}`}>
                    <input
                      type="file"
                      accept="image/*"
                      className="captain-hidden-input"
                      onChange={(e) => handleFileUpload('drivingLicenseFront', e)}
                    />
                    {formData.drivingLicenseFront ? (
                      <div className="captain-preview-container">
                        <img src={formData.drivingLicenseFront} alt="DL preview" className="captain-doc-thumb" />
                        <span className="captain-preview-label">✓ DL Front Ready</span>
                      </div>
                    ) : (
                      <div className="captain-dropzone-content">
                        <div className="captain-dropzone-icon">☁️</div>
                        <span className="captain-dropzone-text">Upload DL Front</span>
                      </div>
                    )}
                  </label>
                </div>

                {/* Upload 3: RC Front Side */}
                <div className="captain-upload-card">
                  <label className="captain-label">RC Front Side *</label>
                  <label className={`captain-upload-dropzone ${formData.rcFront ? 'has-file' : ''}`}>
                    <input
                      type="file"
                      accept="image/*"
                      className="captain-hidden-input"
                      onChange={(e) => handleFileUpload('rcFront', e)}
                    />
                    {formData.rcFront ? (
                      <div className="captain-preview-container">
                        <img src={formData.rcFront} alt="RC preview" className="captain-doc-thumb" />
                        <span className="captain-preview-label">✓ RC Front Ready</span>
                      </div>
                    ) : (
                      <div className="captain-dropzone-content">
                        <div className="captain-dropzone-icon">☁️</div>
                        <span className="captain-dropzone-text">Upload RC Front</span>
                      </div>
                    )}
                  </label>
                </div>

                {/* Upload 4: RC Back Side (Optional) */}
                <div className="captain-upload-card">
                  <label className="captain-label">RC Back Side (Optional)</label>
                  <label className={`captain-upload-dropzone ${formData.rcBack ? 'has-file' : ''}`}>
                    <input
                      type="file"
                      accept="image/*"
                      className="captain-hidden-input"
                      onChange={(e) => handleFileUpload('rcBack', e)}
                    />
                    {formData.rcBack ? (
                      <div className="captain-preview-container">
                        <img src={formData.rcBack} alt="RC back preview" className="captain-doc-thumb" />
                        <span className="captain-preview-label">✓ RC Back Ready</span>
                      </div>
                    ) : (
                      <div className="captain-dropzone-content">
                        <div className="captain-dropzone-icon">☁️</div>
                        <span className="captain-dropzone-text">Upload RC Back</span>
                      </div>
                    )}
                  </label>
                </div>

                <div className="captain-footer-actions split">
                  <button
                    type="button"
                    className="captain-btn-back"
                    onClick={handlePrevStep}
                  >
                    &lt; Back
                  </button>
                  <button
                    type="button"
                    className="captain-btn-submit"
                    onClick={handleSubmit}
                  >
                    Submit Documents
                  </button>
                </div>
              </div>
            )}

            {/* Fast Auto-Fill for Step 1-4 Testing */}
            <div className="captain-demo-helper">
              <button
                type="button"
                className="captain-demo-link"
                onClick={handleFillDemo}
              >
                ⚡ Auto-Fill Sample Captain Details (Test 4 Steps)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Success Modal upon Completion */}
      {successData && (
        <div className="receipt-modal-backdrop" style={{ zIndex: 9999 }}>
          <div className="receipt-modal-card" style={{ maxWidth: '440px', padding: '0', overflow: 'hidden' }}>
            <div style={{
              background: 'linear-gradient(135deg, #1b4958 0%, #00a86b 100%)',
              color: 'white',
              padding: '24px 20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '46px', marginBottom: '8px' }}>🎉</div>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>
                {isTe ? 'ట్రాక్టర్ యజమాని నమోదు పూర్తయింది!' : 'Tractor Owner Registration Complete!'}
              </h3>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', opacity: 0.9 }}>
                {isTe ? 'మీ ట్రాక్టర్ ధృవీకరించబడింది మరియు సక్రియం చేయబడింది' : 'Your tractor is verified and active for bookings'}
              </p>
            </div>

            <div style={{ padding: '24px 20px', background: '#fff' }}>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                fontSize: '13.5px',
                lineHeight: 1.6
              }}>
                <div><strong>{isTe ? 'యజమాని పేరు:' : 'Owner Name:'}</strong> {successData.fullName}</div>
                <div><strong>{isTe ? 'మొబైల్ నంబర్:' : 'Mobile Number:'}</strong> {successData.mobile}</div>
                <div><strong>{isTe ? 'వాహనం:' : 'Vehicle:'}</strong> {successData.vehicleType} ({successData.vehicleNumber})</div>
                <div><strong>{isTe ? 'ప్రాంతం:' : 'Locality:'}</strong> {successData.village}</div>
                <div><strong>{isTe ? 'ధర:' : 'Rental Rate:'}</strong> ₹{successData.pricing}/Hr</div>
                <div style={{ marginTop: '8px', color: '#00a86b', fontWeight: '700' }}>
                  ✓ {isTe ? 'ఆధార్ మరియు డ్రైవింగ్ లైసెన్స్ ధృవీకరించబడింది' : 'Aadhaar & Driving License Verified'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary w-100"
                  onClick={() => {
                    setSuccessData(null);
                    setActivePage('owner-inbox');
                  }}
                >
                  📥 {isTe ? 'ఓనర్ ఇన్‌బాక్స్‌కి వెళ్లండి' : 'Go to Owner Inbox'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary w-100"
                  onClick={() => {
                    setSuccessData(null);
                    setActivePage('find-tractor');
                  }}
                >
                  🔍 {isTe ? 'ఫ్లీట్‌లో చూడండి' : 'View in Fleet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
