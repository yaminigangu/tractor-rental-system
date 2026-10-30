import { translations } from '../translations';

export default function Header({
  activePage,
  setActivePage,
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
  onFarmerLogout,
  currentOwner,
  onOwnerLogout,
  isInstalled = false,
  onInstallApp
}) {
  const t = translations[language] || translations.en;
  const isTe = language === 'te';

  const getPageTitle = (page) => {
    switch (page) {
      case 'portal-select':
        return language === 'te' ? 'లాగిన్ పోర్టల్ ఎంపిక' : 'Login Portal Selection';
      case 'home':
        return t.heroTitle;
      case 'find-tractor':
        return language === 'te' ? 'గ్రామంలో అందుబాటులో ఉన్న ట్రాక్టర్లు' : 'Find Tractor Fleet in Locality';
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

  return (
    <header className="top-header">
      <div className="header-left">
        {activePage !== 'portal-select' && (
          <button
            type="button"
            className="header-back-btn"
            onClick={() => {
              if (activePage === 'farmer-login' || activePage === 'owner-registration' || activePage === 'farmer-onboarding') {
                setActivePage('portal-select');
              } else {
                setActivePage('home');
              }
            }}
            aria-label="Back"
            title={isTe ? "వెనుకకు" : "Back"}
          >
            ←
          </button>
        )}
        <button
          className="mobile-menu-btn"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          ☰
        </button>
        <div className="header-mobile-brand">
          <span className="brand-icon">🌾</span>
          <span className="brand-title">{t.brandName}</span>
        </div>
        <div className="header-title">
          {getPageTitle(activePage)}
        </div>
      </div>

      <div className="header-right">
        {/* Interactive Locality Selector Pill */}
        <button
          className="locality-pill-btn"
          onClick={onOpenLocationPicker}
          title={isTe ? "తెలంగాణ ప్రాంతం / గ్రామం మార్చండి" : "Click to select any village or district across Telangana"}
          type="button"
        >
          <span className="pill-pin">📍</span>
          <span className="pill-text pill-text-desktop">{displayLocation}</span>
          <span className="pill-text pill-text-mobile">{displayLocationShort}</span>
          <span className="pill-arrow">▾</span>
        </button>

        {/* PWA App Install Button (Pill) */}
        {!isInstalled && onInstallApp && (
          <button
            type="button"
            className="header-pwa-btn"
            onClick={onInstallApp}
            title={isTe ? "ఈ వెబ్‌సైట్‌ను ఫోన్/కంప్యూటర్‌లో యాప్ లాగా ఇన్‌స్టాల్ చేసుకోండి" : "Install AgriRent as a Progressive Web App on your phone/PC"}
          >
            <span className="header-pwa-icon">📲</span>
            <span className="header-pwa-text header-pwa-text-desktop">{isTe ? "యాప్ ఇన్‌స్టాల్" : "Install App"}</span>
            <span className="header-pwa-text header-pwa-text-mobile">{isTe ? "యాప్" : "App"}</span>
          </button>
        )}

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

        {/* Role Switcher */}
        <div className="role-switcher" title={t.switchRole}>
          <button
            className={`role-btn ${activeRole === 'farmer' ? 'active' : ''}`}
            onClick={() => setActiveRole('farmer')}
            title={currentFarmer ? `Logged in as Farmer: ${currentFarmer.name}` : 'Click to Login as Farmer'}
          >
            {currentFarmer ? `👨‍🌾 ${currentFarmer.name.split(' ')[0]}` : t.roleFarmer}
          </button>
          <button
            className={`role-btn ${activeRole === 'owner' ? 'active' : ''}`}
            onClick={() => setActiveRole('owner')}
            title={currentOwner ? `Logged in as Tractor Owner: ${currentOwner.fullName}` : 'Click to Login / Register as Tractor Owner'}
          >
            {currentOwner ? `🚜 ${currentOwner.fullName.split(' ')[0]} (Owner)` : t.roleOwner}
          </button>
          <button
            className={`role-btn ${activeRole === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveRole('admin')}
            title={isAdminLoggedIn ? 'Admin Authenticated' : 'Admin Login Required'}
          >
            {t.roleAdmin} {isAdminLoggedIn ? '🔓' : '🔒'}
          </button>
        </div>

        {/* Farmer Logout Button */}
        {activeRole === 'farmer' && currentFarmer && onFarmerLogout && (
          <button
            type="button"
            className="btn btn-call"
            style={{ background: '#4b5563', padding: '5px 8px', fontSize: '11px', color: '#fff' }}
            onClick={onFarmerLogout}
            title="Logout Farmer Profile"
          >
            🚪 {language === 'te' ? 'లాగ్అవుట్' : 'Logout'}
          </button>
        )}

        {/* Owner Logout Button */}
        {activeRole === 'owner' && currentOwner && onOwnerLogout && (
          <button
            type="button"
            className="btn btn-call"
            style={{ background: '#4b5563', padding: '5px 8px', fontSize: '11px', color: '#fff' }}
            onClick={onOwnerLogout}
            title="Logout Tractor Owner Profile"
          >
            🚪 {language === 'te' ? 'లాగ్అవుట్' : 'Logout'}
          </button>
        )}

        {/* Admin Logout Button */}
        {activeRole === 'admin' && isAdminLoggedIn && onAdminLogout && (
          <button
            className="btn btn-call"
            style={{ background: '#d32f2f', padding: '5px 10px', fontSize: '11px' }}
            onClick={onAdminLogout}
            title={t.adminLogoutBtn}
          >
            🚪 {language === 'te' ? 'లాగ్అవుట్' : 'Logout'}
          </button>
        )}
      </div>
    </header>
  );
}
