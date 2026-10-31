import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import WeatherBar from '../components/WeatherBar';
import { translations } from '../translations';

// Returns 100% accurate matching photo corresponding to the specific tractor model and brand
export const getAccurateTractorPhoto = (tractor) => {
  if (!tractor) return '/tractor1.jpeg';
  const brand = (tractor.brand || '').toLowerCase();
  const model = (tractor.model || tractor.tractorModel || '').toLowerCase();
  const photo = tractor.photo || '';

  // 1. Hand push corn seeder / planter
  if (model.includes('seeder') || model.includes('planter') || brand.includes('kisan tools')) {
    return '/corn_seeder.jpg';
  }
  // 2. Straw baler
  if (model.includes('baler') || model.includes('baling')) {
    return '/straw_baler.jpg';
  }
  // 3. Corn / combine harvester
  if (model.includes('harvester') || model.includes('combine')) {
    return '/corn_harvester.jpg';
  }
  // 4. Mahindra 575 DI (Must use 575 image, NOT the 475 photo)
  if (model.includes('575') || (brand.includes('mahindra') && model.includes('sarpanch'))) {
    return '/images/mahindra_575.jpg';
  }
  // 5. Mahindra 475 DI XP Plus (Use tractor1.jpeg which has the 475 badge)
  if (model.includes('475') || (brand.includes('mahindra') && model.includes('bhoomiputra'))) {
    return '/tractor1.jpeg';
  }
  // 6. Mahindra Arjun 605 DI (Trailer)
  if (model.includes('605') || model.includes('arjun')) {
    return '/tractor9.jpg';
  }
  // 7. Swaraj 744 FE XT
  if (model.includes('744') || (brand.includes('swaraj') && model.includes('xt'))) {
    return '/tractor4.jpeg';
  }
  // 8. Swaraj 735 FE
  if (model.includes('735')) {
    return '/tractor8.jpg';
  }
  // 9. John Deere 5310
  if (model.includes('5310')) {
    return '/images/john_deere_5310.jpg';
  }
  // 10. John Deere 5075E / 5050
  if (model.includes('5075') || model.includes('5050')) {
    return '/tractor3.jpeg';
  }
  // 11. Massey Ferguson 241 DI
  if (model.includes('241') || (brand.includes('massey') && model.includes('maha shakti'))) {
    return '/tractor5.jpeg';
  }
  // 12. Massey Ferguson 1035 DI
  if (model.includes('1035')) {
    return '/tractor14.jpg';
  }
  // 13. Sonalika DI 745
  if (model.includes('745') || model.includes('sikander')) {
    return '/tractor6.jpeg';
  }
  // 14. Sonalika Tiger 55
  if (model.includes('tiger')) {
    return '/sonalika_tiger_55.jpg';
  }
  // 15. Kubota MU4501
  if (model.includes('kubota') || model.includes('mu4501')) {
    return '/tractor7.jpeg';
  }
  // 16. Farmtrac 60
  if (model.includes('farmtrac') || model.includes('60 powermaxx') || model.includes('60')) {
    return '/farmtrac_60.jpg';
  }
  // 17. New Holland 3630
  if (model.includes('new holland') || model.includes('3630')) {
    return '/new_holland_3630.jpg';
  }
  // 18. Eicher 380 Super DI
  if (model.includes('eicher') || model.includes('380')) {
    return '/eicher_380_clean.jpg';
  }

  // Fallback to tractor.photo if provided, else default to tractor1
  return photo || '/tractor1.jpeg';
};

// Formats tractor name cleanly without duplicating brand name
export const getTractorDisplayName = (tractor) => {
  if (!tractor) return '';
  const brand = (tractor.brand || '').trim();
  let model = (tractor.model || tractor.tractorModel || '').trim();
  if (!brand) return model;
  if (!model) return brand;
  if (model.toLowerCase().startsWith(brand.toLowerCase())) {
    return model;
  }
  return `${brand} ${model}`;
};

// Returns accurate horsepower label or manual specification
export const getHpDisplay = (tractor) => {
  if (tractor.engineHp) return `${tractor.engineHp} HP`;
  const hpStr = (tractor.hp || '').toString();
  if (hpStr.toLowerCase().includes('manual')) return 'Manual';
  const match = hpStr.match(/(\d+)\s*HP/i) || (tractor.model || '').match(/(\d+)\s*HP/i);
  if (match) return `${match[1]} HP`;
  return '48 HP';
};

