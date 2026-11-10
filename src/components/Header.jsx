import { useState, useEffect, useRef } from 'react';
import { translations } from '../translations';
import { apiGetNotifications, apiMarkNotificationRead, apiMarkAllNotificationsRead } from '../api/apiClient';

export default function Header({
  activePage,
  setActivePage,
  onGoBack,
  toggleMobileMenu,
  activeRole,
  setActiveRole,
  language = 'en',
  setLanguage,
  isAdminLoggedIn,
  onAdminLogout,
  selectedLocation,
  onOpenLocationPicker,
  currentFarmer,
  onOpenFarmerProfile,
  onFarmerLogout,
  onFarmerDeleteAccount,
  currentOwner,
  onOwnerLogout,
  onOwnerDeleteAccount,
  isInstalled = false,
  onInstallApp
}) {
  const t = translations[language] || translations.en;
  const isTe = language === 'te';

  // In-App Notification System
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await apiGetNotifications(20);
      if (res && res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch {
      // offline / quiet fallback
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [currentFarmer, currentOwner]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkOneRead = async (notif) => {
    if (!notif.isRead) {
      await apiMarkNotificationRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllRead = async () => {
    await apiMarkAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const getTranslatedNotification = (notif, isTelugu) => {
    if (!notif) return { title: '', message: '' };
    if (!isTelugu) {
      return {
        title: notif.title || 'Notification',
        message: notif.message || ''
      };
    }

    const titleStr = notif.title || '';
    const msgStr = notif.message || '';
    const codeMatch = (titleStr + ' ' + msgStr).match(/TRC\d+|#\d+/i);
    const code = codeMatch ? codeMatch[0] : '';

    const modelMatch = msgStr.match(/booking for ([^on]+) on/i) || msgStr.match(/for ([^on]+) on/i);
    const tractorName = modelMatch ? modelMatch[1].trim() : '';

    const dateMatch = msgStr.match(/\d{4}-\d{2}-\d{2}/);
    const slotMatch = msgStr.match(/\[([^\]]+)\]/);
    const dateStr = dateMatch ? dateMatch[0] : '';
    const slotStr = slotMatch ? `[${slotMatch[1]}]` : '';

    const type = notif.type || '';
    const titleLower = titleStr.toLowerCase();

    // 1. Booking Submitted / Dispatched
    if (type === 'booking_submitted' || titleLower.includes('dispatched') || titleLower.includes('submitted')) {
      return {
        title: `📋 బుకింగ్ అభ్యర్థన పంపబడింది ${code ? `(${code})` : ''}`,
        message: tractorName
          ? `${tractorName} కొరకు ${dateStr} ${slotStr} సమయానికి బుకింగ్ అభ్యర్థన పంపబడింది. యజమాని ఆమోదం కోసం వేచి ఉంది.`
          : `మీ ట్రాక్టర్ బుకింగ్ విజయవంతంగా పంపబడింది. యజమాని ఆమోదం కోసం వేచి ఉంది.`
      };
    }

    // 2. New Booking Request to Owner
    if (type === 'new_booking_request' || titleLower.includes('new booking request')) {
      return {
        title: `🚜 కొత్త బుకింగ్ అభ్యర్థన ${code ? `(${code})` : ''}`,
        message: `మీ ట్రాక్టర్‌కు కొత్త బుకింగ్ అభ్యర్థన వచ్చింది. దయచేసి పరిశీలించి ఆమోదించండి.`
      };
    }

    // 3. Booking Confirmed
    if (type === 'booking_confirmed' || titleLower.includes('confirmed')) {
      return {
        title: `✅ బుకింగ్ ఖరారైంది ${code ? `(${code})` : ''}`,
        message: `వాహన యజమాని మీ ట్రాక్టర్ బుకింగ్‌ను ఆమోదించారు. నిర్ణీత సమయానికి పొలానికి వస్తారు.`
      };
    }

    // 4. Booking Rejected
    if (type === 'booking_rejected' || titleLower.includes('rejected')) {
      return {
        title: `❌ బుకింగ్ తిరస్కరించబడింది ${code ? `(${code})` : ''}`,
        message: `వాహన యజమాని ప్రస్తుతానికి అందుబాటులో లేనందున ఈ బుకింగ్‌ను తిరస్కరించారు.`
      };
    }

    // 5. Booking Cancelled
    if (type === 'booking_cancelled' || titleLower.includes('cancelled')) {
      return {
        title: `⚠️ బుకింగ్ రద్దు చేయబడింది ${code ? `(${code})` : ''}`,
        message: `ఈ ట్రాక్టర్ బుకింగ్ రద్దు చేయబడింది.`
      };
    }

    return {
      title: titleStr,
      message: msgStr
    };
  };

  const getPageTitle = (page) => {
    switch (page) {
      case 'portal-select':
        return language === 'te' ? 'లాగిన్ పోర్టల్ ఎంపిక' : 'Login Portal Selection';
      case 'home':
        return t.heroTitle;
      case 'find-tractor':
        return language === 'te' ? 'ట్రాక్టర్ ఫ్లీట్' : 'Find Tractor Fleet';
      case 'booking-form':
        return t.bookingFormTitle;
      case 'owner-registration':
        return t.ownerRegTitle;
      case 'owner-inbox':
        return t.ownerInboxTitle;
      case 'my-bookings':
        return t.myBookingsTitle;
      case 'admin-dashboard':
        return language === 'te' ? 'అడ్మిన్ డ్యాష్‌బోర్డ్' : 'Website Admin Dashboard';
      case 'farmer-login':
        return language === 'te' ? 'రైతు లాగిన్' : 'Farmer Login';
      case 'farmer-profile':
        return language === 'te' ? 'రైతు ప్రొఫైల్' : 'Farmer Profile & Settings';
      case 'farmer-onboarding':
        return language === 'te' ? 'కొత్త రైతు నమోదు' : 'Farmer Onboarding';
      default:
        return t.brandSubtitle;
    }
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'te' : 'en'));
  };

  const displayLocation = selectedLocation
    ? `${isTe ? (selectedLocation.villageTe || selectedLocation.village) : selectedLocation.village}, ${isTe ? (selectedLocation.districtTe || selectedLocation.district) : selectedLocation.district}`
    : t.localityLabel;

  const displayLocationShort = selectedLocation
    ? (isTe ? (selectedLocation.villageTe || selectedLocation.village) : selectedLocation.village)
    : 'Hasanparthy';

  const handleDefaultBack = () => {
    switch (activePage) {
      case 'farmer-profile':
      case 'booking-form':
      case 'my-bookings':
        setActivePage(currentFarmer ? 'find-tractor' : 'home');
        break;
      case 'owner-inbox':
        setActivePage(currentOwner ? 'find-tractor' : 'portal-select');
        break;
      case 'owner-registration':
      case 'farmer-login':
      case 'owner-login':
      case 'admin-login':
      case 'admin-dashboard':
        setActivePage('portal-select');
        break;
      case 'farmer-onboarding':
        setActivePage('farmer-login');
        break;
      case 'find-tractor':
        setActivePage('home');
        break;
      case 'home':
        if (currentFarmer || currentOwner) {
          setActivePage('find-tractor');
        } else {
          setActivePage('portal-select');
        }
        break;
      default:
        setActivePage(currentFarmer ? 'find-tractor' : 'home');
    }
  };

  return (
    <header className="top-header">
      <div className="header-left">
        {activePage !== 'portal-select' && (
          <button
            type="button"
            className="header-back-btn"
            onClick={onGoBack || handleDefaultBack}
            aria-label="Back"
            title={isTe ? "వెనుకకు" : "Back"}
          >
            ←
          </button>
        )}
        <button
          type="button"
          className="header-menu-btn"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
          title={isTe ? "మెనూ తెరవండి" : "Open Menu"}
        >
          <span className="header-menu-icon">☰</span>
          <span className="header-menu-text">{isTe ? "మెనూ" : "Menu"}</span>
        </button>
        <div className="header-mobile-brand">
          <span className="brand-icon">🌾</span>
          <span className="brand-title">{t.brandName}</span>
        </div>
        <div className="header-title">
          {getPageTitle(activePage)}
        </div>
      </div>

      <div className="header-right header-right-minimal">
        {/* In-App Notification Bell & Dropdown */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setIsNotifOpen(prev => !prev)}
            title={isTe ? 'నోటిఫికేషన్‌లు' : 'In-App Notifications'}
            aria-label="Notifications"
            style={{
              position: 'relative',
              background: '#ffffff',
              border: '1.5px solid #c8e6c9',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '18px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
            }}
          >
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#d32f2f',
                color: '#ffffff',
                borderRadius: '12px',
                padding: '1px 6px',
                fontSize: '10px',
                fontWeight: '800',
                lineHeight: '14px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.25)'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {isNotifOpen && (
            <div style={{
              position: 'absolute',
              top: '46px',
              right: 0,
              width: '330px',
              maxHeight: '440px',
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
              border: '1px solid #e0e0e0',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 1200
            }}>
              {/* Dropdown Header */}
              <div style={{
                padding: '12px 16px',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                    🔔 {isTe ? 'నోటిఫికేషన్‌లు' : 'Notifications'}
                  </strong>
                  {unreadCount > 0 && (
                    <span style={{
                      background: '#fee2e2',
                      color: '#b91c1c',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 6px',
                      borderRadius: '8px'
                    }}>
                      {unreadCount} {isTe ? 'కొత్తవి' : 'new'}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2e7d32',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    ✓ {isTe ? 'అన్నీ చదివినట్లు మార్క్ చేయండి' : 'Mark all read'}
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div style={{ overflowY: 'auto', maxHeight: '380px' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '40px 16px', textAlign: 'center', color: '#64748b' }}>
                    <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>📭</span>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '600' }}>
                      {isTe ? 'ప్రస్తుతం కొత్త నోటిఫికేషన్‌లు లేవు' : 'No notifications yet'}
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const isNew = !notif.isRead;
                    const notifIcon = notif.type === 'new_booking' ? '🚜' :
                                      notif.type === 'booking_confirmed' ? '✅' :
                                      notif.type === 'booking_rejected' ? '❌' :
                                      notif.type === 'booking_cancelled' ? '⚠️' : '🔔';
                    const translated = getTranslatedNotification(notif, isTe);

                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkOneRead(notif)}
                        style={{
                          padding: '12px 14px',
                          borderBottom: '1px solid #f1f5f9',
                          background: isNew ? '#f0fdf4' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          gap: '10px',
                          alignItems: 'flex-start',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <span style={{ fontSize: '20px', lineHeight: 1 }}>{notifIcon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '13px', color: '#1e293b' }}>{translated.title}</strong>
                            {isNew && (
                              <span style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                background: '#22c55e',
                                display: 'inline-block'
                              }} />
                            )}
                          </div>
                          <p style={{ margin: '3px 0 4px 0', fontSize: '12px', color: '#475569', lineHeight: 1.35 }}>
                            {translated.message}
                          </p>
                          <small style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                            {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                          </small>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Language Switcher */}
        <button
          className="lang-toggle-btn"
          onClick={toggleLanguage}
          title="Switch language between English and Telugu"
        >
          <span>🌐</span>
          <span className="lang-text-desktop">{language === 'en' ? 'తెలుగు' : 'English'}</span>
          <span className="lang-text-mobile">{language === 'en' ? 'తెలుగు' : 'EN'}</span>
        </button>

        {/* Farmer Profile Badge Chip Button (Opens Full Profile Modal & Edit Form) */}
        {currentFarmer && (
          <div className="header-logged-in-user">
            <button
              type="button"
              className="header-user-badge farmer-badge farmer-profile-chip-btn"
              onClick={onOpenFarmerProfile || (() => setActivePage && setActivePage('farmer-profile'))}
              title={isTe ? 'రైతు ప్రొఫైల్ వివరాలు, సవరణ & ఖాతా సెట్టింగ్‌లు' : 'Farmer Profile, Edit Details & Settings'}
              aria-label="Open Farmer Profile"
            >
              <span className="user-badge-avatar">👨‍🌾</span>
              <span className="user-badge-name">
                {currentFarmer.name ? currentFarmer.name.split(' ')[0] : (isTe ? 'రైతు' : 'Farmer')}
              </span>
              <span className="farmer-badge-role-tag">
                <span className="badge-status-dot">●</span>
                {isTe ? 'ప్రొఫైల్' : 'Profile'}
              </span>
              <span className="user-badge-chevron">▾</span>
            </button>
          </div>
        )}

        {!currentFarmer && currentOwner && (
          <div className="header-logged-in-user">
            <div className="header-user-badge owner-badge">
              <span className="user-badge-avatar">🚜</span>
              <span className="user-badge-name">{currentOwner.fullName ? currentOwner.fullName.split(' ')[0] : 'Owner'}</span>
              <span className="user-badge-role">({isTe ? 'వాహన యజమాని' : 'Vehicle Owner'})</span>
            </div>
            {onOwnerLogout && (
              <button
                type="button"
                className="header-logout-btn"
                onClick={onOwnerLogout}
                title={isTe ? "లాగ్అవుట్" : "Logout"}
              >
                🚪 <span className="header-btn-text">{isTe ? 'లాగ్అవుట్' : 'Logout'}</span>
              </button>
            )}
            {onOwnerDeleteAccount && (
              <button
                type="button"
                className="header-delete-btn"
                onClick={onOwnerDeleteAccount}
                title={isTe ? "వాహన యజమాని ఖాతాను శాశ్వతంగా తొలగించండి" : "Permanently Delete Vehicle Owner Account"}
              >
                🗑️ <span className="header-btn-text">{isTe ? 'ఖాతా తొలగించు' : 'Delete Account'}</span>
              </button>
            )}
          </div>
        )}

        {!currentFarmer && !currentOwner && isAdminLoggedIn && (
          <div className="header-logged-in-user">
            <div className="header-user-badge admin-badge">
              <span className="user-badge-avatar">🛡️</span>
              <span className="user-badge-name">Admin</span>
            </div>
            {onAdminLogout && (
              <button
                type="button"
                className="header-logout-btn"
                onClick={onAdminLogout}
                title={isTe ? "లాగ్అవుట్" : "Logout"}
              >
                🚪 {isTe ? 'లాగ్అవుట్' : 'Logout'}
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
