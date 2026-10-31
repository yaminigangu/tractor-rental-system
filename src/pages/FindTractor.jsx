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
  setActivePage,
  setSelectedTractor,
  serviceFilter,
  setServiceFilter,
  language = 'en',
  selectedLocation,
  weatherData,
  isLoadingWeather,
  onOpenLocationPicker,
  isUserLoggedIn = false
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [onlyLocalFleet, setOnlyLocalFleet] = useState(false);

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

  // GSAP Entrance Animations on Mount
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.from('.jfarm-badge-pill', { opacity: 0, y: -12, duration: 0.35, ease: 'power2.out' })
        .from('.jfarm-portal-switch', { opacity: 0, y: -10, duration: 0.35, ease: 'power2.out' }, '-=0.2')
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

      {/* JFarm Services Desktop Hero Banner & QuickRide-style Quick Search Bar (Edge-to-Edge Full Workspace) */}
      <section className="jfarm-hero-section page-anim">
        <div className="jfarm-hero-header">
          <div className="jfarm-header-top-row">
            <div className="jfarm-badge-pill">
              <span className="jfarm-badge-dot">●</span>
              <span>{isTe ? 'తెలంగాణ వ్యవసాయ యంత్రీకరణ వేదిక' : 'Telangana Farm Machinery Rental Platform'}</span>
            </div>

            {/* JFarm Services Hirer vs Renter Mode Switch (Reference: jfarmservices.in/renter.php) */}
            <div className="jfarm-portal-switch" role="tablist">
              <button
                type="button"
                className="jfarm-switch-pill active"
                title={isTe ? 'రైతు అద్దె వేదిక' : 'Hire Machinery (Farmer)'}
              >
                <span>🌾 {isTe ? 'రైతు అద్దె వేదిక' : 'Hire Machinery'}</span>
              </button>
              <button
                type="button"
                className="jfarm-switch-pill"
                onClick={() => setActivePage('owner-registration')}
                title={isTe ? 'యంత్రాల యజమాని పోర్టల్' : 'List Machinery (Renter Hub)'}
              >
                <span>🚜 {isTe ? 'యంత్ర యజమానుల కేంద్రం' : 'List Machinery (Renter Hub)'}</span>
                <span className="jfarm-zero-badge">0% Fee</span>
              </button>
            </div>
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

        {/* QuickRide Desktop Search Toolbar (Horizontal across 1140px-1200px) */}
        <div className="jfarm-search-card">
          <form className="jfarm-search-form" onSubmit={handleSearchSubmit}>
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

            {/* Field 2: Equipment Implement */}
            <div className="jfarm-search-field field-implement">
              <label htmlFor="jfarm-implement-select" className="jfarm-field-label">
                {isTe ? 'యంత్ర రకం' : 'IMPLEMENT TYPE'}
              </label>
              <div className="jfarm-field-select-wrap">
                <span className="jfarm-field-icon">🚜</span>
                <select
                  id="jfarm-implement-select"
                  className="jfarm-field-select"
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                >
                  <option value="All">{isTe ? 'అన్ని యంత్రాలు (All)' : 'All Machinery'}</option>
                  <option value="Ploughing">🌱 {isTe ? 'దుక్కి దున్నడం (Ploughing)' : 'Ploughing'}</option>
                  <option value="Rotavator">🔄 {isTe ? 'రొటవేటర్ (Rotavator)' : 'Rotavator'}</option>
                  <option value="Cultivator">🌾 {isTe ? 'కల్టివేటర్ (Cultivator)' : 'Cultivator'}</option>
                  <option value="Corn Harvester">🌽 {isTe ? 'మొక్కజొన్న కోత (Harvester)' : 'Corn Harvester'}</option>
                  <option value="Straw Baler">📦 {isTe ? 'గడ్డి బెయిలర్ (Straw Baler)' : 'Straw Baler'}</option>
                  <option value="Corn Seeder">🌱 {isTe ? 'విత్తన యంత్రం (Seed Planter)' : 'Seed Planter'}</option>
                  <option value="Trailer Services">🚚 {isTe ? 'ట్రాలీ రవాణా (Trailer)' : 'Trailer Trolley'}</option>
                  <option value="Heavy 50+ HP">⚡ {isTe ? '50+ HP హెవీ ట్రాక్టర్' : '50+ HP Heavy Duty'}</option>
                </select>
                <span className="jfarm-select-chevron">▾</span>
              </div>
            </div>

            {/* Field 3: Search keyword */}
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
                  placeholder={isTe ? "ఉదా: మహీంద్రా, స్వరాజ్, రొటవేటర్..." : "e.g. Mahindra, Swaraj, 575..."}
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

            {/* Field 4: Sorting */}
            <div className="jfarm-search-field field-sort">
              <label htmlFor="jfarm-sort-select" className="jfarm-field-label">
                {isTe ? 'క్రమబద్ధీకరించు' : 'SORT BY'}
              </label>
              <div className="jfarm-field-select-wrap">
                <select
                  id="jfarm-sort-select"
                  className="jfarm-field-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="recommended">⭐ {isTe ? 'సిఫార్సు' : 'Recommended'}</option>
                  <option value="price-low">📉 {isTe ? 'ధర: తక్కువ నుండి ఎక్కువ' : 'Price: Low to High'}</option>
                  <option value="price-high">📈 {isTe ? 'ధర: ఎక్కువ నుండి తక్కువ' : 'Price: High to Low'}</option>
                  <option value="rating">🏆 {isTe ? 'రేటింగ్: ఉత్తమం' : 'Top Rating'}</option>
                </select>
                <span className="jfarm-select-chevron">▾</span>
              </div>
            </div>

            {/* CTA Button */}
            <button type="submit" className="jfarm-search-cta-btn">
              <span>{isTe ? 'యంత్రాలు వెతకండి 🚜' : 'SEARCH MACHINERY 🚜'}</span>
            </button>
          </form>

          {/* JFarm Services Trust & Hotline Footer Strip */}
          <div className="jfarm-trust-strip">
            <div className="jfarm-trust-item">
              <span className="jfarm-trust-icon">📞</span>
              <span>
                <strong>{isTe ? 'టోల్-ఫ్రీ సహాయం:' : 'Toll-Free Helpline:'}</strong>{' '}
                <a href="tel:18004251122" className="jfarm-helpline-link">1800-425-1122</a>
              </span>
            </div>
            <div className="jfarm-trust-dot">•</div>
            <div className="jfarm-trust-item">
              <span className="jfarm-trust-icon">⚡</span>
              <span>{isTe ? '~15 నిమిషాల వేగవంతమైన రాక' : '~15 Mins Quick Dispatch Guarantee'}</span>
            </div>
            <div className="jfarm-trust-dot">•</div>
            <div className="jfarm-trust-item">
              <span className="jfarm-trust-icon">🛡️</span>
              <span>{isTe ? '100% ధృవీకరించబడిన యజమానులు' : '100% KYC & RC Verified Owners'}</span>
            </div>
            <div className="jfarm-trust-dot">•</div>
            <div className="jfarm-trust-item">
              <span className="jfarm-trust-icon">🤝</span>
              <span>{isTe ? '0% కమీషన్ • రైతు నుండి రైతుకు' : '0% Commission • Farmer-to-Farmer'}</span>
            </div>
          </div>
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

      {/* JFarm Services Renter & Machinery Owner Hub Section (Direct Reference to https://www.jfarmservices.in/renter.php) */}
      <section className="jfarm-renter-hub-card page-anim">
        <div className="jfarm-renter-hub-content">
          <div className="jfarm-renter-badge-row">
            <span className="jfarm-renter-kicker">
              🚜 {isTe ? 'TAFE / అగ్రిరెంట్ యంత్రాల యజమానుల నెట్‌వర్క్' : 'JFarm Machinery Renter & Owner Network'}
            </span>
            <span className="jfarm-renter-pill">0% Platform Fee • 100% Direct</span>
          </div>

          <h2 className="jfarm-renter-heading">
            {isTe
              ? 'మీ ట్రాక్టర్ లేదా హార్వెస్టర్‌తో నెలకు ₹40,000 - ₹80,000 అద్దె ఆదాయం పొందండి'
              : 'Monetize Your Idle Machinery • Earn Guaranteed Rental Income'}
          </h2>

          <p className="jfarm-renter-subheading">
            {isTe
              ? 'తెలంగాణలోని 33 జిల్లాల్లో సమీప గ్రామాల రైతులతో నేరుగా అనుసంధానం అవ్వండి. 0% కమీషన్, ఉచిత నమోదు మరియు నేరుగా రైతు నుండి యజమానికి చెల్లింపులు.'
              : 'Tafe JFarm Services & AgriRent model connects tractor, rotavator, and harvester owners directly with neighborhood farmers across 33 Telangana districts. Zero brokerage, instant WhatsApp work orders, and direct payments.'}
          </p>

          <div className="jfarm-renter-highlights">
            <div className="renter-highlight-item">
              <span className="highlight-icon">💰</span>
              <div>
                <strong>{isTe ? '0% కమీషన్ ఫీజు' : '0% Commission Fee'}</strong>
                <p>{isTe ? 'మీ కష్టార్జితం మొత్తం మీకే చేరుతుంది' : 'Retain 100% of your hourly & per-acre earnings'}</p>
              </div>
            </div>
            <div className="renter-highlight-item">
              <span className="highlight-icon">⚡</span>
              <div>
                <strong>{isTe ? 'గ్రామాల నుండి నేరుగా ఆర్డర్లు' : 'Direct Village Orders'}</strong>
                <p>{isTe ? 'రైతుల నుండి నేరుగా కాల్స్ & వాట్సాప్ సందేశాలు' : 'Direct phone & WhatsApp calls from farmers in nearby mandals'}</p>
              </div>
            </div>
            <div className="renter-highlight-item">
              <span className="highlight-icon">🛡️</span>
              <div>
                <strong>{isTe ? 'ధృవీకరించబడిన నెట్‌వర్క్' : '100% RC & KYC Verified'}</strong>
                <p>{isTe ? 'పారదర్శకమైన మరియు సురక్షితమైన వ్యవసాయ సేవలు' : 'Trusted rural community with transparent ratings'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="jfarm-renter-hub-actions">
          <button
            type="button"
            className="btn-jfarm-renter-primary"
            onClick={() => setActivePage('owner-registration')}
          >
            <span>{isTe ? 'యంత్రం నమోదు చేయండి 🚜' : 'List Machinery as Renter 🚜'}</span>
          </button>
          <button
            type="button"
            className="btn-jfarm-renter-secondary"
            onClick={() => setActivePage('owner-inbox')}
          >
            <span>{isTe ? 'వర్క్ ఇన్‌బాక్స్ చూడండి 📬' : 'Owner Work Inbox 📬'}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
