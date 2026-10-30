import { useState } from 'react';

export default function BookingModal({
  isOpen,
  onClose,
  tractor,
  currentUser,
  language = 'en',
  onConfirmBooking
}) {
  if (!isOpen || !tractor) return null;

  const isTe = language === 'te';

  const [farmerName, setFarmerName] = useState(currentUser?.name || 'N. Ramesh Kumar');
  const [farmerPhone, setFarmerPhone] = useState(currentUser?.phone || '9848012345');
  const [deliveryVillage, setDeliveryVillage] = useState(currentUser?.village || tractor.base_village || 'Hasanparthy');
  const [workType, setWorkType] = useState('Ploughing');
  const [landArea, setLandArea] = useState('3');
  const [landUnit, setLandUnit] = useState('Acres');
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('07:00 AM');
  const [notes, setNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const workTypes = [
    { key: 'Ploughing', en: 'Ploughing', te: 'దుక్కి దున్నడం' },
    { key: 'Rotavator', en: 'Rotavator', te: 'రోటవేటర్' },
    { key: 'Cultivator', en: 'Cultivator', te: 'కల్టివేటర్' },
    { key: 'Trailer Services', en: 'Trailer Services', te: 'ట్రాలీ రవాణా' },
    { key: 'Corn Harvester', en: 'Corn Harvester', te: 'మొక్కజొన్న హార్వెస్టర్' },
    { key: 'Straw Baler', en: 'Straw Baler', te: 'గడ్డి చుట్టే యంత్రం' },
    { key: 'Corn Seeder', en: 'Corn Seeder', te: 'విత్తనాలు నాటే యంత్రం' },
    { key: 'Other Agricultural Work', en: 'Other Work', te: 'ఇతర పనులు' },
  ];

  const estimatedTotal = landUnit === 'Acres'
    ? (tractor.rate_per_acre || (tractor.rate_per_hour * 2)) * (Number(landArea) || 1)
    : (tractor.rate_per_hour * 0.5) * (Number(landArea) || 1);

  const handleConfirm = () => {
    const booking = {
      id: Date.now(),
      booking_code: `AGR-${Math.floor(1000 + Math.random() * 9000)}`,
      tractor_id: tractor.id,
      tractor_name: tractor.model,
      owner_name: tractor.owner_name,
      owner_phone: tractor.owner_phone,
      farmer_name: farmerName,
      farmer_phone: farmerPhone,
      delivery_village: deliveryVillage,
      work_type: workType,
      land_area: Number(landArea) || 1,
      land_unit: landUnit,
      booking_date: bookingDate,
      time_slot: timeSlot,
      status: 'accepted',
      estimated_cost: estimatedTotal,
      notes,
      created_at: new Date().toISOString()
    };
    setIsSuccess(true);
    if (onConfirmBooking) {
      onConfirmBooking(booking);
    }
  };

  return (
    <div className="native-modal-overlay" onClick={onClose}>
      <div className="native-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="native-modal-header">
          <div className="modal-header-left">
            <span className="modal-header-icon">🚜</span>
            <div>
              <h2 className="modal-header-title">
                {isTe ? 'ట్రాక్టర్ బుకింగ్ అభ్యర్థన' : 'Tractor Booking Request'}
              </h2>
              <p className="modal-header-sub">
                {tractor.model} ({tractor.hp} HP)
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {isSuccess ? (
          <div className="booking-success-box">
            <div className="success-emoji-circle">✓</div>
            <h3>{isTe ? 'బుకింగ్ విజయవంతమైంది!' : 'Booking Request Confirmed!'}</h3>
            <p>
              {isTe
                ? `మీ అభ్యర్థన యజమాని ${tractor.owner_name} కి పంపబడింది. WhatsApp మరియు SMS ద్వారా హెచ్చరిక పంపబడింది.`
                : `Your booking has been received. Owner ${tractor.owner_name} has been notified via WhatsApp & In-App dispatch.`}
            </p>
            <div className="success-cost-pill">
              {isTe ? 'అంచనా వ్యయం: ' : 'Estimated Rental: '}₹{estimatedTotal}
            </div>
            <button
              type="button"
              className="native-btn-primary green-bg"
              onClick={onClose}
            >
              {isTe ? 'ముగించు' : 'Close & View Bookings'}
            </button>
          </div>
        ) : (
          <div className="modal-scroll-body">
            <div className="native-field-group">
              <label className="native-label">{isTe ? 'రైతు పేరు' : 'Farmer Name'}</label>
              <input
                type="text"
                className="native-input"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
              />
            </div>

            <div className="native-field-group">
              <label className="native-label">{isTe ? 'రైతు ఫోన్ నంబర్' : 'Farmer Mobile'}</label>
              <input
                type="tel"
                className="native-input"
                value={farmerPhone}
                onChange={(e) => setFarmerPhone(e.target.value)}
              />
            </div>

            <div className="native-field-group">
              <label className="native-label">{isTe ? 'పని ప్రదేశం / గ్రామం' : 'Delivery Village'}</label>
              <input
                type="text"
                className="native-input"
                value={deliveryVillage}
                onChange={(e) => setDeliveryVillage(e.target.value)}
              />
            </div>

            <div className="native-field-group">
              <label className="native-label">{isTe ? 'వ్యవసాయ పని రకం' : 'Work Type'}</label>
              <select
                className="native-select"
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
              >
                {workTypes.map((w) => (
                  <option key={w.key} value={w.key}>
                    {isTe ? w.te : w.en}
                  </option>
                ))}
              </select>
            </div>

            <div className="two-col-grid">
              <div className="native-field-group">
                <label className="native-label">{isTe ? 'భూమి విస్తీర్ణం' : 'Land Area'}</label>
                <input
                  type="number"
                  className="native-input"
                  value={landArea}
                  onChange={(e) => setLandArea(e.target.value)}
                  min="0.5"
                  step="0.5"
                />
              </div>

              <div className="native-field-group">
                <label className="native-label">{isTe ? 'యూనిట్' : 'Unit'}</label>
                <select
                  className="native-select"
                  value={landUnit}
                  onChange={(e) => setLandUnit(e.target.value)}
                >
                  <option value="Acres">{isTe ? 'ఎకరాలు' : 'Acres'}</option>
                  <option value="Guntas">{isTe ? 'గుంటలు' : 'Guntas'}</option>
                </select>
              </div>
            </div>

            <div className="two-col-grid">
              <div className="native-field-group">
                <label className="native-label">{isTe ? 'తేదీ' : 'Date'}</label>
                <input
                  type="date"
                  className="native-input"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                />
              </div>

              <div className="native-field-group">
                <label className="native-label">{isTe ? 'సమయం' : 'Time Slot'}</label>
                <select
                  className="native-select"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                >
                  <option value="06:00 AM">06:00 AM</option>
                  <option value="07:00 AM">07:00 AM</option>
                  <option value="08:00 AM">08:00 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                </select>
              </div>
            </div>

            <div className="booking-summary-pill">
              <span>{isTe ? 'అంచనా అద్దె:' : 'Estimated Total:'}</span>
              <span className="summary-price">₹{estimatedTotal}</span>
            </div>

            <button
              type="button"
              className="native-btn-primary green-bg"
              onClick={handleConfirm}
            >
              {isTe ? 'బుకింగ్ అభ్యర్థనను నిర్ధారించండి 🚀' : 'Confirm Booking Request 🚀'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
