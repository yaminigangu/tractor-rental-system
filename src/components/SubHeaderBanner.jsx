import { useState, useMemo, useRef, useEffect } from 'react';
import { TELANGANA_33_DISTRICTS } from '../data/telanganaDistricts';

export default function SubHeaderBanner({
  language = 'en',
  searchQuery = '',
  setSearchQuery,
  selectedImplement = 'all',
  setSelectedImplement,
  sortBy = 'recommended',
  setSortBy,
  onSelectPlace
}) {
  const isTe = language === 'te';

  const [isMachineryOpen, setIsMachineryOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsMachineryOpen(false);
        setIsSortOpen(false);
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const machineryOptions = [
    { key: 'all', icon: '🚜', en: 'All Machinery', te: 'అన్ని యంత్రాలు' },
    { key: 'Ploughing', icon: '🌾', en: 'Ploughing', te: 'దుక్కి దున్నడం' },
    { key: 'Rotavator', icon: '⚙️', en: 'Rotavator', te: 'రోటవేటర్' },
    { key: 'Cultivator', icon: '🌱', en: 'Cultivator', te: 'కల్టివేటర్' },
    { key: 'Trailer Services', icon: '🚛', en: 'Trailer Services', te: 'ట్రాలీ రవాణా' },
    { key: 'Corn Harvester', icon: '🌽', en: 'Corn Harvester', te: 'మొక్కజొన్న హార్వెస్టర్' },
    { key: 'Straw Baler', icon: '🌾', en: 'Straw Baler', te: 'గడ్డి చుట్టే యంత్రం' },
    { key: 'Corn Seeder', icon: '🌱', en: 'Corn Seeder', te: 'విత్తనాలు నాటే యంత్రం' },
    { key: 'Other Agricultural Work', icon: '🔧', en: 'Other Work', te: 'ఇతర పనులు' },
  ];

  const sortOptions = [
    { key: 'recommended', icon: '⭐', en: 'Recommended', te: 'సిఫార్సు చేయబడినవి' },
    { key: 'distance', icon: '📍', en: 'Nearest', te: 'సమీపంలోనివి' },
    { key: 'price_asc', icon: '💵', en: 'Price: Low to High', te: 'ధర: తక్కువ నుండి ఎక్కువ' },
    { key: 'rating', icon: '🌟', en: 'Highest Rating', te: 'అత్యధిక రేటింగ్' },
  ];

  const activeMachineryItem = machineryOptions.find((m) => m.key === selectedImplement) || machineryOptions[0];
  const activeSortItem = sortOptions.find((s) => s.key === sortBy) || sortOptions[0];

  // Instant Village / Mandal Autocomplete across all 33 Telangana districts
  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 1) return [];

    const matches = [];
    const seen = new Set();

    for (const dist of TELANGANA_33_DISTRICTS) {
      for (const m of dist.mandals) {
        if (m.toLowerCase().includes(q) && !seen.has(`${dist.name_en}-${m}`)) {
          seen.add(`${dist.name_en}-${m}`);
          matches.push({
            place: m,
            district: dist.name_en,
            districtTe: dist.name_te,
            isVillage: false
          });
          if (matches.length >= 8) return matches;
        }
      }
      for (const v of dist.villages) {
        if (v.toLowerCase().includes(q) && !seen.has(`${dist.name_en}-${v}`)) {
          seen.add(`${dist.name_en}-${v}`);
          matches.push({
            place: v,
            district: dist.name_en,
            districtTe: dist.name_te,
            isVillage: true
          });
          if (matches.length >= 8) return matches;
        }
      }
    }
    return matches;
  }, [searchQuery]);

  return (
    <div className="sub-header-banner" ref={containerRef}>
      <div className="sub-header-inner">
        {/* Search Bar matching Screenshot 9/10 */}
        <div className="search-bar-wrap">
          <div className="search-input-box">
            <span className="search-glass-icon">🔍</span>
            <input
              type="text"
              className="search-input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder={
                isTe
                  ? 'గ్రామం లేదా యంత్రాన్ని శోధించండి (ఉదా. Parkal, Hasanparthy)...'
                  : 'Search village (e.g. Parkal, Medaram, Pasra) or machine...'
              }
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          {/* Autocomplete Suggestions Popup */}
          {isSearchFocused && suggestions.length > 0 && (
            <div className="search-suggestions-dropdown">
              <div className="suggestions-header">
                {isTe ? 'తెలంగాణ ప్రాంతాల సూచనలు' : 'Telangana Location Matches'}
              </div>
              {suggestions.map((item, idx) => (
                <div
                  key={idx}
                  className="suggestion-row"
                  onMouseDown={() => {
                    setSearchQuery(item.place);
                    setIsSearchFocused(false);
                    if (onSelectPlace) {
                      onSelectPlace(item.district, item.place);
                    }
                  }}
                >
                  <span className="suggestion-pin">📍</span>
                  <div className="suggestion-details">
                    <span className="suggestion-place">{item.place}</span>
                    <span className="suggestion-district">
                      {item.isVillage ? (isTe ? 'గ్రామం' : 'Village') : (isTe ? 'మండలం' : 'Mandal')} • {isTe ? item.districtTe : item.district}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dropdowns Row matching Screenshot 9/10 */}
        <div className="dropdowns-row">
          {/* Machinery Filter Dropdown */}
          <div className="dropdown-container">
            <button
              type="button"
              className="filter-dropdown-btn"
              onClick={() => {
                setIsMachineryOpen((prev) => !prev);
                setIsSortOpen(false);
              }}
            >
              <span>{activeMachineryItem.icon}</span>
              <span className="dropdown-label-text">
                {isTe ? activeMachineryItem.te : activeMachineryItem.en}
              </span>
              <span className="dropdown-caret">▾</span>
            </button>

            {isMachineryOpen && (
              <div className="filter-popup-menu">
                {machineryOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    className={`popup-item-btn ${selectedImplement === opt.key ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedImplement(opt.key);
                      setIsMachineryOpen(false);
                    }}
                  >
                    <span>{opt.icon}</span>
                    <span>{isTe ? opt.te : opt.en}</span>
                    {selectedImplement === opt.key && <span className="check-mark">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Filter Dropdown */}
          <div className="dropdown-container">
            <button
              type="button"
              className="filter-dropdown-btn"
              onClick={() => {
                setIsSortOpen((prev) => !prev);
                setIsMachineryOpen(false);
              }}
            >
              <span>{activeSortItem.icon}</span>
              <span className="dropdown-label-text">
                {isTe ? activeSortItem.te : activeSortItem.en}
              </span>
              <span className="dropdown-caret">▾</span>
            </button>

            {isSortOpen && (
              <div className="filter-popup-menu right-aligned">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    className={`popup-item-btn ${sortBy === opt.key ? 'active' : ''}`}
                    onClick={() => {
                      setSortBy(opt.key);
                      setIsSortOpen(false);
                    }}
                  >
                    <span>{opt.icon}</span>
                    <span>{isTe ? opt.te : opt.en}</span>
                    {sortBy === opt.key && <span className="check-mark">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

