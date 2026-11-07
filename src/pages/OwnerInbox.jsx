import { useState, useEffect } from 'react';
import { translations } from '../translations';
import { apiUpdateBookingStatus, apiGetOwnerBookings, apiGetMyBookings } from '../api/apiClient';

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

  // In-App Permanent Confirmation Modal (NEVER auto-dismisses!)
  const [slotModal, setSlotModal] = useState(null);

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
    if (statusFilter === 'Pending') return b.status === 'Pending Approval';
    if (statusFilter === 'Confirmed') return b.status === 'Approved' || b.status === 'Confirmed';
    if (statusFilter === 'Declined') return b.status.includes('Declined');
    return true;
  });

  const handleSlotDecision = (booking, decisionStatus) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === booking.id) {
          return {
            ...b,
            status: decisionStatus,
            slotDecidedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        }
        return b;
      })
    );

    // Asynchronously update booking status in PostgreSQL database
    apiUpdateBookingStatus(booking.id, decisionStatus).catch(() => {});

    // Open permanent in-app modal with manual OK button
    const updatedBooking = { ...booking, status: decisionStatus };
    if (decisionStatus === 'Approved') {
      setSlotModal({
        title: isTe ? '✅ స్లాట్ విజయవంతంగా ఖరారైంది!' : '✅ Slot Confirmed Successfully!',
        message: isTe 
          ? `${booking.farmerName} గారికి ${booking.bookingDate} తేదీన మీ ట్రాక్టర్ స్లాట్ ఖరారైంది. రైతుకు తన అకౌంట్లో ఈ స్టేటస్ కనిపిస్తుంది.`
          : `Slot has been confirmed for ${booking.farmerName} on ${booking.bookingDate}. The farmer will now see this confirmed in their booking tracker.`,
        booking: updatedBooking,
        decisionStatus: 'Approved'
      });
    } else if (decisionStatus.includes('Proposed')) {
      setSlotModal({
        title: isTe ? '⏳ మరుసటి రోజు స్లాట్ ప్రతిపాదించబడింది' : '⏳ Alternative Slot Proposed!',
        message: isTe 
          ? `${booking.farmerName} గారికి ఈ తేదీన బిజీ అని, మరుసటి రోజు అందుబాటులో ఉన్నారని తెలియజేశాము.`
          : `You proposed to do work on the next day. The farmer is informed to coordinate the alternative slot.`,
        booking: updatedBooking,
        decisionStatus: 'Proposed'
      });
    } else {
      setSlotModal({
        title: isTe ? '❌ స్లాట్ తిరస్కరించబడింది (బిజీ)' : '❌ Slot Declined (Busy)',
        message: isTe 
          ? `ఈ స్లాట్ తిరస్కరించబడింది. రైతు వేరే తేదీ లేదా వేరే ట్రాక్టర్‌ను ఎంచుకోగలరు.`
          : `You marked your tractor as busy for this date. The farmer will be prompted to pick another date or tractor.`,
        booking: updatedBooking,
        decisionStatus: 'Declined'
      });
    }
  };

  // Method 1: Send WhatsApp message to Farmer with slot confirmation
  const handleWhatsAppFarmer = (b, type = 'confirm') => {
    let messageText = '';

    if (type === 'confirm') {
      messageText = encodeURIComponent(
        isTe
          ? `🌾 *అగ్రిరెంట్ స్లాట్ ఖరారైంది*\nనమస్తే ${b.farmerName} గారు, మీరు ${b.bookingDate} తేదీన కోరిన ${b.workType} (${b.landArea} ఎకరాలు) పనిని నేను ఆమోదించాను.\n🚜 ట్రాక్టర్: ${b.tractorModel}\n👨‍🔧 యజమాని: ${b.tractorOwner} (${b.ownerMobile})\n💰 అంచనా మొత్తం: ₹${(b.estimatedCost || 0).toLocaleString()}\nఉదయం 7:00 గంటలకు మీ పొలానికి వస్తాను.`
          : `🌾 *AgriRent Slot Confirmed*\nHello ${b.farmerName}, your booking request for ${b.workType} (${b.landArea} Acres) on ${b.bookingDate} is CONFIRMED by ${b.tractorOwner}.\n🚜 Tractor: ${b.tractorModel}\n💰 Est. Amount: ₹${(b.estimatedCost || 0).toLocaleString()}\nI will reach your farm field in ${b.farmerVillage} at 7:00 AM.`
      );
    } else {
      messageText = encodeURIComponent(
        isTe
          ? `🌾 *అగ్రిరెంట్ స్లాట్ సమాచారం*\nనమస్తే ${b.farmerName} గారు, ${b.bookingDate} తేదీన నా ట్రాక్టర్ ఇప్పటికే వేరే పొలంలో బుక్ అయి ఉంది. దయచేసి మరుసటి రోజు లేదా పోర్టల్‌లో వేరే ట్రాక్టర్‌ను ఎంచుకోగలరు.`
          : `🌾 *AgriRent Slot Notice*\nHello ${b.farmerName}, my tractor is already occupied in field on ${b.bookingDate}. Please pick another date or choose another tractor on AgriRent portal.`
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

      {/* Tractor Selector Strip */}
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

          {/* Quick status tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {['All', 'Pending', 'Confirmed', 'Declined'].map((tab) => (
              <button
                key={tab}
                className={`role-btn ${statusFilter === tab ? 'active' : ''}`}
                onClick={() => setStatusFilter(tab)}
              >
                {tab === 'All' ? (isTe ? 'అన్ని' : 'All') : 
                 tab === 'Pending' ? (isTe ? 'పరిశీలనలో' : 'Pending') :
                 tab === 'Confirmed' ? (isTe ? 'ధృవీకరించబడినవి' : 'Confirmed') : (isTe ? 'రద్దు/బిజీ' : 'Declined')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Incoming Requests Cards / Table */}
      {ownerBookings.length === 0 ? (
        <div className="form-card-wrapper text-center" style={{ padding: '50px 20px' }}>
          <span style={{ fontSize: '42px', display: 'block', marginBottom: '10px' }}>📥</span>
          <h4>{isTe ? 'ఈ ట్రాక్టర్‌కు పెండింగ్ అభ్యర్థనలు లేవు' : 'No incoming work requests for this tractor right now.'}</h4>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            {isTe ? 'రైతులు బుకింగ్ చేయగానే ఇక్కడ కనిపిస్తాయి. ఫోన్ మాట్లాడకుండానే స్లాట్‌ను ఆమోదించవచ్చు!' : 'When farmers book your tractor, orders appear here. You can confirm slots with 1-click!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {ownerBookings.map((b) => {
            const isApproved = b.status === 'Approved' || b.status === 'Confirmed';
            const isPending = b.status === 'Pending Approval';
            const isDeclined = b.status.includes('Declined');
            const isProposed = b.status.includes('Proposed');

            return (
              <div 
                key={b.id} 
                className="service-card" 
                style={{ 
                  cursor: 'default', 
                  borderLeft: `6px solid ${isApproved ? '#2e7d32' : isPending ? '#f57c00' : isDeclined ? '#d32f2f' : isProposed ? '#0288d1' : '#7b1fa2'}` 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  {/* Farmer details */}
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-700)', textTransform: 'uppercase' }}>
                      ORDER #{b.id.toString().slice(-6)} • 📅 {b.bookingDate}
                    </span>
                    <h4 style={{ fontSize: '18px', marginTop: '4px', marginBottom: '4px' }}>
                      👨‍🌾 {b.farmerName} <small style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>({b.farmerVillage})</small>
                    </h4>
                    <p style={{ margin: 0, fontSize: '13.5px' }}>
                      📞 <strong>{b.farmerMobile}</strong> • 📐 <strong>{b.landArea} {isTe ? 'ఎకరాలు' : 'Acres'}</strong> • ⚙️ <strong>{b.workType}</strong>
                    </p>
                  </div>

                  {/* Status & Fare */}
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                      {isTe ? 'అంచనా అద్దె' : 'Estimated Fare'}
                    </span>
                    <strong style={{ fontSize: '20px', color: '#e65100' }}>
                      ₹{(b.estimatedCost || 0).toLocaleString()}
                    </strong>
                    <br />
                    <span className={`badge ${isApproved ? 'bg-success' : isPending ? 'bg-warning' : isDeclined ? 'bg-danger' : 'bg-info'}`} style={{ marginTop: '4px' }}>
                      ● {b.status}
                    </span>
                  </div>
                </div>

                {/* Permanent In-Card Status Notice */}
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
                    <span>✅ {isTe ? 'స్లాట్ ఖరారైంది! రైతు అకౌంట్లో ఈ స్టేటస్ అప్‌డేట్ అయ్యింది.' : 'Slot Confirmed! The farmer can see this verified in their account.'}</span>
                    <button 
                      type="button"
                      className="btn btn-whatsapp" 
                      style={{ padding: '5px 12px', fontSize: '12px' }}
                      onClick={() => handleWhatsAppFarmer(b, 'confirm')}
                    >
                      💬 {isTe ? 'రైతుకు వాట్సాప్ పంపండి' : 'WhatsApp Farmer'}
                    </button>
                  </div>
                )}

                {isProposed && (
                  <div style={{
                    background: '#fff3e0',
                    border: '1.5px solid #f57c00',
                    color: '#e65100',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    marginTop: '12px',
                    fontSize: '13px',
                    fontWeight: '700'
                  }}>
                    <span>⏳ {isTe ? 'మరుసటి రోజు స్లాట్ రైతుకు సూచించబడింది.' : 'Next day alternative slot proposed to the farmer.'}</span>
                  </div>
                )}

                {isDeclined && (
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
                    <span>❌ {isTe ? 'ఈ తేదీన ట్రాక్టర్ బిజీ అని మార్క్ చేయబడింది.' : 'This slot was marked busy/declined.'}</span>
                  </div>
                )}

                {/* Slot Decision Operations */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '16px', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Accept Slot Button */}
                    <button 
                      type="button"
                      className={`btn ${isApproved ? 'btn-outline-white' : 'btn-primary'}`} 
                      style={{ 
                        padding: '8px 14px', 
                        fontSize: '13px', 
                        borderColor: isApproved ? '#2e7d32' : 'transparent', 
                        color: isApproved ? '#1b5e20' : 'white',
                        background: isApproved ? '#e8f5e9' : undefined,
                        fontWeight: 700 
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSlotDecision(b, 'Approved');
                      }}
                    >
                      {isApproved ? (isTe ? '✓ స్లాట్ ఖరారైంది (Confirmed)' : '✓ Slot Confirmed') : t.btnAcceptSlot}
                    </button>

                    {/* Propose Next Day Button */}
                    <button 
                      type="button"
                      className="btn btn-call" 
                      style={{ 
                        padding: '8px 14px', 
                        fontSize: '13px', 
                        background: isProposed ? '#e0f2fe' : '#0288d1',
                        color: isProposed ? '#0369a1' : 'white',
                        borderColor: isProposed ? '#0288d1' : 'transparent'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSlotDecision(b, 'Next Day Proposed ⏳');
                      }}
                    >
                      {isProposed ? (isTe ? '⏳ మరుసటి రోజు ప్రతిపాదించబడింది' : '⏳ Next Day Proposed') : t.btnProposeAlt}
                    </button>

                    {/* Decline Button */}
                    <button 
                      type="button"
                      className="btn btn-call" 
                      style={{ 
                        padding: '8px 14px', 
                        fontSize: '13px', 
                        background: isDeclined ? '#fee2e2' : '#d32f2f',
                        color: isDeclined ? '#b91c1c' : 'white',
                        borderColor: isDeclined ? '#d32f2f' : 'transparent'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSlotDecision(b, 'Declined (Slot Busy) ❌');
                      }}
                    >
                      {isDeclined ? (isTe ? '✕ స్లాట్ తిరస్కరించబడింది' : '✕ Slot Declined') : t.btnDeclineSlot}
                    </button>
                  </div>

                  {/* Method 1: Instant WhatsApp Reply to Farmer */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      type="button"
                      className="btn btn-whatsapp" 
                      style={{ padding: '8px 14px', fontSize: '13px' }}
                      onClick={() => handleWhatsAppFarmer(b, isApproved ? 'confirm' : 'decline')}
                      title="Send WhatsApp confirmation directly to farmer without saving contact"
                    >
                      {t.replyFarmerWhatsApp}
                    </button>

                    <button 
                      type="button"
                      className="btn btn-outline-white" 
                      style={{ borderColor: 'var(--primary-600)', color: 'var(--primary-700)', padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => onViewSlip && onViewSlip(b)}
                    >
                      🧾 {t.btnViewSlip}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PERMANENT IN-APP CONFIRMATION NOTIFICATION MODAL */}
      {/* LOCKED: CANNOT BE DISMISSED EXCEPT BY CLICKING '✓ OK' OR '✕' */}
      {slotModal && (
        <div 
          className="receipt-modal-backdrop"
          style={{ zIndex: 9999, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => e.stopPropagation()}
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
                          slotModal.decisionStatus === 'Proposed' ? 'linear-gradient(135deg, #e65100 0%, #f57c00 100%)' :
                          'linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)',
              color: 'white',
              padding: '24px 28px',
              textAlign: 'center',
              position: 'relative'
            }}>
              <button
                type="button"
                onClick={() => setSlotModal(null)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '14px',
                  background: 'rgba(255,255,255,0.25)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
                title="Close"
              >
                ✕
              </button>
              <div style={{ fontSize: '46px', marginBottom: '8px' }}>
                {slotModal.decisionStatus === 'Approved' ? '✅' : slotModal.decisionStatus === 'Proposed' ? '⏳' : '❌'}
              </div>
              <h3 style={{ margin: 0, fontSize: '21px', fontWeight: 800 }}>{slotModal.title}</h3>
            </div>

            <div style={{ padding: '24px 28px', background: '#ffffff' }}>
              <p style={{ fontSize: '15px', color: '#1e293b', lineHeight: 1.6, marginBottom: '16px', textAlign: 'center' }}>
                {slotModal.message}
              </p>

              {/* Informative stay notice */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '6px 12px',
                marginBottom: '16px',
                fontSize: '12px',
                color: '#64748b',
                textAlign: 'center',
                fontWeight: '600'
              }}>
                ℹ️ {isTe ? 'ఈ సమాచార నోటిఫికేషన్ మీరు "సరే (OK)" క్లిక్ చేసే వరకు స్క్రీన్‌పైనే ఉంటుంది.' : 'This confirmation stays on screen until you press OK.'}
              </div>

              {slotModal.booking && (
                <div style={{
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 18px',
                  marginBottom: '20px',
                  fontSize: '13.5px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{isTe ? 'రైతు పేరు:' : 'Farmer:'}</span>
                    <strong>{slotModal.booking.farmerName} ({slotModal.booking.farmerVillage})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{isTe ? 'పని & విస్తీర్ణం:' : 'Work & Area:'}</span>
                    <strong>{slotModal.booking.workType} ({slotModal.booking.landArea} {isTe ? 'ఎకరాలు' : 'Acres'})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{isTe ? 'తేదీ:' : 'Date:'}</span>
                    <strong>📅 {slotModal.booking.bookingDate}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{isTe ? 'అంచనా అద్దె:' : 'Estimated Fare:'}</span>
                    <strong style={{ color: '#e65100', fontSize: '15px' }}>₹{(slotModal.booking.estimatedCost || 0).toLocaleString()}</strong>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  style={{ padding: '12px 40px', fontSize: '15px', fontWeight: 800, letterSpacing: '0.5px' }}
                  onClick={() => setSlotModal(null)}
                >
                  ✓ {isTe ? 'సరే (OK)' : 'OK'}
                </button>
                
                <button 
                  type="button" 
                  className="btn btn-whatsapp" 
                  style={{ padding: '12px 20px', fontSize: '13px' }}
                  onClick={() => {
                    const b = slotModal.booking;
                    setSlotModal(null);
                    if (b) handleWhatsAppFarmer(b, slotModal.decisionStatus === 'Approved' ? 'confirm' : 'decline');
                  }}
                >
                  💬 {isTe ? 'రైతుకు వాట్సాప్ పంపండి' : 'Send WhatsApp to Farmer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
