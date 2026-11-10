import { useState, useEffect } from 'react';
import { apiUploadImage, apiSubmitCustomTractor, apiResubmitCustomTractor } from '../api/apiClient';

export default function CustomTractorModal({
  isOpen,
  onClose,
  ownerName = '',
  ownerMobile = '',
  defaultDistrict = 'Hanumakonda',
  defaultVillage = 'Hasanparthy',
  language = 'en',
  onTractorSubmitted,
  initialData = null
}) {
  const isTe = language === 'te';

  const brandList = [
    'Mahindra',
    'Swaraj',
    'John Deere',
    'Sonalika',
    'Massey Ferguson',
    'Eicher',
    'New Holland',
    'Farmtrac',
    'Kubota',
    'Powertrac',
    'Captain',
    'VST Shakti',
    'Preet',
    'Indo Farm',
    'Other'
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

  const [formData, setFormData] = useState({
    brand: '',
    customBrand: '',
    model: '',
    hp: '',
    year: '2023',
    rcNumber: '',
    district: defaultDistrict,
    mandal: defaultVillage,
    whereabouts: '',
    priceHour: '',
    priceAcre: '',
    implements: ['Ploughing'],
    photo: ''
  });

  const [photoPreview, setPhotoPreview] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        brand: brandList.includes(initialData.brand) ? initialData.brand : 'Other',
        customBrand: brandList.includes(initialData.brand) ? '' : (initialData.brand || ''),
        model: initialData.model || '',
        hp: (initialData.hp || '').replace(/[^0-9]/g, '') || initialData.hp || '',
        year: initialData.year || '2023',
        rcNumber: initialData.rcNumber || initialData.rc_number || '',
        district: initialData.district || defaultDistrict,
        mandal: initialData.village || initialData.mandal || defaultVillage,
        whereabouts: initialData.whereabouts || '',
        priceHour: initialData.pricing || initialData.priceHour || '',
        priceAcre: initialData.priceAcre || initialData.price_per_acre || '',
        implements: Array.isArray(initialData.implements)
          ? initialData.implements
          : (typeof initialData.equipment === 'string'
              ? initialData.equipment.split(',').map(s => s.trim())
              : ['Ploughing']),
        photo: initialData.photo || ''
      });
      setPhotoPreview(initialData.photo || '');
    } else {
      setFormData({
        brand: 'Mahindra',
        customBrand: '',
        model: '',
        hp: '48',
        year: '2023',
        rcNumber: '',
        district: defaultDistrict,
        mandal: defaultVillage,
        whereabouts: '',
        priceHour: '900',
        priceAcre: '1800',
        implements: ['Ploughing', 'Rotavator'],
        photo: ''
      });
      setPhotoPreview('');
      setPhotoFile(null);
    }
    setErrorMessage('');
    setSuccessInfo(null);
  }, [isOpen, initialData, defaultDistrict, defaultVillage]);

  if (!isOpen) return null;

  const handleImplementToggle = (id) => {
    setFormData(prev => {
      const exists = prev.implements.includes(id);
      const next = exists ? prev.implements.filter(x => x !== id) : [...prev.implements, id];
      return { ...prev, implements: next };
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image format
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMessage(
        isTe
          ? 'దయచేసి సరైన ఫోటో ఫార్మాట్ ఎంచుకోండి (JPG, JPEG, PNG, లేదా WEBP).'
          : 'Please select a valid image format (JPG, JPEG, PNG, or WEBP).'
      );
      return;
    }

    setPhotoFile(file);
    const localUrl = URL.createObjectURL(file);
    setPhotoPreview(localUrl);
    setErrorMessage('');

    // Upload to server immediately to get persistent URL
    setIsUploadingPhoto(true);
    try {
      const uploadRes = await apiUploadImage(file);
      if (uploadRes && uploadRes.success && (uploadRes.path || uploadRes.url)) {
        const storedPath = uploadRes.path || uploadRes.url;
        setFormData(prev => ({ ...prev, photo: storedPath }));
      } else {
        throw new Error('Image upload failed');
      }
    } catch (err) {
      console.warn('Image upload failed, fallback to local preview:', err);
      // Keep local URL as temporary fallback
      setFormData(prev => ({ ...prev, photo: localUrl }));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    setFormData(prev => ({ ...prev, photo: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const resolvedBrand = formData.brand === 'Other' ? formData.customBrand.trim() : formData.brand.trim();
    if (!resolvedBrand) {
      setErrorMessage(isTe ? 'దయచేసి ట్రాక్టర్ బ్రాండ్ నమోదు చేయండి.' : 'Please select or enter Tractor Brand Name.');
      return;
    }

    if (!formData.model.trim()) {
      setErrorMessage(isTe ? 'దయచేసి ఖచ్చితమైన మోడల్ పేరు నమోదు చేయండి.' : 'Please enter Exact Tractor Model Name.');
      return;
    }

    if (!formData.hp || Number(formData.hp) <= 0) {
      setErrorMessage(isTe ? 'దయచేసి హార్స్‌పవర్ (HP) నమోదు చేయండి.' : 'Please enter valid Horsepower (HP).');
      return;
    }

    if (!formData.whereabouts.trim()) {
      setErrorMessage(isTe ? 'దయచేసి ట్రాక్టర్ నిలిపి ఉంచే ప్రదేశం (Whereabouts) నమోదు చేయండి.' : 'Please enter Stationed Whereabouts location.');
      return;
    }

    if (!formData.priceHour || Number(formData.priceHour) <= 0) {
      setErrorMessage(isTe ? 'దయచేసి గంట అద్దె ధర నమోదు చేయండి.' : 'Please enter valid Price per Hour.');
      return;
    }

    // MANDATORY ACTUAL PHOTOGRAPH CHECK
    if (!formData.photo && !photoPreview) {
      setErrorMessage(
        isTe
          ? '⚠️ అసలు ట్రాక్టర్ ఫోటో అప్‌లోడ్ చేయడం తప్పనిసరి! దయచేసి మీ మొబైల్ లేదా కంప్యూటర్ నుండి అసలు ఫోటో అప్‌లోడ్ చేయండి.'
          : '⚠️ Actual Tractor Photograph upload is mandatory! Please upload genuine tractor photo before submitting for verification.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanMobile = String(ownerMobile || '9876543210').replace(/\D/g, '');
      const tractorPayload = {
        brand: resolvedBrand,
        model: formData.model.trim(),
        hp: `${formData.hp} HP`,
        year: formData.year || '2023',
        rcNumber: (formData.rcNumber || '').toUpperCase().trim(),
        district: formData.district || defaultDistrict,
        mandal: formData.mandal || defaultVillage,
        village: formData.mandal || defaultVillage,
        whereabouts: formData.whereabouts.trim(),
        priceHour: Number(formData.priceHour) || 900,
        priceAcre: Number(formData.priceAcre) || 1800,
        implements: formData.implements,
        photo: formData.photo || photoPreview,
        ownerName: ownerName || 'Vehicle Owner',
        ownerMobile: cleanMobile
      };

      let result;
      if (initialData?.id) {
        // Resubmission of existing tractor
        result = await apiResubmitCustomTractor(initialData.id, tractorPayload);
      } else {
        // New custom tractor registration
        result = await apiSubmitCustomTractor(tractorPayload);
      }

      if (result && (result.success || result.tractor || result.id)) {
        const savedTractor = result.tractor || result;
        const listingId = result.listingId || `TRAC-CUSTOM-${savedTractor.id || Date.now()}`;
        
        // Also persist locally in agri_custom_tractors for instant dashboard reactivity
        try {
          const existing = JSON.parse(localStorage.getItem('agri_custom_tractors') || '[]');
          const updatedList = [
            savedTractor,
            ...existing.filter(t => t.id !== savedTractor.id)
          ];
          localStorage.setItem('agri_custom_tractors', JSON.stringify(updatedList));
        } catch (e) {
          console.warn(e);
        }

        if (onTractorSubmitted) {
          onTractorSubmitted(savedTractor);
        }

        setSuccessInfo({
          listingId,
          tractor: savedTractor,
          brand: resolvedBrand,
          model: formData.model.trim()
        });
      } else {
        throw new Error(result?.error || 'Failed to submit tractor for verification');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Submission failed. Please check details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !successInfo) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>🚜</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#166534' }}>
                {initialData ? (isTe ? 'కస్టమ్ ట్రాక్టర్ వివరాలు సవరణ' : 'Edit & Resubmit Custom Tractor') : (isTe ? 'ఇతర ట్రాక్టర్ మోడల్ రిజిస్ట్రేషన్' : 'Other Tractor Model Registration')}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                {isTe ? 'అసలు ఫోటో అప్‌లోడ్ చేసి అడ్మిన్ ధృవీకరణ కోసం సమర్పించండి' : 'Enter tractor specifications & upload real photo for Admin Verification'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '22px',
              color: '#64748b',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '6px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px' }}>
          {/* SUCCESS CONFIRMATION MODAL STATE */}
          {successInfo ? (
            <div style={{ textAlign: 'center', padding: '16px 8px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  margin: '0 auto 16px auto',
                  border: '2px solid #bbf7d0'
                }}
              >
                ✓
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#166534', marginBottom: '8px' }}>
                {isTe ? 'ధృవీకరణ కోసం సమర్పించబడింది!' : 'Submitted for Verification Successfully!'}
              </h3>
              <p style={{ fontSize: '14px', color: '#334155', maxWidth: '480px', margin: '0 auto 18px auto', lineHeight: 1.5 }}>
                {isTe
                  ? `మీ ట్రాక్టర్ (${successInfo.brand} ${successInfo.model}) అడ్మినిస్ట్రేటర్ ధృవీకరణ కోసం సమర్పించబడింది.`
                  : `Your tractor (${successInfo.brand} ${successInfo.model}) has been received for Administrator Verification.`}
              </p>

              {/* Status & ID Badge */}
              <div
                style={{
                  background: '#fefce8',
                  border: '1px solid #fef08a',
                  borderRadius: '12px',
                  padding: '16px',
                  maxWidth: '440px',
                  margin: '0 auto 20px auto',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#713f12', fontWeight: 600 }}>
                    {isTe ? 'ట్రాక్టర్ లిస్టింగ్ ID:' : 'Unique Listing ID:'}
                  </span>
                  <strong style={{ fontSize: '13.5px', color: '#854d0e', fontFamily: 'monospace' }}>
                    {successInfo.listingId}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#713f12', fontWeight: 600 }}>
                    {isTe ? 'ధృవీకరణ స్థితి:' : 'Verification Status:'}
                  </span>
                  <span
                    style={{
                      background: '#fef08a',
                      color: '#854d0e',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    ⏳ {isTe ? 'పరిశీలనలో ఉంది' : 'Pending Verification'}
                  </span>
                </div>
              </div>

              {/* Explanation Notice */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  maxWidth: '440px',
                  margin: '0 auto 24px auto',
                  fontSize: '12.5px',
                  color: '#475569',
                  textAlign: 'left',
                  lineHeight: 1.45
                }}
              >
                ℹ️ <strong>{isTe ? 'గమనిక:' : 'Notice:'}</strong> {isTe
                  ? 'అడ్మినిస్ట్రేటర్ ఆమోదించే వరకు ఈ ట్రాక్టర్ కస్టమర్ల బుకింగ్ మార్కెట్‌ప్లేస్‌లో కనిపించదు. ఆమోదం లేదా తిరస్కరణ వివరాలు మీ ఓనర్ డాష్‌బోర్డ్‌లో కనిపిస్తాయి.'
                  : 'This tractor will NOT appear in the customer fleet until approved by the administrator. Once approved, it will automatically go live. You can track status in your Owner Dashboard under "My Tractor Listings".'}
              </div>

              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 28px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {isTe ? 'పూర్తయింది (డాష్‌బోర్డ్‌కి వెళ్లండి)' : 'Done (Go to Dashboard)'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {errorMessage && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* Grid 1: Brand & Model */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    1. {isTe ? 'ట్రాక్టర్ బ్రాండ్ పేరు *' : 'Tractor Brand Name *'}
                  </label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      fontWeight: 600
                    }}
                  >
                    {brandList.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  {formData.brand === 'Other' && (
                    <input
                      type="text"
                      placeholder={isTe ? 'బ్రాండ్ పేరు రాయండి' : 'Enter custom brand'}
                      value={formData.customBrand}
                      onChange={(e) => setFormData(prev => ({ ...prev, customBrand: e.target.value }))}
                      style={{
                        width: '100%',
                        marginTop: '6px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px'
                      }}
                    />
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    2. {isTe ? 'ఖచ్చితమైన మోడల్ పేరు *' : 'Exact Tractor Model Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 744 FE High Torque / 575 DI"
                    value={formData.model}
                    onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      fontWeight: 600
                    }}
                  />
                </div>
              </div>

              {/* Grid 2: HP, Manufacturing Year, RC Number */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    3. {isTe ? 'హార్స్‌పవర్ (HP) *' : 'Horsepower (HP) *'}
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="48"
                    value={formData.hp}
                    onChange={(e) => setFormData(prev => ({ ...prev, hp: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      textAlign: 'center'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    4. {isTe ? 'తయారీ సంవత్సరం' : 'Manufacturing Year'}
                  </label>
                  <input
                    type="number"
                    placeholder="2023"
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      textAlign: 'center'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    5. {isTe ? 'వాహన RC నంబర్' : 'RC Reg. Number'}
                  </label>
                  <input
                    type="text"
                    placeholder="TS 03 AB 4589"
                    value={formData.rcNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, rcNumber: e.target.value.toUpperCase() }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}
                  />
                </div>
              </div>

              {/* Grid 3: District, Mandal, Whereabouts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    6. {isTe ? 'జిల్లా *' : 'District *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.district}
                    onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    7. {isTe ? 'మండలం / బేస్ లొకేషన్ *' : 'Mandal / Base Location *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.mandal}
                    onChange={(e) => setFormData(prev => ({ ...prev, mandal: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  8. {isTe ? 'నిలిపి ఉంచే స్థలం (Stationed Whereabouts) *' : 'Stationed Whereabouts *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hasanparthy Rythu Vedika & Market Yard"
                  value={formData.whereabouts}
                  onChange={(e) => setFormData(prev => ({ ...prev, whereabouts: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px'
                  }}
                />
              </div>

              {/* Grid 4: Price per Hour, Price per Acre */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    9. {isTe ? 'గంట అద్దె ధర (₹/Hour) *' : 'Price per Hour (₹) *'}
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="900"
                    value={formData.priceHour}
                    onChange={(e) => setFormData(prev => ({ ...prev, priceHour: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      fontWeight: 700
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    10. {isTe ? 'ఎకరానికి ధర (₹/Acre)' : 'Price per Acre (₹)'}
                  </label>
                  <input
                    type="number"
                    placeholder="1800"
                    value={formData.priceAcre}
                    onChange={(e) => setFormData(prev => ({ ...prev, priceAcre: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      fontWeight: 700
                    }}
                  />
                </div>
              </div>

              {/* Grid 5: Implements (Multi-select) */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  11. {isTe ? 'అనుసంధానించబడిన పరికరాలు & సేవలు' : 'Available Implements & Services'}
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {implementOptions.map(imp => {
                    const isSelected = formData.implements.includes(imp.id);
                    return (
                      <button
                        key={imp.id}
                        type="button"
                        onClick={() => handleImplementToggle(imp.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          border: isSelected ? '1px solid #16a34a' : '1px solid #cbd5e1',
                          background: isSelected ? '#dcfce7' : '#f8fafc',
                          color: isSelected ? '#166534' : '#334155'
                        }}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {imp.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid 6: MANDATORY ACTUAL TRACTOR PHOTOGRAPH UPLOAD */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '2px dashed #94a3b8',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                    12. 📷 {isTe ? 'అసలు ట్రాక్టర్ ఫోటో అప్‌లోడ్ (తప్పనిసరి) *' : 'Actual Tractor Photograph Upload (Mandatory) *'}
                  </label>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      style={{
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: '1px solid #fca5a5',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ✕ {isTe ? 'తొలగించు' : 'Remove'}
                    </button>
                  )}
                </div>

                {photoPreview ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                      <img
                        src={photoPreview}
                        alt="Tractor Preview"
                        style={{
                          width: '160px',
                          height: '110px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '2px solid #16a34a',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                        }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          right: '6px',
                          background: '#16a34a',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        ✓ {isTe ? 'అసలు ఫోటో' : 'Genuine Photo'}
                      </span>
                    </div>

                    <div style={{ textAlign: 'left' }}>
                      <label
                        style={{
                          display: 'inline-block',
                          background: '#e2e8f0',
                          color: '#334155',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: isUploadingPhoto ? 'wait' : 'pointer'
                        }}
                      >
                        🔄 {isUploadingPhoto ? (isTe ? 'అప్‌లోడ్ అవుతోంది...' : 'Uploading...') : (isTe ? 'ఫోటో మార్చండి' : 'Replace Photo')}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          onChange={handleFileChange}
                          disabled={isUploadingPhoto}
                          style={{ display: 'none' }}
                        />
                      </label>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                        {isTe ? 'ఫార్మాట్లు: JPG, JPEG, PNG, WEBP' : 'Formats: JPG, JPEG, PNG, WEBP'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label
                      style={{
                        display: 'inline-flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: isUploadingPhoto ? 'wait' : 'pointer',
                        padding: '16px 20px',
                        borderRadius: '8px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1'
                      }}
                    >
                      <span style={{ fontSize: '32px' }}>📷</span>
                      <strong style={{ fontSize: '13px', color: '#166534' }}>
                        {isUploadingPhoto
                          ? (isTe ? 'ఫోటో అప్‌లోడ్ అవుతోంది...' : 'Uploading photo to server...')
                          : (isTe ? 'గ్యాలరీ లేదా కంప్యూటర్ నుండి అసలు ఫోటో ఎంచుకోండి' : 'Choose Actual Photo from Mobile Gallery / Computer')}
                      </strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {isTe ? 'JPG, JPEG, PNG, WEBP ఫైల్స్ ఆమోదించబడతాయి' : 'JPG, JPEG, PNG, WEBP files accepted (10MB max)'}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleFileChange}
                        disabled={isUploadingPhoto}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {isTe ? 'రద్దు చేయి' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingPhoto}
                  style={{
                    background: isSubmitting ? '#94a3b8' : '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 24px',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: isSubmitting ? 'wait' : 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>
                    {isSubmitting
                      ? (isTe ? 'సమర్పిస్తోంది...' : 'Submitting...')
                      : (isTe ? '🛡️ ట్రాక్టర్ ధృవీకరణ కోసం సమర్పించండి →' : '🛡️ Submit Tractor for Verification →')}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

