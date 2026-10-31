import { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ReceiptModal from './components/ReceiptModal';
import LocationModal from './components/LocationModal';
import MobileBottomNav from './components/MobileBottomNav';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import OfflineNotificationBanner from './components/OfflineNotificationBanner';
import TractorLoadingScreen from './components/TractorLoadingScreen';
import Home from './pages/Home';
import FindTractor from './pages/FindTractor';
import TractorBooking from './pages/TractorBooking';
import OwnerRegistration from './pages/OwnerRegistration';
import OwnerLogin from './pages/OwnerLogin';
import FarmerLogin from './pages/FarmerLogin';
import FarmerOnboarding from './pages/FarmerOnboarding';
import OwnerInbox from './pages/OwnerInbox';
import MyBookings from './pages/MyBookings';
import Dashboard from './pages/Dashboard';
import AdminLogin from './pages/AdminLogin';
import DualLoginSelect from './pages/DualLoginSelect';
import { DEFAULT_LOCATION } from './data/telanganaLocations';
import { buildFleetForLocation } from './data/fleetData';
import { fetchRegionWeather, getFallbackWeather } from './services/weatherService';
import { usePwaInstall } from './hooks/usePwaInstall';

const DEFAULT_BOOKINGS = [
  {
    id: 101,
    farmerName: "Kondal Rao",
    farmerMobile: "9848022334",
    farmerVillage: "Hasanparthy",
    workType: "Ploughing",
    landArea: 3,
    bookingDate: new Date().toISOString().split('T')[0],
    estimatedHours: 4,
    estimatedCost: 4800,
    status: "Pending Approval",
    tractorModel: "Mahindra 475 DI XP Plus",
    tractorOwner: "Ramesh Kumar",
    ownerMobile: "9876543210",
    createdAt: "Today"
  },
  {
    id: 102,
    farmerName: "Venkat Swamy",
    farmerMobile: "9989011223",
    farmerVillage: "Velair",
    workType: "Rotavator",
    landArea: 2.5,
    bookingDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    estimatedHours: 3,
    estimatedCost: 3750,
    status: "Approved",
    tractorModel: "Swaraj 744 FE XT",
    tractorOwner: "Mallesh Reddy",
    ownerMobile: "9123456780",
    createdAt: "Yesterday"
  }
];

function App() {
  // Support PWA shortcuts and direct links via ?page=
  const [activePage, setActivePage] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const requestedPage = params.get('page');
      if (requestedPage) return requestedPage;
    } catch {
      // ignore
    }
    // If returning already logged-in farmer, go to find-tractor; if owner, go to owner-inbox
    try {
      if (localStorage.getItem('agri_current_farmer')) return 'find-tractor';
      if (localStorage.getItem('agri_current_owner')) return 'owner-inbox';
    } catch {
      // ignore
    }
    return 'portal-select'; // Opens dual login entry screen upon entering the web-app
  });

  const [activeRole, setActiveRole] = useState('farmer'); // 'farmer', 'owner', 'admin'
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [serviceFilter, setServiceFilter] = useState('All');
  const [selectedTractor, setSelectedTractor] = useState(null);
  const [receiptModalBooking, setReceiptModalBooking] = useState(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // PWA Installation Hook
  const pwa = usePwaInstall();

  // GSAP Tractor Loading Screen State with Emojis & Line Art
  const [isLoadingApp, setIsLoadingApp] = useState(true);

  // Active Logged-in Farmer State with LocalStorage
  const [currentFarmer, setCurrentFarmer] = useState(() => {
    try {
      const saved = localStorage.getItem('agri_current_farmer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleSetCurrentFarmer = (farmer) => {
    setCurrentFarmer(farmer);
    if (farmer) {
      setCurrentOwner(null);
      try {
        localStorage.removeItem('agri_current_owner');
      } catch (e) {
        console.warn(e);
      }
    }
  };

  useEffect(() => {
    try {
      if (currentFarmer) {
        localStorage.setItem('agri_current_farmer', JSON.stringify(currentFarmer));
      } else {
        localStorage.removeItem('agri_current_farmer');
      }
    } catch (e) {
      console.warn(e);
    }
  }, [currentFarmer]);

  // Active Logged-in Tractor Owner / Captain State with LocalStorage
  const [currentOwner, setCurrentOwner] = useState(() => {
    try {
      const saved = localStorage.getItem('agri_current_owner');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleSetCurrentOwner = (owner) => {
    setCurrentOwner(owner);
    if (owner) {
      setCurrentFarmer(null);
      try {
        localStorage.removeItem('agri_current_farmer');
      } catch (e) {
        console.warn(e);
      }
    }
  };

  useEffect(() => {
    try {
      if (currentOwner) {
        localStorage.setItem('agri_current_owner', JSON.stringify(currentOwner));
      } else {
        localStorage.removeItem('agri_current_owner');
      }
    } catch (e) {
      console.warn(e);
    }
  }, [currentOwner]);

  // Mobile number passed when redirecting new farmer to Onboarding
  const [onboardingMobile, setOnboardingMobile] = useState('');

  // Admin Login Authentication State with SessionStorage
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    try {
      return sessionStorage.getItem('agri_admin_logged_in') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('agri_admin_logged_in', isAdminLoggedIn ? 'true' : 'false');
    } catch (e) {
      console.error(e);
    }
  }, [isAdminLoggedIn]);

  // Language State with LocalStorage
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('agri_language') || 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('agri_language', language);
    } catch (e) {
      console.error(e);
    }
  }, [language]);

  // Selected Location State (Telangana District & Village) with LocalStorage
  const [selectedLocation, setSelectedLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('agri_selected_location');
      return saved ? JSON.parse(saved) : DEFAULT_LOCATION;
    } catch {
      return DEFAULT_LOCATION;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('agri_selected_location', JSON.stringify(selectedLocation));
    } catch (e) {
      console.error('Failed to save location to localStorage', e);
    }
  }, [selectedLocation]);

  // Dynamic Weather Data State for Selected Region
  const [weatherData, setWeatherData] = useState(() => getFallbackWeather(selectedLocation, language));
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetchRegionWeather(selectedLocation, language)
      .then((data) => {
        if (isMounted) {
          setWeatherData(data);
          setIsLoadingWeather(false);
        }
      })
      .catch((err) => {
        console.warn('Weather fetch error:', err);
        if (isMounted) {
          setIsLoadingWeather(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedLocation, language]);

  const handleSelectLocation = (newLoc) => {
    setIsLoadingWeather(true);
    setSelectedLocation(newLoc);
  };

  // Custom user-registered tractors (persisted across sessions)
  const [customTractors, setCustomTractors] = useState(() => {
    try {
      const saved = localStorage.getItem('agri_custom_tractors');
      if (saved) return JSON.parse(saved);
      const oldSaved = localStorage.getItem('agri_tractors');
      return oldSaved ? JSON.parse(oldSaved).filter(t => t.id > 17) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('agri_custom_tractors', JSON.stringify(customTractors));
    } catch (e) {
      console.error(e);
    }
  }, [customTractors]);

  // Dynamically built localized fleet tailored to the selected village & district + custom tractors
  const tractors = buildFleetForLocation(selectedLocation, customTractors);

  const setTractors = (updater) => {
    if (typeof updater === 'function') {
      const updated = updater(tractors);
      const newCustom = updated.filter(t => t.id > 17);
      setCustomTractors(newCustom);
    } else if (Array.isArray(updater)) {
      const newCustom = updater.filter(t => t.id > 17);
      setCustomTractors(newCustom);
    }
  };

  // Load Bookings from LocalStorage or Fallback
  const [bookings, setBookings] = useState(() => {
    try {
      const saved = localStorage.getItem('agri_bookings');
      return saved ? JSON.parse(saved) : DEFAULT_BOOKINGS;
    } catch {
      return DEFAULT_BOOKINGS;
    }
  });

  // Sync Bookings to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('agri_bookings', JSON.stringify(bookings));
    } catch (e) {
      console.error('Failed to save bookings to localStorage', e);
    }
  }, [bookings]);

  // Switch role actions with smart authentication routing
  const handleRoleChange = (role) => {
    setActiveRole(role);
    if (role === 'farmer') {
      if (currentFarmer) {
        setActivePage('find-tractor');
      } else {
        setActivePage('farmer-login');
      }
    } else if (role === 'owner') {
      if (currentOwner) {
        setActivePage('owner-inbox');
      } else {
        setActivePage('owner-registration');
      }
    } else if (role === 'admin') {
      setActivePage('admin-dashboard');
    }
  };

  const pendingCount = bookings.filter(b => b.status === 'Pending Approval').length;

  const renderPage = () => {
    switch (activePage) {
      case 'portal-select':
        return (
          <DualLoginSelect
            setActivePage={setActivePage}
            language={language}
            setLanguage={setLanguage}
            currentFarmer={currentFarmer}
            currentOwner={currentOwner}
            selectedLocation={selectedLocation}
          />
        );
      case 'home':
        return (
          <Home
            setActivePage={setActivePage}
            setServiceFilter={setServiceFilter}
            language={language}
            selectedLocation={selectedLocation}
            weatherData={weatherData}
            isLoadingWeather={isLoadingWeather}
            onOpenLocationPicker={() => setIsLocationModalOpen(true)}
          />
        );
      case 'find-tractor':
        return (
          <FindTractor
            tractors={tractors}
            setTractors={setTractors}
            setActivePage={setActivePage}
            setSelectedTractor={setSelectedTractor}
            serviceFilter={serviceFilter}
            setServiceFilter={setServiceFilter}
            language={language}
            selectedLocation={selectedLocation}
            weatherData={weatherData}
            isLoadingWeather={isLoadingWeather}
            onOpenLocationPicker={() => setIsLocationModalOpen(true)}
            isUserLoggedIn={isUserLoggedIn}
            currentOwner={currentOwner}
          />
        );
      case 'booking-form':
        return (
          <TractorBooking
            tractors={tractors}
            selectedTractor={selectedTractor}
            setSelectedTractor={setSelectedTractor}
            setBookings={setBookings}
            setActivePage={setActivePage}
            onBookingSuccess={(newB) => setReceiptModalBooking(newB)}
            language={language}
            selectedLocation={selectedLocation}
            currentFarmer={currentFarmer}
          />
        );
      case 'farmer-login':
      case 'farmer-onboarding':
        return (
          <FarmerLogin
            setActivePage={setActivePage}
            setCurrentFarmer={handleSetCurrentFarmer}
            setOnboardingMobile={setOnboardingMobile}
            language={language}
            selectedLocation={selectedLocation}
          />
        );
      case 'owner-registration':
      case 'owner-login':
        return (
          <OwnerRegistration
            setTractors={setTractors}
            setActivePage={setActivePage}
            language={language}
            currentOwner={currentOwner}
            setCurrentOwner={handleSetCurrentOwner}
            selectedLocation={selectedLocation}
          />
        );
      case 'owner-inbox':
        return (
          <OwnerInbox
            bookings={bookings}
            setBookings={setBookings}
            tractors={tractors}
            onViewSlip={(b) => setReceiptModalBooking(b)}
            language={language}
          />
        );
      case 'my-bookings':
        return (
          <MyBookings
            bookings={bookings}
            setBookings={setBookings}
            setActivePage={setActivePage}
            onViewSlip={(b) => setReceiptModalBooking(b)}
            language={language}
          />
        );
      case 'admin-dashboard':
        return isAdminLoggedIn ? (
          <Dashboard
            bookings={bookings}
            setBookings={setBookings}
            tractors={tractors}
            setTractors={setTractors}
            onViewSlip={(b) => setReceiptModalBooking(b)}
            onLogout={() => setIsAdminLoggedIn(false)}
            language={language}
          />
        ) : (
          <AdminLogin
            onLoginSuccess={() => setIsAdminLoggedIn(true)}
            setActivePage={setActivePage}
            language={language}
          />
        );
      default:
        return (
          <Home
            setActivePage={setActivePage}
            setServiceFilter={setServiceFilter}
            language={language}
            selectedLocation={selectedLocation}
            weatherData={weatherData}
            isLoadingWeather={isLoadingWeather}
            onOpenLocationPicker={() => setIsLocationModalOpen(true)}
          />
        );
    }
  };

  // Logout handlers
  const handleFarmerLogout = () => {
    setCurrentFarmer(null);
    try {
      localStorage.removeItem('agri_current_farmer');
    } catch (e) {
      console.warn(e);
    }
    setActivePage('portal-select');
  };

  const handleOwnerLogout = () => {
    setCurrentOwner(null);
    try {
      localStorage.removeItem('agri_current_owner');
    } catch (e) {
      console.warn(e);
    }
    setActivePage('portal-select');
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    try {
      sessionStorage.removeItem('agri_admin_logged_in');
    } catch (e) {
      console.warn(e);
    }
    setActivePage('portal-select');
  };

  // Top Header and Nav bars appear ONLY after logging in as Farmer, Owner, or Admin
  const isUserLoggedIn = Boolean(currentFarmer || currentOwner || isAdminLoggedIn);
  const isAuthPage = [
    'portal-select',
    'farmer-login',
    'owner-registration',
    'owner-login',
    'farmer-onboarding',
    'admin-login'
  ].includes(activePage);
  const showTopHeader = isUserLoggedIn && !isAuthPage;

  return (
    <div className={`app-layout ${!showTopHeader ? 'auth-mode' : ''}`}>
      {/* Sidebar Navigation: Only shown after logging in */}
      {showTopHeader && (
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          pendingCount={pendingCount}
          isMobileOpen={isMobileOpen}
          closeMobileMenu={() => setIsMobileOpen(false)}
          language={language}
          setLanguage={setLanguage}
          selectedLocation={selectedLocation}
          currentFarmer={currentFarmer}
          onFarmerLogout={handleFarmerLogout}
          currentOwner={currentOwner}
          onOwnerLogout={handleOwnerLogout}
          isAdminLoggedIn={isAdminLoggedIn}
          onAdminLogout={handleAdminLogout}
          isInstalled={pwa.isInstalled}
          onInstallApp={pwa.promptInstall}
          onShowLoader={() => setIsLoadingApp(true)}
        />
      )}

      {/* Main Content Area */}
      <div className={`main-content ${!showTopHeader ? 'full-width' : ''}`}>
        {/* Offline / Online Network Detection Status Bar */}
        <OfflineNotificationBanner language={language} />

        {/* Top Header: Totally removed before login, shows again after farmer or owner login */}
        {showTopHeader && (
          <Header
            activePage={activePage}
            setActivePage={setActivePage}
            toggleMobileMenu={() => setIsMobileOpen(prev => !prev)}
            activeRole={activeRole}
            setActiveRole={handleRoleChange}
            language={language}
            setLanguage={setLanguage}
            isAdminLoggedIn={isAdminLoggedIn}
            onAdminLogout={handleAdminLogout}
            selectedLocation={selectedLocation}
            onOpenLocationPicker={() => setIsLocationModalOpen(true)}
            currentFarmer={currentFarmer}
            onFarmerLogout={handleFarmerLogout}
            currentOwner={currentOwner}
            onOwnerLogout={handleOwnerLogout}
            isInstalled={pwa.isInstalled}
            onInstallApp={pwa.promptInstall}
          />
        )}
        <main className={`page-container ${!showTopHeader ? 'auth-full-screen' : ''}`}>
          {renderPage()}
        </main>
      </div>

      {/* Interactive Telangana Region & Village Location Picker Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={selectedLocation}
        onSelectLocation={handleSelectLocation}
        language={language}
      />

      {/* Digital Agricultural Work Slip / Receipt Modal */}
      {receiptModalBooking && (
        <ReceiptModal
          booking={receiptModalBooking}
          onClose={() => setReceiptModalBooking(null)}
          language={language}
        />
      )}

      {/* Sticky Native-feel Mobile Bottom Navigation Bar: Only shown after logging in */}
      {showTopHeader && (
        <MobileBottomNav
          activePage={activePage}
          setActivePage={setActivePage}
          pendingCount={pendingCount}
          language={language}
        />
      )}

      {/* PWA App Install Banner & Guided Modal */}
      <PwaInstallPrompt language={language} pwa={pwa} />

      {/* GSAP Tractor Loading Screen with Emojis & Line Art */}
      {isLoadingApp && (
        <TractorLoadingScreen
          language={language}
          onComplete={() => setIsLoadingApp(false)}
        />
      )}
    </div>
  );
}

export default App;
