import { useState, useEffect } from 'react';

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // 1. Detect if running as standalone PWA
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(Boolean(isStandaloneMode));
    };

    checkStandalone();
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkStandalone);

    // 2. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    setIsIos(isIosDevice);

    // 3. Listen for browser install prompt (Chrome / Edge / Android)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('[PWA] beforeinstallprompt event captured');
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('[PWA] AgriRent successfully installed as PWA');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener('change', checkStandalone);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
      return choiceResult.outcome;
    } else if (isIos) {
      setShowIosGuide(true);
      return 'ios_guide';
    } else {
      // If prompt is not available, show guide modal
      setShowIosGuide(true);
      return 'manual_guide';
    }
  };

  return {
    isInstallable,
    isInstalled,
    isIos,
    showIosGuide,
    setShowIosGuide,
    promptInstall
  };
}
