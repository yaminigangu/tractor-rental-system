export default function MobileBottomNav({ 
  activePage, 
  setActivePage, 
  pendingCount = 0, 
  language = 'en' 
}) {
  const isTe = language === 'te';

  const navItems = [
    {
      id: 'home',
      label: isTe ? 'హోమ్' : 'Home',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    },
    {
      id: 'find-tractor',
      label: isTe ? 'ట్రాక్టర్లు' : 'Fleet',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
          <path d="M5 17h-2v-4l2-3h7v7" />
          <path d="M12 10h4l2 3h2v4h-3" />
          <path d="M7 10V6h4v4" />
        </svg>
      )
    },
    {
      id: 'booking-form',
      label: isTe ? 'బుకింగ్' : 'Book',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <path d="M9 12h6" />
          <path d="M9 16h6" />
        </svg>
      )
    },
    {
      id: 'owner-inbox',
      label: isTe ? 'ఇన్‌బాక్స్' : 'Inbox',
      badge: pendingCount > 0 ? pendingCount : null,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>
      )
    },
    {
      id: 'my-bookings',
      label: isTe ? 'ఆర్డర్లు' : 'Orders',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
    }
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation Bar">
      {navItems.map((item) => {
        const isActive = activePage === item.id;
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
              {item.badge && <span className="bottom-nav-badge">{item.badge}</span>}
            </div>
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
