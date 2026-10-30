export default function MobileBottomNav({ 
  activePage, 
  setActivePage, 
  pendingCount = 2, 
  language = 'en' 
}) {
  const isTe = language === 'te';

  const navItems = [
    {
      id: 'find-tractor',
      label: isTe ? 'అన్వేషించండి' : 'Explore',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
          <path d="M5 17h-2v-4l2-3h7v7" />
          <path d="M12 10h4l2 3h2v4h-3" />
          <path d="M7 10V6h4v4" />
        </svg>
      )
    },
    {
      id: 'my-bookings',
      label: isTe ? 'బుకింగ్స్' : 'Bookings',
      badge: 2,
      badgeColor: '#ef4444',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    },
    {
      id: 'owner-inbox',
      label: isTe ? 'చాట్' : 'Chat',
      badge: 2,
      badgeColor: '#0284c7',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    },
    {
      id: 'farmer-login',
      label: isTe ? 'ప్రొఫైల్' : 'Profile',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    }
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation Bar">
      {navItems.map((item) => {
        const isActive = activePage === item.id || (item.id === 'find-tractor' && activePage === 'home');
        return (
          <button
            key={item.id}
            type="button"
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => {
              setActivePage(item.id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="bottom-nav-icon-wrap">
              {item.icon}
              {item.badge && (
                <span 
                  className="bottom-nav-badge" 
                  style={{ background: item.badgeColor || '#ef4444' }}
                >
                  {item.badge}
                </span>
              )}
            </div>
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
