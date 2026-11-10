import { useState, useEffect } from 'react';
import { translations } from '../translations';
import { apiUpdateBookingStatus, apiGetOwnerBookings } from '../api/apiClient';

export default function OwnerInbox({ 
  bookings = [], 
  setBookings, 
  tractors = [],
  onViewSlip,
  language = 'en',
  currentOwner,
  onOwnerDeleteAccount
}) {
  const t = translations[language] || translations.en;
  const isTe = language === 'te';

  // Default selected tractor to current owner's tractor if matched, else first tractor
  const [selectedOwnerId, setSelectedOwnerId] = useState(() => {
    if (currentOwner?.mobile) {
      const match = tractors.find(tr => 
        (tr.mobile && tr.mobile.replace(/\D/g, '').slice(-10) === currentOwner.mobile.replace(/\D/g, '').slice(-10)) ||
        (tr.owner && (tr.owner === currentOwner.fullName || tr.owner === currentOwner.owner))
      );
      if (match) return match.id;
    }
    return tractors[0]?.id || 'all';
  });

  const [statusFilter, setStatusFilter] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // In-App Permanent Confirmation Modal
  const [slotModal, setSlotModal] = useState(null);

  // Reject with Reason Modal State
  const [rejectingBooking, setRejectingBooking] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // Fetch live bookings from PostgreSQL on mount and whenever currentOwner changes
  const fetchLiveOwnerBookings = async () => {
    if (!currentOwner?.mobile) return;
    setIsRefreshing(true);
    try {
      const fetched = await apiGetOwnerBookings(currentOwner.mobile);
      if (Array.isArray(fetched) && fetched.length > 0) {
        setBookings(prev => {
          const map = new Map();
          (Array.isArray(prev) ? prev : []).forEach(b => map.set(b.id, b));
          fetched.forEach(b => map.set(b.id, { ...map.get(b.id), ...b }));
          return Array.from(map.values());
        });
      }
    } catch (e) {
      console.warn('Live owner bookings fetch failed:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveOwnerBookings();
  }, [currentOwner?.mobile]);

  const selectedTractor = tractors.find(tr => tr.id === Number(selectedOwnerId));

  // Filter bookings for this tractor/owner
  const ownerBookings = bookings.filter((b) => {
    if (selectedOwnerId !== 'all') {
      const matchesTractor = 
        (selectedTractor && b.tractorId && b.tractorId === selectedTractor.id) ||
        (selectedTractor && b.tractorModel?.includes(selectedTractor.model)) ||
        (selectedTractor && b.ownerMobile && selectedTractor.mobile && (b.ownerMobile === selectedTractor.mobile || b.ownerMobile.slice(-10) === selectedTractor.mobile.slice(-10))) ||
        (selectedTractor && b.tractorOwner?.includes(selectedTractor.owner));
      if (!matchesTractor) return false;
    } else if (currentOwner?.mobile) {
      const cleanOwner = currentOwner.mobile.replace(/\D/g, '').slice(-10);
      const matchesOwner =
        (b.ownerMobile && b.ownerMobile.replace(/\D/g, '').slice(-10) === cleanOwner) ||
        (b.tractorOwner && (b.tractorOwner === currentOwner.fullName || b.tractorOwner === currentOwner.owner));
      if (!matchesOwner) return false;
    }

    if (statusFilter === 'All') return true;
    if (statusFilter === 'Pending') return b.status === 'Pending Approval' || b.status === 'Pending';
    if (statusFilter === 'Confirmed') return b.status === 'Approved' || b.status === 'Confirmed';
    if (statusFilter === 'Rejected') return b.status === 'Rejected' || b.status.includes('Declined');
    if (statusFilter === 'Cancelled') return b.status === 'Cancelled';
    if (statusFilter === 'Completed') return b.status === 'Completed';
    return true;
  });

  const handleSlotDecision = async (booking, decisionStatus, reason = null) => {
    setIsSubmittingDecision(true);

    const updatedBooking = {
      ...booking,
      status: decisionStatus,
      rejectionReason: decisionStatus === 'Rejected' ? reason : booking.rejectionReason,
      slotDecidedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setBookings((prev) =>
      prev.map((b) => (b.id === booking.id ? updatedBooking : b))
    );

    // Update in database with rejection/cancellation reason & triggers in-app + WhatsApp notifications
    try {
      await apiUpdateBookingStatus(booking.id, decisionStatus, reason);
    } catch (err) {
      console.warn('apiUpdateBookingStatus error:', err);
    } finally {
      setIsSubmittingDecision(false);
      setRejectingBooking(null);
      setRejectionReason('');
    }

    // Modal popup
    if (decisionStatus === 'Confirmed' || decisionStatus === 'Approved') {
      setSlotModal({
        title: isTe ? '✅ స్లాట్ విజయవంతంగా ఖరారైంది!' : '✅ Booking Confirmed Successfully!',
        message: isTe 
          ? `${booking.farmerName} గారికి ${booking.bookingDate} (${booking.timeSlot || 'స్లాట్'}) తేదీన మీ ట్రాక్టర్ ఖరారైంది. రైతుకు ఇన్‌-యాప్ నోటిఫికేషన్ పంపబడింది.`
          : `Booking confirmed for ${booking.farmerName} on ${booking.bookingDate} (${booking.timeSlot || 'slot'}). Customer notified in-app and WhatsApp alert dispatched.`,
        booking: updatedBooking,
        decisionStatus: 'Approved'
      });
    } else if (decisionStatus === 'Completed') {
      setSlotModal({
        title: isTe ? '🌾 పని పూర్తయినట్లు మార్క్ చేయబడింది!' : '🌾 Work Marked as Completed!',
        message: isTe
          ? `${booking.farmerName} గారి పొలంలో పని విజయవంతంగా పూర్తయింది.`
          : `Field operation completed for ${booking.farmerName}. Receipt updated.`,
        booking: updatedBooking,
        decisionStatus: 'Completed'
      });
    } else {
      setSlotModal({
        title: isTe ? '❌ స్లాట్ తిరస్కరించబడింది' : '❌ Booking Rejected',
        message: isTe 
          ? `ఈ బుకింగ్ తిరస్కరించబడింది. రైతుకు నోటిఫికేషన్ ద్వారా సమాచారం అందించబడింది.`
          : `Booking rejected. Reason: ${reason || 'Tractor occupied'}. Customer notified.`,
        booking: updatedBooking,
        decisionStatus: 'Declined'
      });
    }
  };

  // Method: Send WhatsApp message to Farmer with slot confirmation
  const handleWhatsAppFarmer = (b, type = 'confirm') => {
    let messageText = '';

    if (type === 'confirm') {
      messageText = encodeURIComponent(
        `🚜 TRACTOR BOOKING CONFIRMED\n\n` +
        `Booking ID: ${b.bookingCode || 'TRC' + String(b.id).slice(-4)}\n` +
        `Customer: ${b.farmerName}\n` +
        `Tractor: ${b.tractorModel}\n` +
        `Date: ${b.bookingDate}\n` +
        `Time Slot: ${b.timeSlot || '09:00 AM – 01:00 PM'}\n` +
        `Duration: ${b.durationHours || b.estimatedHours || 4} Hours\n` +
        `Location: ${b.farmerVillage}\n` +
        `Estimated Total: ₹${(b.estimatedCost || 0).toLocaleString()}\n\n` +
        `Status: Confirmed ✓\n\n` +
        `I will reach your farm field on the scheduled time. Contact: +91 ${(b.ownerMobile || currentOwner?.mobile || '')}`
      );
    } else {
      messageText = encodeURIComponent(
        `🚜 TRACTOR BOOKING UPDATE\n\n` +
        `Booking ID: ${b.bookingCode || 'TRC' + String(b.id).slice(-4)}\n` +
        `Customer: ${b.farmerName}\n` +
        `Date: ${b.bookingDate}\n` +
        `Time Slot: ${b.timeSlot || '09:00 AM – 01:00 PM'}\n\n` +
        `Status: Rejected ✕\n` +
        `Reason: ${b.rejectionReason || 'Tractor occupied or under maintenance'}\n\n` +
        `Please log in to AgriRent to choose another tractor or another date.`
      );
    }

    const cleanMobile = (b.farmerMobile || '').replace(/\D/g, '');
    window.open(`https://wa.me/91${cleanMobile}?text=${messageText}`, '_blank');
  };

  return (
    <div className="page-anim">
      <div className="section-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h3>{t.ownerInboxTitle}</h3>
          <p>{t.ownerInboxSubtitle}</p>
        </div>
        {currentOwner && onOwnerDeleteAccount && (
          <button
            type="button"
            className="danger-account-btn"
            onClick={onOwnerDeleteAccount}
            title={isTe ? 'వాహన యజమాని ఖాతాను శాశ్వతంగా తొలగించండి' : 'Permanently Delete Vehicle Owner Account'}
          >
            🗑️ {isTe ? 'యజమాని ఖాతా తొలగించండి' : 'Delete Owner Account'}
          </button>
        )}
      </div>

      {/* Tractor Selector & Filter Tabs Strip */}
      <div className="form-card-wrapper" style={{ maxWidth: '100%', marginBottom: '24px', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🚜</span>
            <div>
              <strong style={{ fontSize: '14px', color: 'var(--primary-900)' }}>{t.selectYourTractor}</strong>
              <select 
                value={selectedOwnerId} 
                onChange={(e) => setSelectedOwnerId(e.target.value)}
                style={{ marginLeft: '10px', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-light)', fontWeight: '600' }}
              >
                <option value="all">🌐 {isTe ? 'అన్ని ట్రాక్టర్లు (అడ్మిన్ వీక్షణ)' : 'All Tractors (Fleet Overview)'}</option>
                {tractors.map((tr) => (
                  <option key={tr.id} value={tr.id}>
                    {tr.owner} — {tr.brand} {tr.model} (📍 {tr.location})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={fetchLiveOwnerBookings}
                disabled={isRefreshing}
                style={{
                  marginLeft: '8px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-light)',
                  background: '#f1f8e9',
                  color: '#2e7d32',
                  cursor: isRefreshing ? 'wait' : 'pointer',
                  fontWeight: '600',
                  fontSize: '12px'
                }}
                title={isTe ? 'డేటాబేస్ నుండి లైవ్ ఆర్డర్లు రీఫ్రెష్ చేయండి' : 'Sync live bookings from database'}
              >
                {isRefreshing ? '⏳...' : '🔄 ' + (isTe ? 'రీఫ్రెష్' : 'Sync DB')}
              </button>
            </div>
          </div>

          {/* All 6 Required Status Tabs */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'All', labelEn: 'All', labelTe: 'అన్ని' },
              { id: 'Pending', labelEn: 'Pending', labelTe: 'పెండింగ్' },
              { id: 'Confirmed', labelEn: 'Confirmed', labelTe: 'ధృవీకరించబడినవి' },
              { id: 'Rejected', labelEn: 'Rejected', labelTe: 'తిరస్కరించబడినవి' },
              { id: 'Cancelled', labelEn: 'Cancelled', labelTe: 'రద్దు చేసినవి' },
              { id: 'Completed', labelEn: 'Completed', labelTe: 'పూర్తయినవి' }
            ].map((tab) => (
              <button
                key={tab.id}
                className={`role-btn ${statusFilter === tab.id ? 'active' : ''}`}
                onClick={() => setStatusFilter(tab.id)}
                style={{ fontSize: '12.5px', padding: '6px 12px' }}
              >
                {isTe ? tab.labelTe : tab.labelEn}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Incoming Requests Cards */}
      {ownerBookings.length === 0 ? (
        <div className="form-card-wrapper text-center" style={{ padding: '50px 20px' }}>
          <span style={{ fontSize: '42px', display: 'block', marginBottom: '10px' }}>📥</span>
          <h4>{isTe ? 'ఈ ఫిల్టర్‌లో అభ్యర్థనలు లేవు' : 'No bookings found under this status filter.'}</h4>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            {isTe ? 'రైతులు బుకింగ్ చేయగానే ఇక్కడ కనిపిస్తాయి. మీరు తక్షణమే ఆమోదించవచ్చు లేదా తిరస్కరించవచ్చు.' : 'When farmers submit rental requests, they appear here. You can confirm or reject them with 1-click.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {ownerBookings.map((b) => {
            const isApproved = b.status === 'Approved' || b.status === 'Confirmed';
            const isPending = b.status === 'Pending Approval' || b.status === 'Pending';
            const isRejected = b.status === 'Rejected' || b.status.includes('Declined');
            const isCancelled = b.status === 'Cancelled';
            const isCompleted = b.status === 'Completed';

            return (
              <div 
                key={b.id} 
                className="service-card" 
                style={{ 
                  cursor: 'default', 
                  borderLeft: `6px solid ${isApproved ? '#2e7d32' : isPending ? '#f57c00' : isRejected ? '#d32f2f' : isCancelled ? '#757575' : '#1565c0'}` 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  {/* Farmer details */}
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-700)', textTransform: 'uppercase' }}>
                      ORDER {b.bookingCode || `#${String(b.id).slice(-6)}`} • 📅 {b.bookingDate} • ⏰ {b.timeSlot || '09:00 AM – 01:00 PM'}
                    </span>
                    <h4 style={{ fontSize: '18px', marginTop: '4px', marginBottom: '4px' }}>
                      👨‍🌾 {b.farmerName} <small style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>({b.farmerVillage})</small>
                    </h4>
                    <p style={{ margin: 0, fontSize: '13.5px' }}>
                      📞 <strong>{b.farmerMobile}</strong> • 📐 <strong>{b.landArea} {isTe ? 'ఎకరాలు' : 'Acres'}</strong> • ⚙️ <strong>{b.workType}</strong>
                    </p>
                    {b.advancePayment > 0 && (
                      <span style={{ fontSize: '12px', color: '#2e7d32', fontWeight: 700, display: 'inline-block', marginTop: '4px' }}>
                        💵 Advance Paid: ₹{b.advancePayment.toLocaleString()}
                      </span>
                    )}
                    {b.rejectionReason && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#c62828', fontWeight: 600 }}>
                        ⚠️ Rejection Reason: {b.rejectionReason}
                      </p>
                    )}
                  </div>

                  {/* Status & Fare */}
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                      {isTe ? 'మొత్తం అంచనా చార్జ్' : 'Total Estimated Fare'}
                    </span>
                    <strong style={{ fontSize: '20px', color: '#e65100' }}>
                      ₹{(b.estimatedCost || 0).toLocaleString()}
                    </strong>
                    <br />
                    <span className={`badge ${isApproved ? 'bg-success' : isPending ? 'bg-warning' : isRejected ? 'bg-danger' : isCompleted ? 'bg-info' : 'bg-secondary'}`} style={{ marginTop: '4px' }}>
                      ● {b.status}
                    </span>
                  </div>
                </div>

                {/* Status Notice Banners */}
                {isApproved && (
                  <div style={{
                    background: '#e8f5e9',
                    border: '1.5px solid #2e7d32',
                    color: '#1b5e20',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    marginTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                    fontSize: '13px',
                    fontWeight: '700'
                  }}>
                    <span>✅ {isTe ? 'స్లాట్ ఖరారైంది! రైతుకు నోటిఫికేషన్ అప్‌డేట్ అయ్యింది.' : 'Booking Confirmed! Customer has received the update in-app.'}</span>
                    <button 
                      type="button"
                      className="btn btn-whatsapp" 
                      style={{ padding: '5px 12px', fontSize: '12px' }}
                      onClick={() => handleWhatsAppFarmer(b, 'confirm')}
                    >
                      💬 {isTe ? 'వాట్సాప్ ఇన్‌వాయిస్ పంపండి' : 'Send WhatsApp Invoice'}
                    </button>
                  </div>
                )}

                {isRejected && (
                  <div style={{
                    background: '#ffebee',
                    border: '1.5px solid #d32f2f',
                    color: '#c62828',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    marginTop: '12px',
                    fontSize: '13px',
                    fontWeight: '700'
                  }}>
                    <span>❌ {isTe ? 'ఈ బుకింగ్ తిరస్కరించబడింది.' : 'This booking was rejected.'} {b.rejectionReason && `(${b.rejectionReason})`}</span>
                  </div>
                )}

                {/* Decision Operations */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '16px', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Explicit Confirm Button */}
                    {isPending && (
                      <button 
                        type="button"
                        className="btn btn-primary" 
                        style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 700, background: '#1b5e20' }}
                        onClick={() => handleSlotDecision(b, 'Confirmed')}
                      >
                        ✓ {isTe ? 'ఆమోదించండి (Confirm)' : 'Confirm Booking'}
                      </button>
                    )}

                    {/* Explicit Reject Button */}
                    {isPending && (
                      <button 
                        type="button"
                        className="btn btn-call" 
                        style={{ padding: '8px 16px', fontSize: '13px', background: '#d32f2f', color: '#fff', fontWeight: 700 }}
                        onClick={() => setRejectingBooking(b)}
                      >
                        ✕ {isTe ? 'తిరస్కరించండి (Reject)' : 'Reject Booking'}
                      </button>
                    )}

                    {/* Mark Completed Button */}
                    {isApproved && (
                      <button 
                        type="button"
                        className="btn btn-primary" 
                        style={{ padding: '8px 16px', fontSize: '13px', background: '#0288d1', fontWeight: 700 }}
                        onClick={() => handleSlotDecision(b, 'Completed')}
                      >
                        🌾 {isTe ? 'పని పూర్తయింది (Mark Completed)' : 'Mark Work Completed'}
                      </button>
                    )}
                  </div>

                  {/* Actions Right */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      type="button"
                      className="btn btn-whatsapp" 
                      style={{ padding: '8px 14px', fontSize: '13px' }}
                      onClick={() => handleWhatsAppFarmer(b, isApproved ? 'confirm' : 'reject')}
                      title="Send WhatsApp update to farmer"
                    >
                      💬 WhatsApp
                    </button>

                    <button 
                      type="button"
                      className="btn btn-outline-white" 
                      style={{ borderColor: 'var(--primary-600)', color: 'var(--primary-700)', padding: '6px 14px', fontSize: '13px', fontWeight: 700 }}
                      onClick={() => onViewSlip && onViewSlip(b)}
                    >
                      🧾 {isTe ? 'ఇన్‌వాయిస్ రసీదు' : 'View Invoice'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REJECT BOOKING REASON MODAL */}
      {rejectingBooking && (
        <div 
          className="receipt-modal-backdrop"
          style={{ zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setRejectingBooking(null)}
        >
          <div 
            className="receipt-modal-card" 
            style={{ maxWidth: '480px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ margin: '0 0 10px 0', color: '#b71c1c' }}>
              ❌ {isTe ? 'బుకింగ్ తిరస్కరణ' : 'Reject Booking Request'}
            </h4>
            <p style={{ fontSize: '13.5px', color: '#334155', marginBottom: '16px' }}>
              {isTe
                ? `${rejectingBooking.farmerName} గారి ${rejectingBooking.bookingDate} (${rejectingBooking.timeSlot}) అభ్యర్థనను తిరస్కరించడానికి కారణాన్ని నమోదు చేయండి:`
                : `Please provide an optional reason for rejecting the booking for ${rejectingBooking.farmerName}:`}
            </p>

            <textarea
              rows="3"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginBottom: '16px' }}
              placeholder={isTe ? "ఉదా: ట్రాక్టర్ మరమ్మత్తులో ఉంది / వేరే పనిలో నిమగ్నమై ఉంది" : "e.g. Tractor undergoing routine servicing / Already committed"}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-outline-white"
                onClick={() => setRejectingBooking(null)}
              >
                {isTe ? 'రద్దు' : 'Cancel'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#d32f2f' }}
                disabled={isSubmittingDecision}
                onClick={() => handleSlotDecision(rejectingBooking, 'Rejected', rejectionReason || 'Tractor occupied')}
              >
                {isSubmittingDecision ? '...' : (isTe ? 'ఖరారు చేసి తిరస్కరించండి' : 'Confirm Rejection')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION POPUP MODAL */}
      {slotModal && (
        <div 
          className="receipt-modal-backdrop"
          style={{ zIndex: 9999, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)' }}
          onClick={() => setSlotModal(null)}
        >
          <div 
            className="receipt-modal-card" 
            style={{ 
              maxWidth: '520px', 
              padding: '0', 
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
              border: '2px solid rgba(255, 255, 255, 0.2)' 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              background: slotModal.decisionStatus === 'Approved' ? 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)' :
                          slotModal.decisionStatus === 'Completed' ? 'linear-gradient(135deg, #0288d1 0%, #0369a1 100%)' :
                          'linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)',
              color: 'white',
              padding: '24px 28px',
              textAlign: 'center',
              position: 'relative'
            }}>
              <div style={{ fontSize: '46px', marginBottom: '8px' }}>
                {slotModal.decisionStatus === 'Approved' ? '✅' : slotModal.decisionStatus === 'Completed' ? '🌾' : '❌'}
              </div>
              <h3 style={{ margin: 0, fontSize: '21px', fontWeight: 800 }}>{slotModal.title}</h3>
            </div>

            <div style={{ padding: '24px 28px', background: '#ffffff' }}>
              <p style={{ fontSize: '15px', color: '#1e293b', lineHeight: 1.6, marginBottom: '16px', textAlign: 'center' }}>
                {slotModal.message}
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  style={{ padding: '12px 40px', fontSize: '15px', fontWeight: 800 }}
                  onClick={() => setSlotModal(null)}
                >
                  ✓ {isTe ? 'సరే (OK)' : 'OK'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
