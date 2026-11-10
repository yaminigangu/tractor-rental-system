import { useState } from 'react';
import { apiUpdateBookingStatus } from '../api/apiClient';
import BookingStepper from './BookingStepper';

export default function ReceiptModal({ booking, onClose, language = 'en' }) {
  if (!booking) return null;

  const isTe = language === 'te';
  const [paymentStatus, setPaymentStatus] = useState(booking.paymentStatus || 'Pending Cash on Service');
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  const bookingCode = booking.bookingCode || (booking.id ? `TRC${String(booking.id).slice(-4)}` : 'TRC1025');
  const ownerClean = String(booking.ownerMobile || '9440123456').replace(/\D/g, '').slice(-10);
  const farmerClean = String(booking.farmerMobile || '').trim();
  const upiVpa = `${ownerClean}@ybl`;
  const upiAmount = booking.estimatedCost || 0;
  const upiUri = `upi://pay?pa=${upiVpa}&pn=${encodeURIComponent(booking.tractorOwner || 'Tractor Owner')}&am=${upiAmount}&tn=AgriRent_${bookingCode}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=6&data=${encodeURIComponent(upiUri)}`;

  const timeSlot = booking.timeSlot || booking.bookingTime || '09:00 AM – 01:00 PM';
  const durationHours = booking.durationHours || booking.estimatedHours || 4;
  const advancePayment = Number(booking.advancePayment || 0);
  const totalCost = Number(booking.estimatedCost || 0);
  const balanceDue = Math.max(0, totalCost - advancePayment);
  const hourlyRate = durationHours > 0 ? Math.round(totalCost / durationHours) : 1500;

  const handleDownloadPdf = () => {
    window.print();
  };

  const handleMarkPayment = async (newStatus) => {
    setIsUpdatingPayment(true);
    try {
      await apiUpdateBookingStatus(booking.id, booking.status, null, newStatus);
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
      `🚜 *AGRIRENT OFFICIAL BOOKING INVOICE*\n\n` +
      `Booking ID: ${bookingCode}\n\n` +
      `Customer: ${booking.farmerName}\n` +
      `Mobile: ${farmerClean || '—'}\n` +
      `Location: ${booking.farmerVillage}\n` +
      `Tractor: ${booking.tractorModel}\n` +
      `Registration: ${booking.registrationNo || 'TS 03 AB 4589'}\n` +
      `Owner: ${booking.tractorOwner} (${ownerClean})\n` +
      `Booking Date: ${booking.bookingDate}\n` +
      `Time Slot: ${timeSlot}\n` +
      `Duration: ${durationHours} Hours\n` +
      `Operation: ${booking.workType} (${booking.landArea} Acres)\n` +
      `Rental Charges: ₹${hourlyRate}/Hr\n` +
      `Advance Payment: ₹${advancePayment.toLocaleString()}\n` +
      `Balance Due: ₹${balanceDue.toLocaleString()}\n` +
      `Total Estimated Amount: ₹${totalCost.toLocaleString()}\n\n` +
      `Status: ${booking.status}\n` +
      `Payment Status: ${paymentStatus}\n\n` +
      `Thank you for using AgriRent Tractor Rental System!`
    );

    if (ownerClean && ownerClean.length >= 10) {
      window.open(`https://wa.me/91${ownerClean}?text=${text}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  return (
    <div className="receipt-modal-backdrop" onClick={onClose}>
      <div className="receipt-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Printable Pass Container */}
        <div className="receipt-slip-printable" id="printableSlip">
          {/* Slip Header */}
          <div className="slip-header" style={{ borderBottom: '2px solid #2e7d32', paddingBottom: '14px' }}>
            <div className="slip-brand">
              <span className="slip-logo" style={{ fontSize: '32px' }}>🚜</span>
              <div>
                <h2 style={{ margin: 0, color: '#1b5e20', fontSize: '20px' }}>AgriRent Tractor Rental System</h2>
                <small style={{ color: '#4b5563', fontWeight: 600 }}>Official Digital Booking Invoice & Work Slip</small>
              </div>
            </div>
            <div className="slip-ref-box" style={{ textAlign: 'right' }}>
              <span className="slip-ref-tag" style={{ background: '#e8f5e9', color: '#1b5e20', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>
                INVOICE
              </span>
              <div style={{ marginTop: '4px' }}>
                <strong className="slip-ref-id" style={{ fontSize: '18px', color: '#0f172a' }}>{bookingCode}</strong>
              </div>
            </div>
          </div>

          {/* Status & Date Bar */}
          <div className="slip-status-banner" style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', margin: '14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span>● {isTe ? 'బుకింగ్ స్థితి:' : 'Status:'} <strong style={{ color: '#15803d' }}>{booking.status}</strong></span>
            <span style={{
              background: paymentStatus === 'Paid' ? '#2e7d32' : '#e65100',
              color: '#fff',
              padding: '3px 10px',
              borderRadius: '4px',
              fontWeight: '700',
              fontSize: '11.5px'
            }}>
              💳 {isTe ? (paymentStatus === 'Paid' ? 'చెల్లించబడింది' : 'పెండింగ్') : paymentStatus}
            </span>
            <span>📅 {booking.bookingDate}</span>
          </div>

          {/* Timeline Stepper */}
          <div style={{ margin: '12px 0 18px 0', padding: '8px 12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <BookingStepper status={booking.status} language={language} />
          </div>

          {/* Details Grid */}
          <div className="slip-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="slip-section" style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '13.5px' }}>
                👨‍🌾 {isTe ? 'కస్టమర్ / రైతు వివరాలు' : 'Customer Information'}
              </h4>
              <p style={{ margin: '3px 0', fontSize: '13px' }}><strong>{isTe ? 'పేరు:' : 'Name:'}</strong> {booking.farmerName}</p>
              <p style={{ margin: '3px 0', fontSize: '13px' }}><strong>{isTe ? 'మొబైల్:' : 'Mobile:'}</strong> {farmerClean || '—'}</p>
              <p style={{ margin: '3px 0', fontSize: '13px' }}><strong>{isTe ? 'ప్రాంతం:' : 'Location:'}</strong> {booking.farmerVillage}</p>
            </div>

            <div className="slip-section" style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '13.5px' }}>
                🚜 {isTe ? 'ట్రాక్టర్ యజమాని వివరాలు' : 'Tractor Owner Information'}
              </h4>
              <p style={{ margin: '3px 0', fontSize: '13px' }}><strong>{isTe ? 'యజమాని:' : 'Owner:'}</strong> {booking.tractorOwner}</p>
              <p style={{ margin: '3px 0', fontSize: '13px' }}><strong>{isTe ? 'సంప్రదించండి:' : 'Contact:'}</strong> +91 {ownerClean || 'Assigned'}</p>
              <p style={{ margin: '3px 0', fontSize: '13px' }}><strong>{isTe ? 'వాహన మోడల్:' : 'Tractor:'}</strong> {booking.tractorModel}</p>
              <p style={{ margin: '3px 0', fontSize: '12px', color: '#64748b' }}><strong>RC:</strong> {booking.registrationNo || 'TS 03 AB 4589'}</p>
            </div>
          </div>

          {/* Work & Time Slot Specs */}
          <div className="slip-work-box" style={{ background: '#f1f8e9', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #c8e6c9' }}>
            <div className="slip-work-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              <div>
                <small style={{ color: '#558b2f', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>{isTe ? 'పని రకం' : 'Operation'}</small>
                <h5 style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{booking.workType}</h5>
              </div>
              <div>
                <small style={{ color: '#558b2f', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>{isTe ? 'విస్తీర్ణం' : 'Land Area'}</small>
                <h5 style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{booking.landArea} Acres</h5>
              </div>
              <div>
                <small style={{ color: '#558b2f', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>{isTe ? 'సమయ స్లాట్' : 'Time Slot'}</small>
                <h5 style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#1b5e20' }}>{timeSlot}</h5>
              </div>
              <div>
                <small style={{ color: '#558b2f', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>{isTe ? 'వ్యవధి' : 'Duration'}</small>
                <h5 style={{ margin: '4px 0 0 0', fontSize: '13px' }}>~{durationHours} Hours</h5>
              </div>
            </div>
          </div>

          {/* Pricing Breakdown Table */}
          <div style={{ marginBottom: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px', color: '#475569' }}>Tractor Rental Rate</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>₹{hourlyRate.toLocaleString()} / hour</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px', color: '#475569' }}>Duration Total ({durationHours} Hours)</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>₹{totalCost.toLocaleString()}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px', color: '#475569' }}>Professional Operator & Fuel</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>Included (Free)</td>
                </tr>
                {advancePayment > 0 && (
                  <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f0fdf4' }}>
                    <td style={{ padding: '8px 12px', color: '#166534', fontWeight: 600 }}>Advance Payment Received</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: '#166534', fontWeight: 700 }}>- ₹{advancePayment.toLocaleString()}</td>
                  </tr>
                )}
                <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                  <td style={{ padding: '10px 12px', fontSize: '14px', color: '#0f172a' }}>Total Estimated Amount</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '16px', color: '#b45309' }}>₹{totalCost.toLocaleString()}</td>
                </tr>
                {advancePayment > 0 && (
                  <tr style={{ background: '#ffffff', fontWeight: 700 }}>
                    <td style={{ padding: '6px 12px', fontSize: '12px', color: '#64748b' }}>Balance Payable on Service Completion</td>
                    <td style={{ padding: '6px 12px', textAlign: 'right', fontSize: '13px', color: '#0f172a' }}>₹{balanceDue.toLocaleString()}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer with Dynamic Real UPI QR Stamp */}
          <div className="slip-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '14px' }}>
            <div className="slip-qr-box" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src={qrCodeUrl}
                alt="UPI QR Code"
                style={{ width: '70px', height: '70px', borderRadius: '4px', border: '1px solid #c8e6c9', background: '#fff' }}
              />
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#1b5e20', display: 'block' }}>
                  {isTe ? 'UPI స్కాన్ చేసి చెల్లించండి' : 'Direct UPI Settlement'}
                </span>
                <span style={{ fontSize: '10px', color: '#64748b', wordBreak: 'break-all' }}>{upiVpa}</span>
              </div>
            </div>

            <div className="slip-signature" style={{ textAlign: 'right' }}>
              <span className="verified-stamp" style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>
                ✓ OFFICIAL AGRIRENT INVOICE
              </span>
              <div style={{ marginTop: '6px', fontSize: '10.5px', color: '#94a3b8' }}>
                Issued by AgriRent Telematics Network
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="receipt-modal-actions" style={{ flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
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
                ? `✓ ${isTe ? 'చెల్లించబడింది (Paid)' : 'Payment Settled (Paid)'}`
                : `💵 ${isTe ? 'చెల్లించినట్లు మార్క్ చేయండి' : 'Mark as Paid'}`
              )
            }
          </button>
          
          <button className="btn btn-primary" onClick={handleDownloadPdf} style={{ fontWeight: 700 }}>
            📥 {isTe ? 'PDF డౌన్‌లోడ్ / ప్రింట్' : 'Download PDF Invoice'}
          </button>
          
          <button className="btn btn-whatsapp" onClick={handleShareWhatsApp}>
            📲 {isTe ? 'వాట్సాప్‌లో పంపండి' : 'Share on WhatsApp'}
          </button>
          
          <button className="btn btn-call" style={{ background: '#64748b' }} onClick={onClose}>
            ✕ {isTe ? 'మూసివేయి' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
