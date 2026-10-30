import { useState } from 'react';

export default function PwaInstallPrompt({
  language = 'en',
  pwa
}) {
  const isTe = language === 'te';
  const { isInstallable, isInstalled, isIos, showIosGuide, setShowIosGuide, promptInstall } = pwa;

  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('agri_pwa_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('agri_pwa_dismissed', 'true');
    } catch (e) {
      console.warn(e);
    }
  };

  // If already installed as app or dismissed for this session, hide floating banner
  const shouldShowBanner = !isInstalled && !isDismissed && (isInstallable || isIos);

  return (
    <>
      {/* Floating Bottom App Installation Card */}
      {shouldShowBanner && (
        <div className="pwa-install-banner page-anim" role="alert">
          <div className="pwa-banner-content">
            <img
              src="/pwa-192.png"
              alt="AgriRent App"
              className="pwa-banner-icon"
            />
            <div className="pwa-banner-text">
              <div className="pwa-banner-title-row">
                <h4>{isTe ? 'యాప్ ఇన్‌స్టాల్ చేసుకోండి' : 'Install AgriRent App'}</h4>
                <span className="pwa-badge-pwa">PWA</span>
              </div>
              <p>
                {isTe
                  ? 'మొబైల్ హోమ్ స్క్రీన్‌పై ఉంచండి • ఆఫ్‌లైన్‌లో కూడా పనిచేస్తుంది'
                  : 'Add to Home Screen for fast offline access & instant farm booking'}
              </p>
            </div>
          </div>

          <div className="pwa-banner-actions">
            <button
              type="button"
              className="pwa-btn-install"
              onClick={promptInstall}
            >
              <span>📲</span>
              <span>{isTe ? 'ఇన్‌స్టాల్' : 'Install'}</span>
            </button>
            <button
              type="button"
              className="pwa-btn-close"
              onClick={handleDismiss}
              aria-label="Close"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Guide Modal for iOS Safari / Manual Installation */}
      {showIosGuide && (
        <div className="receipt-modal-backdrop" style={{ zIndex: 99999 }}>
          <div className="receipt-modal-card" style={{ maxWidth: '440px', padding: '26px 22px' }}>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <img
                src="/pwa-192.png"
                alt="AgriRent App"
                style={{ width: '68px', height: '68px', borderRadius: '18px', boxShadow: '0 6px 16px rgba(0,0,0,0.18)' }}
              />
              <h3 style={{ fontSize: '20px', marginTop: '12px', fontWeight: 800, color: '#0f172a' }}>
                {isTe ? 'AgriRent యాప్‌ను ఇన్‌స్టాల్ చేయండి' : 'Install AgriRent on your Device'}
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                {isTe
                  ? 'యాప్ స్టోర్ లేదా ప్లేస్టోర్ అవసరం లేకుండా నేరుగా ఇన్‌స్టాల్ అవుతుంది'
                  : 'Installs directly on home screen with zero app store download'}
              </p>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', fontSize: '13.5px', lineHeight: 1.6, color: '#334155' }}>
              {isIos ? (
                <>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '20px' }}>1️⃣</span>
                    <span>{isTe ? 'సఫారి బ్రౌజర్ దిగువన ఉన్న <strong>షేర్ చిహ్నం (⎋)</strong> నొక్కండి' : 'Tap the Safari <strong>Share button (⎋)</strong> at the bottom'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '20px' }}>2️⃣</span>
                    <span>{isTe ? 'మెనులో క్రిందికి స్క్రోల్ చేసి <strong>"హోమ్ స్క్రీన్‌కు జోడించు" (➕)</strong> ఎంచుకోండి' : 'Scroll down & tap <strong>"Add to Home Screen" (➕)</strong>'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px' }}>3️⃣</span>
                    <span>{isTe ? 'ఎగువ కుడివైపున <strong>"Add"</strong> నొక్కండి. యాప్ సిద్ధం!' : 'Tap <strong>"Add"</strong> in top right. You now have AgriRent App!'}</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '20px' }}>1️⃣</span>
                    <span>{isTe ? 'బ్రౌజర్ ఎగువ కుడివైపు <strong>మెను (⋮)</strong> నొక్కండి' : 'Tap the browser <strong>menu (⋮)</strong> in the top right'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '20px' }}>2️⃣</span>
                    <span>{isTe ? '<strong>"యాప్ ఇన్‌స్టాల్ చేయండి"</strong> లేదా "Install app" ఎంచుకోండి' : 'Tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px' }}>3️⃣</span>
                    <span>{isTe ? 'ఇన్‌స్టాల్ పూర్తి అయిన తర్వాత నేరుగా హోమ్‌స్క్రీన్‌నుండి తెరవవచ్చు' : 'Once installed, open AgriRent directly from your apps list!'}</span>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              className="btn btn-primary w-100"
              style={{ marginTop: '20px', padding: '13px', fontWeight: 800, fontSize: '15px' }}
              onClick={() => setShowIosGuide(false)}
            >
              ✓ {isTe ? 'సరే, అర్థమైంది' : 'Got it!'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
