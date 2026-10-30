export default function TopNavBar({
  language = 'en',
  setLanguage,
  openDrawer,
  onBack,
  showBack = false,
  onBrandClick
}) {
  const isTe = language === 'te';

  return (
    <header className="native-top-navbar">
      <div className="native-nav-inner">
        {/* Left Cluster */}
        <div className="nav-left-cluster">
          {showBack && (
            <button
              type="button"
              className="nav-btn-icon back-arrow-btn"
              onClick={onBack}
              title={isTe ? 'వెనుకకు' : 'Back'}
            >
              ←
            </button>
          )}

          <button
            type="button"
            className="nav-btn-icon menu-hamburger-btn"
            onClick={openDrawer}
            title={isTe ? 'మెనూ' : 'Menu'}
          >
            ☰
          </button>

          <div className="nav-brand-group" onClick={onBrandClick} role="button" tabIndex={0}>
            <div className="brand-logo-badge">
              <span className="logo-emoji">🌾</span>
            </div>
            <div className="brand-text-stack">
              <div className="brand-heading-row">
                <span className="brand-main-text">Agrirent</span>
                <span className="region-mini-badge">
                  {isTe ? 'తెలంగాణ' : 'Telangana'}
                </span>
              </div>
              <div className="brand-sub-caption">
                {isTe ? 'రైతు & యంత్రాల వేదిక' : 'Machinery Rental'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Cluster */}
        <div className="nav-right-cluster">
          <button
            type="button"
            className="native-lang-pill-yellow"
            onClick={() => setLanguage(language === 'en' ? 'te' : 'en')}
            title="Switch Language"
          >
            <span>🌐</span>
            <span>{language === 'en' ? 'తెలుగు' : 'English'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
