import { useState, useEffect, useMemo } from 'react';
import './App.css';
import RoleLoginScreen from './components/RoleLoginScreen';
import TopNavBar from './components/TopNavBar';
import SubHeaderBanner from './components/SubHeaderBanner';
import TractorCard from './components/TractorCard';
import BottomTabBar from './components/BottomTabBar';
import AppDrawerModal from './components/AppDrawerModal';
import BookingModal from './components/BookingModal';
import BookingsAndMessagesModal from './components/BookingsAndMessagesModal';
import UserProfileModal from './components/UserProfileModal';
import SettingsModal from './components/SettingsModal';
import LocationModal from './components/LocationModal';
import { generateTelanganaFleet, recalculateNearbyTractors } from './data/telanganaFleet';
import { TELANGANA_33_DISTRICTS } from './data/telanganaDistricts';

export default function App() {
  // --------------------------------------------------------------------------
  // AUTH & SESSION STATE (Local Storage Persistence)
  // --------------------------------------------------------------------------
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('agri_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [guestBrowsing, setGuestBrowsing] = useState(() => {
    try {
      return localStorage.getItem('agri_guest_browsing') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('agri_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('agri_current_user');
      }
    } catch (e) {
      console.warn(e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('agri_guest_browsing', guestBrowsing ? 'true' : 'false');
    } catch (e) {
      console.warn(e);
    }
  }, [guestBrowsing]);

  // Language State
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
      console.warn(e);
    }
  }, [language]);

  // Selected Location (District & Mandal)
  const [selectedDistrict, setSelectedDistrict] = useState(() => {
    return currentUser?.district || 'Hanumakonda';
  });

  const [selectedMandal, setSelectedMandal] = useState(() => {
    return currentUser?.mandal || currentUser?.village || 'Hasanparthy';
  });

  // --------------------------------------------------------------------------
  // FLEET & TRACTORS STATE
  // --------------------------------------------------------------------------
  const [allTractors, setAllTractors] = useState(() => generateTelanganaFleet());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImplement, setSelectedImplement] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');

  // Bookings State
  const [bookings, setBookings] = useState(() => {
    try {
      const saved = localStorage.getItem('agri_bookings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return [
      {
        id: 1,
        booking_code: 'AGR-2026-8812',
        tractor_id: 1,
        tractor_name: 'Mahindra 575 DI XP Plus (47 HP)',
        owner_name: 'G. Srinivas Rao',
        owner_phone: '+91 94401-56789',
        farmer_name: 'N. Ramesh Kumar',
        farmer_phone: '+91 98480-12345',
        delivery_village: 'Hasanparthy',
        work_type: 'Ploughing',
        land_area: 3,
        land_unit: 'Acres',
        booking_date: '2026-10-31',
        time_slot: '07:00 AM',
        status: 'accepted',
        estimated_cost: 5100,
        notes: 'Deep ploughing near canal road.',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        booking_code: 'AGR-2026-8815',
        tractor_id: 6,
        tractor_name: 'Swaraj 744 FE High Torque (48 HP)',
        owner_name: 'Ch. Thirupathi Reddy',
        owner_phone: '+91 99890-44123',
        farmer_name: 'N. Ramesh Kumar',
        farmer_phone: '+91 98480-12345',
        delivery_village: 'Velair',
        work_type: 'Rotavator',
        land_area: 2.5,
        land_unit: 'Acres',
        booking_date: '2026-11-01',
        time_slot: '08:00 AM',
        status: 'accepted',
        estimated_cost: 4500,
        notes: 'Field leveling before sowing.',
        created_at: new Date().toISOString()
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('agri_bookings', JSON.stringify(bookings));
    } catch (e) {
      console.warn(e);
    }
  }, [bookings]);

  // --------------------------------------------------------------------------
  // MODALS STATE
  // --------------------------------------------------------------------------
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingTractor, setBookingTractor] = useState(null);
  const [isBookingsModalOpen, setIsBookingsModalOpen] = useState(false);
  const [bookingsModalTab, setBookingsModalTab] = useState('active');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Bottom Nav Active Tab
  const [activeBottomTab, setActiveBottomTab] = useState('explore');

  // Recalculate nearby tractors based on location
  const localizedTractors = useMemo(() => {
    return recalculateNearbyTractors(allTractors, selectedDistrict, selectedMandal);
  }, [allTractors, selectedDistrict, selectedMandal]);

  // Filter & Sort Tractors
  const displayedTractors = useMemo(() => {
    return localizedTractors.filter((tractor) => {
      // 1. Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesModel = (tractor.model || '').toLowerCase().includes(q);
        const matchesBrand = (tractor.brand || '').toLowerCase().includes(q);
        const matchesVillage = (tractor.base_village || '').toLowerCase().includes(q);
        const matchesMandal = (tractor.mandal || '').toLowerCase().includes(q);
        const matchesDistrict = (tractor.district || '').toLowerCase().includes(q);
        const matchesImplements = Array.isArray(tractor.implements) &&
          tractor.implements.some((impl) => impl.toLowerCase().includes(q));

        if (!matchesModel && !matchesBrand && !matchesVillage && !matchesMandal && !matchesDistrict && !matchesImplements) {
          return false;
        }
      }

      // 2. Implement filter
      if (selectedImplement !== 'all') {
        if (!Array.isArray(tractor.implements) || !tractor.implements.includes(selectedImplement)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'distance') return a.distance_km - b.distance_km;
      if (sortBy === 'price_asc') return a.rate_per_hour - b.rate_per_hour;
      if (sortBy === 'rating') return b.rating - a.rating;
      return a.distance_km - b.distance_km; // default recommended
    });
  }, [localizedTractors, searchQuery, selectedImplement, sortBy]);

  // Active bookings count
  const activeBookingsCount = bookings.filter((b) => ['pending', 'accepted', 'Approved'].includes(b.status)).length;

  // Sign out handler
  const handleSignOut = () => {
    setCurrentUser(null);
    setGuestBrowsing(false);
    setIsDrawerOpen(false);
    setIsProfileModalOpen(false);
    setIsSettingsModalOpen(false);
    localStorage.removeItem('agri_current_user');
    localStorage.removeItem('agri_guest_browsing');
  };

  // Farmer Login handler
  const handleLoginFarmer = (farmer) => {
    setCurrentUser(farmer);
    setGuestBrowsing(false);
    setSelectedDistrict(farmer.district || 'Hanumakonda');
    setSelectedMandal(farmer.village || 'Hasanparthy');
  };

  // Owner Login handler
  const handleLoginOwner = (owner) => {
    setCurrentUser(owner);
    setGuestBrowsing(false);
    setSelectedDistrict(owner.district || 'Hanumakonda');
    setSelectedMandal(owner.mandal || 'Hasanparthy');

    // If owner registered a custom tractor in 4-step flow, prepend it
    if (owner.tractor) {
      const newTractor = {
        id: Date.now(),
        owner_name: owner.name,
        owner_phone: owner.phone,
        brand: owner.tractor.brand,
        model: `${owner.tractor.brand} ${owner.tractor.model}`,
        hp: owner.tractor.hp,
        implements: owner.tractor.implements,
        rate_per_hour: owner.tractor.ratePerHour,
        rate_per_acre: owner.tractor.ratePerAcre,
        base_village: owner.village,
        mandal: owner.mandal,
        district: owner.district,
        whereabouts: owner.tractor.whereabouts,
        distance_km: 1.1,
        eta_minutes: 12,
        proximity_label: '⚡ Ultra Nearby (Within 2 km)',
        status: 'available',
        approval_status: 'approved',
        image_url: owner.tractor.image_url,
        rating: 5.0,
        review_count: 1
      };
      setAllTractors((prev) => [newTractor, ...prev]);
    }
  };

  // Booking confirm handler
  const handleConfirmBooking = (newBooking) => {
    setBookings((prev) => [newBooking, ...prev]);
  };

  // --------------------------------------------------------------------------
  // RENDER: If not signed in and not browsing as guest, show RoleLoginScreen!
  // (Matches C:\Agrirent\src\app\index.tsx lines 52-60)
  // --------------------------------------------------------------------------
  if (!currentUser && !guestBrowsing) {
    return (
      <div className="native-app-container">
        <RoleLoginScreen
          language={language}
          setLanguage={setLanguage}
          onLoginFarmer={handleLoginFarmer}
          onLoginOwner={handleLoginOwner}
          onContinueAsGuest={() => setGuestBrowsing(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          defaultDistrict={selectedDistrict}
          defaultMandal={selectedMandal}
        />

        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          language={language}
          setLanguage={setLanguage}
          currentUser={currentUser}
          onSignOut={handleSignOut}
        />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: Main Marketplace App
  // --------------------------------------------------------------------------
  return (
    <div className="native-app-container">
      {/* 1. Rapido Top Header with Hamburger Menu & Bilingual Pill */}
      <TopNavBar
        language={language}
        setLanguage={setLanguage}
        openDrawer={() => setIsDrawerOpen(true)}
        onBack={() => {
          setSearchQuery('');
          setSelectedImplement('all');
        }}
        showBack={searchQuery !== '' || selectedImplement !== 'all'}
        onBrandClick={() => {
          setSearchQuery('');
          setSelectedImplement('all');
          setSortBy('recommended');
        }}
      />

      {/* 2. Sub-Header Search & Dropdowns */}
      <SubHeaderBanner
        language={language}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedImplement={selectedImplement}
        setSelectedImplement={setSelectedImplement}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onSelectPlace={(dist, mandal) => {
          setSelectedDistrict(dist);
          setSelectedMandal(mandal);
        }}
      />

      {/* 3. Main Tractor Listings Feed */}
      <main className="marketplace-feed-container">
        {/* Floating Settings Gear on Top-Right */}
        <button
          type="button"
          className="floating-gear-btn"
          onClick={() => setIsSettingsModalOpen(true)}
          title="Settings"
        >
          ⚙️
        </button>

        {displayedTractors.length === 0 ? (
          <div className="empty-feed-card">
            <span className="empty-feed-icon">🌾</span>
            <h3>{language === 'te' ? 'యంత్రాలు కనిపించలేదు' : 'No Machinery Found'}</h3>
            <p>
              {language === 'te'
                ? 'మీరు ఎంచుకున్న ఫిల్టర్‌కు సరిపోయే యంత్రాలు లేవు. దయచేసి ఫిల్టర్‌ను రీసెట్ చేయండి.'
                : 'No tractors match your current filter. Please reset or search another village.'}
            </p>
            <button
              type="button"
              className="native-btn-primary green-bg"
              onClick={() => {
                setSearchQuery('');
                setSelectedImplement('all');
              }}
            >
              {language === 'te' ? 'అన్ని ఫిల్టర్లను రీసెట్ చేయండి' : 'Reset All Filters'}
            </button>
          </div>
        ) : (
          <div className="tractor-cards-grid">
            {displayedTractors.map((tractor) => (
              <TractorCard
                key={tractor.id}
                tractor={tractor}
                language={language}
                onBook={(t) => {
                  setBookingTractor(t);
                  setIsBookingModalOpen(true);
                }}
              />
            ))}
          </div>
        )}

        {/* Safety & Privacy Guarantee Card (Matching Screenshot 9/10) */}
        <div className="safety-guarantee-banner">
          <div className="shield-icon-circle">🛡️</div>
          <div>
            <div className="guarantee-title">
              {language === 'te'
                ? 'అగ్రిరెంట్ భద్రత & గోప్యత హామీ'
                : 'Agrirent Safety & Privacy Guarantee'}
            </div>
            <div className="guarantee-sub">
              {language === 'te'
                ? 'తెలంగాణ రవాణా RTO ధృవీకరణ & నంబర్ మాస్కింగ్ రక్షణ.'
                : 'Telangana RTO verified tractors & phone privacy protection.'}
            </div>
          </div>
        </div>
      </main>

      {/* 4. Docked Bottom Navigation Bar */}
      <BottomTabBar
        activeTab={activeBottomTab}
        onSelectTab={(tab) => {
          setActiveBottomTab(tab);
          if (tab === 'bookings') {
            setBookingsModalTab('active');
            setIsBookingsModalOpen(true);
          } else if (tab === 'chat') {
            setBookingsModalTab('chat');
            setIsBookingsModalOpen(true);
          } else if (tab === 'profile') {
            setIsProfileModalOpen(true);
          }
        }}
        bookingsCount={activeBookingsCount}
        chatCount={activeBookingsCount}
        language={language}
        isLoggedIn={!!currentUser}
      />

      {/* 5. Modals & Slideouts */}
      <AppDrawerModal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentUser={currentUser}
        language={language}
        bookingsCount={activeBookingsCount}
        chatCount={activeBookingsCount}
        onSelectMenu={(id) => {
          if (id === 'bookings') {
            setBookingsModalTab('active');
            setIsBookingsModalOpen(true);
          } else if (id === 'chat') {
            setBookingsModalTab('chat');
            setIsBookingsModalOpen(true);
          } else if (id === 'profile') {
            setIsProfileModalOpen(true);
          } else if (id === 'settings') {
            setIsSettingsModalOpen(true);
          } else if (id === 'help') {
            alert(language === 'te' ? 'కిసాన్ టోల్-ఫ్రీ హెల్ప్‌లైన్: 1800-425-1110' : 'Kisan Toll-Free Helpline: 1800-425-1110');
          } else if (id === 'about') {
            alert(language === 'te' ? 'అగ్రిరెంట్ - తెలంగాణ 33 జిల్లాల్లో రైతులకు సులభ అద్దె యంత్రాల వేదిక.' : 'Agrirent - Farm machinery rental across 33 Telangana districts.');
          }
        }}
        onSignOut={handleSignOut}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setBookingTractor(null);
        }}
        tractor={bookingTractor}
        currentUser={currentUser}
        language={language}
        onConfirmBooking={handleConfirmBooking}
      />

      <BookingsAndMessagesModal
        isOpen={isBookingsModalOpen}
        onClose={() => {
          setIsBookingsModalOpen(false);
          setActiveBottomTab('explore');
        }}
        initialTab={bookingsModalTab}
        bookings={bookings}
        currentUser={currentUser}
        language={language}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setActiveBottomTab('explore');
        }}
        currentUser={currentUser}
        language={language}
        onSignOut={handleSignOut}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        language={language}
        setLanguage={setLanguage}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={(loc) => {
          setSelectedDistrict(loc.district);
          setSelectedMandal(loc.village || loc.mandal);
          setIsLocationModalOpen(false);
        }}
        language={language}
      />
    </div>
  );
}
