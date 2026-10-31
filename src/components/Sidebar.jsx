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
  isAdminLoggedIn,
  onAdminLogout,
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
    if (onAdminLogout) onAdminLogout();
    try {
      localStorage.removeItem('agri_current_farmer');
      localStorage.removeItem('agri_current_owner');
      sessionStorage.removeItem('agri_admin_logged_in');
    } catch (e) {
      console.warn(e);
    }
    setActivePage('portal-select');
    if (closeMobileMenu) {
      closeMobileMenu();
    }
  };

  // Helper to extract clean name without ANY emoji characters
  const getCleanName = (rawName, fallback) => {
    if (!rawName) return fallback;
    const cleaned = String(rawName).replace(/[\p{Emoji}\p{Extended_Pictographic}\u200d\uFE0F]/gu, '').trim();
    return cleaned.split(' ')[0] || fallback;
  };

  // Build role-tailored navigation menu items:
  // - Strictly 1 icon per menu item (NO duplicate emojis)
  // - No redundant "Login Portals" links for already logged-in users
  const menuItems = (() => {
    const items = [
      { 
        id: 'home', 
        label: isTe ? 'హోమ్' : 'Home', 
        icon: '🏡' 
      }
    ];

    if (currentFarmer) {
      items.push(
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
          id: 'my-bookings', 
          label: isTe ? 'నా బుకింగ్‌లు' : 'My Bookings', 
          icon: '📄' 
        }
      );
    } else if (currentOwner) {
      items.push(
        { 
          id: 'owner-inbox', 
          label: isTe ? 'యజమాని వర్క్ ఇన్‌బాక్స్' : 'Owner Work Inbox', 
          icon: '📮', 
          badge: pendingCount > 0 ? pendingCount : null 
        },
        { 
          id: 'find-tractor', 
          label: isTe ? 'ట్రాక్టర్ మార్కెట్‌ప్లేస్' : 'Explore Fleet', 
          icon: '🚜' 
        },
        { 
          id: 'my-bookings', 
          label: isTe ? 'బుకింగ్ చరిత్ర' : 'Booking History', 
          icon: '📄' 
        },
        { 
          id: 'owner-registration', 
          label: isTe ? 'యంత్రాల KYC వివరాలు' : 'Machinery KYC Specs', 
          icon: '⚙️' 
        }
      );
    } else if (isAdminLoggedIn) {
      items.push(
        { 
          id: 'admin-dashboard', 
          label: isTe ? 'అడ్మిన్ డ్యాష్‌బోర్డ్' : 'Admin Dashboard', 
          icon: '🛡️' 
        },
        { 
          id: 'find-tractor', 
          label: isTe ? 'అన్ని ట్రాక్టర్లు' : 'All Fleet', 
          icon: '🚜' 
        },
        { 
          id: 'my-bookings', 
          label: isTe ? 'అన్ని బుకింగ్‌లు' : 'All Bookings', 
          icon: '📄' 
        }
      );
    } else {
      items.push(
        { 
          id: 'find-tractor', 
          label: isTe ? 'ట్రాక్టర్లను కనుగొనండి' : 'Find Tractor', 
          icon: '🔍' 
        },
        { 
          id: 'booking-form', 
          label: isTe ? 'ట్రాక్టర్ బుకింగ్' : 'Booking Tractor', 
          icon: '📋' 
        }
      );
    }

    return items;
  })();

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
            // Strip ANY emoji / symbol / pictograph from the text label so only item.icon is shown!
            const cleanLabel = (item.label || '')
              .replace(/[\p{Emoji}\p{Extended_Pictographic}\u200d\uFE0F]/gu, '')
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

        {/* Logged-In User Profile Card & Sign Out in Sidebar */}
        {(currentFarmer || currentOwner || isAdminLoggedIn) && (
          <div className="sidebar-user-section">
            <div className="sidebar-user-card">
              <span className="sidebar-user-avatar">
                {currentFarmer ? '👨‍🌾' : (currentOwner ? '🚜' : '🛡️')}
              </span>
              <div className="sidebar-user-details">
                <strong className="sidebar-user-name">
                  {currentFarmer ? currentFarmer.name : (currentOwner ? currentOwner.fullName : 'Admin')}
                </strong>
                <span className="sidebar-user-role">
                  {currentFarmer 
                    ? (isTe ? 'రైతు (లాగిన్ అయ్యారు)' : 'Farmer (Logged In)') 
                    : (currentOwner 
                        ? (isTe ? 'యజమాని (లాగిన్ అయ్యారు)' : 'Owner (Logged In)') 
                        : (isTe ? 'అడ్మినిస్ట్రేటర్' : 'Administrator'))}
                </span>
              </div>
              <button
                type="button"
                className="sidebar-user-logout"
                onClick={currentFarmer ? onFarmerLogout : (currentOwner ? onOwnerLogout : onAdminLogout || handleSignOut)}
                title={isTe ? 'లాగ్అవుట్' : 'Logout'}
                aria-label="Logout"
              >
                🚪
              </button>
            </div>
          </div>
        )}

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
