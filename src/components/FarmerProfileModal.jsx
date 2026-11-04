import { useState, useEffect } from 'react';
import { TELANGANA_33_DISTRICTS } from '../data/telanganaDistricts';
import { apiGetMyBookings } from '../api/apiClient';

const CROPS_OPTIONS = [
  { id: 'Paddy', en: 'Paddy (Rice)', te: 'వరి' },
  { id: 'Cotton', en: 'Cotton', te: 'పత్తి' },
  { id: 'Chilli', en: 'Chilli', te: 'మిరప' },
  { id: 'Maize', en: 'Maize (Corn)', te: 'మొక్కజొన్న' },
  { id: 'Red Gram', en: 'Red Gram / Pulses', te: 'కంది / పప్పుధాన్యాలు' },
  { id: 'Groundnut', en: 'Groundnut', te: 'వేరుశెనగ' },
  { id: 'Turmeric', en: 'Turmeric', te: 'పసుపు' },
  { id: 'Vegetables', en: 'Vegetables', te: 'కూరగాయలు' },
];

export default function FarmerProfileModal({
  isOpen,
  onClose,
  currentFarmer,
  onUpdateFarmer,
  onFarmerLogout,
  onFarmerDeleteAccount,
  language = 'en',
  onNavigateBookings,
}) {
  const isTe = language === 'te';

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [myBookingsCount, setMyBookingsCount] = useState(0);

  // Form edit fields
  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('Hanumakonda');
  const [landArea, setLandArea] = useState('3.0');
  const [crops, setCrops] = useState(['Paddy', 'Cotton']);
  const [passbookNo, setPassbookNo] = useState('');

  // Sync state whenever currentFarmer opens or changes
  useEffect(() => {
    if (currentFarmer) {
      setName(currentFarmer.name || '');
      setVillage(currentFarmer.village || 'Hasanparthy');
      setDistrict(currentFarmer.district || 'Hanumakonda');
      setLandArea(String(currentFarmer.landArea || 3.0));
      setCrops(Array.isArray(currentFarmer.crops) && currentFarmer.crops.length > 0
        ? currentFarmer.crops
        : ['Paddy', 'Cotton']);
      setPassbookNo(currentFarmer.passbookNo || '');
      setIsEditing(false);
      setSaveSuccessMsg('');
      setErrorMsg('');
      setShowDeleteConfirm(false);

      if (isOpen) {
        apiGetMyBookings(currentFarmer)
          .then((records) => {
            if (Array.isArray(records)) {
              setMyBookingsCount(records.length);
            }
          })
          .catch(() => {});
      }
    }
  }, [currentFarmer, isOpen]);

  if (!isOpen || !currentFarmer) return null;

  const handleToggleCrop = (cropId) => {
    if (crops.includes(cropId)) {
      if (crops.length === 1) return; // Keep at least one crop
      setCrops(crops.filter((c) => c !== cropId));
    } else {
      setCrops([...crops, cropId]);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSaveSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg(isTe ? 'రైతు పూర్తి పేరును నమోదు చేయండి.' : 'Please enter your full name.');
      return;
    }

    const parsedArea = parseFloat(landArea);
    if (isNaN(parsedArea) || parsedArea <= 0) {
      setErrorMsg(isTe ? 'దయచేసి సరైన పొలం ఎకరాల సంఖ్యను ఇవ్వండి.' : 'Please enter a valid farm land acreage.');
      return;
    }

    setIsSaving(true);
    try {
      const updatedData = {
        name: name.trim(),
        village: village.trim() || 'Hasanparthy',
        district: district || 'Hanumakonda',
        landArea: parsedArea,
        crops: crops,
        passbookNo: passbookNo.trim(),
      };

      if (onUpdateFarmer) {
        await onUpdateFarmer(updatedData);
      }

      setSaveSuccessMsg(
        isTe
          ? '✓ రైతు ప్రొఫైల్ విజయవంతంగా నవీకరించబడింది!'
          : '✓ Farmer profile updated successfully! Synced with PostgreSQL database.'
      );
      setIsEditing(false);
    } catch (err) {
      setErrorMsg(err.message || (isTe ? 'సేవ్ చేయడంలో సమస్య ఏర్పడింది.' : 'Failed to update profile. Please try again.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (currentFarmer) {
      setName(currentFarmer.name || '');
      setVillage(currentFarmer.village || 'Hasanparthy');
      setDistrict(currentFarmer.district || 'Hanumakonda');
      setLandArea(String(currentFarmer.landArea || 3.0));
      setCrops(Array.isArray(currentFarmer.crops) && currentFarmer.crops.length > 0
        ? currentFarmer.crops
        : ['Paddy', 'Cotton']);
      setPassbookNo(currentFarmer.passbookNo || '');
    }
    setIsEditing(false);
    setErrorMsg('');
  };

  return (
    <div className="farmer-profile-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="farmer-profile-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="farmer-profile-header">
          <div className="farmer-profile-header-left">
            <span className="farmer-profile-header-icon">👨‍🌾</span>
            <div>
              <h2 className="farmer-profile-title">
                {isTe ? 'రైతు ప్రొఫైల్' : 'Farmer Profile'}
              </h2>
              <p className="farmer-profile-subtitle">
                {isTe ? 'వ్యక్తిగత వివరాలు, సెషన్ మరియు ఖాతా సెట్టింగ్‌లు' : 'Personal Details, Session & Account Settings'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="farmer-profile-close-btn"
            onClick={onClose}
            aria-label="Close Profile"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="farmer-profile-scroll-body">
          {saveSuccessMsg && (
            <div className="farmer-profile-alert success">
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="farmer-profile-alert error">
              <span>⚠️ {errorMsg}</span>
            </div>
          )}

          {/* Hero Banner: Identity & Verified Badges */}
          <div className="farmer-hero-summary">
            <div className="farmer-hero-avatar-wrap">
              <span className="farmer-hero-avatar">👨‍🌾</span>
              <span className="farmer-hero-badge" title="Verified Telangana Farmer">✓</span>
            </div>
            <div className="farmer-hero-info">
              <div className="farmer-hero-title-row">
                <h3 className="farmer-hero-name">{currentFarmer.name || 'Telangana Farmer'}</h3>
                <span className="farmer-verified-pill">
                  ✓ {isTe ? 'ధృవీకృత రైతు' : 'Verified Farmer'}
                </span>
              </div>
              <p className="farmer-hero-meta">
                <span>📱 +91 {currentFarmer.mobile || '—'}</span>
                <span className="meta-sep">•</span>
                <span>📍 {currentFarmer.village || 'Hasanparthy'}, {currentFarmer.district || 'Hanumakonda'}</span>
                <span className="meta-sep">•</span>
                <span>🌾 {currentFarmer.landArea || 3} {isTe ? 'ఎకరాలు' : 'Acres'}</span>
                <span className="meta-sep">•</span>
                <span>📋 {myBookingsCount} {isTe ? 'బుకింగ్‌లు' : 'Bookings'}</span>
              </p>
            </div>
          </div>

          {/* Quick Action Navigation Strip */}
          <div className="farmer-quick-nav-row">
            {onNavigateBookings && (
              <button
                type="button"
                className="farmer-nav-btn"
                onClick={() => {
                  onClose();
                  onNavigateBookings();
                }}
              >
                <span>📄</span>
                <span>{isTe ? 'నా బుకింగ్‌లు చూడండి' : 'View My Bookings'} ({myBookingsCount})</span>
              </button>
            )}
            <button
              type="button"
              className={`farmer-nav-btn ${isEditing ? 'active' : ''}`}
              onClick={() => {
                setIsEditing(!isEditing);
                setSaveSuccessMsg('');
                setErrorMsg('');
              }}
            >
              <span>{isEditing ? '✕' : '✏️'}</span>
              <span>{isEditing ? (isTe ? 'సవరణ రద్దు' : 'Cancel Editing') : (isTe ? 'వివరాలు సవరించండి' : 'Edit Details')}</span>
            </button>
          </div>

          {/* Section: Farmer Details & Edit Form */}
          <div className="farmer-details-card">
            <div className="farmer-card-header">
              <h4 className="farmer-card-title">
                {isTe ? 'రైతు ప్రాథమిక సమాచారం' : 'Farmer Farm & Contact Details'}
              </h4>
              {!isEditing ? (
                <button
                  type="button"
                  className="farmer-card-edit-btn"
                  onClick={() => setIsEditing(true)}
                >
                  ✏️ {isTe ? 'సవరించండి' : 'Edit Details'}
                </button>
              ) : null}
            </div>

            {!isEditing ? (
              /* VIEW MODE */
              <div className="farmer-details-grid">
                <div className="farmer-field-box">
                  <span className="farmer-field-label">{isTe ? 'పూర్తి పేరు' : 'Full Name'}</span>
                  <strong className="farmer-field-value">{currentFarmer.name || '—'}</strong>
                </div>

                <div className="farmer-field-box">
                  <span className="farmer-field-label">{isTe ? 'మొబైల్ సంఖ్య (OTP ధృవీకరించబడింది)' : 'Mobile (SMS OTP Verified)'}</span>
                  <div className="farmer-field-value-row">
                    <strong className="farmer-field-value">+91 {currentFarmer.mobile || '—'}</strong>
                    <span className="farmer-otp-chip">✓ Verified</span>
                  </div>
                </div>

                <div className="farmer-field-box">
                  <span className="farmer-field-label">{isTe ? 'గ్రామం / స్థావరం' : 'Base Village'}</span>
                  <strong className="farmer-field-value">{currentFarmer.village || 'Hasanparthy'}</strong>
                </div>

                <div className="farmer-field-box">
                  <span className="farmer-field-label">{isTe ? 'జిల్లా' : 'District'}</span>
                  <strong className="farmer-field-value">{currentFarmer.district || 'Hanumakonda'}</strong>
                </div>

                <div className="farmer-field-box">
                  <span className="farmer-field-label">{isTe ? 'వ్యవసాయ భూమి వైశాల్యం' : 'Farmland Size'}</span>
                  <strong className="farmer-field-value">{currentFarmer.landArea || 3} {isTe ? 'ఎకరాలు' : 'Acres'}</strong>
                </div>

                <div className="farmer-field-box">
                  <span className="farmer-field-label">{isTe ? 'పట్టాదార్ పాస్‌బుక్ / రైతు బంధు ID' : 'Pattadar Passbook / Rythu Bandhu ID'}</span>
                  <strong className="farmer-field-value">{currentFarmer.passbookNo || (isTe ? 'నమోదు కాలేదు (ఐచ్ఛికం)' : 'Not Registered (Optional)')}</strong>
                </div>

                <div className="farmer-field-box full-width">
                  <span className="farmer-field-label">{isTe ? 'సాగు చేసే ప్రధాన పంటలు' : 'Primary Crops Cultivated'}</span>
                  <div className="farmer-crops-chips-row">
                    {(Array.isArray(currentFarmer.crops) && currentFarmer.crops.length > 0 ? currentFarmer.crops : ['Paddy', 'Cotton']).map((crop) => (
                      <span key={crop} className="farmer-crop-pill">
                        🌱 {crop}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* EDIT MODE */
              <form onSubmit={handleSaveProfile} className="farmer-edit-form">
                <div className="form-fields-grid">
                  {/* Name Field */}
                  <div className="form-group">
                    <label className="form-label">
                      {isTe ? 'రైతు పూర్తి పేరు *' : 'Farmer Full Name *'}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isTe ? 'రైతు పేరు' : 'Full Name'}
                      required
                    />
                  </div>

                  {/* Mobile Field (Read-only for account integrity) */}
                  <div className="form-group">
                    <label className="form-label">
                      {isTe ? 'మొబైల్ సంఖ్య (ధృవీకరించబడింది)' : 'Mobile Number (Primary Account Key)'}
                    </label>
                    <input
                      type="text"
                      className="form-input readonly"
                      value={`+91 ${currentFarmer.mobile || ''}`}
                      disabled
                      title="Mobile number is verified with Message Central OTP and serves as your account login."
                    />
                  </div>

                  {/* Village Field */}
                  <div className="form-group">
                    <label className="form-label">
                      {isTe ? 'గ్రామం / లొకేషన్ *' : 'Base Village *'}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder={isTe ? 'గ్రామం పేరు' : 'Village name'}
                      required
                    />
                  </div>

                  {/* District Dropdown (All 33 Telangana Districts) */}
                  <div className="form-group">
                    <label className="form-label">
                      {isTe ? 'తెలంగాణ జిల్లా *' : 'Telangana District *'}
                    </label>
                    <select
                      className="form-input form-select"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      required
                    >
                      {TELANGANA_33_DISTRICTS.map((d) => (
                        <option key={d.id} value={d.name_en}>
                          {isTe ? `${d.name_te} (${d.name_en})` : d.name_en}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Land Area */}
                  <div className="form-group">
                    <label className="form-label">
                      {isTe ? 'వ్యవసాయ భూమి (ఎకరాలలో) *' : 'Farmland Area (Acres) *'}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="1000"
                      className="form-input"
                      value={landArea}
                      onChange={(e) => setLandArea(e.target.value)}
                      required
                    />
                  </div>

                  {/* Passbook / Rythu Bandhu ID */}
                  <div className="form-group">
                    <label className="form-label">
                      {isTe ? 'రైతు బంధు / పట్టాదార్ పాస్‌బుక్ సంఖ్య' : 'Rythu Bandhu / Pattadar Passbook No.'}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={passbookNo}
                      onChange={(e) => setPassbookNo(e.target.value)}
                      placeholder="e.g. TS-RYTHU-84920"
                    />
                  </div>
                </div>

                {/* Crops Selector */}
                <div className="form-group full-width" style={{ marginTop: '12px' }}>
                  <label className="form-label">
                    {isTe ? 'పండించే పంటలను ఎంచుకోండి:' : 'Select Crops Cultivated:'}
                  </label>
                  <div className="crops-toggle-strip">
                    {CROPS_OPTIONS.map((c) => {
                      const isSelected = crops.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          className={`crop-toggle-pill ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleToggleCrop(c.id)}
                        >
                          <span>{isSelected ? '✓' : '+'}</span>
                          <span>{isTe ? c.te : c.en}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Edit Form Action Buttons */}
                <div className="form-actions-row">
                  <button
                    type="submit"
                    className="farmer-save-btn"
                    disabled={isSaving}
                  >
                    {isSaving
                      ? (isTe ? '🔄 సేవ్ చేస్తోంది...' : '🔄 Saving to Database...')
                      : (isTe ? '💾 మార్పులను సేవ్ చేయండి' : '💾 Save Profile Changes')}
                  </button>
                  <button
                    type="button"
                    className="farmer-cancel-btn"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    {isTe ? 'రద్దు చేయండి' : 'Cancel'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Section: Account Session & Logout ("Logout Page / Action") */}
          <div className="farmer-session-card">
            <div className="session-card-left">
              <span className="session-card-icon">🚪</span>
              <div>
                <h4 className="session-card-title">
                  {isTe ? 'ఖాతా సెషన్ & లాగ్అవుట్' : 'Account Session & Sign Out'}
                </h4>
                <p className="session-card-desc">
                  {isTe
                    ? `మీరు ప్రస్తుతం ${currentFarmer.name || 'రైతు'} ఖాతాతో లాగిన్ అయ్యారు. లాగ్అవుట్ చేయడం ద్వారా ఈ పరికరంలో సెషన్ ముగుస్తుంది. మీ వివరాలు మరియు బుకింగ్‌లు సురక్షితంగా ఉంటాయి.`
                    : `Currently signed in as ${currentFarmer.name || 'Farmer'} (+91 ${currentFarmer.mobile || ''}). Signing out will safely end your active session on this device.`}
                </p>
              </div>
            </div>
            {onFarmerLogout && (
              <button
                type="button"
                className="farmer-logout-action-btn"
                onClick={() => {
                  onClose();
                  onFarmerLogout();
                }}
              >
                🚪 {isTe ? 'లాగ్అవుట్ అవ్వండి' : 'Logout of Account'}
              </button>
            )}
          </div>

          {/* Section: Danger Zone & Delete Account ("Delete Account") */}
          <div className="farmer-danger-card">
            <div className="danger-card-left">
              <span className="danger-card-icon">⚠️</span>
              <div>
                <h4 className="danger-card-title">
                  {isTe ? 'ప్రమాదకర ప్రాంతం: రైతు ఖాతా తొలగింపు' : 'Danger Zone: Permanently Delete Account'}
                </h4>
                <p className="danger-card-desc">
                  {isTe
                    ? 'మీ రైతు ఖాతా, వ్యక్తిగత సమాచారం మరియు PostgreSQL డేటాబేస్ రికార్డులను శాశ్వతంగా తొలగిస్తుంది. ఈ చర్యను రద్దు చేయడం సాధ్యం కాదు.'
                    : 'Permanently deletes your farmer profile credentials, contact records, and active session from PostgreSQL database. This action cannot be reversed.'}
                </p>
              </div>
            </div>

            {!showDeleteConfirm ? (
              <button
                type="button"
                className="farmer-delete-action-btn"
                onClick={() => setShowDeleteConfirm(true)}
              >
                🗑️ {isTe ? 'రైతు ఖాతా తొలగించండి' : 'Delete Account'}
              </button>
            ) : (
              <div className="delete-confirm-box">
                <p className="delete-confirm-warning">
                  ⚠️ {isTe ? 'ఖచ్చితంగా మీ ఖాతాను శాశ్వతంగా తొలగించాలనుకుంటున్నారా?' : 'Are you completely sure you want to permanently delete your account?'}
                </p>
                <div className="delete-confirm-actions">
                  <button
                    type="button"
                    className="delete-final-btn"
                    onClick={() => {
                      onClose();
                      if (onFarmerDeleteAccount) onFarmerDeleteAccount();
                    }}
                  >
                    🗑️ {isTe ? 'అవును, ఖచ్చితంగా తొలగించు' : 'Yes, Permanently Delete'}
                  </button>
                  <button
                    type="button"
                    className="delete-cancel-btn"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    {isTe ? 'రద్దు చేయి' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

