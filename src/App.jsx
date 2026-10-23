import { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ReceiptModal from './components/ReceiptModal';
import LocationModal from './components/LocationModal';
import MobileBottomNav from './components/MobileBottomNav';
import Home from './pages/Home';
import FindTractor from './pages/FindTractor';
import TractorBooking from './pages/TractorBooking';
import OwnerRegistration from './pages/OwnerRegistration';
import OwnerInbox from './pages/OwnerInbox';
import MyBookings from './pages/MyBookings';
import Dashboard from './pages/Dashboard';
import AdminLogin from './pages/AdminLogin';
import { DEFAULT_LOCATION } from './data/telanganaLocations';
import { buildFleetForLocation } from './data/fleetData';
import { fetchRegionWeather, getFallbackWeather } from './services/weatherService';

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
  const [activePage, setActivePage] = useState('home');
  const [activeRole, setActiveRole] = useState('farmer'); // 'farmer', 'owner', 'admin'
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [serviceFilter, setServiceFilter] = useState('All');
  const [selectedTractor, setSelectedTractor] = useState(null);
  const [receiptModalBooking, setReceiptModalBooking] = useState(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

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

  // Switch role actions
  const handleRoleChange = (role) => {
    setActiveRole(role);
    if (role === 'farmer') {
      setActivePage('find-tractor');
    } else if (role === 'owner') {
      setActivePage('owner-inbox');
    } else if (role === 'admin') {
      setActivePage('admin-dashboard');
    }
  };

  const pendingCount = bookings.filter(b => b.status === 'Pending Approval').length;

  const renderPage = () => {
    switch (activePage) {
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
            setActivePage={setActivePage}
            setSelectedTractor={setSelectedTractor}
            serviceFilter={serviceFilter}
            setServiceFilter={setServiceFilter}
            language={language}
            selectedLocation={selectedLocation}
            weatherData={weatherData}
            isLoadingWeather={isLoadingWeather}
            onOpenLocationPicker={() => setIsLocationModalOpen(true)}
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
          />
        );
      case 'owner-registration':
        return (
          <OwnerRegistration
            setTractors={setTractors}
            setActivePage={setActivePage}
            language={language}
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

  return (
    <div className="app-layout">
      {/* Sidebar Navigation with Dynamic Local Regional Helpline */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        pendingCount={pendingCount}
        isMobileOpen={isMobileOpen}
        closeMobileMenu={() => setIsMobileOpen(false)}
        language={language}
        selectedLocation={selectedLocation}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Header
          activePage={activePage}
          toggleMobileMenu={() => setIsMobileOpen(prev => !prev)}
          activeRole={activeRole}
          setActiveRole={handleRoleChange}
          language={language}
          setLanguage={setLanguage}
          isAdminLoggedIn={isAdminLoggedIn}
          onAdminLogout={() => setIsAdminLoggedIn(false)}
          selectedLocation={selectedLocation}
          onOpenLocationPicker={() => setIsLocationModalOpen(true)}
        />
        <main className="page-container">
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

      {/* Sticky Native-feel Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activePage={activePage}
        setActivePage={setActivePage}
        pendingCount={pendingCount}
        language={language}
      />
    </div>
  );
}

export default App;
