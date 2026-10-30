export default function BottomTabBar({
  activeTab = 'explore',
  onSelectTab,
  bookingsCount = 2,
  chatCount = 2,
  language = 'en',
  isLoggedIn = false
}) {
  const isTe = language === 'te';

  return (
    <nav className="native-bottom-dock" aria-label="Bottom Navigation">
      <div className="native-dock-inner">
        {/* 1. Explore */}
        <button
          type="button"
          className={`dock-tab-btn ${activeTab === 'explore' ? 'active' : ''}`}
          onClick={() => onSelectTab('explore')}
        >
          <div className="dock-icon-wrapper">
            <span className="dock-icon">🚜</span>
          </div>
          <span className="dock-label">
            {isTe ? 'అన్వేషించండి' : 'Explore'}
          </span>
        </button>

        {/* 2. Bookings */}
        <button
          type="button"
          className={`dock-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => onSelectTab('bookings')}
        >
          <div className="dock-icon-wrapper">
            <span className="dock-icon">📅</span>
            {bookingsCount > 0 && (
              <span className="dock-badge red-badge">{bookingsCount}</span>
            )}
          </div>
          <span className="dock-label">
            {isTe ? 'బుకింగ్‌లు' : 'Bookings'}
          </span>
        </button>

        {/* 3. Chat */}
        <button
          type="button"
          className={`dock-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => onSelectTab('chat')}
        >
          <div className="dock-icon-wrapper">
            <span className="dock-icon">💬</span>
            {chatCount > 0 && (
              <span className="dock-badge blue-badge">{chatCount}</span>
            )}
          </div>
          <span className="dock-label">
            {isTe ? 'చాట్' : 'Chat'}
          </span>
        </button>

        {/* 4. Profile */}
        <button
          type="button"
          className={`dock-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => onSelectTab('profile')}
        >
          <div className="dock-icon-wrapper">
            <span className="dock-icon">👤</span>
          </div>
          <span className="dock-label">
            {isTe ? 'ప్రొఫైల్' : 'Profile'}
          </span>
        </button>
      </div>
    </nav>
  );
}

