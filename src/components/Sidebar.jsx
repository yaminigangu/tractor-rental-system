import { translations } from '../translations';

export default function Sidebar({ 
  activePage, 
  setActivePage, 
  pendingCount = 1,
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

  // Helper to extract clean name without leading/trailing emoji characters
  const getCleanName = (rawName, fallback) => {
    if (!rawName) return fallback;
    const cleaned = String(rawName).replace(/^[\p{Emoji}\p{Extended_Pictographic}\u200d\uFE0F\s]+/gu, '').trim();
    return cleaned.split(' ')[0] || fallback;
  };

  // Farmer display name (strictly ONE farmer icon rendered separately, label has NO emojis)
  const farmerDisplayName = currentFarmer
    ? `${getCleanName(currentFarmer.name, 'Farmer')} (Farmer)`
    : (isTe ? 'రైతు లాగిన్' : 'Farmer Login');

  // Owner display name (strictly ONE tractor icon rendered separately, label has NO emojis)
  const ownerDisplayName = currentOwner
    ? `${getCleanName(currentOwner.fullName, 'Owner')} (Owner)`
    : (isTe ? 'ట్రాక్టర్ యజమాని లాగిన్ / నమోదు' : 'Tractor Owner Login / Register');

  // Strictly single icon per item: NO duplicate emojis in label!
  const menuItems = [
    { 
      id: 'home', 
      label: isTe ? 'హోమ్' : 'Home', 
      icon: '🏡' 
    },
    { 
      id: 'find-tractor', 
      label: isTe ? 'ట్రాక్టర్లను కనుగొనండి' : 'Find Tractor', 
      icon: '🔍' 
    },
    { 
      id: 'booking-form', 
      label: isTe ? 'ట్రాక్టర్ బుకింగ్' : 'Booking Tractor', 
      icon: '📋' 
    },
    { 
      id: 'portal-select', 
      label: isTe ? 'లాగిన్ ఎంపిక' : 'Login Portals', 
      icon: '🔐' 
    },
    { 
      id: 'farmer-login', 
      label: farmerDisplayName, 
      icon: '👨‍🌾' 
    },
    { 
      id: 'owner-registration', 
      label: ownerDisplayName, 
      icon: '🚜' 
    },
    { 
      id: 'owner-inbox', 
      label: isTe ? 'యజమాని వర్క్ ఇన్‌బాక్స్' : 'Owner Work Inbox', 
      icon: '📮', 
      badge: pendingCount > 0 ? pendingCount : null 
    },
    { 
      id: 'my-bookings', 
      label: isTe ? 'నా బుకింగ్' : 'My Booking', 
      icon: '📄' 
    },
    { 
      id: 'admin-dashboard', 
      label: isTe ? 'అడ్మిన్ డ్యాష్‌బోర్డ్' : 'Admin Dashboard', 
      icon: '🛡️' 
    },
  ];

  const villageName = selectedLocation
    ? (isTe ? (selectedLocation.villageTe || selectedLocation.village) : selectedLocation.village)
    : 'Hasanparthy';
  
  const helplineNum = selectedLocation?.helpline || '9032004060';

  return (
    <>
      <div 
        className={`sidebar-overlay ${isMobileOpen ? 'open' : ''}`} 
        onClick={closeMobileMenu}
        aria-hidden="true"
      />
      <aside className={`app-sidebar ${isMobileOpen ? 'open' : ''}`}>
        {/* Sidebar Brand Header */}
        <div className="sidebar-brand">
          <span className="brand-icon">🌾</span>
          <div className="brand-text">
            <h1>{t.brandName || 'AgriRent'}</h1>
            <small>{t.brandSubtitle || 'TRACTOR SERVICES'}</small>
          </div>
        </div>

        {/* Navigation items with strictly 1 icon each */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            // Strip any leading emoji / symbol / whitespace from label as an ironclad safeguard
            const cleanLabel = (item.label || '')
              .replace(/^[\p{Emoji}\p{Extended_Pictographic}\u200d\uFE0F\s]+/gu, '')
              .trim();

            return (
              <button
                key={item.id}
                type="button"
                className={`nav-link ${activePage === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <div className="nav-link-content">
                  <span className="nav-icon-single">{item.icon}</span>
                  <span className="nav-label-text">{cleanLabel}</span>
                </div>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </button>
            );
          })}
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

        {/* Footer Helpline */}
        <div className="sidebar-footer">
          <div className="helpline-box">
            <strong>{t.villageHelpline || 'Helpline'} ({villageName})</strong>
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
