import { translations } from '../translations';

export default function Sidebar({ 
  activePage, 
  setActivePage, 
  pendingCount = 0,
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
  isCollapsed = false,
  onToggleCollapse
}) {
  const t = translations[language] || translations.en;
  const isTe = language === 'te';

  const handleNavClick = (id) => {
    if (closeMobileMenu) {
      closeMobileMenu();
    }

    // Role-specific action intercepts
    if (id === 'farmer-profile' || id === 'profile') {
      setActivePage('profile');
      return;
    }

    if (id === 'account-settings') {
      setActivePage('account-settings');
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
          'admin-bookings': 'bookings'
        };
        setAdminActiveTab(tabMap[id] || 'overview');
      }
      return;
    }

    setActivePage(id);
  };

  // Build role-tailored minimalist navigation menu items:
  // Strictly adhering to RBAC separation and removing duplicates:
  // 1. FARMER: Home, Explore Fleet, My Bookings
  // 2. VEHICLE_OWNER: Home, Owner Work Inbox, My Tractor Listings, Add New Tractor
  // 3. ADMIN: Overview, Manage Farmers, Manage Vehicle Owners, Tractor Fleet, Pending Verification, All Bookings
  const menuItems = (() => {
    if (currentFarmer) {
      return [
        { id: 'home', label: isTe ? 'హోమ్' : 'Home', icon: '🏡' },
        { id: 'find-tractor', label: isTe ? 'ఫ్లీట్‌ను అన్వేషించండి' : 'Explore Fleet', icon: '🚜' },
        { id: 'my-bookings', label: isTe ? 'నా బుకింగ్‌లు' : 'My Bookings', icon: '📋' }
      ];
    }
    
    if (currentOwner) {
      return [
        { id: 'home', label: isTe ? 'హోమ్' : 'Home', icon: '🏡' },
        { id: 'owner-inbox', label: isTe ? 'వర్క్ ఇన్‌బాక్స్' : 'Work Inbox', icon: '📮', badge: pendingCount > 0 ? pendingCount : null },
        { id: 'owner-listings', label: isTe ? 'నా ట్రాక్టర్లు' : 'My Tractors', icon: '🚜' },
        { id: 'owner-registration', label: isTe ? 'ట్రాక్టర్‌ను జోడించండి' : 'Add Tractor', icon: '➕' }
      ];
    }
    
    if (isAdminLoggedIn) {
      return [
        { id: 'admin-dashboard', label: isTe ? 'అవలోకనం' : 'Overview', icon: '📊' },
        { id: 'admin-farmers', label: isTe ? 'రైతుల నిర్వహణ' : 'Manage Farmers', icon: '👨‍🌾' },
        { id: 'admin-owners', label: isTe ? 'యజమానుల నిర్వహణ' : 'Manage Owners', icon: '🚜' },
        { id: 'admin-tractors', label: isTe ? 'ట్రాక్టర్ల జాబితా' : 'Tractor Fleet', icon: '📋' },
        { id: 'admin-verification', label: isTe ? 'ధృవీకరణ స్థితి' : 'Pending Verification', icon: '⏳' },
        { id: 'admin-bookings', label: isTe ? 'అన్ని బుకింగ్‌లు' : 'All Bookings', icon: '📑' }
      ];
    }

    // Guest / Public Browser
    return [
      { id: 'home', label: isTe ? 'హోమ్' : 'Home', icon: '🏡' },
      { id: 'find-tractor', label: isTe ? 'ఫ్లీట్‌ను అన్వేషించండి' : 'Explore Fleet', icon: '🚜' },
      { id: 'portal-select', label: isTe ? 'సైన్ ఇన్' : 'Sign In', icon: '🔑' }
    ];
  })();

  const villageName = selectedLocation
    ? (isTe ? (selectedLocation.villageTe || selectedLocation.village) : selectedLocation.village)
    : 'Hasanparthy';
  
  const helplineNum = selectedLocation?.helpline || '1800-425-1122';

  const isItemActive = (item) => {
    if (activePage === item.id) return true;
    if (item.id === 'admin-dashboard' && activePage === 'admin-dashboard' && (!adminActiveTab || adminActiveTab === 'overview')) return true;
    if (item.id === 'admin-farmers' && activePage === 'admin-dashboard' && adminActiveTab === 'farmers') return true;
    if (item.id === 'admin-owners' && activePage === 'admin-dashboard' && adminActiveTab === 'owners') return true;
    if (item.id === 'admin-tractors' && activePage === 'admin-dashboard' && adminActiveTab === 'fleet') return true;
    if (item.id === 'admin-verification' && activePage === 'admin-dashboard' && adminActiveTab === 'verifications') return true;
    if (item.id === 'admin-bookings' && activePage === 'admin-dashboard' && adminActiveTab === 'bookings') return true;
    return false;
  };

  return (
    <>
      <div 
        className={`sidebar-overlay ${isMobileOpen ? 'open' : ''}`} 
        onClick={closeMobileMenu}
        aria-hidden="true"
      />
      <aside className={`app-sidebar ${isMobileOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Minimalist Sidebar Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-header-left">
            <span className="brand-icon">🌾</span>
            {!isCollapsed && (
              <div className="brand-text">
                <h1>{t.brandName || 'AgriRent'}</h1>
                <small>{t.brandSubtitle || 'TRACTOR SERVICES'}</small>
              </div>
            )}
          </div>
          {/* Mobile close button */}
          <button
            type="button"
            className="sidebar-close-btn mobile-only"
            onClick={closeMobileMenu}
            aria-label="Close Navigation Menu"
            title={isTe ? "మెనూ మూసివేయండి" : "Close Menu"}
          >
            ✕
          </button>
          {/* Desktop collapse toggle button */}
          {onToggleCollapse && (
            <button
              type="button"
              className="sidebar-collapse-btn desktop-only"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={isCollapsed ? (isTe ? "విస్తరించండి" : "Expand Sidebar") : (isTe ? "కుదించండి" : "Collapse Sidebar")}
            >
              {isCollapsed ? '⇥' : '⇤'}
            </button>
          )}
        </div>

        {/* Clean Essential Navigation Items */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const active = isItemActive(item);
            const cleanLabel = (item.label || '')
              .replace(/[\p{Emoji}\p{Extended_Pictographic}\u200d\uFE0F]/gu, '')
              .trim();

            return (
              <button
                key={item.id}
                type="button"
                className={`nav-link ${active ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? cleanLabel : ''}
              >
                <div className="nav-link-content">
                  <span className="nav-icon-single">{item.icon}</span>
                  {!isCollapsed && <span className="nav-label-text">{cleanLabel}</span>}
                </div>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </button>
            );
          })}
        </nav>

        {/* Minimalist Bottom Footer - Excluded from Vehicle Owner per requirement 3 */}
        {!currentOwner && (
          <div className="sidebar-footer">
            <div className="helpline-compact" title={`Toll-Free Helpline: ${helplineNum} (${villageName})`}>
              <span className="helpline-icon">📞</span>
              {!isCollapsed && (
                <div className="helpline-text-block">
                  <span className="helpline-label">{isTe ? 'హెల్ప్‌లైన్' : 'Helpline'}</span>
                  <span className="helpline-number">{helplineNum}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
