import { useState, useEffect } from 'react';
import BookingStepper from '../components/BookingStepper';
import { translations } from '../translations';
import { apiGetMyBookings, apiUpdateBookingStatus } from '../api/apiClient';

export default function MyBookings({ 
  bookings = [], 
  setBookings, 
  setActivePage,
  onGoBack,
  onViewSlip,
  language = 'en',
  currentFarmer,
  onFarmerDeleteAccount
}) {
  const t = translations[language] || translations.en;
  const isTe = language === 'te';

  const [isLoading, setIsLoading] = useState(true);
  const [isolatedBookings, setIsolatedBookings] = useState([]);
  const [cancelError, setCancelError] = useState('');

  // Normalize phone for comparison
  const normalizePhone = (phone) => {
    if (!phone) return '';
    return String(phone).replace(/\D/g, '').slice(-10);
  };

  const farmerPhone = currentFarmer ? normalizePhone(currentFarmer.mobile) : '';
  const farmerId = currentFarmer?.id ? parseInt(currentFarmer.id, 10) : null;

  // Fetch strictly isolated bookings for current authenticated farmer
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function fetchFarmerBookings() {
      try {
        // Step 1: Securely fetch from authenticated API endpoint (GET /api/bookings/my)
        if (currentFarmer) {
          const apiRecords = await apiGetMyBookings(currentFarmer);
          if (isMounted && Array.isArray(apiRecords)) {
            setIsolatedBookings(apiRecords);
            setIsLoading(false);
            return;
          }
        }

        // Step 2: Strict Client-Side Defense-in-Depth Filter
        // Restricts records strictly to current authenticated farmer
        if (isMounted) {
          if (!currentFarmer) {
            setIsolatedBookings([]);
          } else {
            const filtered = bookings.filter((b) => {
              const bMobile = normalizePhone(b.farmerMobile);
              const bId = b.farmerId ? parseInt(b.farmerId, 10) : null;
              return (farmerPhone && bMobile && farmerPhone === bMobile) ||
                     (farmerId && bId && farmerId === bId);
            });
            setIsolatedBookings(filtered);
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('Failed to load authenticated bookings:', err);
        if (isMounted) {
          // Strictly fallback to filtered local bookings
          const filtered = bookings.filter((b) => {
            const bMobile = normalizePhone(b.farmerMobile);
            return farmerPhone && bMobile && farmerPhone === bMobile;
          });
          setIsolatedBookings(filtered);
          setIsLoading(false);
        }
      }
    }

    fetchFarmerBookings();

    return () => {
      isMounted = false;
    };
  }, [currentFarmer, bookings, farmerPhone, farmerId]);

  const handleCancelBooking = async (bookingId) => {
    const confirmMsg = isTe
      ? 'ఈ ట్రాక్టర్ బుకింగ్ అభ్యర్థనను మీరు రద్దు చేయాలనుకుంటున్నారా?'
      : 'Are you sure you want to cancel this tractor booking request?';

    if (!window.confirm(confirmMsg)) return;

    setCancelError('');
    try {
      // Update on PostgreSQL backend
      await apiUpdateBookingStatus(bookingId, 'Cancelled');

      // Update isolated state
      setIsolatedBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'Cancelled' } : b))
      );

      // Update parent state if available
      if (setBookings) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: 'Cancelled' } : b))
        );
      }
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel booking.');
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

  const getPaymentStatusBadge = (paymentStatus) => {
    const status = paymentStatus || 'Pending Cash on Service';
    if (status.toLowerCase().includes('paid')) {
      return (
        <span className="payment-status-badge paid" title="Payment settled">
          ✓ {isTe ? 'చెల్లించబడింది' : 'Paid'}
        </span>
      );
    }
    return (
      <span className="payment-status-badge pending" title="Pay cash directly to tractor owner after field work">
        💵 {isTe ? 'పని పూర్తయ్యాక చెల్లింపు' : 'Cash on Service'}
      </span>
    );
  };

  return (
    <div className="page-anim my-bookings-page-wrap">
      {/* Page Header */}
      <div className="section-header my-bookings-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline-white back-nav-btn"
            onClick={onGoBack || (() => setActivePage(currentFarmer ? 'find-tractor' : 'home'))}
            title={isTe ? 'వెనుకకు వెళ్ళండి' : 'Go Back'}
            style={{ padding: '6px 12px', fontSize: '13px', fontWeight: '700' }}
          >
            ← {isTe ? 'వెనుకకు' : 'Back'}
          </button>
          <div>
            <div className="bookings-title-row">
              <h2 className="my-bookings-main-title">{t.myBookingsTitle}</h2>
              {currentFarmer && (
                <span className="farmer-auth-badge">
                  👨‍🌾 {currentFarmer.name || 'Farmer'} ({isTe ? 'ధృవీకరించబడిన ఖాతా' : 'Verified Session'})
                </span>
              )}
            </div>
            <p className="my-bookings-subtitle">{t.myBookingsSubtitle}</p>
          </div>
        </div>

        <div className="header-actions-group">
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

      {cancelError && (
        <div className="alert-box error" style={{ marginBottom: '16px' }}>
          ⚠️ {cancelError}
        </div>
      )}

      {/* Bookings Card Container */}
      <div className="table-card bookings-container-card">
        {isLoading ? (
          <div className="bookings-loading-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div className="loading-spinner" style={{ fontSize: '36px', marginBottom: '12px' }}>🔄</div>
            <p style={{ fontWeight: '700', color: '#334155' }}>
              {isTe ? 'మీ బుకింగ్‌లను లోడ్ చేస్తోంది...' : 'Loading your authenticated bookings from PostgreSQL...'}
            </p>
          </div>
        ) : isolatedBookings.length === 0 ? (
          /* Empty State Requirement: "You haven't booked any tractors yet." */
          <div className="empty-bookings-box" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div className="empty-icon-wrap" style={{ fontSize: '48px', marginBottom: '14px' }}>
              🚜
            </div>
            <h3 className="empty-title" style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              {isTe ? 'మీరు ఇంకా ఎలాంటి ట్రాక్టర్లను బుక్ చేసుకోలేదు.' : "You haven't booked any tractors yet."}
            </h3>
            <p className="empty-desc" style={{ fontSize: '13.5px', color: '#64748b', maxWidth: '440px', margin: '0 auto 20px auto' }}>
              {isTe
                ? 'మీ గ్రామంలో అందుబాటులో ఉన్న ఆధునిక ట్రాక్టర్లు, రొటవేటర్లు మరియు హార్వెస్టర్లను ఎంచుకోండి. పారదర్శక ధరలతో నేరుగా బుక్ చేయండి.'
                : 'Browse verified tractors, rotavators, and harvesters stationed in your village with transparent hourly rates and instant booking.'}
            </p>
            <button 
              type="button"
              className="btn btn-primary" 
              onClick={() => setActivePage('find-tractor')}
              style={{ padding: '10px 24px', fontSize: '14px', fontWeight: '700' }}
            >
              {t.btnBookTractor || (isTe ? '🚜 ట్రాక్టర్లను కనుగొనండి' : '🚜 Browse Fleet & Book Tractor')}
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="farmer-bookings-table">
              <thead>
                <tr>
                  <th>{isTe ? 'బుకింగ్ ID & తేదీ' : 'Booking ID & Dates'}</th>
                  <th>{isTe ? 'పని రకం & వ్యవధి' : 'Operation & Duration'}</th>
                  <th>{isTe ? 'అద్దె ట్రాక్టర్ వివరాలు' : 'Rented Tractor Details'}</th>
                  <th>{isTe ? 'ట్రాక్టర్ యజమాని' : 'Tractor Owner'}</th>
                  <th>{isTe ? 'మొత్తం ఖర్చు & చెల్లింపు' : 'Total Cost & Payment'}</th>
                  <th>{isTe ? 'స్థితి' : 'Status'}</th>
                  <th>{isTe ? 'చర్యలు' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {isolatedBookings.map((b) => {
                  const tractorPhoto = b.tractorPhoto || '';
                  const registrationNo = b.registrationNo || 'TS 03 AB 4589';
                  const ownerName = b.ownerFullName || b.tractorOwner || 'Local Fleet Owner';
                  const tractorModel = b.tractorModel || b.tractorModelName || 'Mahindra 575 DI Sarpanch';
                  const tractorBrand = b.tractorBrand || 'Mahindra';
                  const durationHours = b.durationHours || b.estimatedHours || 4;

                  return (
                    <tr key={b.id} className="booking-row">
                      {/* Booking ID & Dates */}
                      <td className="booking-id-cell">
                        <div className="id-badge-wrap">
                          <span className="booking-hash-id">#{b.id}</span>
                          <span className="booking-date-tag">📅 {b.bookingDate}</span>
                          {b.bookingTime && (
                            <small className="booking-time-tag">⏰ {b.bookingTime}</small>
                          )}
                        </div>
                      </td>

                      {/* Operation, Land Area & Duration */}
                      <td>
                        <strong className="work-type-title">{b.workType}</strong>
                        <div className="booking-specs-meta">
                          <span>🌱 {b.landArea} {isTe ? 'ఎకరాలు' : 'Acres'}</span>
                          <span>•</span>
                          <span className="duration-tag">⏱️ {durationHours} {isTe ? 'గంటలు' : 'Hours'}</span>
                        </div>
                        {/* Progress Stepper */}
                        <div style={{ marginTop: '8px', maxWidth: '280px' }}>
                          <BookingStepper status={b.status} language={language} />
                        </div>
                      </td>

                      {/* Rented Tractor Details: Photo, Model, Registration/Identifier */}
                      <td className="tractor-details-cell">
                        <div className="tractor-info-item">
                          {tractorPhoto ? (
                            <img
                              src={tractorPhoto}
                              alt={tractorModel}
                              className="booked-tractor-thumbnail"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <span className="booked-tractor-placeholder-icon">🚜</span>
                          )}
                          <div className="tractor-text-meta">
                            <strong className="tractor-model-name">{tractorModel}</strong>
                            <div className="tractor-reg-badge" title="Tractor Registration Identifier">
                              🏷️ {registrationNo}
                            </div>
                            <small className="tractor-brand-tag">{tractorBrand}</small>
                          </div>
                        </div>
                      </td>

                      {/* Tractor Owner Details */}
                      <td className="owner-details-cell">
                        <div className="owner-info-card">
                          <strong className="owner-name-title">👨‍💼 {ownerName}</strong>
                          <span className="owner-tractor-sub">🚜 {tractorModel}</span>
                          {b.ownerMobile && (
                            <a
                              href={`tel:${b.ownerMobile}`}
                              className="owner-call-link"
                              title="Call Tractor Owner directly"
                            >
                              📞 +91 {b.ownerMobile}
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Total Cost and Payment Status */}
                      <td className="cost-cell">
                        <div className="cost-display-wrap">
                          <strong className="cost-total-amount">
                            ₹{(b.estimatedCost || 0).toLocaleString()}
                          </strong>
                          <div className="payment-status-wrap">
                            {getPaymentStatusBadge(b.paymentStatus)}
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="status-cell">
                        {getStatusBadge(b.status)}
                      </td>

                      {/* Actions */}
                      <td className="actions-cell">
                        <div className="booking-actions-row">
                          {/* Official Digital Work Slip */}
                          <button 
                            type="button"
                            className="btn btn-outline-white action-slip-btn" 
                            onClick={() => onViewSlip && onViewSlip(b)}
                            title="View Official Digital Work Slip"
                          >
                            📄 {t.btnViewSlip || 'Work Slip'}
                          </button>

                          {/* Call Owner */}
                          {b.ownerMobile && (
                            <a 
                              href={`tel:${b.ownerMobile}`} 
                              className="btn btn-call" 
                              title={t.callOwner}
                            >
                              📞
                            </a>
                          )}

                          {/* Cancel Option for Pending Approval */}
                          {b.status === 'Pending Approval' && (
                            <button 
                              type="button"
                              className="btn btn-call cancel-booking-btn" 
                              onClick={() => handleCancelBooking(b.id)}
                              title={isTe ? 'అభ్యర్థనను రద్దు చేయండి' : 'Cancel Request'}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
