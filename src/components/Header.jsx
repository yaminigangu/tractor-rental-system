import { translations } from '../translations';

export default function Header({
  activePage,
  toggleMobileMenu,
  activeRole,
  setActiveRole,
  language = 'en',
  setLanguage,
  isAdminLoggedIn,
  onAdminLogout,
  selectedLocation,
  onOpenLocationPicker
}) {
  const t = translations[language] || translations.en;
  const isTe = language === 'te';

  const getPageTitle = (page) => {
    switch (page) {
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
          >
            {t.roleFarmer}
          </button>
          <button
            className={`role-btn ${activeRole === 'owner' ? 'active' : ''}`}
            onClick={() => setActiveRole('owner')}
          >
            {t.roleOwner}
          </button>
          <button
            className={`role-btn ${activeRole === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveRole('admin')}
            title={isAdminLoggedIn ? 'Admin Authenticated' : 'Admin Login Required'}
          >
            {t.roleAdmin} {isAdminLoggedIn ? '🔓' : '🔒'}
          </button>
        </div>

        {isAdminLoggedIn && onAdminLogout && (
          <button
            className="btn btn-call"
            style={{ background: '#d32f2f', padding: '5px 10px', fontSize: '11px' }}
            onClick={onAdminLogout}
            title={t.adminLogoutBtn}
          >
            🚪
          </button>
        )}
      </div>
    </header>
  );
}
