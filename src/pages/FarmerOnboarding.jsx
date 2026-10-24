import { useState } from 'react';
import { translations } from '../translations';
import { saveRegisteredFarmer } from '../data/userData';
import { ALL_LOCATIONS_LIST } from '../data/telanganaLocations';

export default function FarmerOnboarding({
  initialMobile = '',
  setActivePage,
  setCurrentFarmer,
  language = 'en',
  selectedLocation
}) {
  const t = translations[language] || translations.en;
  const isTe = language === 'te';

  const defaultVillage = selectedLocation
    ? `${isTe ? (selectedLocation.villageTe || selectedLocation.village) : selectedLocation.village}, ${isTe ? (selectedLocation.districtTe || selectedLocation.district) : selectedLocation.district}`
    : 'Hasanparthy, Hanamkonda';

  const [formData, setFormData] = useState({
    name: '',
    mobile: initialMobile || '',
    village: defaultVillage,
    landArea: 2.5,
    crops: ['Paddy', 'Cotton'],
    passbookNo: ''
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const cropOptions = [
    { id: 'Paddy', label: isTe ? 'వరి (Paddy)' : 'Paddy (వరి)' },
    { id: 'Cotton', label: isTe ? 'పత్తి (Cotton)' : 'Cotton (పత్తి)' },
    { id: 'Maize', label: isTe ? 'మొక్కజొన్న (Maize)' : 'Maize / Corn (మొక్కజొన్న)' },
    { id: 'Chilli', label: isTe ? 'మిరప (Chilli)' : 'Chilli (మిరప)' },
    { id: 'Turmeric', label: isTe ? 'పసుపు (Turmeric)' : 'Turmeric (పసుపు)' },
    { id: 'Vegetables', label: isTe ? 'కూరగాయలు (Vegetables)' : 'Vegetables (కూరగాయలు)' },
  ];

  const handleCropToggle = (cropId) => {
    setFormData(prev => {
      const exists = prev.crops.includes(cropId);
      const updated = exists
        ? prev.crops.filter(c => c !== cropId)
        : [...prev.crops, cropId];
      return { ...prev, crops: updated };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg(isTe ? 'దయచేసి మీ పూర్తి పేరు నమోదు చేయండి.' : 'Please enter your full name.');
      return;
    }

    const cleanMobile = formData.mobile.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length < 10) {
      setErrorMsg(isTe ? 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.' : 'Please enter a valid 10-digit mobile number.');
      return;
    }

    const newFarmer = {
      name: formData.name.trim(),
      mobile: cleanMobile,
      village: formData.village,
      district: selectedLocation?.district || 'Telangana',
      landArea: Number(formData.landArea) || 2,
      crops: formData.crops,
      passbookNo: formData.passbookNo.trim(),
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

    setSuccess(true);
  };

  return (
    <div className="auth-screen-wrapper page-anim">
      <div className="auth-device-frame">
        <div className="captain-mobile-card-inner page-anim">
          {/* Header */}
          <div className="captain-card-header">
            <div className="captain-title-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>🌱</span>
                <h2 style={{ fontSize: '20px' }}>
                  {isTe ? 'రైతు ప్రొఫైల్ నమోదు' : 'Farmer Onboarding'}
                </h2>
              </div>
              <button
                type="button"
                className="captain-login-link-btn"
                onClick={() => setActivePage('farmer-login')}
              >
                ← {isTe ? 'లాగిన్' : 'Login'}
              </button>
            </div>
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              fontSize: '12px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontWeight: '700',
              marginTop: '10px'
            }}>
              ✨ {isTe ? 'కొత్త రైతు గుర్తించబడింది • 1-నిమిషంలో ప్రొఫైల్ పూర్తి చేయండి' : 'New Farmer Detected • 1-Minute Setup'}
            </div>
          </div>

          {errorMsg && (
            <div className="captain-alert-error" style={{ marginBottom: '16px' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="captain-step-content">
            <div className="captain-form-group">
              <label className="captain-label">
                {isTe ? 'రైతు పూర్తి పేరు *' : 'Farmer Full Name *'}
              </label>
              <input
                type="text"
                className="captain-input"
                placeholder="e.g. Kondal Rao / Srinivas"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="captain-form-group">
              <label className="captain-label">
                {isTe ? 'మొబైల్ నంబర్ *' : 'Mobile Number *'}
              </label>
              <input
                type="tel"
                maxLength={10}
                className="captain-input"
                value={formData.mobile}
                onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value.replace(/\D/g, '') }))}
              />
            </div>

            <div className="captain-form-group">
              <label className="captain-label">
                {isTe ? 'గ్రామం / ప్రాంతం *' : 'Village / Locality *'}
              </label>
              <input
                type="text"
                className="captain-input"
                value={formData.village}
                onChange={(e) => setFormData(prev => ({ ...prev, village: e.target.value }))}
              />
            </div>

            <div className="captain-form-group">
              <label className="captain-label">
                {isTe ? 'మొత్తం వ్యవసాయ భూమి (ఎకరాల్లో) *' : 'Total Farm Land (In Acres) *'}
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                className="captain-input"
                value={formData.landArea}
                onChange={(e) => setFormData(prev => ({ ...prev, landArea: e.target.value }))}
              />
            </div>

            {/* Crops selection */}
            <div className="captain-form-group">
              <label className="captain-label">
                {isTe ? 'మీరు పండించే ప్రధాన పంటలు' : 'Primary Crops Grown'}
              </label>
              <div className="captain-implements-grid">
                {cropOptions.map((crop) => (
                  <button
                    key={crop.id}
                    type="button"
                    className={`captain-chip-btn ${formData.crops.includes(crop.id) ? 'active' : ''}`}
                    onClick={() => handleCropToggle(crop.id)}
                  >
                    {formData.crops.includes(crop.id) ? '✓ ' : '+ '}
                    {crop.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="captain-form-group">
              <label className="captain-label">
                {isTe ? 'పట్టాదారు పాస్‌బుక్ / ఆధార్ చివరి 4 అంకెలు (ఐచ్ఛికం)' : 'Pattadar Passbook / Aadhaar Last 4 Digits (Optional)'}
              </label>
              <input
                type="text"
                className="captain-input"
                placeholder="e.g. TS-WGL-88219"
                value={formData.passbookNo}
                onChange={(e) => setFormData(prev => ({ ...prev, passbookNo: e.target.value }))}
              />
            </div>

            <div className="captain-footer-actions">
              <button
                type="submit"
                className="auth-btn-continue"
                style={{ background: '#1b5e20', marginTop: '10px' }}
              >
                <span>{isTe ? 'ప్రొఫైల్ పూర్తి చేసి ట్రాక్టర్ బుక్ చేయండి' : 'Complete Profile & Start Booking'}</span>
                <span>→</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {success && (
        <div className="receipt-modal-backdrop" style={{ zIndex: 9999 }}>
          <div className="receipt-modal-card" style={{ maxWidth: '440px', padding: '0', overflow: 'hidden' }}>
            <div style={{
              background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
              color: 'white',
              padding: '24px 20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '46px', marginBottom: '8px' }}>🎉</div>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>
                {isTe ? 'రైతు ఖాతా విజయవంతంగా సృష్టించబడింది!' : 'Welcome to AgriRent!'}
              </h3>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', opacity: 0.9 }}>
                {isTe ? `${formData.name} గారి ప్రొఫైల్ సిద్ధమైంది.` : `Profile created for ${formData.name}. You can now book tractors instantly.`}
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
                <div><strong>{isTe ? 'రైతు పేరు:' : 'Farmer Name:'}</strong> {formData.name}</div>
                <div><strong>{isTe ? 'మొబైల్:' : 'Mobile:'}</strong> {formData.mobile}</div>
                <div><strong>{isTe ? 'గ్రామం:' : 'Village:'}</strong> {formData.village}</div>
                <div><strong>{isTe ? 'భూమి వైశాల్యం:' : 'Land Area:'}</strong> {formData.landArea} Acres</div>
                <div><strong>{isTe ? 'పంటలు:' : 'Crops:'}</strong> {formData.crops.join(', ')}</div>
              </div>

              <button
                type="button"
                className="btn btn-primary w-100"
                style={{ padding: '14px', fontSize: '15px', fontWeight: '800' }}
                onClick={() => {
                  setSuccess(false);
                  setActivePage('find-tractor');
                }}
              >
                🔍 {isTe ? 'గ్రామంలోని ట్రాక్టర్లను చూడండి' : 'Browse Tractors in Village'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