export default function FindTractor({
  tractors = [],
  setTractors,
  setActivePage,
  setSelectedTractor,
  serviceFilter,
  setServiceFilter,
  language = 'en',
  selectedLocation,
  weatherData,
  isLoadingWeather,
  onOpenLocationPicker,
  isUserLoggedIn = false,
  currentOwner
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [onlyLocalFleet, setOnlyLocalFleet] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [listSuccessToast, setListSuccessToast] = useState('');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  const t = translations[language] || translations.en;
  const isTe = language === 'te';

  // Swiggy-style visual machinery category list matching user request & screenshots
  const machineryCategories = [
    {
      id: 'All',
      name: 'All Fleet',
      nameTe: 'అన్ని యంత్రాలు',
      image: '/tractor1.jpeg',
      emoji: '🚜',
      badge: 'All'
    },
    {
      id: 'Ploughing',
      name: 'Ploughing',
      nameTe: 'దుక్కి దున్నడం',
      image: '/images/mahindra_575.jpg',
      emoji: '🌱',
      badge: 'Popular'
    },
    {
      id: 'Rotavator',
      name: 'Rotavator',
      nameTe: 'రొటవేటర్',
      image: '/tractor4.jpeg',
      emoji: '🔄',
      badge: 'Top Pick'
    },
    {
      id: 'Cultivator',
      name: 'Cultivator',
      nameTe: 'కల్టివేటర్',
      image: '/images/john_deere_5310.jpg',
      emoji: '🌾',
      badge: 'Tillage'
    },
    {
      id: 'Corn Harvester',
      name: 'Harvester',
      nameTe: 'కోత యంత్రం',
      image: '/corn_harvester.jpg',
      emoji: '🌽',
      badge: 'Harvest'
    },
    {
      id: 'Trailer Services',
      name: 'Trailer Trolley',
      nameTe: 'ట్రాలీ రవాణా',
      image: '/tractor9.jpg',
      emoji: '🚚',
      badge: 'Haulage'
    },
    {
      id: 'Straw Baler',
      name: 'Straw Baler',
      nameTe: 'గడ్డి బెయిలర్',
      image: '/straw_baler.jpg',
      emoji: '📦',
      badge: 'Baling'
    },
    {
      id: 'Corn Seeder',
      name: 'Seed Planter',
      nameTe: 'విత్తన యంత్రం',
      image: '/corn_seeder.jpg',
      emoji: '🌱',
      badge: 'Seeding'
    },
    {
      id: 'Heavy 50+ HP',
      name: '50+ HP Heavy',
      nameTe: '50+ HP హెవీ',
      image: '/tractor3.jpeg',
      emoji: '⚡',
      badge: 'Heavy'
    },
    {
      id: 'Mini Tractor',
      name: 'Mini Orchard',
      nameTe: 'మినీ ట్రాక్టర్',
      image: '/tractor7.jpeg',
      emoji: '🚜',
      badge: 'Compact'
    }
  ];

  const servicesList = machineryCategories.map(c => ({
    id: c.id,
    label: `${c.emoji} ${isTe ? c.nameTe : c.name}`
  }));

  const activeVillage = selectedLocation?.village || 'Hasanparthy';
  const activeDistrict = selectedLocation?.district || 'Hanumakonda';

  // Filter tractors based on search query, selected service, and regional fleet
  const filteredTractors = tractors.filter((tractor) => {
    const matchesSearch =
      (tractor.model || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tractor.brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tractor.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tractor.district || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tractor.owner || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tractor.equipment || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesService = (() => {
      if (!serviceFilter || serviceFilter === 'All') return true;
      const sf = serviceFilter.toLowerCase();
      const equip = (tractor.equipment || '').toLowerCase();
      const model = (tractor.model || '').toLowerCase();
      const brand = (tractor.brand || '').toLowerCase();
      const combined = `${equip} ${model} ${brand}`;

      if (sf.includes('baler')) return combined.includes('baler') || combined.includes('baling');
      if (sf.includes('seeder') || sf.includes('planter')) return combined.includes('seeder') || combined.includes('seeding') || combined.includes('planter');
      if (sf.includes('harvester') || sf === 'corn') return combined.includes('harvester') || combined.includes('combine') || combined.includes('corn');
      if (sf.includes('plough')) return combined.includes('plough') || combined.includes('tillage');
      if (sf.includes('rotavator')) return combined.includes('rotavator');
      if (sf.includes('cultivator')) return combined.includes('cultivator');
      if (sf.includes('trailer') || sf.includes('trolley')) return combined.includes('trailer') || combined.includes('trolley') || combined.includes('haulage');
      if (sf.includes('heavy') || sf.includes('50')) {
        const hp = parseInt(tractor.engineHp || '48', 10);
        return hp >= 50 || combined.includes('heavy') || combined.includes('50') || combined.includes('55');
      }
      if (sf.includes('mini') || sf.includes('orchard')) {
        const hp = parseInt(tractor.engineHp || '48', 10);
        return hp < 45 || combined.includes('mini') || combined.includes('orchard') || combined.includes('compact');
      }

      return combined.includes(sf);
    })();

    const isSpecialtyMachine =
      (tractor.equipment || '').toLowerCase().includes('harvester') ||
      (tractor.equipment || '').toLowerCase().includes('baler') ||
      (tractor.equipment || '').toLowerCase().includes('seeder');

    const matchesLocal =
      !onlyLocalFleet ||
      isSpecialtyMachine ||
      (tractor.location || '').toLowerCase().includes(activeVillage.toLowerCase());

    return matchesSearch && matchesService && matchesLocal;
  });

  // Sorting Logic
  const sortedTractors = [...filteredTractors].sort((a, b) => {
    if (sortBy === 'price-low') return (a.pricing || 0) - (b.pricing || 0);
    if (sortBy === 'price-high') return (b.pricing || 0) - (a.pricing || 0);
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    return (a.distanceKm || 1) - (b.distanceKm || 1);
  });

  const containerRef = useRef(null);

  // List Machinery Modal Form State
  const [newMachineForm, setNewMachineForm] = useState({
    ownerName: currentOwner?.fullName || '',
    mobile: currentOwner?.mobile || '',
    brand: 'Mahindra',
    model: '575 DI XP Plus (47 HP)',
    implements: ['Ploughing', 'Rotavator'],
    priceHour: 1100,
    priceAcre: 2200,
    village: activeVillage,
    photo: '/images/mahindra_575.jpg'
  });

  const availableBrands = [
    'Mahindra',
    'Swaraj',
    'John Deere',
    'Eicher',
    'Sonalika',
    'Massey Ferguson',
    'New Holland',
    'Farmtrac',
    'Kubota',
    'Kisan Tools'
  ];

  const availableImplements = [
    { id: 'Ploughing', label: isTe ? 'దుక్కి దున్నడం' : 'Ploughing' },
    { id: 'Rotavator', label: isTe ? 'రొటవేటర్' : 'Rotavator' },
    { id: 'Cultivator', label: isTe ? 'కల్టివేటర్' : 'Cultivator' },
    { id: 'Corn Harvester', label: isTe ? 'మొక్కజొన్న కోత' : 'Harvester' },
    { id: 'Straw Baler', label: isTe ? 'గడ్డి బెయిలర్' : 'Straw Baler' },
    { id: 'Corn Seeder', label: isTe ? 'విత్తన యంత్రం' : 'Seed Planter' },
    { id: 'Trailer Services', label: isTe ? 'ట్రాలీ రవాణా' : 'Trailer' }
  ];

  const selectablePhotos = [
    { id: 'mahindra_575', label: 'Mahindra 575 DI', src: '/images/mahindra_575.jpg' },
    { id: 'mahindra_475', label: 'Mahindra 475 DI', src: '/tractor1.jpeg' },
    { id: 'swaraj_744', label: 'Swaraj 744 FE', src: '/tractor4.jpeg' },
    { id: 'john_deere_5310', label: 'John Deere 5310', src: '/images/john_deere_5310.jpg' },
    { id: 'eicher_380', label: 'Eicher 380 Super DI', src: '/eicher_380_clean.jpg' },
    { id: 'farmtrac_60', label: 'Farmtrac 60', src: '/farmtrac_60.jpg' },
    { id: 'new_holland', label: 'New Holland 3630', src: '/new_holland_3630.jpg' },
    { id: 'sonalika', label: 'Sonalika Tiger 55', src: '/sonalika_tiger_55.jpg' },
    { id: 'harvester', label: 'Corn Harvester', src: '/corn_harvester.jpg' },
    { id: 'baler', label: 'Straw Baler', src: '/straw_baler.jpg' },
    { id: 'seeder', label: 'Corn Seeder', src: '/corn_seeder.jpg' },
    { id: 'trailer', label: 'Trailer Trolley', src: '/tractor9.jpg' }
  ];

  const handleToggleImplement = (implId) => {
    setNewMachineForm(prev => {
      const exists = prev.implements.includes(implId);
      return {
        ...prev,
        implements: exists 
          ? prev.implements.filter(i => i !== implId)
          : [...prev.implements, implId]
      };
    });
  };

  const handleListMachinerySubmit = (e) => {
    if (e) e.preventDefault();
    if (!newMachineForm.ownerName.trim() || !newMachineForm.mobile.trim()) {
      alert(isTe ? 'దయచేసి మీ పేరు మరియు మొబైల్ నంబర్ నమోదు చేయండి.' : 'Please enter owner name and mobile number.');
      return;
    }

    const createdTractor = {
      id: Date.now(),
      owner: newMachineForm.ownerName.trim(),
      mobile: newMachineForm.mobile.trim(),
      location: newMachineForm.village || activeVillage,
      district: activeDistrict,
      brand: newMachineForm.brand,
      model: newMachineForm.model,
      equipment: newMachineForm.implements.length > 0 ? newMachineForm.implements.join(', ') : 'Ploughing, Rotavator',
      pricing: Number(newMachineForm.priceHour) || 1000,
      priceAcre: Number(newMachineForm.priceAcre) || 2000,
      engineHp: '48 HP',
      availability: 'Available',
      photo: newMachineForm.photo || getAccurateTractorPhoto({ brand: newMachineForm.brand, model: newMachineForm.model }),
      rating: 5.0,
      jobsDone: 0,
      registeredAt: 'Just Now',
      distanceKm: 0.5,
      dispatchMins: 12
    };

    if (setTractors) {
      setTractors(prev => [createdTractor, ...(Array.isArray(prev) ? prev : [])]);
    }

    setIsListModalOpen(false);
    setListSuccessToast(
      isTe
        ? `✅ మీ ${newMachineForm.brand} ${newMachineForm.model} అగ్రిరెంట్‌లో విజయవంతంగా చేర్చబడింది!`
        : `✅ Your ${newMachineForm.brand} ${newMachineForm.model} is now live in the AgriRent Fleet!`
    );

    setTimeout(() => {
      const el = document.getElementById('fleet-results');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 250);

    setTimeout(() => {
      setListSuccessToast('');
    }, 6000);
  };

  // GSAP Entrance Animations on Mount
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.from('.jfarm-badge-pill', { opacity: 0, y: -12, duration: 0.35, ease: 'power2.out' })
        .from('.jfarm-hero-title', { opacity: 0, y: 22, duration: 0.45, ease: 'power3.out' }, '-=0.2')
        .from('.jfarm-hero-subtitle', { opacity: 0, y: 16, duration: 0.4, ease: 'power3.out' }, '-=0.25')
        .from('.jfarm-tab-pill', { opacity: 0, scale: 0.85, y: 12, stagger: 0.03, duration: 0.32, ease: 'back.out(2)' }, '-=0.2')
        .from('.jfarm-search-card', { opacity: 0, y: 22, duration: 0.45, ease: 'power2.out' }, '-=0.15')
        .from('.swiggy-cat-card', { opacity: 0, scale: 0.75, y: 18, stagger: 0.035, duration: 0.38, ease: 'back.out(1.6)' }, '-=0.2');
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // GSAP Stagger Animation for Tractor Fleet Cards when filters/search update
  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('.marketplace-tractor-card');
    if (cards.length > 0) {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 24, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, stagger: 0.035, ease: 'power2.out' }
      );
    }
  }, [serviceFilter, searchQuery, sortBy, selectedLocation]);

  const handleBookTractor = (tractor) => {
    if (setSelectedTractor) {
      setSelectedTractor(tractor);
    }
    setActivePage('booking-form');
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const resultsEl = document.getElementById('fleet-results');
    if (resultsEl) {
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div ref={containerRef} className="find-tractor-page full-bleed-workspace page-anim">
      {/* Guest Mode Banner with return to Login Portal */}
      {!isUserLoggedIn && (
        <div className="guest-browse-banner">
          <div className="guest-browse-info">
            <span className="guest-browse-icon">🌱</span>
            <span>
              {isTe
                ? 'మీరు అతిథిగా చూస్తున్నారు. ట్రాక్టర్లను బుక్ చేయడానికి లేదా యంత్రాలను నమోదు చేయడానికి సైన్ ఇన్ చేయండి.'
                : 'Browsing as Guest. Sign in to book tractors or manage rental fleet.'}
            </span>
          </div>
          <button
            type="button"
            className="guest-signin-btn"
            onClick={() => setActivePage('portal-select')}
          >
            {isTe ? 'సైన్-ఇన్ పోర్టల్ →' : 'Sign-In Portal →'}
          </button>
        </div>
      )}

      {/* AgriRent Desktop Hero Banner (Edge-to-Edge Full Workspace) */}
      <section className="jfarm-hero-section page-anim">
        <div className="jfarm-hero-header">
          <div className="jfarm-badge-pill">
            <span className="jfarm-badge-dot">●</span>
            <span>{isTe ? 'తెలంగాణ వ్యవసాయ యంత్రీకరణ వేదిక' : 'Telangana Farm Machinery Rental Platform'}</span>
          </div>

          <h1 className="jfarm-hero-title">
            {isTe ? 'ఉత్తమ యంత్రం. ఉత్తమ ధర.' : 'Best Machinery. Best Fare.'}
          </h1>
          <p className="jfarm-hero-subtitle">
            {isTe
              ? 'తెలంగాణలోని 33 జిల్లాల్లో సమీప ట్రాక్టర్లు, రొటవేటర్లు, హార్వెస్టర్లను నేరుగా యజమానుల నుండి అద్దెకు తీసుకోండి • 0% కమీషన్'
              : 'Direct Farmer-to-Farmer (F2F) tractor and equipment rental across Telangana. Transparent rates with instant village dispatch.'}
          </p>

          {/* Quick Category Toggle Pills (QuickRide Style: AIRPORT | RENTAL | OUTSTATION | LOCAL) */}
          <div className="jfarm-quick-tabs" role="tablist">
            {[
              { id: 'All', label: isTe ? 'అన్నీ' : 'ALL FLEET', icon: '🚜' },
              { id: 'Ploughing', label: isTe ? 'దుక్కి' : 'PLOUGHING', icon: '🌱' },
              { id: 'Rotavator', label: isTe ? 'రొటవేటర్' : 'ROTAVATOR', icon: '🔄' },
              { id: 'Cultivator', label: isTe ? 'కల్టివేటర్' : 'CULTIVATOR', icon: '🌾' },
              { id: 'Corn Harvester', label: isTe ? 'హార్వెస్టర్' : 'HARVESTER', icon: '🌽' },
              { id: 'Straw Baler', label: isTe ? 'బెయిలర్' : 'STRAW BALER', icon: '📦' },
              { id: 'Corn Seeder', label: isTe ? 'సీడర్' : 'SEED PLANTER', icon: '🌱' },
              { id: 'Trailer Services', label: isTe ? 'ట్రాలీ' : 'TRAILER', icon: '🚚' }
            ].map((tab) => {
              const isActive = (serviceFilter || 'All').toLowerCase() === tab.id.toLowerCase();
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`jfarm-tab-pill ${isActive ? 'active' : ''}`}
                  onClick={() => setServiceFilter(tab.id)}
                >
                  <span className="jfarm-tab-icon">{tab.icon}</span>
                  <span className="jfarm-tab-text">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Clean Two-Field Search Toolbar */}
        <div className="jfarm-search-card">
          <form className="jfarm-search-form clean-search-bar" onSubmit={handleSearchSubmit}>
            {/* Field 1: Location */}
            <div
              className="jfarm-search-field field-location"
              onClick={onOpenLocationPicker}
              role="button"
              tabIndex={0}
            >
              <span className="jfarm-field-label">
                {isTe ? 'గ్రామం / లొకేషన్' : 'VILLAGE / BASE'}
              </span>
              <div className="jfarm-field-value">
                <span className="jfarm-field-icon">📍</span>
                <span className="jfarm-location-text">
                  {selectedLocation ? `${activeVillage}, ${activeDistrict}` : (isTe ? 'హసన్‌పర్తి, హనుమకొండ' : 'Hasanparthy, Hanumakonda')}
                </span>
                <span className="jfarm-change-link">{isTe ? 'మార్చండి ▾' : 'Change ▾'}</span>
              </div>
            </div>

            {/* Field 2: Search keyword */}
            <div className="jfarm-search-field field-search">
              <label htmlFor="jfarm-search-input" className="jfarm-field-label">
                {isTe ? 'శోధన' : 'SEARCH MODEL / VILLAGE'}
              </label>
              <div className="jfarm-field-input-wrap">
                <span className="jfarm-field-icon">🔍</span>
                <input
                  id="jfarm-search-input"
                  type="text"
                  className="jfarm-field-input"
                  placeholder={isTe ? "ఉదా: మహీంద్రా, స్వరాజ్, రొటవేటర్, హసన్‌పర్తి..." : "e.g. Mahindra, Swaraj, 575, Hasanparthy..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="jfarm-clear-btn"
                    onClick={() => setSearchQuery('')}
                    title="Clear"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Swiggy-Style "What's on your mind?" Machinery Visual Category Carousel */}
      <section className="swiggy-categories-section page-anim">
        <div className="swiggy-categories-header">
          <div>
            <h2 className="swiggy-categories-title">
              {isTe ? 'మీకు ఏ వ్యవసాయ యంత్రం కావాలి?' : "What machinery are you looking for?"}
            </h2>
            <span className="swiggy-categories-sub">
              {isTe 
                ? 'తెలంగాణ రైతులకు అనుకూలమైన ట్రాక్టర్లు & ఉపకరణాలు' 
                : 'Select machine type to filter nearby fleet instantly'}
            </span>
          </div>
          {serviceFilter && serviceFilter !== 'All' && (
            <button
              type="button"
              className="swiggy-reset-btn"
              onClick={() => setServiceFilter('All')}
              title={isTe ? 'అన్నీ చూపించు' : 'Show all machinery'}
            >
              ✕ {isTe ? 'అన్నీ చూపించు' : 'Clear filter'}
            </button>
          )}
        </div>

        {/* Horizontal Scrollable Categories Track */}
        <div className="swiggy-categories-track">
          {machineryCategories.map((cat) => {
            const isSelected = (serviceFilter || 'All').toLowerCase() === cat.id.toLowerCase();
            return (
              <button
                key={cat.id}
                type="button"
                className={`swiggy-cat-card ${isSelected ? 'active' : ''}`}
                onClick={() => setServiceFilter(isSelected && cat.id !== 'All' ? 'All' : cat.id)}
                title={isTe ? cat.nameTe : cat.name}
              >
                <div className="swiggy-cat-circle-wrap">
                  <div className="swiggy-cat-circle">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="swiggy-cat-img"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextSibling) {
                          e.currentTarget.nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                    <div className="swiggy-cat-fallback-emoji" style={{ display: 'none' }}>
                      {cat.emoji}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="swiggy-cat-check-badge">✓</div>
                  )}
                  {cat.badge && (
                    <span className="swiggy-cat-pill-badge">{cat.badge}</span>
                  )}
                </div>
                <span className="swiggy-cat-label">
                  {isTe ? cat.nameTe : cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Results Header with Sorting Bar (Swiggy Style: Top X restaurants to explore) */}
      <div id="fleet-results" className="marketplace-results-bar">
        <div className="results-count-wrap">
          <h3 className="results-count-title">
            {isTe 
              ? `${activeVillage} లో అందుబాటులో ఉన్న ${sortedTractors.length} యంత్రాలు` 
              : `Top ${sortedTractors.length} machinery in ${activeVillage}`}
          </h3>
          {serviceFilter && serviceFilter !== 'All' && (
            <span className="results-filter-pill">
              Filter: {serviceFilter}
            </span>
          )}
        </div>

        <div className="results-sorting-wrap">
          <div className="marketplace-select-box">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="marketplace-select-elem"
            >
              <option value="recommended">⭐ {isTe ? 'సిఫార్సు చేయబడినవి' : 'Recommended'}</option>
              <option value="price-low">📉 {t.sortPriceLowHigh}</option>
              <option value="price-high">📈 {t.sortPriceHighLow}</option>
              <option value="rating">🏆 {t.sortRating}</option>
            </select>
            <span className="marketplace-select-chevron">▾</span>
          </div>
        </div>
      </div>

      {/* Fleet Cards Container */}
      <div className="marketplace-cards-container">
        {sortedTractors.map((tractor, idx) => {
          const rating = tractor.rating || 4.9;
          const reviewsCount = 24 + idx * 3;
          const distanceKm = tractor.distanceKm || (idx === 0 ? 1 : 2);
          const dispatchMins = idx === 0 ? 13 : 15;
          const priceAcre = tractor.priceAcre || (tractor.pricing * 2);

          const implementsList = tractor.equipment 
            ? tractor.equipment.split(',').map(s => s.trim()) 
            : ['Ploughing', 'Rotavator', 'Cultivator'];

          const accuratePhoto = getAccurateTractorPhoto(tractor);
          const displayName = getTractorDisplayName(tractor);
          const hpLabel = getHpDisplay(tractor);

          return (
            <div key={tractor.id} className="marketplace-tractor-card">
              {/* Top Dispatch Tag (Screenshot 4: ~1 km away • ~13 mins dispatch) */}
              <div className="marketplace-dispatch-banner">
                <span className="dispatch-bolt">⚡</span>
                <span>~{distanceKm} km away • ~{dispatchMins} mins dispatch</span>
              </div>

              {/* Tractor Photo Container */}
              <div className="marketplace-image-wrapper">
                <img
                  src={accuratePhoto}
                  alt={displayName}
                  className="marketplace-tractor-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/tractor1.jpeg';
                  }}
                />
                {/* Rating Badge on bottom-right of image */}
                <span className="marketplace-rating-tag">
                  ★ {rating} ({reviewsCount})
                </span>
              </div>

              {/* Card Body */}
              <div className="marketplace-card-content">
                {/* Title & HP Badge */}
                <div className="marketplace-title-row">
                  <h3 className="marketplace-tractor-name">
                    {displayName}
                  </h3>
                  <span className="marketplace-hp-pill">
                    {hpLabel}
                  </span>
                </div>

                {/* Owner Line */}
                <div className="marketplace-owner-row">
                  <span className="marketplace-owner-trophy">🏆</span>
                  <span>Owner: <strong>{tractor.owner}</strong></span>
                </div>

                {/* Suitable For Tags */}
                <div className="marketplace-suitable-section">
                  <span className="marketplace-suitable-title">SUITABLE FOR:</span>
                  <div className="marketplace-tags-wrap">
                    {implementsList.slice(0, 3).map((tool, i) => (
                      <span key={i} className="marketplace-green-tag">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price & Book Tractor CTA */}
                <div className="marketplace-price-action-row">
                  <div className="marketplace-pricing-group">
                    <span className="marketplace-price-main">
                      ₹{tractor.pricing} <small>/hr</small>
                    </span>
                    <span className="marketplace-price-sub">
                      (₹{priceAcre}/acre)
                    </span>
                  </div>

                  <button
                    type="button"
                    className="marketplace-book-btn"
                    onClick={() => handleBookTractor(tractor)}
                  >
                    <span>{isTe ? 'ట్రాక్టర్ బుక్ చేయండి 🚜' : 'Book Tractor 🚜'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AgriRent Privacy Policy & Rural Platform Footer */}
      <footer className="agrirent-app-footer page-anim">
        {/* Footer Main Area Styled Like a Privacy Policy & Legal Section */}
        <div className="agrirent-footer-body">
          <div className="agrirent-footer-main">
            {/* Column 1: Brand & Mission */}
            <div className="agrirent-footer-col brand-col">
              <div className="footer-brand-header">
                <span className="footer-brand-logo">🌾</span>
                <div>
                  <h3 className="footer-brand-title">AgriRent</h3>
                  <span className="footer-brand-sub">FARM MACHINERY PLATFORM</span>
                </div>
              </div>
              <p className="footer-brand-desc">
                {isTe
                  ? 'తెలంగాణలోని 33 జిల్లాల్లో రైతుల కోసం ప్రత్యేకంగా రూపొందించబడిన రైతు-నుండి-రైతు వ్యవసాయ యంత్రాల అద్దె వేదిక. మధ్యవర్తులు మరియు కమీషన్ లేని పారదర్శక సేవలు.'
                  : 'Direct Farmer-to-Farmer agricultural machinery rental platform across all 33 Telangana districts. Verified tractors, implements, and harvesters with zero platform fee and transparent rates.'}
              </p>
              <div className="footer-district-badges">
                <span className="footer-district-pill">🌾 33 Telangana Districts</span>
                <span className="footer-district-pill">⚡ 0% Brokerage Guarantee</span>
              </div>
            </div>

            {/* Column 2: Privacy Policy & Farmer Protection (Highlighted Section) */}
            <div className="agrirent-footer-col privacy-col">
              <h4 className="footer-col-title">
                <span className="footer-title-icon">🔒</span>
                {isTe ? 'గోప్యతా విధానం & డేటా రక్షణ' : 'Privacy Policy & Protection'}
              </h4>
              <div className="footer-privacy-box">
                <p className="footer-privacy-summary">
                  {isTe
                    ? 'రైతులు మరియు వాహన యజమానుల వ్యక్తిగత వివరాలు, ఫోన్ నంబర్లు మరియు ఆర్సీ పత్రాలు 100% ఎన్‌క్రిప్ట్ చేయబడ్డాయి. మూడవ పక్షాలకు ఎలాంటి డేటా అమ్మబడదు.'
                    : 'Farmer and machinery owner phone numbers, field locations, and RC documents are end-to-end encrypted. We strictly never sell or share farmer data with 3rd-party advertisers.'}
                </p>
                <ul className="footer-policy-bullets">
                  <li>✓ {isTe ? 'ప్రత్యక్ష నగదు లేదా UPI చెల్లింపులు' : '100% Direct Cash or UPI Settlements'}</li>
                  <li>✓ {isTe ? 'ఆర్సీ & ఆధార్ భద్రతా ధృవీకరణ' : 'RTA-Verified Machinery RC & Driver KYC'}</li>
                  <li>✓ {isTe ? 'సురక్షిత స్థాన పరిధి (15 కి.మీ)' : 'Strict 15 km Radius Proximity Matching'}</li>
                </ul>
                <button
                  type="button"
                  className="footer-privacy-modal-btn"
                  onClick={() => setIsPrivacyModalOpen(true)}
                >
                  <span>{isTe ? 'పూర్తి గోప్యతా విధానం చదవండి →' : 'Read Full Privacy Policy →'}</span>
                </button>
              </div>
            </div>

            {/* Column 3: Terms of Rental & Operating Rules */}
            <div className="agrirent-footer-col terms-col">
              <h4 className="footer-col-title">
                <span className="footer-title-icon">📜</span>
                {isTe ? 'అద్దె నిబంధనలు & మార్గదర్శకాలు' : 'Rental Terms & Rules'}
              </h4>
              <ul className="footer-links-list">
                <li>
                  <button type="button" className="footer-link-btn" onClick={() => setIsPrivacyModalOpen(true)}>
                    {isTe ? 'రైతు సమాచార రక్షణ నిబంధనలు' : 'Farmer Data Privacy & Terms'}
                  </button>
                </li>
                <li>
                  <span className="footer-static-link">
                    {isTe ? 'పారదర్శక గంట & ఎకరా రేట్లు' : 'Transparent Hourly & Per-Acre Rates'}
                  </span>
                </li>
                <li>
                  <span className="footer-static-link">
                    {isTe ? 'డిస్పాచ్‌కు ముందు ఉచిత రద్దు' : 'Free Cancellation Prior to Dispatch'}
                  </span>
                </li>
                <li>
                  <span className="footer-static-link">
                    {isTe ? 'ఇంధనం & డ్రైవర్ ముందస్తు ఒప్పందం' : 'Pre-Agreed Diesel & Driver Norms'}
                  </span>
                </li>
                <li>
                  <span className="footer-static-link">
                    {isTe ? 'గ్రామ వివాద పరిష్కార విభాగం' : 'Village Grievance Redressal'}
                  </span>
                </li>
              </ul>
            </div>

            {/* Column 4: Support & Mandals */}
            <div className="agrirent-footer-col contact-col">
              <h4 className="footer-col-title">
                <span className="footer-title-icon">📞</span>
                {isTe ? 'హెల్ప్‌లైన్ & కేంద్రం' : 'Helpline & Office'}
              </h4>
              <div className="footer-contact-details">
                <div className="footer-contact-row">
                  <span className="contact-icon">📞</span>
                  <div>
                    <span className="contact-label">{isTe ? 'టోల్-ఫ్రీ కిసాన్ డెస్క్:' : 'Toll-Free Kisan Desk:'}</span>
                    <a href="tel:18004251122" className="contact-val highlight">1800-425-1122</a>
                  </div>
                </div>
                <div className="footer-contact-row">
                  <span className="contact-icon">🏢</span>
                  <div>
                    <span className="contact-label">{isTe ? 'హసన్‌పర్తి మండల కేంద్రం:' : 'Hasanparthy Mandal Desk:'}</span>
                    <a href="tel:08702577788" className="contact-val">0870-2577788</a>
                  </div>
                </div>
                <div className="footer-contact-row">
                  <span className="contact-icon">💬</span>
                  <div>
                    <span className="contact-label">{isTe ? 'కిసాన్ వాట్సాప్ సేవలు:' : 'WhatsApp Support:'}</span>
                    <span className="contact-val">+91 9032004060</span>
                  </div>
                </div>
                <div className="footer-contact-row">
                  <span className="contact-icon">⏰</span>
                  <div>
                    <span className="contact-label">{isTe ? 'పనివేళలు:' : 'Operating Hours:'}</span>
                    <span className="contact-val">5:00 AM – 9:00 PM (All 7 Days)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Legal Copyright Row */}
          <div className="agrirent-footer-bottom">
            <div className="footer-copyright-text">
              © 2026 AgriRent Technologies Pvt Ltd. All rights reserved. • Built for Telangana Farmers
            </div>
            <div className="footer-bottom-links">
              <button type="button" className="bottom-link-item" onClick={() => setIsPrivacyModalOpen(true)}>
                Privacy Policy
              </button>
              <span className="bottom-divider">•</span>
              <button type="button" className="bottom-link-item" onClick={() => setIsPrivacyModalOpen(true)}>
                Terms of Service
              </button>
              <span className="bottom-divider">•</span>
              <span className="bottom-link-item">Kisan Grievance Cell</span>
              <span className="bottom-divider">•</span>
              <span className="bottom-link-item">Telangana 33 Mandals</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Celebratory Toast When Machinery Is Successfully Listed */}
      {listSuccessToast && (
        <div className="list-success-toast">
          <span>{listSuccessToast}</span>
        </div>
      )}

      {/* Direct List Machinery Modal: Instantly lists machinery on AgriRent without redirecting to Vehicle Owner KYC Login */}
      {isListModalOpen && (
        <div className="list-machinery-modal-overlay" onClick={() => setIsListModalOpen(false)}>
          <div className="list-machinery-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="list-machinery-modal-header">
              <div className="list-machinery-header-left">
                <div className="list-machinery-header-icon">🚜</div>
                <div>
                  <h3 className="list-machinery-title">
                    {isTe ? 'అగ్రిరెంట్‌లో యంత్రాన్ని నమోదు చేయండి' : 'List Machinery on AgriRent'}
                  </h3>
                  <p className="list-machinery-sub">
                    {isTe ? '0% కమీషన్ • తక్షణమే ఫ్లీట్‌లో కనిపిస్తుంది' : '0% Commission • Instant Fleet Listing'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="list-machinery-close-btn"
                onClick={() => setIsListModalOpen(false)}
                title="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleListMachinerySubmit} className="list-machinery-form">
              <div className="list-form-row">
                <div className="list-form-group">
                  <label className="list-form-label">{isTe ? 'యజమాని పూర్తి పేరు *' : 'Owner Full Name *'}</label>
                  <input
                    type="text"
                    required
                    className="list-form-input"
                    placeholder={isTe ? "ఉదా: రమేష్ రావు" : "e.g. Ramesh Rao"}
                    value={newMachineForm.ownerName}
                    onChange={(e) => setNewMachineForm({ ...newMachineForm, ownerName: e.target.value })}
                  />
                </div>
                <div className="list-form-group">
                  <label className="list-form-label">{isTe ? '10-అంకెల మొబైల్ నంబర్ *' : '10-Digit Mobile *'}</label>
                  <input
                    type="tel"
                    pattern="[0-9]{10}"
                    required
                    className="list-form-input"
                    placeholder={isTe ? "10 అంకెల మొబైల్" : "10-digit mobile"}
                    value={newMachineForm.mobile}
                    onChange={(e) => setNewMachineForm({ ...newMachineForm, mobile: e.target.value })}
                  />
                </div>
              </div>

              <div className="list-form-row">
                <div className="list-form-group">
                  <label className="list-form-label">{isTe ? 'ట్రాక్టర్ బ్రాండ్' : 'Machinery Brand'}</label>
                  <select
                    className="list-form-select"
                    value={newMachineForm.brand}
                    onChange={(e) => {
                      const selectedB = e.target.value;
                      const defaultM = `${selectedB} 575 DI (47 HP)`;
                      setNewMachineForm({
                        ...newMachineForm,
                        brand: selectedB,
                        model: defaultM,
                        photo: getAccurateTractorPhoto({ brand: selectedB, model: defaultM })
                      });
                    }}
                  >
                    {availableBrands.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="list-form-group">
                  <label className="list-form-label">{isTe ? 'మోడల్ & HP వివరణ *' : 'Model & HP Specs *'}</label>
                  <input
                    type="text"
                    required
                    className="list-form-input"
                    placeholder="e.g. 575 DI XP Plus (47 HP)"
                    value={newMachineForm.model}
                    onChange={(e) => setNewMachineForm({ ...newMachineForm, model: e.target.value })}
                  />
                </div>
              </div>

              <div className="list-form-group">
                <label className="list-form-label">{isTe ? 'అందుబాటులో ఉన్న పరికరాలు (Implements)' : 'Available Attachments / Implements'}</label>
                <div className="list-implements-grid">
                  {availableImplements.map((impl) => {
                    const active = newMachineForm.implements.includes(impl.id);
                    return (
                      <button
                        key={impl.id}
                        type="button"
                        className={`list-implement-pill ${active ? 'active' : ''}`}
                        onClick={() => handleToggleImplement(impl.id)}
                      >
                        {active ? '✓ ' : '+ '}{impl.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="list-form-row">
                <div className="list-form-group">
                  <label className="list-form-label">{isTe ? 'గంటకు అద్దె ధర (₹/hr) *' : 'Rental Rate (₹/hr) *'}</label>
                  <input
                    type="number"
                    min="300"
                    max="5000"
                    required
                    className="list-form-input"
                    value={newMachineForm.priceHour}
                    onChange={(e) => setNewMachineForm({
                      ...newMachineForm,
                      priceHour: e.target.value,
                      priceAcre: (Number(e.target.value) || 1000) * 2
                    })}
                  />
                </div>
                <div className="list-form-group">
                  <label className="list-form-label">{isTe ? 'ఎకరానికి ధర (₹/acre)' : 'Per Acre Rate (₹/acre)'}</label>
                  <input
                    type="number"
                    className="list-form-input"
                    value={newMachineForm.priceAcre}
                    onChange={(e) => setNewMachineForm({ ...newMachineForm, priceAcre: e.target.value })}
                  />
                </div>
              </div>

              <div className="list-form-group">
                <label className="list-form-label">{isTe ? 'గ్రామం / మండలం లొకేషన్ *' : 'Base Village / Location *'}</label>
                <input
                  type="text"
                  required
                  className="list-form-input"
                  value={newMachineForm.village}
                  onChange={(e) => setNewMachineForm({ ...newMachineForm, village: e.target.value })}
                />
              </div>

              <div className="list-form-group">
                <label className="list-form-label">{isTe ? 'యంత్రం ఫోటో ఎంచుకోండి' : 'Choose Machinery Photo'}</label>
                <div className="list-photos-picker">
                  {selectablePhotos.map((p) => {
                    const isSelected = newMachineForm.photo === p.src;
                    return (
                      <div
                        key={p.id}
                        className={`list-photo-thumb-wrap ${isSelected ? 'selected' : ''}`}
                        onClick={() => setNewMachineForm({ ...newMachineForm, photo: p.src })}
                        title={p.label}
                      >
                        <img src={p.src} alt={p.label} className="list-photo-thumb" />
                      </div>
                    );
                  })}
                </div>
              </div>

              <button type="submit" className="list-machinery-submit-btn">
                <span>{isTe ? 'యంత్రాన్ని ఫ్లీట్‌లో ప్రచురించండి 🚀' : 'Publish Machinery to AgriRent Fleet 🚀'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Privacy Policy Modal */}
      {isPrivacyModalOpen && (
        <div className="privacy-modal-overlay" onClick={() => setIsPrivacyModalOpen(false)}>
          <div className="privacy-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="privacy-modal-header">
              <div className="privacy-header-left">
                <div className="privacy-header-icon">🔒</div>
                <div>
                  <h3 className="privacy-modal-title">
                    {isTe ? 'అగ్రిరెంట్ గోప్యతా విధానం & రైతు భద్రత' : 'AgriRent Privacy Policy & Farmer Protection'}
                  </h3>
                  <p className="privacy-modal-sub">
                    {isTe
                      ? 'తెలంగాణ వ్యవసాయ విభాగ మార్గదర్శకాల ప్రకారం భద్రపరచబడింది • అక్టోబర్ 2026'
                      : 'Telangana Agricultural Mechanization Standards Compliant • October 2026'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="privacy-modal-close"
                onClick={() => setIsPrivacyModalOpen(false)}
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="privacy-modal-body">
              <section className="privacy-section">
                <h4>1. Information We Collect</h4>
                <p>
                  AgriRent collects minimal operational information needed for machine dispatch: farmer contact number, field location (village/mandal), required acreage/hours, and machinery registration (RC certificate and owner KYC for tractor owners).
                </p>
              </section>

              <section className="privacy-section">
                <h4>2. Zero Third-Party Advertising & Data Sales</h4>
                <p>
                  We maintain a strict <strong>Zero Third-Party Advertising & Data Sales</strong> commitment. Your phone number is only shared directly with the verified tractor owner or farmer when a booking is confirmed, solely to coordinate work in the field.
                </p>
              </section>

              <section className="privacy-section">
                <h4>3. Geolocation & Dispatch Privacy</h4>
                <p>
                  Village base coordinates are used strictly to calculate dispatch distances within a 15 km radius, ensuring the quickest arrival (~15 mins) and fair travel estimation. We never track background location when the app is inactive.
                </p>
              </section>

              <section className="privacy-section">
                <h4>4. Direct Payments & Financial Security</h4>
                <p>
                  AgriRent operates with <strong>0% platform commission</strong>. All payments (UPI, PhonePe, Google Pay, or Cash on Delivery) are settled directly between farmer and machinery owner. AgriRent never asks for or stores debit card numbers, UPI PINs, or bank account credentials.
                </p>
              </section>

              <section className="privacy-section">
                <h4>5. Machine Verification & Grievance Redressal</h4>
                <p>
                  All tractors, rotavators, and harvesters undergo RC verification to prevent disputes. For any grievance regarding delayed arrival, incorrect equipment, or billing, call our Toll-Free Kisan Helpline at <strong>1800-425-1122</strong> or contact the Hasanparthy Mandal Mechanization desk.
                </p>
              </section>
            </div>

            <div className="privacy-modal-footer">
              <button
                type="button"
                className="btn-privacy-accept"
                onClick={() => setIsPrivacyModalOpen(false)}
              >
                {isTe ? 'అర్థమైంది & మూసివేయండి' : 'Understood & Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
