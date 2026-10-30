export default function TractorCard({
  tractor,
  language = 'en',
  onBook
}) {
  const isTe = language === 'te';

  // Distance formatting
  const approxDistanceKm = Math.max(1, Math.round(tractor.distance_km || 1));
  const etaMins = tractor.eta_minutes || Math.max(10, Math.round(approxDistanceKm * 4));

  // Implements list
  const displayImplements = Array.isArray(tractor.implements) && tractor.implements.length > 0
    ? tractor.implements.slice(0, 3)
    : ['Ploughing', 'Rotavator', 'Cultivator'];

  // Clean model name removing duplicate (XX HP)
  const cleanModelName = (tractor.model || '').replace(/\s*\(\d+\s*HP\)/i, '').trim();

  const implementMapTe = {
    'Ploughing': 'దుక్కి దున్నడం',
    'Rotavator': 'రోటవేటర్',
    'Cultivator': 'కల్టివేటర్',
    'Trailer Services': 'ట్రాలీ రవాణా',
    'Corn Harvester': 'మొక్కజొన్న హార్వెస్టర్',
    'Straw Baler': 'గడ్డి చుట్టే యంత్రం',
    'Corn Seeder': 'విత్తనాలు నాటే యంత్రం',
    'Other Agricultural Work': 'ఇతర పనులు'
  };

  return (
    <div className="native-tractor-card">
      {/* Proximity ETA Header Bar */}
      <div className="proximity-eta-header">
        <span className="bolt-icon">⚡</span>
        <span className="proximity-distance">
          {isTe ? `~${approxDistanceKm} కి.మీ దూరం` : `~${approxDistanceKm} km away`}
        </span>
        <span className="proximity-dot">•</span>
        <span className="proximity-eta">
          ~{etaMins} {isTe ? 'నిమిషాల్లో రాక' : 'mins dispatch'}
        </span>
      </div>

      {/* Tractor Image Container */}
      <div className="card-image-box">
        <img
          src={tractor.image_url || '/images/mahindra_575.jpg'}
          alt={tractor.model}
          className="card-photo"
          onError={(e) => {
            e.currentTarget.src = '/images/mahindra_575.jpg';
          }}
        />

        {/* Rating Pill in bottom right */}
        <div className="photo-rating-pill">
          <span className="star-icon">★</span>
          <span className="rating-num">{(tractor.rating || 4.9).toFixed(1)}</span>
          <span className="review-count">({tractor.review_count || 24})</span>
        </div>
      </div>

      {/* Tractor Details Content */}
      <div className="card-body-content">
        {/* Title & Horsepower Badge */}
        <div className="card-title-row">
          <h3 className="card-tractor-title" title={tractor.model}>
            {cleanModelName || tractor.brand}
          </h3>
          <span className="card-hp-badge">
            {tractor.hp || 47} HP
          </span>
        </div>

        {/* Owner Info with trophy */}
        <div className="card-owner-row">
          <span className="owner-emoji">🏆</span>
          <span className="owner-text">
            {isTe ? 'యజమాని: ' : 'Owner: '}{tractor.owner_name || 'G. Srinivas Rao'}
          </span>
        </div>

        {/* Suitable Work Purposes */}
        <div className="card-purposes-section">
          <div className="purposes-label">
            {isTe ? 'అనువైన పనులు:' : 'SUITABLE FOR:'}
          </div>
          <div className="purpose-chips-wrap">
            {displayImplements.map((item, idx) => (
              <span key={idx} className="purpose-chip-pill">
                {isTe ? (implementMapTe[item] || item) : item}
              </span>
            ))}
          </div>
        </div>

        {/* Pricing & Primary CTA Footer */}
        <div className="card-footer-row">
          <div className="card-price-box">
            <div className="price-primary">
              <span className="rupee-sign">₹</span>
              <span className="price-num">{tractor.rate_per_hour || 850}</span>
              <span className="price-unit">{isTe ? '/గంట' : '/hr'}</span>
            </div>
            {tractor.rate_per_acre && (
              <div className="price-secondary">
                (₹{tractor.rate_per_acre}{isTe ? '/ఎకరా' : '/acre'})
              </div>
            )}
          </div>

          <button
            type="button"
            className="book-tractor-btn"
            onClick={() => onBook(tractor)}
          >
            <span>{isTe ? 'ట్రాక్టర్ బుక్ చేయండి' : 'Book Tractor'}</span>
            <span>🚜</span>
          </button>
        </div>
      </div>
    </div>
  );
}
