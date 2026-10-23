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
import { fetchRegionWeather, getFallbackWeather } from './services/weatherService';

const DEFAULT_TRACTORS = [
  {
    id: 1,
    owner: "Ramesh Kumar",
    mobile: "9876543210",
    location: "Hasanparthy",
    district: "Hanumakonda",
    brand: "Mahindra",
    model: "475 DI XP Plus (44 HP)",
    equipment: "Ploughing, Rotavator, Cultivator",
    pricing: 1200,
    availability: "Available",
    photo: "/tractor1.jpeg",
    rating: 4.9,
    jobsDone: 34
  },
  {
    id: 2,
    owner: "Sailu Yadav",
    mobile: "9032004060",
    location: "Bheemaram",
    district: "Hanumakonda",
    brand: "Mahindra",
    model: "575 DI Sarpanch (47 HP)",
    equipment: "Ploughing, Cultivator, Trailer Services",
    pricing: 1250,
    availability: "Available",
    photo: "/tractor2.jpeg",
    rating: 4.8,
    jobsDone: 28
  },
  {
    id: 3,
    owner: "Rajesh Goud",
    mobile: "9440123456",
    location: "Velair",
    district: "Hanumakonda",
    brand: "John Deere",
    model: "5075E 4WD (75 HP Heavy)",
    equipment: "Ploughing, Rotavator, Heavy Tillage, Laser Leveler",
    pricing: 1500,
    availability: "Available",
    photo: "/tractor3.jpeg",
    rating: 5.0,
    jobsDone: 42
  },
  {
    id: 4,
    owner: "Mallesh Reddy",
    mobile: "9123456780",
    location: "Dharmasagar",
    district: "Hanumakonda",
    brand: "Swaraj",
    model: "744 FE XT (48 HP)",
    equipment: "Rotavator, Cultivator, Trailer Services",
    pricing: 1100,
    availability: "Available",
    photo: "/tractor4.jpeg",
    rating: 4.7,
    jobsDone: 19
  },
  {
    id: 5,
    owner: "Kishan Rao",
    mobile: "9849123450",
    location: "Kazipet",
    district: "Hanumakonda",
    brand: "Massey Ferguson",
    model: "241 DI Maha Shakti (42 HP)",
    equipment: "Ploughing, Disc Harrow, Cultivator",
    pricing: 1150,
    availability: "Available",
    photo: "/tractor5.jpeg",
    rating: 4.9,
    jobsDone: 31
  },
  {
    id: 6,
    owner: "Srinivas Chary",
    mobile: "9908123456",
    location: "Gajwel",
    district: "Siddipet",
    brand: "Sonalika",
    model: "DI 745 III Sikander (50 HP)",
    equipment: "Rotavator, Heavy Tillage, Cultivator",
    pricing: 1300,
    availability: "Available",
    photo: "/tractor6.jpeg",
    rating: 4.8,
    jobsDone: 24
  },
  {
    id: 7,
    owner: "Thirupathi Goud",
    mobile: "9701123456",
    location: "Hasanparthy",
    district: "Hanumakonda",
    brand: "Kubota",
    model: "MU4501 4WD (Paddy Specialist)",
    equipment: "Cage Wheels Puddling, Rotavator, Wet Land Ploughing",
    pricing: 1400,
    availability: "Available",
    photo: "/tractor7.jpeg",
    rating: 5.0,
    jobsDone: 45
  },
  {
    id: 8,
    owner: "Prabhakar Reddy",
    mobile: "9490123789",
    location: "Narsampet",
    district: "Warangal",
    brand: "New Holland",
    model: "3630 TX Super Plus (55 HP)",
    equipment: "Deep Ploughing, Cultivator, Trolley Hauling",
    pricing: 1350,
    availability: "Available",
    photo: "/tractor4.jpeg",
    rating: 4.8,
    jobsDone: 22
  },
  {
    id: 9,
    owner: "Devender Varma",
    mobile: "9866123456",
    location: "Armoor",
    district: "Nizamabad",
    brand: "Eicher",
    model: "380 Super DI (40 HP Economical)",
    equipment: "Ploughing, Cultivator, Ridger / Bund Maker",
    pricing: 1050,
    availability: "Available",
    photo: "/tractor1.jpeg",
    rating: 4.6,
    jobsDone: 16
  },
  {
    id: 10,
    owner: "Bikshapathi Nayak",
    mobile: "9949123456",
    location: "Miryalaguda",
    district: "Nalgonda",
    brand: "Farmtrac",
    model: "60 Powermaxx (55 HP)",
    equipment: "Ploughing, Rotavator, Trailer Services, Heavy Haulage",
    pricing: 1300,
    availability: "Available",
    photo: "/tractor5.jpeg",
    rating: 4.9,
    jobsDone: 38
  },
  {
    id: 11,
    owner: "Anjaiah Yadav",
    mobile: "9848556677",
    location: "Huzurabad",
    district: "Karimnagar",
    brand: "John Deere",
    model: "5310 GearPro (55 HP)",
    equipment: "Laser Leveling, Heavy Ploughing, Rotavator",
    pricing: 1450,
    availability: "Available",
    photo: "/tractor3.jpeg",
    rating: 4.9,
    jobsDone: 29
  },
  {
    id: 12,
    owner: "Maheshwar Rao",
    mobile: "9000123987",
    location: "Sathupally",
    district: "Khammam",
    brand: "Mahindra",
    model: "Novo 655 DI 4WD (65 HP High Power)",
    equipment: "Subsoiler, Heavy Disc Harrow, Rotavator, Trailer Services",
    pricing: 1600,
    availability: "Available",
    photo: "/tractor2.jpeg",
    rating: 5.0,
    jobsDone: 51
  },
  {
    id: 13,
    owner: "Venkataiah Goud",
    mobile: "9848112233",
    location: "Jadcherla",
    district: "Mahabubnagar",
    brand: "Swaraj",
    model: "855 FE (52 HP Heavy Duty)",
    equipment: "Ploughing, Cultivator, Rotavator, Groundnut Digger",
    pricing: 1350,
    availability: "Available",
    photo: "/tractor4.jpeg",
    rating: 4.8,
    jobsDone: 26
  },
  {
    id: 14,
    owner: "Ravi Shankar",
    mobile: "9988776655",
    location: "Kodad",
    district: "Suryapet",
    brand: "Mahindra",
    model: "585 DI Power Plus (50 HP)",
    equipment: "Ploughing, Trailer Services, Rotavator",
    pricing: 1250,
    availability: "Available",
    photo: "/tractor1.jpeg",
    rating: 4.9,
    jobsDone: 33
  }
];

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

  // Load Tractors from LocalStorage or Fallback (auto-upgrades fleet)
  const [tractors, setTractors] = useState(() => {
    try {
      const saved = localStorage.getItem('agri_tractors');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length < DEFAULT_TRACTORS.length) {
          const userCreated = parsed.filter(t => t.id > 14);
          return [...DEFAULT_TRACTORS, ...userCreated];
        }
        return parsed;
      }
      return DEFAULT_TRACTORS;
    } catch {
      return DEFAULT_TRACTORS;
    }
  });

  // Load Bookings from LocalStorage or Fallback
  const [bookings, setBookings] = useState(() => {
    try {
      const saved = localStorage.getItem('agri_bookings');
      return saved ? JSON.parse(saved) : DEFAULT_BOOKINGS;
    } catch {
      return DEFAULT_BOOKINGS;
    }
  });

  // Sync Tractors to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('agri_tractors', JSON.stringify(tractors));
    } catch (e) {
      console.error('Failed to save tractors to localStorage', e);
    }
  }, [tractors]);

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
