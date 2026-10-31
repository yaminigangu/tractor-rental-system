export default function AuthShowcasePanel({ isTe = false, portalType = 'all' }) {
  const isOwner = portalType === 'owner';
  const isFarmer = portalType === 'farmer';

  return (
    <aside className="auth-desktop-showcase page-anim" aria-label="Platform Highlights">
      <div className="auth-showcase-visual-card">
        {/* 3D Perspective Tractor Hero Visual */}
        <div className="auth-tractor-hero-frame">
          <img
            src="/images/mahindra_575.jpg"
            alt="Telangana Farm Machinery Tractor"
            className="auth-tractor-hero-img"
          />
          <div className="auth-tractor-hero-overlay" />

          {/* Floating 3D Animated Badges */}
          <div className="auth-float-badge badge-top-right">
            <span className="float-badge-icon">⚡</span>
            <div>
              <strong>{isTe ? '~15 నిమిషాల రాక' : '~15 Mins Dispatch'}</strong>
              <small>{isTe ? 'తక్షణ గ్రామ డెలివరీ' : 'Quick Village Response'}</small>
            </div>
          </div>

          <div className="auth-float-badge badge-bottom-left">
            <span className="float-badge-icon">🛡️</span>
            <div>
              <strong>{isTe ? '100% RC ధృవీకరణ' : '100% KYC & RC Verified'}</strong>
              <small>{isTe ? 'సురక్షిత యంత్రాలు' : 'Trusted Local Fleet'}</small>
            </div>
          </div>

          <div className="auth-float-badge badge-bottom-right">
            <span className="float-badge-icon">💰</span>
            <div>
              <strong>{isTe ? '0% కమీషన్' : '0% Commission'}</strong>
              <small>{isTe ? 'రైతు నుండి రైతుకు' : 'Direct Farmer-to-Farmer'}</small>
            </div>
          </div>
        </div>

        {/* Narrative & Platform Highlights */}
        <div className="auth-showcase-copy">
          <div className="auth-showcase-tag">
            🌾 {isTe ? 'తెలంగాణ 33 జిల్లాల నెట్‌వర్క్' : 'Telangana 33 Districts Network'}
          </div>

          <h2 className="auth-showcase-heading">
            {isOwner
              ? (isTe
                  ? 'మీ ట్రాక్టర్ & యంత్రాలతో నెలకు ₹40,000 - ₹80,000 అద్దె ఆదాయం పొందండి'
                  : 'Monetize Your Machinery • Earn Guaranteed Rental Income')
              : (isTe
                  ? 'తెలంగాణలో నమ్మకమైన ట్రాక్టర్ & వ్యవసాయ యంత్రాల అద్దె వేదిక'
                  : 'Direct On-Demand Farm Machinery & Tractor Rentals')}
          </h2>

          <p className="auth-showcase-sub">
            {isOwner
              ? (isTe
                  ? 'రైతుల నుండి నేరుగా ఆర్డర్లు, 0% కమీషన్, మరియు సురక్షిత చెల్లింపులతో మీ ఖాళీ యంత్రాలను లాభదాయకంగా మార్చుకోండి.'
                  : 'Zero brokerage, instant WhatsApp work orders, and direct payments from verified farmers across 33 mandal clusters.')
              : (isTe
                  ? 'హసన్‌పర్తి నుండి ఆదిలాబాద్ వరకు 5,000+ ట్రాక్టర్లు, రొటవేటర్లు మరియు హార్వెస్టర్ల యజమానులను నేరుగా స్థానిక గ్రామాల రైతులతో అనుసంధానించే వేదిక.'
                  : 'Connecting 5,000+ verified tractor, rotavator, and harvester owners directly with local farmers at transparent hourly rates.')}
          </p>

          {/* 4-Item Stats Grid */}
          <div className="auth-showcase-stats-grid">
            <div className="auth-stat-box">
              <span className="auth-stat-number">5,000+</span>
              <span className="auth-stat-label">{isTe ? 'నమోదిత యంత్రాలు' : 'Verified Fleet'}</span>
            </div>
            <div className="auth-stat-box">
              <span className="auth-stat-number">33</span>
              <span className="auth-stat-label">{isTe ? 'జిల్లాలు' : 'Districts'}</span>
            </div>
            <div className="auth-stat-box">
              <span className="auth-stat-number">0%</span>
              <span className="auth-stat-label">{isTe ? 'కమీషన్' : 'Platform Fee'}</span>
            </div>
            <div className="auth-stat-box">
              <span className="auth-stat-number">4.9 ★</span>
              <span className="auth-stat-label">{isTe ? 'రైతుల రేటింగ్' : 'Satisfaction'}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
