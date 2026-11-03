import BookingStepper from '../components/BookingStepper';
import { translations } from '../translations';

export default function MyBookings({ 
  bookings = [], 
  setBookings, 
  setActivePage,
  onViewSlip,
  language = 'en',
  currentFarmer,
  onFarmerDeleteAccount
}) {
  const t = translations[language] || translations.en;
  const isTe = language === 'te';

  const handleCancelBooking = (bookingId) => {
    if (window.confirm(isTe ? 'ఈ ట్రాక్టర్ బుకింగ్ అభ్యర్థనను మీరు రద్దు చేయాలనుకుంటున్నారా?' : 'Are you sure you want to cancel this tractor booking request?')) {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'Cancelled' } : b))
      );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
      case 'Confirmed':
        return <span className="badge bg-success">✓ {isTe ? 'ధృవీకరించబడింది' : 'Confirmed'}</span>;
      case 'In Progress':
        return <span className="badge bg-info">⚙️ {isTe ? 'పొలంలో పని జరుగుతోంది' : 'In Progress'}</span>;
      case 'Completed':
        return <span className="badge bg-success" style={{ background: '#c8e6c9', color: '#1b5e20' }}>✓ {isTe ? 'పూర్తయింది' : 'Completed'}</span>;
      case 'Cancelled':
        return <span className="badge bg-danger">✕ {isTe ? 'రద్దు చేయబడింది' : 'Cancelled'}</span>;
      default:
        return <span className="badge bg-warning">⏳ {isTe ? 'పరిశీలనలో ఉంది' : 'Pending Approval'}</span>;
    }
  };

  return (
    <div className="page-anim">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3>{t.myBookingsTitle}</h3>
          <p>{t.myBookingsSubtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {currentFarmer && onFarmerDeleteAccount && (
            <button
              type="button"
              className="danger-account-btn"
              onClick={onFarmerDeleteAccount}
              title={isTe ? 'రైతు ఖాతాను శాశ్వతంగా తొలగించండి' : 'Permanently Delete Farmer Account'}
            >
              🗑️ {isTe ? 'రైతు ఖాతా తొలగించండి' : 'Delete Farmer Account'}
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setActivePage('booking-form')}>
            {t.btnNewBooking}
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>{t.colFarmer}</th>
                <th>{t.colOperation}</th>
                <th>{t.colLandArea}</th>
                <th>{t.colSchedule}</th>
                <th>{t.colTractor}</th>
                <th>{t.colEstCost}</th>
                <th>{t.colStatus}</th>
                <th>{t.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center" style={{ padding: '40px' }}>
                    <div style={{ fontSize: '36px', marginBottom: '10px' }}>🚜</div>
                    <p style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                      {isTe ? 'ఇంకా ఎలాంటి బుకింగ్స్ లేవు.' : 'No active bookings yet.'}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {isTe ? 'మన గ్రామంలో సిద్ధంగా ఉన్న ట్రాక్టర్లను చూసి ఇప్పుడే బుక్ చేసుకోండి!' : 'Browse the local fleet and request your first tractor service today!'}
                    </p>
                    <button 
                      className="btn btn-secondary" 
                      style={{ marginTop: '12px' }}
                      onClick={() => setActivePage('find-tractor')}
                    >
                      {t.btnBookTractor}
                    </button>
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <strong>{b.farmerName}</strong>
                      <br />
                      <small style={{ color: 'var(--text-muted)' }}>📞 {b.farmerMobile} | 🏡 {b.farmerVillage}</small>
                      
                      {/* Visual Stepper Tracker for this work order! */}
                      <BookingStepper status={b.status} language={language} />
                    </td>
                    <td>
                      <span style={{ fontWeight: '600' }}>{b.workType}</span>
                    </td>
                    <td>
                      <strong>{b.landArea}</strong> {isTe ? 'ఎకరాలు' : 'Acres'}
                    </td>
                    <td>
                      <span>📅 {b.bookingDate}</span>
                    </td>
                    <td>
                      <strong>{b.tractorModel}</strong>
                      <br />
                      <small style={{ color: 'var(--text-muted)' }}>
                        {b.tractorOwner} {b.ownerMobile && `(${b.ownerMobile})`}
                      </small>
                    </td>
                    <td>
                      <strong style={{ color: '#e65100' }}>₹{(b.estimatedCost || 0).toLocaleString()}</strong>
                      <br />
                      <small style={{ color: 'var(--text-muted)' }}>~{b.estimatedHours || 2} {isTe ? 'గం.' : 'hrs'}</small>
                    </td>
                    <td>
                      {getStatusBadge(b.status)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {/* Open Receipt Slip Button */}
                        <button 
                          className="btn btn-outline-white" 
                          style={{ borderColor: 'var(--primary-600)', color: 'var(--primary-700)', padding: '5px 8px', fontSize: '12px' }}
                          onClick={() => onViewSlip && onViewSlip(b)}
                          title="View Official Digital Work Slip"
                        >
                          {t.btnViewSlip}
                        </button>

                        {/* Call Owner */}
                        {b.ownerMobile && (
                          <a 
                            href={`tel:${b.ownerMobile}`} 
                            className="btn btn-call" 
                            style={{ padding: '5px 9px', fontSize: '12px' }}
                            title={t.callOwner}
                          >
                            📞
                          </a>
                        )}

                        {/* Cancel Option if Pending */}
                        {b.status === 'Pending Approval' && setBookings && (
                          <button 
                            className="btn btn-call" 
                            style={{ background: '#d32f2f', padding: '5px 9px', fontSize: '12px' }}
                            onClick={() => handleCancelBooking(b.id)}
                            title="Cancel Request"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
