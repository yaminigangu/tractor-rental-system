import { translations } from '../translations';
import AuthShowcasePanel from '../components/AuthShowcasePanel';

export default function DualLoginSelect({
  setActivePage,
  language = 'en',
  setLanguage,
  currentFarmer,
  setCurrentFarmer,
  selectedLocation
}) {
  const t = translations[language] || translations.en;
  const isTe = language === 'te';

  const toggleLanguage = () => {
    if (setLanguage) {
      setLanguage(prev => (prev === 'en' ? 'te' : 'en'));
    }
  };

  // If already authenticated as a Farmer, directly login and go to marketplace!
  const handleFarmerPortalClick = () => {
    const existingFarmer = currentFarmer || (() => {
      try {
        const s = localStorage.getItem('agri_current_farmer');
        return s ? JSON.parse(s) : null;
      } catch {
        return null;
      }
    })();

    if (existingFarmer) {
      if (setCurrentFarmer) {
        setCurrentFarmer(existingFarmer);
      }
      setActivePage('find-tractor');
    } else {
      setActivePage('farmer-login');
    }
  };

  return (
    <div className="signin-page-viewport page-anim">
      {/* Background Animated Floating Elements */}
      <div className="auth-bg-particles" aria-hidden="true">
        <span className="bg-particle p1">🌾</span>
        <span className="bg-particle p2">✨</span>
        <span className="bg-particle p3">🌱</span>
        <span className="bg-particle p4">🚜</span>
        <span className="bg-particle p5">✨</span>
        <span className="bg-particle p6">🌾</span>
      </div>

      <div className="auth-split-layout">
        {/* Left Side 3D Showcase Panel on Desktop */}
        <AuthShowcasePanel isTe={isTe} portalType="all" />

        {/* Right Side Card Side */}
        <div className="auth-card-side">
          {/* Top Header Bar matching Screenshot 1 */}
          <header className="signin-top-nav">
            <div className="signin-brand-group">
              <div className="signin-brand-logo">
                <span className="signin-sprout-icon">🌾</span>
              </div>
              <div className="signin-brand-text">
                <h1 className="signin-brand-title">Agrirent</h1>
                <span className="signin-brand-subtitle">
                  {isTe ? 'వ్యవసాయ యంత్రాల అద్దె వేదిక' : 'Farm Machinery Rental Platform'}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="signin-lang-pill"
              onClick={toggleLanguage}
              title={isTe ? 'Switch to English' : 'తెలుగులోకి మార్చండి'}
            >
              🌐 {isTe ? 'తెలుగు ▾' : 'English ▾'}
            </button>
          </header>

          {/* Main Container Card matching Screenshot 1 */}
          <main className="signin-card-container">
            <div className="signin-main-card">
              {/* Main Title & Subtitle */}
              <h2 className="signin-heading" style={{ marginTop: '10px' }}>
                {isTe ? 'స్వాగతం! మీ సైన్-ఇన్ ఎంచుకోండి' : 'Welcome! Choose Your Sign-In'}
              </h2>
              <p className="signin-description">
                {isTe
                  ? 'సమీపంలోని ట్రాక్టర్లను అద్దెకు తీసుకోవడానికి లేదా హామీ ఇవ్వబడిన అద్దె ఆదాయం పొందడానికి యంత్రాలను నమోదు చేయడానికి సైన్ ఇన్ చేయండి.'
                  : 'Sign in to rent nearby tractors or register machinery to earn guaranteed rental income.'}
              </p>

              {/* Action Choice 1: Farmer Sign-In */}
              <button
                type="button"
                className="signin-choice-card choice-farmer"
                onClick={handleFarmerPortalClick}
              >
                <div className="signin-choice-icon-wrap icon-farmer">
                  <span className="signin-avatar-emoji">👨‍🌾</span>
                </div>
                <div className="signin-choice-info">
                  <h3 className="signin-choice-title title-farmer">
                    {isTe ? 'రైతు సైన్-ఇన్' : 'Farmer Sign-In'}
                  </h3>
                  <span className="signin-choice-sub">
                    {isTe ? 'యంత్రాలను అద్దెకు తీసుకోండి' : 'Rent Machinery'}
                  </span>
                </div>
              </button>

              {/* Action Choice 2: Vehicle Owner */}
              <button
                type="button"
                className="signin-choice-card choice-owner"
                onClick={() => setActivePage('owner-registration')}
              >
                <div className="signin-choice-icon-wrap icon-owner">
                  <span className="signin-avatar-emoji">🚜</span>
                </div>
                <div className="signin-choice-info">
                  <h3 className="signin-choice-title title-owner">
                    {isTe ? 'వాహన యజమాని' : 'Vehicle Owner'}
                  </h3>
                  <span className="signin-choice-sub">
                    {isTe ? '4-దశల KYC ధృవీకరణ' : '4-Step KYC Verification'}
                  </span>
                </div>
              </button>

              {/* Guest Browsing Link */}
              <div className="signin-guest-link-box">
                <span className="signin-guest-prompt">
                  {isTe ? 'కేవలం చూడాలనుకుంటున్నారా? ' : 'Just browsing? '}
                </span>
                <button
                  type="button"
                  className="signin-guest-btn"
                  onClick={() => setActivePage('find-tractor')}
                >
                  {isTe ? 'ట్రాక్టర్ మార్కెట్‌ప్లేస్‌ను అతిథిగా చూడండి →' : 'Explore Tractors Marketplace as Guest →'}
                </button>
              </div>
            </div>

            {/* Footer Norms Disclaimer */}
            <footer className="signin-safety-footer">
              <span className="signin-shield-icon">🛡️</span>
              <span>
                {isTe
                  ? 'తెలంగాణ రవాణా మరియు వ్యవసాయ భద్రతా సమాచార నిబంధనలకు అగ్రిరెంట్ కట్టుబడి ఉంటుంది.'
                  : 'Agrirent adheres to Telangana transport & agriculture safety data norms.'}
              </span>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
