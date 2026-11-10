import { useState, useEffect } from 'react';
import { apiGetProfile, apiUpdateProfile } from '../api/apiClient';

export default function UserProfile({
  language = 'en',
  currentFarmer,
  setCurrentFarmer,
  currentOwner,
  setCurrentOwner,
  isAdminLoggedIn,
  setActivePage,
  onGoBack
}) {
  const isTe = language === 'te';

  // Determine active role
  const userRole = currentFarmer ? 'FARMER' : currentOwner ? 'VEHICLE_OWNER' : isAdminLoggedIn ? 'ADMIN' : null;

  // Active user reference
  const currentUser = currentFarmer || currentOwner || (isAdminLoggedIn ? { role: 'ADMIN', name: 'Administrator', email: 'admin@agrirent.telangana.gov.in' } : null);

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Editable Form fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    district: '',
    mandal: '',
    address: '',
    profilePhoto: ''
  });

  // Fetch actual user profile from database
  const loadProfile = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const params = {};
      if (userRole) params.role = userRole;
      if (currentFarmer?.mobile) params.mobile = currentFarmer.mobile;
      else if (currentOwner?.mobile) params.mobile = currentOwner.mobile;

      const res = await apiGetProfile(params);
      if (res && res.success && res.profile) {
        setProfile(res.profile);
        setFormData({
          name: res.profile.name || '',
          email: res.profile.email || '',
          mobile: res.profile.mobile || '',
          district: res.profile.district || '',
          mandal: res.profile.mandal || '',
          address: res.profile.address || '',
          profilePhoto: res.profile.profilePhoto || ''
        });
      } else {
        // Fallback to currently authenticated in-memory/localStorage user object
        const fallback = {
          name: currentFarmer?.name || currentOwner?.fullName || currentOwner?.owner || (isAdminLoggedIn ? 'Administrator' : 'User'),
          email: currentFarmer?.email || currentOwner?.email || (isAdminLoggedIn ? 'admin@agrirent.telangana.gov.in' : ''),
          mobile: currentFarmer?.mobile || currentOwner?.mobile || '',
          role: userRole || 'FARMER',
          district: currentFarmer?.district || currentOwner?.district || 'Hanumakonda',
          mandal: currentFarmer?.village || currentOwner?.village || 'Hasanparthy',
          address: currentFarmer?.village || currentOwner?.village || '',
          profilePhoto: null,
          registrationDate: new Date().toISOString()
        };
        setProfile(fallback);
        setFormData({
          name: fallback.name,
          email: fallback.email,
          mobile: fallback.mobile,
          district: fallback.district,
          mandal: fallback.mandal,
          address: fallback.address,
          profilePhoto: ''
        });
      }
    } catch (err) {
      console.warn('Error loading user profile:', err);
      setErrorMessage(isTe ? 'ప్రొఫైల్ వివరాలు లోడ్ చేయడంలో విఫలమైంది' : 'Failed to fetch actual profile from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [currentFarmer, currentOwner, isAdminLoggedIn]);

  // Handle Photo Upload (Convert to Base64 data URL)
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(isTe ? 'దయచేసి సరైన ఫోటో ఫైల్ (JPG, PNG) ఎంచుకోండి' : 'Please select a valid image file (JPG, PNG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(isTe ? 'ఫోటో పరిమాణం 5MB కంటే తక్కువగా ఉండాలి' : 'Photo size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setFormData(prev => ({ ...prev, profilePhoto: uploadEvent.target.result }));
    };
    reader.readAsDataURL(file);
  };

  // Handle Save Profile Changes
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setErrorMessage(isTe ? 'పేరు కనీసం 2 అక్షరాలు ఉండాలి' : 'Full Name must be at least 2 characters long.');
      return;
    }

    const cleanMobile = formData.mobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      setErrorMessage(isTe ? 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్‌ను నమోదు చేయండి' : 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile: cleanMobile,
        district: formData.district.trim(),
        mandal: formData.mandal.trim(),
        address: formData.address.trim(),
        profilePhoto: formData.profilePhoto || null,
        role: userRole
      };

      const res = await apiUpdateProfile(payload);
      if (res && res.success) {
        setSuccessMessage(isTe ? 'ప్రొఫైల్ విజయవంతంగా నవీకరించబడింది!' : 'Profile updated successfully!');
        setIsEditing(false);

        // Update local state and sync storage
        setProfile(prev => ({
          ...prev,
          name: payload.name,
          email: payload.email,
          mobile: payload.mobile,
          district: payload.district,
          mandal: payload.mandal,
          address: payload.address,
          profilePhoto: payload.profilePhoto || prev?.profilePhoto
        }));

        if (userRole === 'FARMER' && setCurrentFarmer) {
          const updated = {
            ...currentFarmer,
            name: payload.name,
            email: payload.email,
            mobile: payload.mobile,
            village: payload.address || payload.mandal,
            district: payload.district,
            mandal: payload.mandal,
            profilePhoto: payload.profilePhoto
          };
          setCurrentFarmer(updated);
          localStorage.setItem('agri_current_farmer', JSON.stringify(updated));
        } else if (userRole === 'VEHICLE_OWNER' && setCurrentOwner) {
          const updated = {
            ...currentOwner,
            fullName: payload.name,
            owner: payload.name,
            email: payload.email,
            mobile: payload.mobile,
            village: payload.address || payload.mandal,
            district: payload.district,
            mandal: payload.mandal,
            profilePhoto: payload.profilePhoto
          };
          setCurrentOwner(updated);
          localStorage.setItem('agri_current_owner', JSON.stringify(updated));
        }

        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrorMessage(res?.error || (isTe ? 'నవీకరణ విఫలమైంది. మళ్ళీ ప్రయత్నించండి.' : 'Failed to update profile. Please try again.'));
      }
    } catch (err) {
      console.warn('Failed to update profile:', err);
      setErrorMessage(isTe ? 'సర్వర్ కనెక్షన్ లోపం.' : 'Network error updating profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return { label: isTe ? 'అడ్మినిస్ట్రేటర్' : 'System Administrator', icon: '🛡️', color: '#0369a1', bg: '#e0f2fe' };
      case 'VEHICLE_OWNER':
        return { label: isTe ? 'వాహన యజమాని' : 'Vehicle Owner', icon: '🚜', color: '#15803d', bg: '#dcfce7' };
      default:
        return { label: isTe ? 'రైతు' : 'Farmer', icon: '👨‍🌾', color: '#166534', bg: '#f0fdf4' };
    }
  };

  const roleMeta = getRoleBadge(userRole);

  const formattedDate = profile?.registrationDate
    ? new Date(profile.registrationDate).toLocaleDateString(isTe ? 'te-IN' : 'en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : (isTe ? 'ఇటీవల' : 'Recent Member');

  return (
    <div className="page-anim" style={{ maxWidth: '850px', margin: '0 auto', padding: '10px 0 40px 0' }}>
      {/* Top Header Row with Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="header-back-btn"
            onClick={onGoBack || (() => setActivePage(userRole === 'VEHICLE_OWNER' ? 'owner-inbox' : 'find-tractor'))}
            title={isTe ? 'వెనుకకు' : 'Go Back'}
            style={{ padding: '6px 12px', fontSize: '13px', fontWeight: '700' }}
          >
            ← {isTe ? 'వెనుకకు' : 'Back'}
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
              👤 {isTe ? 'నా ప్రొఫైల్ వివరాలు' : 'My Profile Details'}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              {isTe ? 'మీ వ్యక్తిగత మరియు ఖాతా సమాచారం' : 'Manage your official identity and verified regional contact details'}
            </p>
          </div>
        </div>

        {!isEditing && !isLoading && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsEditing(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 18px', fontSize: '13.5px' }}
          >
            ✏️ {isTe ? 'ప్రొఫైల్ సవరించండి' : 'Edit Profile'}
          </button>
        )}
      </div>

      {/* Success / Error Banners */}
      {successMessage && (
        <div className="alert-box success" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>✅</span>
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="alert-box error" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>⏳</div>
          <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>
            {isTe ? 'డేటాబేస్ నుండి ప్రొఫైల్ వివరాలను లోడ్ చేస్తోంది...' : 'Loading verified profile details from database...'}
          </p>
        </div>
      ) : isEditing ? (
        /* EDIT PROFILE FORM */
        <form onSubmit={handleSaveChanges} style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '28px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px', flexWrap: 'wrap' }}>
            {/* Avatar / Photo Upload */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                background: formData.profilePhoto ? `url(${formData.profilePhoto}) center/cover no-repeat` : roleMeta.bg,
                border: '2.5px solid #86efac',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                overflow: 'hidden'
              }}>
                {!formData.profilePhoto && roleMeta.icon}
              </div>
              <label
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  background: '#16a34a',
                  color: 'white',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  fontSize: '14px'
                }}
                title={isTe ? 'ఫోటో మార్చండి' : 'Change Photo'}
              >
                📷
                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              </label>
            </div>

            <div>
              <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                {isTe ? 'ప్రొఫైల్ ఫోటో మరియు వివరాలను నవీకరించండి' : 'Update Profile Photo & Contact Details'}
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                {isTe ? 'JPG లేదా PNG ఫార్మాట్ (గరిష్టంగా 5MB)' : 'JPG, PNG or WEBP (Max 5MB)'}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
            <div className="form-group">
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                {isTe ? 'పూర్తి పేరు *' : 'Full Name *'}
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                {isTe ? 'మొబైల్ నంబర్ *' : 'Mobile Number *'}
              </label>
              <input
                type="tel"
                className="input-field"
                value={formData.mobile}
                onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                required
                maxLength={10}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                {isTe ? 'ఇమెయిల్ చిరునామా' : 'Email Address'}
              </label>
              <input
                type="email"
                className="input-field"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="name@example.com"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                {isTe ? 'జిల్లా *' : 'District *'}
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.district}
                onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                {isTe ? 'మండలం *' : 'Mandal / Base Location *'}
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.mandal}
                onChange={(e) => setFormData(prev => ({ ...prev, mandal: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                {isTe ? 'నమోదిత చిరునామా / గ్రామం' : 'Registered Address / Village'}
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="e.g. Near GP Office, Hasanparthy"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '28px', paddingTop: '18px', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsEditing(false);
                setErrorMessage('');
              }}
              disabled={isSaving}
              style={{ padding: '10px 22px', fontSize: '14px' }}
            >
              {isTe ? 'రద్దు చేయండి' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
              style={{ padding: '10px 28px', fontSize: '14px', fontWeight: 800 }}
            >
              {isSaving ? (isTe ? 'భద్రపరుస్తోంది...' : 'Saving Changes...') : (isTe ? 'మార్పులను భద్రపరచండి' : 'Save Changes')}
            </button>
          </div>
        </form>
      ) : (
        /* VIEW PROFILE DETAILS */
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          {/* User Hero Banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '22px', paddingBottom: '24px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
            <div style={{
              width: '88px',
              height: '88px',
              borderRadius: '50%',
              background: profile?.profilePhoto ? `url(${profile.profilePhoto}) center/cover no-repeat` : roleMeta.bg,
              border: '2.5px solid #86efac',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '42px',
              flexShrink: 0
            }}>
              {!profile?.profilePhoto && roleMeta.icon}
            </div>

            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                  {profile?.name}
                </h3>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: roleMeta.bg,
                  color: roleMeta.color,
                  fontSize: '11.5px',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '12px'
                }}>
                  <span>●</span> {roleMeta.label}
                </span>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                📅 {isTe ? 'నమోదు తేదీ' : 'Registered'}: <strong>{formattedDate}</strong>
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '22px', marginTop: '24px' }}>
            <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <small style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.4px', marginBottom: '4px' }}>
                📱 {isTe ? 'మొబైల్ నంబర్' : 'Mobile Number'}
              </small>
              <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                +91 {profile?.mobile || 'N/A'}
              </strong>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <small style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.4px', marginBottom: '4px' }}>
                📧 {isTe ? 'ఇమెయిల్ చిరునామా' : 'Email Address'}
              </small>
              <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                {profile?.email || (isTe ? 'జోడించబడలేదు' : 'Not Provided')}
              </strong>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <small style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.4px', marginBottom: '4px' }}>
                🏛️ {isTe ? 'జిల్లా' : 'District'}
              </small>
              <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                {profile?.district || 'Hanumakonda'}
              </strong>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <small style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.4px', marginBottom: '4px' }}>
                📍 {isTe ? 'మండలం' : 'Mandal / Base Location'}
              </small>
              <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                {profile?.mandal || 'Hasanparthy'}
              </strong>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <small style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.4px', marginBottom: '4px' }}>
                🏡 {isTe ? 'నమోదిత చిరునామా' : 'Registered Address'}
              </small>
              <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                {profile?.address || profile?.mandal || 'Telangana'}
              </strong>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <small style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.4px', marginBottom: '4px' }}>
                🛡️ {isTe ? 'ఖాతా స్థితి' : 'Account Status'}
              </small>
              <strong style={{ fontSize: '15px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>✓</span> {isTe ? 'ధృవీకరించబడిన ఖాతా' : 'Active & Verified'}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
