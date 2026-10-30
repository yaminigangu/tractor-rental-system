import { translations } from '../translations';

export default function Sidebar({ 
  activePage, 
  setActivePage, 
  pendingCount = 0,
  isMobileOpen,
  closeMobileMenu,
  language = 'en',
  selectedLocation,
  currentFarmer,
  currentOwner,
  isInstalled = false,
  onInstallApp
}) {
  const t = translations[language] || translations.en;
  const isTe = language === 'te';

  const menuItems = [
    { id: 'home', label: t.navHome, icon: '🏡' },
    { id: 'find-tractor', label: t.navFindTractor, icon: '🔍' },
    { id: 'booking-form', label: t.navBookingTractor, icon: '📋' },
    { 
      id: 'farmer-login', 
      label: currentFarmer ? `👨‍🌾 ${currentFarmer.name.split(' ')[0]} (Farmer)` : (isTe ? '👨‍🌾 రైతు లాగిన్' : '👨‍🌾 Farmer Login'), 
      icon: '🌾' 
    },
    { 
      id: 'owner-registration', 
      label: currentOwner ? `🚜 ${currentOwner.fullName.split(' ')[0]} (Owner)` : (isTe ? '🚜 ట్రాక్టర్ యజమాని లాగిన్ / నమోదు' : '🚜 Tractor Owner Login / Register'), 
      icon: '🚜' 
    },
    { id: 'owner-inbox', label: t.navOwnerInbox, icon: '📥', badge: pendingCount > 0 ? pendingCount : null },
    { id: 'my-bookings', label: t.navMyBooking, icon: '📄' },
    { id: 'admin-dashboard', label: t.navAdminDashboard, icon: '🛡️' },
  ];

  const handleNavClick = (id) => {
    setActivePage(id);
    if (closeMobileMenu) {
      closeMobileMenu();
    }
  };

  const villageName = selectedLocation
    ? (isTe ? (selectedLocation.villageTe || selectedLocation.village) : selectedLocation.village)
    : 'Hasanparthy';
  
  const helplineNum = selectedLocation?.helpline || '9032004060';

  return (
    <>
      <div 
        className={`sidebar-overlay ${isMobileOpen ? 'open' : ''}`} 
        onClick={closeMobileMenu}
      />
      <aside className={`app-sidebar ${isMobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-icon">🌾</span>
          <div className="brand-text">
            <h1>{t.brandName}</h1>
            <small>{t.brandSubtitle}</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-link ${activePage === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <div className="nav-link-content">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>

        {/* PWA Web App Install Widget in Sidebar */}
        {!isInstalled && onInstallApp && (
          <div className="sidebar-pwa-card">
            <div className="sidebar-pwa-header">
              <span className="sidebar-pwa-icon">📲</span>
              <div>
                <strong>{isTe ? 'అగ్రిరెంట్ మొబైల్ యాప్' : 'AgriRent App'}</strong>
                <p>{isTe ? 'హోమ్ స్క్రీన్‌పై ఇన్‌స్టాల్ చేయండి' : 'Install on Mobile / PC'}</p>
              </div>
            </div>
            <button
              type="button"
              className="sidebar-pwa-btn"
              onClick={onInstallApp}
            >
              {isTe ? 'యాప్ ఇన్‌స్టాల్' : 'Install App'}
            </button>
          </div>
        )}

        <div className="sidebar-footer">
          <div className="helpline-box">
            <strong>{t.villageHelpline} ({villageName})</strong>
            <span>{villageName}: {helplineNum} | Toll-Free: 1800-425-1122</span>
            {selectedLocation?.kvk && (
              <small style={{ display: 'block', fontSize: '9.5px', color: '#a5d6a7', marginTop: '3px' }}>
                🏛️ {selectedLocation.kvk}
              </small>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
