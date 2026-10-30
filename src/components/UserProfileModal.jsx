export default function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  language = 'en',
  onSignOut
}) {
  if (!isOpen) return null;

  const isTe = language === 'te';
  const isOwner = currentUser?.role === 'owner';
  const name = currentUser?.name || (isOwner ? 'G. Srinivas Rao' : 'N. Ramesh Kumar');
  const phone = currentUser?.phone || (isOwner ? '9440156789' : '9848012345');
  const district = currentUser?.district || 'Hanumakonda';
  const village = currentUser?.village || 'Hasanparthy';

  return (
    <div className="native-modal-overlay" onClick={onClose}>
      <div className="native-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="native-modal-header">
          <div className="modal-header-left">
            <span className="modal-header-icon">{isOwner ? '🚜' : '👨‍🌾'}</span>
            <div>
              <h2 className="modal-header-title">{name}</h2>
              <p className="modal-header-sub">
                {isOwner
                  ? (isTe ? 'ధృవీకరించబడిన యజమాని • హనుమకొండ' : 'Verified Owner • Hanumakonda')
                  : (isTe ? 'ధృవీకరించబడిన రైతు • హనుమకొండ' : 'Verified Farmer • Hanumakonda')}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-scroll-body">
          {/* Stats Bar */}
          <div className="profile-stats-row">
            <div className="stat-box">
              <span className="stat-num">{isOwner ? '18' : '6'}</span>
              <span className="stat-title">{isTe ? 'ఆర్డర్లు' : 'Rentals'}</span>
            </div>
            <div className="stat-box">
              <span className="stat-num">★ 4.9</span>
              <span className="stat-title">{isTe ? 'రేటింగ్' : 'Rating'}</span>
            </div>
            <div className="stat-box">
              <span className="stat-num">₹{isOwner ? '32,400' : '8,500'}</span>
              <span className="stat-title">{isOwner ? (isTe ? 'సంపాదన' : 'Earned') : (isTe ? 'ఖర్చు' : 'Spent')}</span>
            </div>
          </div>

          <div className="profile-details-list">
            <div className="detail-item">
              <span className="detail-label">{isTe ? 'మొబైల్ సంఖ్య' : 'Phone Number'}</span>
              <span className="detail-val">+91 {phone}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">{isTe ? 'గ్రామం / స్థావరం' : 'Base Village'}</span>
              <span className="detail-val">{village}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">{isTe ? 'జిల్లా' : 'District'}</span>
              <span className="detail-val">{district}</span>
            </div>
            {isOwner && (
              <div className="detail-item">
                <span className="detail-label">{isTe ? 'RC రిజిస్ట్రేషన్' : 'Vehicle RC'}</span>
                <span className="detail-val">TS 03 AB 4589</span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">{isTe ? 'ధృవీకరణ స్థితి' : 'KYC Verification'}</span>
              <span className="detail-val text-green font-bold">✓ Approved (Telangana RTO)</span>
            </div>
          </div>

          <button
            type="button"
            className="native-btn-danger mt-4"
            onClick={() => {
              onClose();
              onSignOut();
            }}
          >
            🚪 {isTe ? 'ఖాతా నుండి నిష్క్రమించండి' : 'Sign Out of Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
