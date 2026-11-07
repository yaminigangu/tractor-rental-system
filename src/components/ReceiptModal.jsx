import { useState } from 'react';
import { apiUpdateBookingStatus } from '../api/apiClient';

export default function ReceiptModal({ booking, onClose, language = 'en' }) {
  if (!booking) return null;

  const isTe = language === 'te';
  const [paymentStatus, setPaymentStatus] = useState(booking.paymentStatus || 'Pending Cash on Service');
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  const ownerClean = String(booking.ownerMobile || '9440123456').replace(/\D/g, '').slice(-10);
  const farmerClean = String(booking.farmerMobile || '').trim();
  const upiVpa = `${ownerClean}@ybl`;
  const upiAmount = booking.estimatedCost || 0;
  const upiUri = `upi://pay?pa=${upiVpa}&pn=${encodeURIComponent(booking.tractorOwner || 'Tractor Owner')}&am=${upiAmount}&tn=AgriRent_${booking.id}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=6&data=${encodeURIComponent(upiUri)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleMarkPayment = async (newStatus) => {
    setIsUpdatingPayment(true);
    try {
      await apiUpdateBookingStatus(booking.id, booking.status, newStatus);
      setPaymentStatus(newStatus);
      booking.paymentStatus = newStatus;
    } catch (err) {
      console.warn('Failed to update payment status:', err);
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      isTe
        ? `🌾 *అగ్రిరెంట్ అధికారిక పని రసీదు (AgriRent Work Slip)*\n` +
          `బుకింగ్ ID: #AGRI-${String(booking.id).slice(-6)}\n` +
          `రైతు పేరు: ${booking.farmerName}\n` +
          `రైతు మొబైల్: ${farmerClean || '—'}\n` +
          `గ్రామం: ${booking.farmerVillage}\n` +
          `పని రకం: ${booking.workType} (${booking.landArea} ఎకరాలు)\n` +
          `తేదీ: ${booking.bookingDate}\n` +
          `ట్రాక్టర్: ${booking.tractorModel}\n` +
          `వాహన యజమాని: ${booking.tractorOwner}\n` +
          `చెల్లింపు స్థితి: ${paymentStatus}\n` +
          `మొత్తం అంచనా చార్జ్: ₹${(booking.estimatedCost || 0).toLocaleString()}\n` +
          `యజమాని UPI: ${upiVpa}\n` +
          `స్థితి: ${booking.status}`
        : `🌾 *AgriRent Official Work Slip / Money Receipt*\n` +
          `Booking ID: #AGRI-${String(booking.id).slice(-6)}\n` +
          `Farmer Name: ${booking.farmerName}\n` +
          `Farmer Mobile: ${farmerClean || '—'}\n` +
          `Village: ${booking.farmerVillage}\n` +
          `Operation: ${booking.workType} for ${booking.landArea} Acres\n` +
          `Date: ${booking.bookingDate}\n` +
          `Machinery: ${booking.tractorModel}\n` +
          `Tractor Owner: ${booking.tractorOwner} (${booking.ownerMobile || 'Assigned'})\n` +
          `Payment Status: ${paymentStatus}\n` +
          `Estimated Total: ₹${(booking.estimatedCost || 0).toLocaleString()}\n` +
          `Owner UPI: ${upiVpa}\n` +
          `Status: ${booking.status}`
    );

    if (ownerClean && ownerClean.length >= 10) {
      window.open(`https://wa.me/91${ownerClean}?text=${text}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  return (
    <div className="receipt-modal-backdrop" onClick={onClose}>
      <div className="receipt-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Printable Pass Container */}
        <div className="receipt-slip-printable" id="printableSlip">
          {/* Slip Header */}
          <div className="slip-header">
            <div className="slip-brand">
              <span className="slip-logo">🌾</span>
              <div>
                <h2>AgriRent Official Work Slip</h2>
                <small>Locality Farm Machinery Network • Hasanparthy Cluster</small>
              </div>
            </div>
            <div className="slip-ref-box">
              <span className="slip-ref-tag">ORDER PASS</span>
              <strong className="slip-ref-id">#AGRI-{booking.id.toString().slice(-6)}</strong>
            </div>
          </div>

          <div className="slip-status-banner">
            <span>● {isTe ? 'బుకింగ్ స్థితి:' : 'Order Status:'} <strong>{booking.status}</strong></span>
            <span style={{
              background: paymentStatus === 'Paid' ? '#2e7d32' : '#e65100',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: '700',
              fontSize: '11px'
            }}>
              💳 {isTe ? (paymentStatus === 'Paid' ? 'చెల్లించబడింది' : 'పెండింగ్') : paymentStatus}
            </span>
            <span>📅 {booking.bookingDate}</span>
          </div>

          {/* Details Grid */}
          <div className="slip-details-grid">
            <div className="slip-section">
              <h4>👨‍🌾 {isTe ? 'రైతు వివరాలు (Farmer)' : 'Farmer Details'}</h4>
              <p><strong>{isTe ? 'పేరు:' : 'Name:'}</strong> {booking.farmerName}</p>
              <p><strong>{isTe ? 'ఫోన్:' : 'Phone:'}</strong> {booking.farmerMobile}</p>
              <p><strong>{isTe ? 'గ్రామం:' : 'Village:'}</strong> {booking.farmerVillage}</p>
            </div>

            <div className="slip-section">
              <h4>🚜 {isTe ? 'ట్రాక్టర్ & డ్రైవర్ (Machinery)' : 'Machinery & Operator'}</h4>
              <p><strong>{isTe ? 'ట్రాక్టర్:' : 'Tractor:'}</strong> {booking.tractorModel}</p>
              <p><strong>{isTe ? 'యజమాని:' : 'Owner:'}</strong> {booking.tractorOwner}</p>
              <p><strong>{isTe ? 'సంప్రదించండి:' : 'Contact:'}</strong> {booking.ownerMobile || 'Assigned on Confirmation'}</p>
            </div>
          </div>

          {/* Work Specs */}
          <div className="slip-work-box">
            <div className="slip-work-row">
              <div>
                <small>{isTe ? 'పని రకం' : 'Agricultural Operation'}</small>
                <h5>{booking.workType}</h5>
              </div>
              <div>
                <small>{isTe ? 'భూమి విస్తీర్ణం' : 'Target Land Area'}</small>
                <h5>{booking.landArea} Acres</h5>
              </div>
              <div>
                <small>{isTe ? 'అంచనా సమయం' : 'Estimated Time'}</small>
                <h5>~{booking.estimatedHours || 2} Hours</h5>
              </div>
            </div>
          </div>

          {/* Amount Box */}
          <div className="slip-total-bar">
            <div>
              <span className="total-label">{isTe ? 'మొత్తం అంచనా చార్జ్' : 'Total Estimated Work Fee'}</span>
              <small className="total-terms">Cash on work completion / Direct UPI to owner</small>
            </div>
            <div className="total-amount">
              ₹{(booking.estimatedCost || 0).toLocaleString()}
            </div>
          </div>

          {/* Footer with Dynamic Real UPI QR Stamp */}
          <div className="slip-footer">
            <div className="slip-qr-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textAlign: 'center' }}>
              <img
                src={qrCodeUrl}
                alt="UPI QR Code"
                style={{ width: '80px', height: '80px', borderRadius: '4px', border: '1px solid #c8e6c9', background: '#fff' }}
              />
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#1b5e20' }}>
                {isTe ? 'UPI స్కాన్ చేసి చెల్లించండి' : 'Scan to Pay via UPI'}
              </span>
              <span style={{ fontSize: '9px', color: '#555', wordBreak: 'break-all' }}>{upiVpa}</span>
            </div>

            <div className="slip-signature">
              <span className="verified-stamp">✓ VERIFIED LOCALITY PASS</span>
              <small>AgriRent Rural Coordination System</small>
              <div style={{ marginTop: '8px' }}>
                <a
                  href={upiUri}
                  style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    background: '#e8f5e9',
                    color: '#2e7d32',
                    borderRadius: '6px',
                    fontWeight: '700',
                    fontSize: '11px',
                    textDecoration: 'none',
                    border: '1px solid #a5d6a7'
                  }}
                >
                  🚀 {isTe ? 'UPI యాప్ తెరవండి (PhonePe / GPay)' : 'Pay via UPI App'}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="receipt-modal-actions" style={{ flexWrap: 'wrap', gap: '8px' }}>
          <button
            className="btn"
            style={{
              background: paymentStatus === 'Paid' ? '#2e7d32' : '#e65100',
              color: '#fff',
              fontWeight: '700'
            }}
            onClick={() => handleMarkPayment(paymentStatus === 'Paid' ? 'Pending Cash on Service' : 'Paid')}
            disabled={isUpdatingPayment}
          >
            {isUpdatingPayment
              ? '⏳...'
              : (paymentStatus === 'Paid'
                ? `✓ ${isTe ? 'చెల్లించబడింది (Paid)' : 'Payment Received (Paid)'}`
                : `💵 ${isTe ? 'చెల్లించినట్లు మార్క్ చేయండి (Cash/UPI)' : 'Mark Paid (Cash / UPI)'}`
              )
            }
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            🖨️ {isTe ? 'రసీదు ప్రింట్ చేయండి' : 'Print Work Slip'}
          </button>
          <button className="btn btn-whatsapp" onClick={handleShareWhatsApp}>
            📲 {isTe ? 'వాట్సాప్‌లో పంపండి' : 'Send via WhatsApp'}
          </button>
          <button className="btn btn-call" style={{ background: '#64748b' }} onClick={onClose}>
            ✕ {isTe ? 'మూసివేయి' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
