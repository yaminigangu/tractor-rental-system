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
  onOpenLocationPicker
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [onlyLocalFleet, setOnlyLocalFleet] = useState(false);

  const t = translations[language] || translations.en;
  const isTe = language === 'te';

  const servicesList = [
    { id: 'All', label: t.allTractors },
    { id: 'Ploughing', label: isTe ? 'దుక్కి దున్నడం' : 'Ploughing' },
    { id: 'Rotavator', label: isTe ? 'రొటవేటర్' : 'Rotavator' },
    { id: 'Cultivator', label: isTe ? 'కల్టివేటర్' : 'Cultivator' },
    { id: 'Trailer Services', label: isTe ? 'ట్రాలీ రవాణా' : 'Trailer Services' },
    { id: 'Corn Harvester', label: isTe ? 'మొక్కజొన్న హార్వెస్టర్' : 'Corn Harvester' },
    { id: 'Straw Baler', label: isTe ? 'గడ్డి బెయిలర్' : 'Straw Baler' },
    { id: 'Corn Seeder', label: isTe ? 'విత్తన యంత్రం' : 'Corn Seeder' },
  ];

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

      // Straw Baler filter - matches balers and baling
      if (sf.includes('baler')) {
        return combined.includes('baler') || combined.includes('baling');
      }

      // Corn Seeder filter - matches manual/push corn seeders and planters
      if (sf.includes('seeder') || sf.includes('planter')) {
        return combined.includes('seeder') || combined.includes('seeding') || combined.includes('planter');
      }

      // Corn Harvester filter - matches combine harvester and corn machinery
      if (sf.includes('harvester') || sf === 'corn') {
        return combined.includes('harvester') || combined.includes('combine') || combined.includes('corn');
      }

      // Standard agricultural services
      if (sf.includes('plough')) {
        return combined.includes('plough') || combined.includes('tillage');
      }
      if (sf.includes('rotavator')) {
        return combined.includes('rotavator');
      }
      if (sf.includes('cultivator')) {
        return combined.includes('cultivator');
      }
      if (sf.includes('trailer')) {
        return combined.includes('trailer');
      }

      return combined.includes(sf);
    })();

    // Specialized machinery travels across mandals and districts; also match by village/district
    const isSpecialtyMachine =
      (tractor.equipment || '').toLowerCase().includes('harvester') ||
      (tractor.equipment || '').toLowerCase().includes('baler') ||
      (tractor.equipment || '').toLowerCase().includes('seeder') ||
      ['Corn Harvester', 'Straw Baler', 'Corn Seeder', 'Corn', 'Baler', 'Seeder'].includes(serviceFilter);

    const matchesLocal =
      !onlyLocalFleet ||
      isSpecialtyMachine ||
      (tractor.location || '').toLowerCase().includes(activeVillage.toLowerCase());

    return matchesSearch && matchesService && matchesLocal;
  });

  // Sort tractors
  const sortedTractors = [...filteredTractors].sort((a, b) => {
    if (sortBy === 'price-low') {
      return (a.pricing || 0) - (b.pricing || 0);
    } else if (sortBy === 'price-high') {
      return (b.pricing || 0) - (a.pricing || 0);
    } else if (sortBy === 'rating') {
      return (b.rating || 4.8) - (a.rating || 4.8);
    }
    return 0; // default order
  });

  const handleBookTractor = (tractor) => {
    if (setSelectedTractor) {
      setSelectedTractor(tractor);
    }
    setActivePage('booking-form');
  };

  const handleWhatsApp = (tractor) => {
    const msg = encodeURIComponent(
      isTe
        ? `నమస్తే ${tractor.owner} గారు, నేను అగ్రిరెంట్ పోర్టల్ ద్వారా మీ ట్రాక్టర్ (${tractor.brand} ${tractor.model}) చూశాను. నా పొలంలో పని కోసం మీ ట్రాక్టర్ కావాలి. దయచేసి వివరాలు చెప్పగలరు.`
        : `Hello ${tractor.owner}, I found your tractor (${tractor.brand} ${tractor.model}) on AgriRent portal. I need tractor work for my farm. Please let me know your availability.`
    );
    window.open(`https://wa.me/91${tractor.mobile.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  return (
    <div className="page-anim">
      {/* Agricultural Weather & Soil Advisory Widget */}
      <WeatherBar
        language={language}
        selectedLocation={selectedLocation}
        weatherData={weatherData}
        isLoadingWeather={isLoadingWeather}
        onOpenLocationPicker={onOpenLocationPicker}
      />

      {/* Locality Fleet Banner */}
      <div className="locality-fleet-banner">
        <div>
          <span>📍 {isTe ? 'ఎంచుకున్న ప్రాంతం:' : 'Active Location:'} </span>
          <strong>
            {isTe ? (selectedLocation?.villageTe || activeVillage) : activeVillage},{' '}
            {isTe ? (selectedLocation?.districtTe || activeDistrict) : activeDistrict}
          </strong>
          <span style={{ marginLeft: '10px', fontSize: '12px', background: '#e0f2fe', color: '#0369a1', padding: '3px 9px', borderRadius: '12px', fontWeight: 600 }}>
            {isTe ? `${sortedTractors.length} స్థానిక ట్రాక్టర్లు లభ్యత` : `${sortedTractors.length} Tractors Available Nearby`}
          </span>
        </div>
        <div className="locality-fleet-actions">
          <button
            className={`filter-local-toggle-btn ${onlyLocalFleet ? 'active' : ''}`}
            onClick={() => setOnlyLocalFleet(prev => !prev)}
            title={isTe ? 'ఈ గ్రామంలోని ట్రాక్టర్లను మాత్రమే చూపించు' : 'Filter tractors located in this immediate village only'}
          >
            {onlyLocalFleet
              ? (isTe ? `✓ కేవలం ${activeVillage} మాత్రమే` : `✓ ${activeVillage} Only`)
              : (isTe ? `🌾 కేవలం ${activeVillage}` : `🌾 ${activeVillage} Village Only`)}
          </button>
          <button
            className="filter-local-toggle-btn"
            style={{ background: '#f8fafc', borderColor: '#cbd5e1', color: '#334155' }}
            onClick={onOpenLocationPicker}
          >
            {isTe ? 'ప్రాంతం మార్చండి ▾' : 'Change Locality ▾'}
          </button>
        </div>
      </div>

      <div className="find-tractor-header">
        <div className="search-filter-bar">
          <div className="search-input-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder={isTe ? "గ్రామం (ఉదా: హసన్‌పర్తి, గజ్వేల్), బ్రాండ్ లేదా మోడల్ ద్వారా వెతకండి..." : t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Sort Selector */}
          <div className="sort-select-box">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="recommended">⭐ {isTe ? 'సిఫార్సు చేయబడినవి' : 'Recommended'}</option>
              <option value="price-low">📉 {t.sortPriceLowHigh}</option>
              <option value="price-high">📈 {t.sortPriceHighLow}</option>
              <option value="rating">🏆 {t.sortRating}</option>
            </select>
          </div>

          {/* Service Filter Pills */}
          <div className="filter-pills">
            {servicesList.map((service) => (
              <button
                key={service.id}
                className={`filter-pill ${(serviceFilter === service.id || (!serviceFilter && service.id === 'All')) ? 'active' : ''}`}
                onClick={() => setServiceFilter(service.id)}
              >
                {service.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {sortedTractors.length === 0 ? (
        <div className="form-card-wrapper text-center" style={{ padding: '50px 20px' }}>
          <p style={{ fontSize: '48px', marginBottom: '10px' }}>🌾</p>
          <h4>{isTe ? `ఫలితాలు దొరకలేదు: "${searchQuery || serviceFilter || activeVillage}"` : `No tractors matching "${searchQuery || serviceFilter || activeVillage}"`}</h4>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            {isTe ? 'స్థానిక ఫిల్టర్ తీసివేసి లేదా వేరే గ్రామం పేరుతో వెతకండి.' : 'Try disabling "Local Fleet Only" or search by another village name.'}
          </p>
          <div style={{ marginTop: '14px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {onlyLocalFleet && (
              <button
                className="btn btn-secondary"
                onClick={() => setOnlyLocalFleet(false)}
              >
                🌐 {isTe ? 'అన్ని తెలంగాణ ట్రాక్టర్లను చూపించు' : 'Show All Telangana Fleet'}
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={() => { setSearchQuery(''); setServiceFilter('All'); setOnlyLocalFleet(false); }}
            >
              🔄 {isTe ? 'ఫిల్టర్లు రీసెట్ చేయండి' : 'Reset Filters'}
            </button>
          </div>
        </div>
      ) : (
        <div className="tractor-grid">
          {sortedTractors.map((tractor) => {
            const isAvailable = (tractor.availability || 'Available').toLowerCase() === 'available';
            const rating = tractor.rating || 4.9;
            const jobsDone = tractor.jobsDone || (tractor.id * 7 + 12);

            return (
              <div key={tractor.id} className="tractor-card">
                <div className="tractor-image-box">
                  <img
                    src={tractor.photo || '/tractor1.jpeg'}
                    alt={`${tractor.brand} ${tractor.model}`}
                    className="tractor-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/tractor1.jpeg';
                    }}
                  />
                  <span className="brand-badge">{tractor.brand}</span>
                  <span className={`availability-tag ${isAvailable ? 'status-avail' : 'status-busy'}`}>
                    ● {isAvailable ? t.available : (tractor.availability || t.busy)}
                  </span>
                  <span className="rating-badge">★ {rating} ({jobsDone} {isTe ? 'పనులు' : 'jobs'})</span>
                  <span className="price-tag">
                    ₹{tractor.pricing} <small>{t.perHour}</small>
                  </span>
                </div>

                <div className="tractor-card-body">
                  <div className="tractor-title-row">
                    <h4 className="tractor-brand-model">{tractor.brand} {tractor.model}</h4>
                  </div>

                  <div className="locality-badge-row">
                    <span className="tractor-location-pill">
                      📍 {tractor.location}
                      {tractor.distanceKm && (
                        <span style={{ marginLeft: '5px', fontWeight: 600, color: '#166534' }}>
                          ({tractor.distanceKm < 2 ? (isTe ? 'గ్రామంలోనే' : 'In Village') : `${tractor.distanceKm} km`})
                        </span>
                      )}
                    </span>
                    <span className="verified-badge">✓ {t.verifiedBadge}</span>
                  </div>

                  <div className="equipment-tags-container">
                    <small className="equip-label">{t.equippedTools}:</small>
                    <p className="equipment-text">{tractor.equipment}</p>
                  </div>

                  <div className="owner-profile-strip">
                    <div className="owner-name-group">
                      <span className="owner-avatar">👤</span>
                      <div>
                        <strong>{tractor.owner}</strong>
                        <div className="owner-phone-sub">📞 {tractor.mobile}</div>
                      </div>
                    </div>
                  </div>

                  <div className="tractor-card-actions">
                    <button
                      className="btn-card-book"
                      onClick={() => handleBookTractor(tractor)}
                    >
                      🚜 {t.bookThisTractor}
                    </button>
                    <div className="tractor-card-quick-actions">
                      <a
                        href={`tel:${tractor.mobile}`}
                        className="btn-card-call"
                        title={`Call Owner: ${tractor.mobile}`}
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <span>{isTe ? 'కాల్ చేయండి' : 'Call'}</span>
                      </a>
                      <button
                        className="btn-card-whatsapp"
                        onClick={() => handleWhatsApp(tractor)}
                        title="WhatsApp Owner"
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1.004.577 1.764.846 2.806.847h.005c3.182 0 5.768-2.587 5.768-5.766.001-3.182-2.585-5.768-5.768-5.768zm7.545 5.767c-.001 4.161-3.387 7.546-7.546 7.547-1.329-.001-2.591-.351-3.692-.969l-4.108 1.077 1.097-4.004c-.68-1.157-1.042-2.483-1.042-3.839.001-4.161 3.387-7.546 7.547-7.547 4.16 0 7.544 3.386 7.544 7.546l-.001.189zm-4.133 2.923c-.227-.113-1.343-.663-1.551-.739-.208-.076-.36-.113-.512.113-.152.227-.588.739-.721.89-.133.152-.266.17-.493.057-.227-.113-.96-.354-1.83-1.129-.675-.602-1.131-1.346-1.264-1.573-.133-.227-.014-.35.099-.463.102-.102.227-.266.341-.399.113-.133.151-.227.227-.379.076-.152.038-.284-.019-.398-.057-.113-.512-1.233-.702-1.688-.185-.443-.373-.383-.512-.39-.133-.007-.284-.009-.437-.009-.152 0-.4.057-.609.284-.209.227-.798.779-.798 1.9 0 1.121.817 2.204.931 2.355.114.152 1.608 2.456 3.896 3.443.544.235.969.376 1.301.482.548.174 1.047.15 1.442.091.44-.066 1.343-.549 1.533-1.08.19-.531.19-.986.133-1.08-.057-.095-.209-.152-.436-.265z" />
                        </svg>
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
