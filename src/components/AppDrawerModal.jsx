export default function AppDrawerModal({
  isOpen,
  onClose,
  currentUser,
  language = 'en',
  onSelectMenu,
  onSignOut,
  onOpenSettings,
  bookingsCount = 2,
  chatCount = 2
}) {
  if (!isOpen) return null;

  const isTe = language === 'te';
  const isOwner = currentUser?.role === 'owner';
  const displayName = currentUser?.name || (isOwner ? 'G. Srinivas Rao' : 'N. Ramesh Kumar');
  const roleBadge = isOwner
    ? (isTe ? '✓ ధృవీకరించబడిన యజమాని' : '✓ Verified Tractor Owner')
    : (isTe ? '✓ ధృవీకరించబడిన రైతు' : '✓ Verified Farmer');

  const menuItems = [
    {
      id: 'fleet',
      emoji: '🚜',
      title: isTe ? 'ట్రాక్టర్లు & యంత్రాలు' : 'Tractors & Machinery',
      subtitle: isTe ? 'రైతు అద్దె మార్కెట్‌ప్లేస్' : 'Instant Machinery Marketplace',
    },
    {
      id: 'bookings',
      emoji: '📋',
      title: isTe ? 'నా బుకింగ్‌లు & అద్దెలు' : 'My Bookings & Rentals',
      subtitle: isTe ? 'ప్రత్యక్ష అద్దె ట్రాకింగ్ & రసీదులు' : 'Live Rental Tracking & Receipts',
      badge: bookingsCount
    },
    {
      id: 'chat',
      emoji: '💬',
      title: isTe ? 'లైవ్ చాట్ & అలర్ట్‌లు' : 'Live Chat & Alerts',
      subtitle: isTe ? 'ప్రత్యక్ష యాప్ సందేశాలు & WhatsApp' : 'Direct In-App Messages & WhatsApp',
      badge: chatCount
    },
    {
      id: 'profile',
      emoji: '👤',
      title: isTe ? 'నా ప్రొఫైల్ & కార్యకలాపాలు' : 'My Profile & Activity',
      subtitle: isTe ? 'ఖాతా వివరాలు & యాక్టివిటీ లాగ్' : 'Account Details & Activity Log',
    },
    {
      id: 'settings',
      emoji: '⚙️',
      title: isTe ? 'సెట్టింగ్‌లు' : 'Settings',
      subtitle: isTe ? 'భాష, ప్రాధాన్యతలు & లాగ్ అవుట్' : 'Language, Preferences & Logout',
    },
    {
      id: 'about',
      emoji: 'ℹ️',
      title: isTe ? 'అగ్రిరెంట్ గురించి' : 'About Agrirent',
      subtitle: isTe ? 'లక్ష్యం & భద్రతా ప్రమాణాలు' : 'Mission & Safety Standards',
    },
    {
      id: 'help',
      emoji: '📞',
      title: isTe ? 'హెల్ప్‌లైన్ & మద్దతు' : 'Helpline & Support',
      subtitle: isTe ? 'కిసాన్ మద్దతు & టోల్-ఫ్రీ లైన్' : 'Kisan Support & Toll-Free Line',
    },
  ];

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header matching Screenshot 6 */}
        <div className="drawer-header">
          <div className="drawer-brand-box">
            <span className="drawer-brand-icon">🌾</span>
            <div>
              <div className="drawer-brand-title">Agrirent</div>
              <div className="drawer-brand-sub">
                {isTe ? 'వ్యవసాయ యంత్రాల అద్దె వేదిక' : 'Machinery Rental Platform'}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Profile Card matching Screenshot 6 */}
        <div
          className="drawer-profile-card"
          onClick={() => {
            onClose();
            onSelectMenu('profile');
          }}
        >
          <div className="profile-card-left">
            <div className="profile-avatar-circle">
              <span>{isOwner ? '🚜' : '👨‍🌾'}</span>
            </div>
            <div className="profile-text-group">
              <div className="profile-full-name">{displayName}</div>
              <div className="profile-verified-tag">{roleBadge}</div>
            </div>
          </div>
          <span className="profile-chevron">›</span>
        </div>

        {/* Menu Items List matching Screenshot 6 */}
        <div className="drawer-menu-list">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="drawer-menu-item"
              onClick={() => {
                onClose();
                onSelectMenu(item.id);
              }}
            >
              <div className="menu-item-left">
                <div className="menu-icon-box">
                  <span className="menu-emoji">{item.emoji}</span>
                </div>
                <div className="menu-text-stack">
                  <div className="menu-title">{item.title}</div>
                  <div className="menu-subtitle">{item.subtitle}</div>
                </div>
              </div>

              <div className="menu-item-right">
                {item.badge && item.badge > 0 && (
                  <span className="menu-red-badge">{item.badge}</span>
                )}
                <span className="menu-chevron">›</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Actions matching Screenshot 6 */}
        <div className="drawer-bottom-actions">
          <button
            type="button"
            className="drawer-action-btn green-action"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
          >
            <span className="action-bullet">•</span>
            <span>⚙️</span>
            <span>{isTe ? 'భాష & సెట్టింగ్‌లు' : 'Language & Settings'}</span>
          </button>

          <button
            type="button"
            className="drawer-action-btn red-action"
            onClick={() => {
              onClose();
              onSignOut();
            }}
          >
            <span>🚪</span>
            <span>{isTe ? 'ఖాతా నుండి నిష్క్రమించండి' : 'Sign Out of Account'}</span>
          </button>

          <div className="drawer-version-stamp">
            Agrirent Mobile Native v2.5.0 • Telangana
          </div>
        </div>
      </aside>
    </div>
  );
}

