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

        {/* Clean Logged-in User Badge & Logout Button */}
        {currentFarmer && (
          <div className="header-logged-in-user">
            <div className="header-user-badge farmer-badge">
              <span className="user-badge-avatar">👨‍🌾</span>
              <span className="user-badge-name">{currentFarmer.name ? currentFarmer.name.split(' ')[0] : 'Farmer'}</span>
              <span className="user-badge-role">({isTe ? 'రైతు' : 'Farmer'})</span>
            </div>
            {onFarmerLogout && (
              <button
                type="button"
                className="header-logout-btn"
                onClick={onFarmerLogout}
                title={isTe ? "లాగ్అవుట్" : "Logout"}
              >
                🚪 {isTe ? 'లాగ్అవుట్' : 'Logout'}
              </button>
            )}
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
                🚪 {isTe ? 'లాగ్అవుట్' : 'Logout'}
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
