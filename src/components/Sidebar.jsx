import { translations } from '../translations';

export default function Sidebar({
  activePage,
  setActivePage,
  pendingCount = 2,
  isMobileOpen,
  closeMobileMenu,
  language = 'en',
  setLanguage,
  selectedLocation,
  currentFarmer,
  onFarmerLogout,
  currentOwner,
  onOwnerLogout,
  isInstalled = false,
  onInstallApp
}) {
  const t = translations[language] || translations.en;
  const isTe = language === 'te';

  const toggleLanguage = () => {
    if (setLanguage) {
      setLanguage(prev => (prev === 'en' ? 'te' : 'en'));
    }
  };

  const handleNavClick = (id) => {
    setActivePage(id);
    if (closeMobileMenu) {
      closeMobileMenu();
    }
  };

  const handleSignOut = () => {
    if (onFarmerLogout) onFarmerLogout();
    if (onOwnerLogout) onOwnerLogout();
    try {
      localStorage.removeItem('agri_current_farmer');
      localStorage.removeItem('agri_current_owner');
    } catch (e) {
      console.warn(e);
    }
    setActivePage('portal-select');
    if (closeMobileMenu) {
      closeMobileMenu();
    }
  };

  // User Profile details
  const userName = currentFarmer?.name || currentOwner?.fullName || 'N. Ramesh Kumar';
  const userRoleText = currentOwner
    ? (isTe ? '✓ ధృవీకరించబడిన యజమాని' : '✓ Verified Owner')
    : (isTe ? '✓ ధృవీకరించబడిన రైతు' : '✓ Verified Farmer');

  const menuItems = [
    {
      id: 'find-tractor',
      title: isTe ? 'ట్రాక్టర్లు & యంత్రాలు' : 'Tractors & Machinery',
      subtitle: isTe ? 'తక్షణ యంత్రాల మార్కెట్‌ప్లేస్' : 'Instant Machinery Marketplace',
      icon: '🚜',
      iconBg: '#eff6ff',
      badge: null
    },
    {
      id: 'my-bookings',
      title: isTe ? 'నా బుకింగ్స్ & అద్దెలు' : 'My Bookings & Rentals',
      subtitle: isTe ? 'లైవ్ అద్దె ట్రాకింగ్ & రసీదులు' : 'Live Rental Tracking & Receipts',
      icon: '📋',
      iconBg: '#fef3c7',
      badge: 2
    },
    {
      id: 'owner-inbox',
      title: isTe ? 'లైవ్ చాట్ & హెచ్చరికలు' : 'Live Chat & Alerts',
      subtitle: isTe ? 'ఇన్-యాప్ మెసేజెస్ & వాట్సాప్' : 'Direct In-App Messages & WhatsApp...',
      icon: '💬',
      iconBg: '#e0f2fe',
      badge: 2
    },
    {
      id: 'farmer-login',
      title: isTe ? 'నా ప్రొఫైల్ & కార్యకలాపాలు' : 'My Profile & Activity',
      subtitle: isTe ? 'ఖాతా వివరాలు & యాక్టివిటీ లాగ్' : 'Account Details & Activity Log',
      icon: '👤',
      iconBg: '#dbeafe',
      badge: null
    },
    {
      id: 'settings',
      title: isTe ? 'సెట్టింగ్‌లు' : 'Settings',
      subtitle: isTe ? 'భాష, ప్రాధాన్యతలు & లాగౌట్' : 'Language, Preferences & Logout',
      icon: '⚙️',
      iconBg: '#f1f5f9',
      badge: null,
      customAction: toggleLanguage
    },
    {
      id: 'home',
      title: isTe ? 'అగ్రిరెంట్ గురించి' : 'About Agrirent',
      subtitle: isTe ? 'లక్ష్యం & భద్రతా ప్రమాణాలు' : 'Mission & Safety Standards',
      icon: 'ℹ️',
      iconBg: '#e0f2fe',
      badge: null
    },
    {
      id: 'helpline',
      title: isTe ? 'హెల్ప్‌లైన్ & మద్దతు' : 'Helpline & Support',
      subtitle: isTe ? 'కిసాన్ సపోర్ట్ & టోల్-ఫ్రీ లైన్' : 'Kisan Support & Toll-Free Line',
      icon: '📞',
      iconBg: '#f1f5f9',
      badge: null,
      customAction: () => {
        window.location.href = 'tel:18004251122';
      }
    }
  ];

  return (
    <>
      {/* Backdrop overlay for mobile drawer */}
      <div
        className={`sidebar-overlay ${isMobileOpen ? 'open' : ''}`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      <aside className={`app-sidebar ${isMobileOpen ? 'open' : ''}`}>
        {/* Top Header matching media_1793345213232 */}
        <div className="drawer-header-row">
          <div className="drawer-brand-left">
            <div className="drawer-sprout-box">
              <span className="drawer-sprout-emoji">🌾</span>
            </div>
            <div className="drawer-brand-text">
              <h2 className="drawer-brand-name">Agrirent</h2>
              <span className="drawer-brand-sub">
                {isTe ? 'వ్యవసాయ యంత్రాల వేదిక' : 'Machinery Rental Platform'}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="drawer-close-circle"
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Top User Profile Card (Screenshot 2) */}
        <div
          className="drawer-profile-card"
          onClick={() => handleNavClick(currentOwner ? 'owner-inbox' : 'farmer-login')}
          role="button"
          tabIndex={0}
        >
          <div className="drawer-profile-avatar">
            <span className="drawer-avatar-emoji">👨‍🌾</span>
          </div>
          <div className="drawer-profile-info">
            <h3 className="drawer-profile-name">{userName}</h3>
            <span className="drawer-profile-status">{userRoleText}</span>
          </div>
          <span className="drawer-chevron-right">›</span>
        </div>

        {/* Nav List */}
        <nav className="drawer-nav-list">
          {menuItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`drawer-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (item.customAction) {
                    item.customAction();
                  } else {
                    handleNavClick(item.id);
                  }
                }}
              >
                <div
                  className="drawer-item-icon-box"
                  style={{ background: item.iconBg }}
                >
                  <span>{item.icon}</span>
                </div>

                <div className="drawer-item-text">
                  <div className="drawer-item-title-row">
                    <h4 className="drawer-item-title">{item.title}</h4>
                  </div>
                  <span className="drawer-item-subtitle">{item.subtitle}</span>
                </div>

                <div className="drawer-item-end">
                  {item.badge && (
                    <span className="drawer-red-badge">{item.badge}</span>
                  )}
                  <span className="drawer-item-chevron">›</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Bottom Action Buttons (Screenshot 2) */}
        <div className="drawer-bottom-actions">
          {/* Language & Settings Button */}
          <button
            type="button"
            className="drawer-btn-language"
            onClick={toggleLanguage}
          >
            <span>• ⚙️ {isTe ? 'భాష & సెట్టింగ్‌లు (English)' : 'Language & Settings (తెలుగు)'}</span>
          </button>

          {/* Sign Out Button */}
          <button
            type="button"
            className="drawer-btn-signout"
            onClick={handleSignOut}
          >
            <span>🚪 {isTe ? 'ఖాతా నుండి సైన్ అవుట్' : 'Sign Out of Account'}</span>
          </button>

          {/* App Version Stamp */}
          <div className="drawer-version-stamp">
            Agrirent Mobile Native v2.5.0 • Telangana
          </div>
        </div>
      </aside>
    </>
  );
}
