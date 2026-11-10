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
  onOpenFarmerProfile,
  onFarmerLogout,
  onFarmerDeleteAccount,
  currentOwner,
  onOwnerLogout,
  onOwnerDeleteAccount,
  isAdminLoggedIn,
  onAdminLogout,
  adminActiveTab,
  setAdminActiveTab,
  onOpenNotifications,
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
    if (closeMobileMenu) {
      closeMobileMenu();
    }

    // Role-specific action intercepts
    if (id === 'farmer-profile') {
      if (onOpenFarmerProfile) onOpenFarmerProfile();
      else setActivePage('farmer-profile');
      return;
    }

    if (id === 'farmer-notifications' || id === 'owner-notifications') {
      if (onOpenNotifications) {
        onOpenNotifications();
      } else {
        setActivePage(currentFarmer ? 'my-bookings' : 'owner-inbox');
      }
      return;
    }

    if (id === 'farmer-logout') {
      if (onFarmerLogout) onFarmerLogout();
      return;
    }

    if (id === 'owner-logout') {
      if (onOwnerLogout) onOwnerLogout();
      return;
    }

    if (id === 'admin-logout') {
      if (onAdminLogout) onAdminLogout();
      return;
    }

    // Owner specific sub-navigation routes
    if (id === 'owner-listings') {
      setActivePage('owner-inbox');
      return;
    }

    if (id === 'owner-requests') {
      setActivePage('owner-inbox');
      return;
    }

    if (id === 'owner-history') {
      setActivePage('owner-inbox');
      return;
    }

    if (id === 'owner-kyc') {
      setActivePage('owner-registration');
      return;
    }

    if (id === 'owner-profile') {
      setActivePage('owner-inbox');
      return;
    }

    // Admin dashboard sub-tabs
    if (id.startsWith('admin-')) {
      setActivePage('admin-dashboard');
      if (setAdminActiveTab) {
        const tabMap = {
          'admin-dashboard': 'overview',
          'admin-farmers': 'farmers',
          'admin-owners': 'owners',
          'admin-tractors': 'fleet',
          'admin-verification': 'verifications',
          'admin-bookings': 'bookings',
          'admin-reports': 'reports',
          'admin-payments': 'payments',
          'admin-notifications': 'notifications',
          'admin-support': 'support',
          'admin-settings': 'settings'
        };
        setAdminActiveTab(tabMap[id] || 'overview');
      }
      return;
    }

    setActivePage(id);
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
  // Strictly adhering to RBAC separation:
  // 1. FARMER: Home, Explore Fleet, My Bookings, Booking History, Notifications, My Profile, Logout
  // 2. VEHICLE_OWNER: Home, Owner Work Inbox, My Tractor Listings, Add New Tractor, Booking Requests, Booking History, Machinery KYC / Verification Status, Notifications, My Profile, Logout
  // 3. ADMIN: Admin Home / Dashboard, Manage Farmers, Manage Vehicle Owners, Manage Tractor Listings, Pending Tractor Verification, Manage All Bookings, Booking Reports, Payments and Transactions, Notifications, Complaints / Support, System Settings, Logout
  const menuItems = (() => {
    if (currentFarmer) {
      return [
        { id: 'home', label: isTe ? 'హోమ్' : 'Home', icon: '🏡' },
        { id: 'find-tractor', label: isTe ? 'ఫ్లీట్‌ను అన్వేషించండి' : 'Explore Fleet', icon: '🚜' },
        { id: 'my-bookings', label: isTe ? 'నా బుకింగ్‌లు' : 'My Bookings', icon: '📋' },
        { id: 'booking-form', label: isTe ? 'ట్రాక్టర్ బుకింగ్' : 'Book a Tractor', icon: '📝' },
        { id: 'farmer-notifications', label: isTe ? 'నోటిఫికేషన్‌లు' : 'Notifications', icon: '🔔' },
        { id: 'farmer-profile', label: isTe ? 'నా ప్రొఫైల్' : 'My Profile', icon: '👤' },
        { id: 'farmer-logout', label: isTe ? 'లాగ్‌అవుట్' : 'Logout', icon: '🚪' }
      ];
    }
    
    if (currentOwner) {
      return [
        { id: 'home', label: isTe ? 'హోమ్' : 'Home', icon: '🏡' },
        { id: 'owner-inbox', label: isTe ? 'యజమాని వర్క్ ఇన్‌బాక్స్' : 'Owner Work Inbox', icon: '📮', badge: pendingCount > 0 ? pendingCount : null },
        { id: 'owner-listings', label: isTe ? 'నా ట్రాక్టర్ల జాబితా' : 'My Tractor Listings', icon: '🚜' },
        { id: 'owner-registration', label: isTe ? 'కొత్త ట్రాక్టర్‌ను జోడించండి' : 'Add New Tractor', icon: '➕' },
        { id: 'owner-requests', label: isTe ? 'బుకింగ్ అభ్యర్థనలు' : 'Booking Requests', icon: '📩', badge: pendingCount > 0 ? pendingCount : null },
        { id: 'owner-history', label: isTe ? 'బుకింగ్ చరిత్ర' : 'Booking History', icon: '📜' },
        { id: 'owner-kyc', label: isTe ? 'యంత్రాల KYC / ధృవీకరణ స్థితి' : 'Machinery KYC / Status', icon: '🛡️' },
        { id: 'owner-notifications', label: isTe ? 'నోటిఫికేషన్‌లు' : 'Notifications', icon: '🔔' },
        { id: 'owner-profile', label: isTe ? 'నా ప్రొఫైల్' : 'My Profile', icon: '👤' },
        { id: 'owner-logout', label: isTe ? 'లాగ్‌అవుట్' : 'Logout', icon: '🚪' }
      ];
    }
    
    if (isAdminLoggedIn) {
      return [
        { id: 'admin-dashboard', label: isTe ? 'అడ్మిన్ హోమ్ / డ్యాష్‌బోర్డ్' : 'Admin Home / Dashboard', icon: '📊' },
        { id: 'admin-farmers', label: isTe ? 'రైతుల నిర్వహణ' : 'Manage Farmers', icon: '👨‍🌾' },
        { id: 'admin-owners', label: isTe ? 'వాహన యజమానుల నిర్వహణ' : 'Manage Vehicle Owners', icon: '🚜' },
        { id: 'admin-tractors', label: isTe ? 'ట్రాక్టర్ల జాబితా నిర్వహణ' : 'Manage Tractor Listings', icon: '🚜' },
        { id: 'admin-verification', label: isTe ? 'పెండింగ్ ట్రాక్టర్ ధృవీకరణ' : 'Pending Tractor Verification', icon: '⏳' },
        { id: 'admin-bookings', label: isTe ? 'అన్ని బుకింగ్‌ల నిర్వహణ' : 'Manage All Bookings', icon: '📑' },
        { id: 'admin-reports', label: isTe ? 'బుకింగ్ నివేదికలు' : 'Booking Reports', icon: '📈' },
        { id: 'admin-payments', label: isTe ? 'చెల్లింపులు & లావాదేవీలు' : 'Payments & Transactions', icon: '💳' },
        { id: 'admin-notifications', label: isTe ? 'నోటిఫికేషన్‌లు' : 'Notifications', icon: '🔔' },
        { id: 'admin-support', label: isTe ? 'ఫిర్యాదులు / సపోర్ట్' : 'Complaints / Support', icon: '💬' },
        { id: 'admin-settings', label: isTe ? 'సిస్టమ్ సెట్టింగ్‌లు' : 'System Settings', icon: '⚙️' },
        { id: 'admin-logout', label: isTe ? 'లాగ్‌అవుట్' : 'Logout', icon: '🚪' }
      ];
    }

    // Guest / Public Browser
    return [
      { id: 'home', label: isTe ? 'హోమ్' : 'Home', icon: '🏡' },
      { id: 'find-tractor', label: isTe ? 'ఫ్లీట్‌ను అన్వేషించండి' : 'Explore Fleet', icon: '🚜' },
      { id: 'portal-select', label: isTe ? 'సైన్ ఇన్' : 'Sign In Portal', icon: '🔑' }
    ];
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
          <div className="brand-header-left">
            <span className="brand-icon">🌾</span>
            <div className="brand-text">
              <h1>{t.brandName || 'AgriRent'}</h1>
              <small>{t.brandSubtitle || 'TRACTOR SERVICES'}</small>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={closeMobileMenu}
            aria-label="Close Navigation Menu"
            title={isTe ? "మెనూ మూసివేయండి" : "Close Menu"}
          >
            ✕
          </button>
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
            <div 
              className={`sidebar-user-card ${currentFarmer ? 'clickable' : ''}`}
              onClick={() => {
                if (currentFarmer && onOpenFarmerProfile) {
                  if (closeMobileMenu) closeMobileMenu();
                  onOpenFarmerProfile();
                }
              }}
              title={currentFarmer ? (isTe ? 'రైతు ప్రొఫైల్ వివరాలు తెరవండి' : 'Open Farmer Profile & Settings') : ''}
            >
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
                        ? (isTe ? 'వాహన యజమాని (లాగిన్ అయ్యారు)' : 'Vehicle Owner (Logged In)') 
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

            {/* Delete Account Option inside Farmer or Vehicle Owner account */}
            {currentFarmer && onFarmerDeleteAccount && (
              <button
                type="button"
                className="sidebar-user-delete-btn"
                onClick={() => {
                  if (closeMobileMenu) closeMobileMenu();
                  onFarmerDeleteAccount();
                }}
                title={isTe ? 'రైతు ఖాతాను శాశ్వతంగా తొలగించండి' : 'Permanently Delete Farmer Account'}
              >
                <span className="del-icon">🗑️</span>
                <span>{isTe ? 'రైతు ఖాతా తొలగించండి' : 'Delete Farmer Account'}</span>
              </button>
            )}

            {!currentFarmer && currentOwner && onOwnerDeleteAccount && (
              <button
                type="button"
                className="sidebar-user-delete-btn"
                onClick={() => {
                  if (closeMobileMenu) closeMobileMenu();
                  onOwnerDeleteAccount();
                }}
                title={isTe ? 'వాహన యజమాని ఖాతాను శాశ్వతంగా తొలగించండి' : 'Permanently Delete Vehicle Owner Account'}
              >
                <span className="del-icon">🗑️</span>
                <span>{isTe ? 'యజమాని ఖాతా తొలగించండి' : 'Delete Owner Account'}</span>
              </button>
            )}
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
