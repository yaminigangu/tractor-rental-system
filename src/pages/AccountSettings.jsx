import { useState } from 'react';
import { apiChangePassword, apiDeleteAccount } from '../api/apiClient';

export default function AccountSettings({
  language = 'en',
  currentFarmer,
  currentOwner,
  isAdminLoggedIn,
  onFarmerLogout,
  onOwnerLogout,
  onAdminLogout,
  onFarmerDeleteAccount,
  onOwnerDeleteAccount,
  setActivePage,
  onGoBack
}) {
  const isTe = language === 'te';

  // Role detection
  const userRole = currentFarmer ? 'FARMER' : currentOwner ? 'VEHICLE_OWNER' : isAdminLoggedIn ? 'ADMIN' : 'FARMER';
  const userName = currentFarmer?.name || currentOwner?.fullName || currentOwner?.owner || (isAdminLoggedIn ? 'Administrator' : 'User');
  const userIdentifier = currentFarmer?.mobile || currentOwner?.mobile || (isAdminLoggedIn ? 'admin@agrirent.telangana.gov.in' : '');

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Password submission handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError(isTe ? 'దయచేసి ప్రస్తుత పాస్‌వర్డ్‌ను నమోదు చేయండి' : 'Current password is required.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordError(isTe ? 'కొత్త పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి' : 'New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(isTe ? 'కొత్త పాస్‌వర్డ్ మరియు నిర్ధారణ సరిపోలలేదు' : 'New password and confirmation do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await apiChangePassword({
        currentPassword,
        newPassword,
        confirmPassword,
        role: userRole,
        mobile: currentFarmer?.mobile || currentOwner?.mobile,
        email: currentFarmer?.email || currentOwner?.email || (isAdminLoggedIn ? 'admin@agrirent.telangana.gov.in' : '')
      });

      if (res && res.success) {
        setPasswordSuccess(res.message || (isTe ? 'పాస్‌వర్డ్ విజయవంతంగా మార్చబడింది!' : 'Password updated successfully!'));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 6000);
      } else {
        setPasswordError(res?.error || (isTe ? 'ప్రస్తుత పాస్‌వర్డ్ తప్పు లేదా మార్చడం విఫలమైంది' : 'Incorrect current password or update failed.'));
      }
    } catch (err) {
      console.warn('Password change error:', err);
      setPasswordError(isTe ? 'సర్వర్ కనెక్షన్ లోపం.' : 'Network error updating password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Secure Logout with Confirmation Dialog
  const handleSecureLogout = () => {
    const confirmLogout = window.confirm(
      isTe
        ? 'మీరు మీ ఖాతా నుండి సురక్షితంగా లాగ్‌అవుట్ కావాలనుకుంటున్నారా?'
        : 'Are you sure you want to securely log out of your session?'
    );

    if (confirmLogout) {
      if (currentFarmer && onFarmerLogout) onFarmerLogout();
      else if (currentOwner && onOwnerLogout) onOwnerLogout();
      else if (isAdminLoggedIn && onAdminLogout) onAdminLogout();
    }
  };

  // Safe Account Deletion Confirmation
  const handleDeleteAccountConfirm = async () => {
    const confirmDelete = window.confirm(
      isTe
        ? `హెచ్చరిక: మీ ఖాతాను (${userName}) శాశ్వతంగా తొలగించాలనుకుంటున్నారా?\n\nఈ చర్యను తిరిగి మార్చలేము. మీ ప్రొఫైల్ మరియు ఆధారాలు శాశ్వతంగా తొలగించబడతాయి.`
        : `Warning: Are you sure you want to permanently delete your account (${userName})?\n\nThis action cannot be undone. All your registered records and session data will be permanently deleted.`
    );

    if (!confirmDelete) return;

    try {
      await apiDeleteAccount({
        role: userRole,
        mobile: currentFarmer?.mobile || currentOwner?.mobile,
        email: currentFarmer?.email || currentOwner?.email
      });
    } catch (e) {
      console.warn('Backend delete notification:', e);
    }

    if (currentFarmer && onFarmerDeleteAccount) onFarmerDeleteAccount();
    else if (currentOwner && onOwnerDeleteAccount) onOwnerDeleteAccount();
  };

  return (
    <div className="page-anim" style={{ maxWidth: '850px', margin: '0 auto', padding: '10px 0 40px 0' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
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
            ⚙️ {isTe ? 'ఖాతా సెట్టింగ్‌లు' : 'Account Settings'}
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            {isTe ? 'భద్రత, లాగిన్ సెషన్ మరియు ఖాతా నిర్వహణ ప్రాధాన్యతలు' : 'Security credentials, active session status, and account safety'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 1. SECURITY SETTINGS (CHANGE PASSWORD) */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '28px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '22px' }}>🔒</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                {isTe ? 'భద్రతా సెట్టింగ్‌లు — పాస్‌వర్డ్ మార్చండి' : 'Security Settings — Change Password'}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                {isTe ? 'మీ ఖాతా భద్రత కోసం బలమైన పాస్‌వర్డ్‌ను ఉపయోగించండి (కనీసం 6 అక్షరాలు)' : 'Use a strong, unique password with at least 6 characters to protect your account'}
              </p>
            </div>
          </div>

          {passwordSuccess && (
            <div className="alert-box success" style={{ marginBottom: '18px' }}>
              ✅ {passwordSuccess}
            </div>
          )}

          {passwordError && (
            <div className="alert-box error" style={{ marginBottom: '18px' }}>
              ⚠️ {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  {isTe ? 'ప్రస్తుత పాస్‌వర్డ్ *' : 'Current Password *'}
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  {isTe ? 'కొత్త పాస్‌వర్డ్ *' : 'New Password *'}
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="•••••••• (Min 6 chars)"
                  required
                  minLength={6}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  {isTe ? 'కొత్త పాస్‌వర్డ్ నిర్ధారించండి *' : 'Confirm New Password *'}
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isChangingPassword}
                style={{ padding: '10px 24px', fontSize: '13.5px', fontWeight: 800 }}
              >
                {isChangingPassword ? (isTe ? 'నవీకరిస్తోంది...' : 'Saving Password...') : (isTe ? 'పాస్‌వర్డ్ భద్రపరచండి' : 'Save Password')}
              </button>
            </div>
          </form>
        </div>

        {/* 2. ACTIVE SESSION SETTINGS */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '28px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '22px' }}>🖥️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                {isTe ? 'ప్రస్తుత సెషన్ స్థితి' : 'Active Session Settings'}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                {isTe ? 'మీ ప్రస్తుత ప్రమాణీకరించబడిన లాగిన్ స్థితి' : 'Your live authenticated device session on AgriRent'}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '22px' }}>
            <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
              <small style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, marginBottom: '4px' }}>
                {isTe ? 'లాగిన్ అయిన ఖాతా' : 'Logged-In Account'}
              </small>
              <strong style={{ fontSize: '14.5px', color: '#0f172a' }}>{userName}</strong>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{userIdentifier}</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
              <small style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, marginBottom: '4px' }}>
                {isTe ? 'ఖాతా హోదా' : 'Account Role'}
              </small>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#dcfce7', color: '#15803d', padding: '2px 9px', borderRadius: '10px', fontSize: '12px', fontWeight: 800 }}>
                <span>●</span> {userRole}
              </div>
              <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px', fontWeight: 700 }}>
                ✓ {isTe ? 'ధృవీకరించబడిన సెషన్' : 'Verified & Active'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSecureLogout}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 20px', fontSize: '13.5px', fontWeight: 700 }}
            >
              🚪 {isTe ? 'సురక్షితంగా లాగ్‌అవుట్ అవ్వండి' : 'Log Out from this Device'}
            </button>
          </div>
        </div>

        {/* 3. ACCOUNT MANAGEMENT (DANGER ZONE) */}
        {userRole !== 'ADMIN' && (
          <div style={{ background: '#fff5f5', borderRadius: '16px', border: '1.5px solid #fecaca', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '22px' }}>🗑️</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#b91c1c' }}>
                  {isTe ? 'ఖాతా నిర్వహణ — డేంజర్ జోన్' : 'Account Management — Danger Zone'}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#7f1d1d' }}>
                  {isTe
                    ? 'మీ ఖాతాను శాశ్వతంగా తొలగిస్తే మీ సమాచారం పూర్తిగా తొలగించబడుతుంది.'
                    : 'Permanently delete your account, saved machinery listings and verified credentials.'}
                </p>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#991b1b', lineHeight: 1.5, marginBottom: '18px' }}>
              {isTe
                ? 'ఖాతా తొలగింపు చర్యను వెనక్కి తీసుకోలేము. మీరు మళ్ళీ సేవలను ఉపయోగించాలనుకుంటే కొత్తగా నమోదు చేసుకోవాల్సి ఉంటుంది.'
                : 'Deleting your account is permanent. All pending or completed booking history, KYC data, and machinery registrations will be removed.'}
            </p>

            <button
              type="button"
              onClick={handleDeleteAccountConfirm}
              style={{
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 22px',
                fontSize: '13.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)'
              }}
            >
              🗑️ {isTe ? 'నా ఖాతాను శాశ్వతంగా తొలగించండి' : 'Permanently Delete My Account'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

