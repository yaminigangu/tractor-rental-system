import { useState } from 'react';
import WeatherBar from '../components/WeatherBar';
import { translations } from '../translations';

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
      image: '/images/swaraj_blue.jpg',
      emoji: '🌱',
      badge: 'Popular'
    },
    {
      id: 'Rotavator',
      name: 'Rotavator',
      nameTe: 'రొటవేటర్',
      image: '/images/mahindra_575.jpg',
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
      image: '/tractor4.jpeg',
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
      image: '/tractor5.jpeg',
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

  const handleBookTractor = (tractor) => {
    if (setSelectedTractor) {
      setSelectedTractor(tractor);
    }
    setActivePage('booking-form');
  };

  return (
    <div className="find-tractor-page page-anim">
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

      {/* Top Search & Filter Bar */}
      <div className="marketplace-controls-wrap">
        {/* Search Input */}
        <div className="marketplace-search-box">
          <span className="marketplace-search-icon">🔍</span>
          <input
            type="text"
            className="marketplace-search-input"
            placeholder={
              isTe 
                ? "గ్రామం ద్వారా వెతకండి (ఉదా: పరకాల, మేడారం, పస్రా) లేదా యంత్రం..." 
                : "Search village (e.g. Parkal, Medaram, Pasra) or machine..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="marketplace-search-clear"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

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
      <div className="marketplace-results-bar">
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
          const engineHp = tractor.engineHp || (tractor.model?.includes('575') ? '47' : '48');
          const priceAcre = tractor.priceAcre || (tractor.pricing * 2);

          const implementsList = tractor.equipment 
            ? tractor.equipment.split(',').map(s => s.trim()) 
            : ['Ploughing', 'Rotavator', 'Cultivator'];

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
                  src={tractor.photo || '/tractor1.jpeg'}
                  alt={`${tractor.brand} ${tractor.model}`}
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
                    {tractor.brand} {tractor.model}
                  </h3>
                  <span className="marketplace-hp-pill">
                    {engineHp} HP
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
    </div>
  );
}
