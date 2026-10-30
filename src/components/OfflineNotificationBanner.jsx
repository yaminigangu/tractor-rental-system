import { useState, useEffect } from 'react';

export default function OfflineNotificationBanner({ language = 'en' }) {
  const isTe = language === 'te';
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [showRestoredNotice, setShowRestoredNotice] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestoredNotice(true);
      const timer = setTimeout(() => setShowRestoredNotice(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestoredNotice(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showRestoredNotice) {
    return null;
  }

  return (
    <div
      className={`pwa-network-status-bar ${isOnline ? 'status-online' : 'status-offline'} page-anim`}
      role="status"
    >
      <div className="network-status-inner">
        {isOnline ? (
          <>
            <span className="network-dot dot-online"></span>
            <span>
              {isTe
                ? '🟢 తిరిగి ఇంటర్నెట్‌కి కనెక్ట్ అయ్యారు! ప్రత్యక్ష డేటా సింక్ అవుతోంది.'
                : '🟢 Back Online! Live syncing with village fleet.'}
            </span>
          </>
        ) : (
          <>
            <span className="network-dot dot-offline"></span>
            <span>
              {isTe
                ? '📶 ఆఫ్‌లైన్ మోడ్: ఇంటర్నెట్ లేదు, కానీ మునుపటి ట్రాక్టర్లు & బుకింగ్స్ అందుబాటులో ఉన్నాయి.'
                : '📶 Offline Mode: No internet connection. You can still browse saved tractors and view bookings.'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
