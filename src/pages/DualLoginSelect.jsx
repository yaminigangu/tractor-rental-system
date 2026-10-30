import { translations } from '../translations';

export default function DualLoginSelect({
  setActivePage,
  language = 'en',
  currentFarmer,
  currentOwner,
  selectedLocation
}) {
  const t = translations[language] || translations.en;
  const isTe = language === 'te';

  const villageName = selectedLocation
    ? `${isTe ? (selectedLocation.villageTe || selectedLocation.village) : selectedLocation.village}, ${isTe ? (selectedLocation.districtTe || selectedLocation.district) : selectedLocation.district}`
    : 'Hasanparthy, Hanamkonda';

  return (
    <div className="dual-login-page-wrapper page-anim">
      <div className="dual-login-container">
        {/* Top Header & Branding */}
        <div className="dual-login-header">
          <div className="dual-login-brand-badge">
            <span className="dual-badge-icon">🌾</span>
            <span className="dual-badge-text">
              {isTe ? 'అగ్రిరెంట్ తెలంగాణ నెట్‌వర్క్' : 'AgriRent Telangana Network'}
            </span>
          </div>

          <h1 className="dual-login-title">
            {isTe ? 'లాగిన్ ఎంచుకోండి' : 'Choose Your Login'}
          </h1>
          <p className="dual-login-subtitle">
            {isTe
              ? 'మీరు రైతులా లేక ట్రాక్టర్ యజమానిలా? క్రింది సంబంధిత పోర్టల్‌ను ఎంచుకుని సులభంగా లాగిన్ అవ్వండి.'
              : 'Are you a Farmer hiring machinery or a Tractor Owner listing equipment? Select your login portal below to continue into the web-app.'}
          </p>

          <div className="dual-location-pill">
            📍 {villageName}
          </div>
        </div>

        {/* 2 Login Cards Grid */}
        <div className="dual-cards-grid">
          {/* CARD 1: FARMER LOGIN */}
          <div
            className="dual-role-card farmer-role-card"
            onClick={() => setActivePage('farmer-login')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setActivePage('farmer-login')}
          >
            <div className="dual-card-top">
              <span className="dual-role-pill farmer-pill">
                {isTe ? '🌾 రైతు పోర్టల్' : '🌾 Farmer Portal'}
              </span>
              <div className="dual-avatar-circle farmer-circle">
                <span className="dual-avatar-emoji">👨‍🌾</span>
              </div>
            </div>

            <h2 className="dual-card-title">
              {isTe ? 'రైతు లాగిన్' : 'Farmer Login'}
            </h2>
            <p className="dual-card-desc">
              {isTe
                ? 'మీ వ్యవసాయ పనుల కోసం ట్రాక్టర్లు, రొటవేటర్లు, హార్వెస్టర్లు & విత్తన యంత్రాలను సులభంగా బుక్ చేసుకోండి.'
                : 'Book certified tractors, rotavators, harvesters & precision seeders directly for your fields.'}
            </p>

            <ul className="dual-card-features">
              <li>
                <span className="feat-check">✓</span>
                <span>{isTe ? 'నమోదైన రైతులకు మొబైల్ నంబర్ / పేరుతో నేరుగా లాగిన్' : 'Existing farmers log in directly via mobile or name'}</span>
              </li>
              <li>
                <span className="feat-check">✓</span>
                <span>{isTe ? 'కొత్త రైతులు 1-నిమిషంలో ఆన్‌బోర్డింగ్ పూర్తి చేయవచ్చు' : 'New farmers routed to quick 1-minute onboarding'}</span>
              </li>
              <li>
                <span className="feat-check">✓</span>
                <span>{isTe ? 'గ్రామంలో సిద్ధంగా ఉన్న ట్రాక్టర్లు & ప్రత్యక్ష ధరల వివరాలు' : 'Instant access to nearby fleet, live rates & booking'}</span>
              </li>
            </ul>

            {currentFarmer && (
              <div className="dual-logged-banner farmer-logged">
                ✓ Logged in as: <strong>{currentFarmer.name}</strong>
              </div>
            )}

            <button
              type="button"
              className="dual-action-btn farmer-btn"
              onClick={(e) => {
                e.stopPropagation();
                setActivePage('farmer-login');
              }}
            >
              <span>{isTe ? 'రైతుగా లాగిన్ అవ్వండి →' : 'Continue as Farmer →'}</span>
            </button>
          </div>

          {/* CARD 2: TRACTOR OWNER LOGIN */}
          <div
            className="dual-role-card owner-role-card"
            onClick={() => setActivePage('owner-registration')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setActivePage('owner-registration')}
          >
            <div className="dual-card-top">
              <span className="dual-role-pill owner-pill">
                {isTe ? '🚜 యజమాని / కెప్టెన్ పోర్టల్' : '🚜 Tractor Owner Portal'}
              </span>
              <div className="dual-avatar-circle owner-circle">
                <span className="dual-avatar-emoji">🚜</span>
              </div>
            </div>

            <h2 className="dual-card-title">
              {isTe ? 'ట్రాక్టర్ యజమాని లాగిన్' : 'Tractor Owner Login'}
            </h2>
            <p className="dual-card-desc">
              {isTe
                ? 'మీ ట్రాక్టర్ & పరికరాలను నమోదు చేసి, స్థానిక రైతుల నుండి బుకింగ్ ఆర్డర్లు పొంది రోజూ అద్దె ఆదాయం సంపాదించండి.'
                : 'List machinery, accept booking orders from local farmers, and earn steady rental income across Telangana.'}
            </p>

            <ul className="dual-card-features">
              <li>
                <span className="feat-check">✓</span>
                <span>{isTe ? 'ఇప్పటికే ఉన్న యజమానులకు మొబైల్ / RC తో నేరుగా లాగిన్' : 'Existing owners log in directly to Owner Inbox'}</span>
              </li>
              <li>
                <span className="feat-check">✓</span>
                <span>{isTe ? 'కొత్త యంత్రాల కోసం 4-దశల సులభమైన KYC ధృవీకరణ' : 'New owners complete the 4-step KYC authentication'}</span>
              </li>
              <li>
                <span className="feat-check">✓</span>
                <span>{isTe ? 'రైతుల నుండి బుకింగ్ అభ్యర్థనలను ప్రత్యక్షంగా నిర్వహించండి' : 'Real-time booking management & UPI payouts'}</span>
              </li>
            </ul>

            {currentOwner && (
              <div className="dual-logged-banner owner-logged">
                ✓ Logged in as: <strong>{currentOwner.fullName}</strong>
              </div>
            )}

            <button
              type="button"
              className="dual-action-btn owner-btn"
              onClick={(e) => {
                e.stopPropagation();
                setActivePage('owner-registration');
              }}
            >
              <span>{isTe ? 'యజమానిగా లాగిన్ అవ్వండి →' : 'Continue as Tractor Owner →'}</span>
            </button>
          </div>
        </div>

        {/* Footer Guest Browsing Link & Helpline */}
        <div className="dual-login-footer">
          <button
            type="button"
            className="dual-guest-btn"
            onClick={() => setActivePage('find-tractor')}
          >
            🔍 {isTe ? 'లాగిన్ లేకుండా ట్రాక్టర్ల వివరాలు చూడండి (అతిథి మోడ్) →' : 'Browse Tractor Fleet Without Login (Guest View) →'}
          </button>

          <div className="dual-helpline-tag">
            <span>📞 {isTe ? 'రైతు & యజమాని టోల్-ఫ్రీ హెల్ప్‌లైన్:' : 'Farmer & Owner 24/7 Helpline:'}</span>
            <strong>1800-425-1122 / 9032004060</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
