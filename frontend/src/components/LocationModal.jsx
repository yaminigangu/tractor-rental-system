import { useState, useMemo } from 'react';
import { TELANGANA_DISTRICTS, ALL_LOCATIONS_LIST } from '../data/telanganaLocations';

export default function LocationModal({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
  language = 'en'
}) {
  const isTe = language === 'te';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState('all');
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [customVillage, setCustomVillage] = useState('');
  const [customDistrictId, setCustomDistrictId] = useState('hanumakonda');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Filter locations by search term and district
  const filteredLocations = useMemo(() => {
    let list = ALL_LOCATIONS_LIST;

    if (selectedDistrictFilter !== 'all') {
      list = list.filter((loc) => loc.districtId === selectedDistrictFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((loc) =>
        loc.village.toLowerCase().includes(q) ||
        (loc.villageTe && loc.villageTe.includes(q)) ||
        loc.mandal.toLowerCase().includes(q) ||
        loc.district.toLowerCase().includes(q) ||
        (loc.districtTe && loc.districtTe.includes(q))
      );
    }

    return list;
  }, [searchTerm, selectedDistrictFilter]);

  if (!isOpen) return null;

  // Handle GPS Auto-detect
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert(isTe ? 'మీ బ్రౌజర్‌లో GPS సపోర్ట్ లేదు.' : 'Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsDetectingGps(false);
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;

        // Find closest Telangana district by Euclidean/Haversine distance
        let closestDistrict = TELANGANA_DISTRICTS[0];
        let minDistance = Infinity;

        TELANGANA_DISTRICTS.forEach((d) => {
          const dist = Math.hypot(d.lat - userLat, d.lon - userLon);
          if (dist < minDistance) {
            minDistance = dist;
            closestDistrict = d;
          }
        });

        const primaryVillage = closestDistrict.villages[0] || { name: closestDistrict.name, mandal: closestDistrict.name };
        const detected = {
          village: primaryVillage.name,
          villageTe: primaryVillage.nameTe || primaryVillage.name,
          mandal: primaryVillage.mandal,
          districtId: closestDistrict.id,
          district: closestDistrict.name,
          districtTe: closestDistrict.nameTe,
          lat: closestDistrict.lat,
          lon: closestDistrict.lon,
          helpline: closestDistrict.helpline,
          kvk: closestDistrict.kvk
        };

        onSelectLocation(detected);
        onClose();
      },
      (error) => {
        setIsDetectingGps(false);
        console.warn('GPS location permission denied or error:', error.message);
        alert(
          isTe
            ? 'GPS అనుమతి నిరాకరించబడింది లేదా లొకేషన్ అందుబాటులో లేదు. దయచేసి జాబితా నుండి ఎంచుకోండి.'
            : 'GPS location access denied or unavailable. Please pick your village from the list.'
        );
      },
      { timeout: 7000 }
    );
  };

  // Handle Custom Village Add
  const handleSaveCustomVillage = (e) => {
    e.preventDefault();
    if (!customVillage.trim()) return;

    const districtObj = TELANGANA_DISTRICTS.find((d) => d.id === customDistrictId) || TELANGANA_DISTRICTS[0];
    const newLoc = {
      village: customVillage.trim(),
      villageTe: customVillage.trim(),
      mandal: customVillage.trim(),
      districtId: districtObj.id,
      district: districtObj.name,
      districtTe: districtObj.nameTe,
      lat: districtObj.lat,
      lon: districtObj.lon,
      helpline: districtObj.helpline,
      kvk: districtObj.kvk
    };

    onSelectLocation(newLoc);
    onClose();
  };

  const popularHubs = [
    { village: 'Hasanparthy', districtId: 'hanumakonda' },
    { village: 'Gajwel', districtId: 'siddipet' },
    { village: 'Narsampet', districtId: 'warangal' },
    { village: 'Armoor', districtId: 'nizamabad' },
    { village: 'Miryalaguda', districtId: 'nalgonda' },
    { village: 'Jadcherla', districtId: 'mahabubnagar' },
    { village: 'Huzurabad', districtId: 'karimnagar' },
    { village: 'Kodad', districtId: 'suryapet' },
    { village: 'Sathupally', districtId: 'khammam' },
    { village: 'Tandur', districtId: 'vikarabad' },
    { village: 'Palwancha', districtId: 'bhadradri_kothagudem' },
    { village: 'Bhongir Rural', districtId: 'yadadri_bhuvanagiri' }
  ];

  return (
    <div className="location-modal-overlay" onClick={onClose}>
      <div className="location-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="location-modal-header">
          <div className="modal-title-wrap">
            <span className="location-pin-icon">📍</span>
            <div>
              <h3>{isTe ? 'తెలంగాణ ప్రాంతం & గ్రామం ఎంచుకోండి' : 'Select Location & Village in Telangana'}</h3>
              <p>{isTe ? '33 జిల్లాలు మరియు గ్రామాల వ్యవసాయ వాతావరణం & ట్రాక్టర్ సేవలు' : 'Weather advisory & tractor fleet coverage across all 33 Telangana districts'}</p>
            </div>
          </div>
          <button className="location-modal-close" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        {/* Current Active Location Banner */}
        {currentLocation && (
          <div className="current-location-chip-banner">
            <span className="active-tag">{isTe ? 'ప్రస్తుత ప్రాంతం:' : 'Active Location:'}</span>
            <strong>
              {isTe ? (currentLocation.villageTe || currentLocation.village) : currentLocation.village},{' '}
              {isTe ? (currentLocation.districtTe || currentLocation.district) : currentLocation.district}
            </strong>
          </div>
        )}

        {/* Search & GPS Controls */}
        <div className="location-controls-bar">
          <div className="location-search-input">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              autoFocus
              placeholder={isTe ? 'గ్రామం లేదా మండలం పేరును శోధించండి (ఉదా: హసన్‌పర్తి, గజ్వేల్, ఆర్మూర్)...' : 'Search any village, mandal, or district (e.g. Hasanparthy, Gajwel, Armoor)...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search-btn" onClick={() => setSearchTerm('')}>✕</button>
            )}
          </div>

          <button
            className={`gps-locate-btn ${isDetectingGps ? 'detecting' : ''}`}
            onClick={handleDetectGPS}
            disabled={isDetectingGps}
            title={isTe ? 'నా ప్రస్తుత GPS స్థానాన్ని గుర్తించు' : 'Auto-detect my current GPS location'}
          >
            <span>{isDetectingGps ? '⏳' : '🎯'}</span>
            <span>{isDetectingGps ? (isTe ? 'గుర్తిస్తోంది...' : 'Detecting GPS...') : (isTe ? 'నా లొకేషన్' : 'Use My GPS')}</span>
          </button>
        </div>

        {/* Popular Telangana Hubs Quick Chips */}
        <div className="popular-hubs-container">
          <span className="hubs-label">{isTe ? 'ప్రముఖ వ్యవసాయ కేంద్రాలు:' : 'Popular Agri Hubs:'}</span>
          <div className="hubs-scroll-row">
            {popularHubs.map((hub) => {
              const matchedLoc = ALL_LOCATIONS_LIST.find(
                (l) => l.village === hub.village && l.districtId === hub.districtId
              );
              if (!matchedLoc) return null;
              const isSelected = currentLocation?.village === matchedLoc.village && currentLocation?.districtId === matchedLoc.districtId;

              return (
                <button
                  key={`${hub.districtId}-${hub.village}`}
                  className={`hub-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    onSelectLocation(matchedLoc);
                    onClose();
                  }}
                >
                  {isTe ? (matchedLoc.villageTe || matchedLoc.village) : matchedLoc.village}
                </button>
              );
            })}
          </div>
        </div>

        {/* District Filter Row */}
        <div className="district-filter-section">
          <div className="district-filter-label-row">
            <span>{isTe ? 'తెలంగాణ జిల్లా ద్వారా ఫిల్టర్:' : 'Filter by Telangana District (33 Districts):'}</span>
            <span className="match-count">
              {filteredLocations.length} {isTe ? 'గ్రామాలు/ప్రాంతాలు' : 'villages / mandals found'}
            </span>
          </div>
          <div className="district-filter-chips">
            <button
              className={`district-filter-btn ${selectedDistrictFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedDistrictFilter('all')}
            >
              {isTe ? 'అన్ని జిల్లాలు (33)' : 'All Districts (33)'}
            </button>
            {TELANGANA_DISTRICTS.map((dist) => (
              <button
                key={dist.id}
                className={`district-filter-btn ${selectedDistrictFilter === dist.id ? 'active' : ''}`}
                onClick={() => setSelectedDistrictFilter(dist.id)}
              >
                {isTe ? dist.nameTe : dist.name}
              </button>
            ))}
          </div>
        </div>

        {/* Village Selection Grid */}
        <div className="villages-grid-container">
          {filteredLocations.length > 0 ? (
            <div className="villages-grid">
              {filteredLocations.map((loc) => {
                const isSelected =
                  currentLocation?.village === loc.village &&
                  currentLocation?.districtId === loc.districtId;

                return (
                  <div
                    key={`${loc.districtId}-${loc.mandal}-${loc.village}`}
                    className={`village-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onSelectLocation(loc);
                      onClose();
                    }}
                  >
                    <div className="village-card-main">
                      <span className="village-icon">🏡</span>
                      <div className="village-text-info">
                        <strong className="village-name">
                          {isTe ? (loc.villageTe || loc.village) : loc.village}
                        </strong>
                        <span className="village-mandal">
                          {isTe ? `మండలం: ${loc.mandal}` : `Mandal: ${loc.mandal}`}
                        </span>
                        <span className="village-district-badge">
                          {isTe ? (loc.districtTe || loc.district) : loc.district}
                        </span>
                      </div>
                    </div>
                    {isSelected ? (
                      <span className="selected-checkmark" title="Current Active Location">✓ {isTe ? 'ఎంపికైంది' : 'Selected'}</span>
                    ) : (
                      <span className="select-action-btn">{isTe ? 'ఎంచుకోండి' : 'Select'} →</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-villages-found">
              <span className="empty-icon">🌾</span>
              <p>
                {isTe
                  ? `"${searchTerm}" పేరుతో గ్రామం కనబడలేదు. మీరు మీ గ్రామం పేరును నేరుగా క్రింద జోడించవచ్చు.`
                  : `No village found matching "${searchTerm}". You can enter your village name below.`}
              </p>
              <button
                className="btn-add-custom-village"
                onClick={() => setShowCustomInput(true)}
              >
                + {isTe ? 'నా గ్రామాన్ని నమోదు చేయండి' : 'Add My Village Name'}
              </button>
            </div>
          )}
        </div>

        {/* Custom Village Entry Bar */}
        <div className="custom-village-footer">
          {!showCustomInput ? (
            <button
              className="toggle-custom-village-btn"
              onClick={() => setShowCustomInput(true)}
            >
              ✍️ {isTe ? 'మీ గ్రామం లేదా తండా జాబితాలో లేదా? ఇక్కడ నమోదు చేయండి' : "Can't find your specific hamlet or thanda? Enter custom village"}
            </button>
          ) : (
            <form className="custom-village-form" onSubmit={handleSaveCustomVillage}>
              <div className="custom-inputs-row">
                <input
                  type="text"
                  placeholder={isTe ? 'మీ గ్రామం / తండా పేరు టైప్ చేయండి' : 'Type your village / thanda name'}
                  value={customVillage}
                  onChange={(e) => setCustomVillage(e.target.value)}
                  required
                />
                <select
                  value={customDistrictId}
                  onChange={(e) => setCustomDistrictId(e.target.value)}
                >
                  {TELANGANA_DISTRICTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {isTe ? d.nameTe : d.name}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn-save-custom">
                  ✓ {isTe ? 'ఈ గ్రామాన్ని ఎంచుకోండి' : 'Set as Location'}
                </button>
                <button
                  type="button"
                  className="btn-cancel-custom"
                  onClick={() => setShowCustomInput(false)}
                >
                  ✕
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
