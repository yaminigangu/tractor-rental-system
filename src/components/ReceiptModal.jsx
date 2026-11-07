export default function ReceiptModal({ booking, onClose, language = 'en' }) {
  if (!booking) return null;

  const isTe = language === 'te';

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const ownerClean = String(booking.ownerMobile || '').replace(/\D/g, '');
    const farmerClean = String(booking.farmerMobile || '').trim();

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
          `మొత్తం అంచనా చార్జ్: ₹${(booking.estimatedCost || 0).toLocaleString()}\n` +
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
          `Estimated Total: ₹${(booking.estimatedCost || 0).toLocaleString()}\n` +
          `Status: ${booking.status}`
    );

    if (ownerClean && ownerClean.length >= 10) {
      window.open(`https://wa.me/91${ownerClean.slice(-10)}?text=${text}`, '_blank');
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

          {/* Footer with QR Stamp */}
          <div className="slip-footer">
            <div className="slip-qr-box">
              <svg width="60" height="60" viewBox="0 0 100 100" fill="#1b5e20">
                <rect x="5" y="5" width="30" height="30" rx="4" />
                <rect x="10" y="10" width="20" height="20" fill="#fff" />
                <rect x="15" y="15" width="10" height="10" />

                <rect x="65" y="5" width="30" height="30" rx="4" />
                <rect x="70" y="10" width="20" height="20" fill="#fff" />
                <rect x="75" y="15" width="10" height="10" />

                <rect x="5" y="65" width="30" height="30" rx="4" />
                <rect x="10" y="70" width="20" height="20" fill="#fff" />
                <rect x="15" y="75" width="10" height="10" />

                <rect x="45" y="15" width="10" height="25" />
                <rect x="45" y="50" width="25" height="10" />
                <rect x="55" y="65" width="20" height="20" />
              </svg>
              <span>Scan to verify order</span>
            </div>

            <div className="slip-signature">
              <span className="verified-stamp">✓ VERIFIED LOCALITY PASS</span>
              <small>AgriRent Rural Coordination System</small>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="receipt-modal-actions">
          <button className="btn btn-primary" onClick={handlePrint}>
            🖨️ {isTe ? 'రసీదు ప్రింట్ చేయండి' : 'Print Work Slip'}
          </button>
          <button className="btn btn-whatsapp" onClick={handleShareWhatsApp}>
            📲 {isTe ? 'యజమానికి వాట్సాప్‌లో పంపండి' : 'Send Receipt to Owner via WhatsApp'}
          </button>
          <button className="btn btn-call" style={{ background: '#64748b' }} onClick={onClose}>
            ✕ {isTe ? 'మూసివేయి' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
