import { useState, useEffect } from 'react';
import { translations } from '../translations';
import { ALL_LOCATIONS_LIST } from '../data/telanganaLocations';
import { getAccurateTractorPhoto, getTractorDisplayName } from './FindTractor';

const TODAY_DATE = new Date().toISOString().split('T')[0];

export default function TractorBooking({
  tractors = [],
  selectedTractor,
  setSelectedTractor,
  setBookings,
  setActivePage,
  onBookingSuccess,
  language = 'en',
  selectedLocation,
  currentFarmer
}) {
  const t = translations[language] || translations.en;
  const isTe = language === 'te';

  const defaultVillage = currentFarmer?.village || (selectedLocation
    ? `${isTe ? (selectedLocation.villageTe || selectedLocation.village) : selectedLocation.village}, ${isTe ? (selectedLocation.districtTe || selectedLocation.district) : selectedLocation.district}`
    : '');

  const [formData, setFormData] = useState(() => ({
    farmerName: currentFarmer?.name || '',
    farmerMobile: currentFarmer?.mobile || '',
    farmerVillage: defaultVillage,
    workType: 'Ploughing',
    otherWorkDetails: '',
    landArea: currentFarmer?.landArea || 2,
    bookingDate: TODAY_DATE,
    assignedTractorId: selectedTractor ? selectedTractor.id : (tractors[0]?.id || '')
  }));

  // Auto-sync currentFarmer if user logs in while on or visiting the page
  useEffect(() => {
    if (currentFarmer) {
      setFormData(prev => ({
        ...prev,
        farmerName: currentFarmer.name || prev.farmerName,
        farmerMobile: currentFarmer.mobile || prev.farmerMobile,
        farmerVillage: currentFarmer.village || prev.farmerVillage,
        landArea: currentFarmer.landArea || prev.landArea
      }));
    }
  }, [currentFarmer]);

  // Sync selectedTractor from FindTractor whenever it changes
  useEffect(() => {
    if (selectedTractor) {
      setFormData(prev => ({
        ...prev,
        assignedTractorId: selectedTractor.id
      }));
    }
  }, [selectedTractor]);

  const currentTractor = selectedTractor || tractors.find(t => t.id === Number(formData.assignedTractorId)) || tractors[0];
  const hourlyRate = currentTractor ? currentTractor.pricing : 1200;
  // Estimated 1.5 hours per acre for ploughing/rotavator
  const estimatedHours = Math.max(1, Math.round((Number(formData.landArea) || 1) * 1.5));
  const estimatedCost = estimatedHours * hourlyRate;

  const handleSubmit = (e) => {
    e.preventDefault();

    const newBooking = {
      id: Date.now(),
      farmerName: formData.farmerName,
      farmerMobile: formData.farmerMobile,
      farmerVillage: formData.farmerVillage,
      workType: formData.workType === 'Other Agricultural Work'
        ? `Other: ${formData.otherWorkDetails || 'Custom farm work'}`
        : formData.workType,
      landArea: Number(formData.landArea),
      bookingDate: formData.bookingDate,
      estimatedHours,
      estimatedCost,
      status: 'Pending Approval',
      tractorModel: currentTractor ? `${currentTractor.brand} ${currentTractor.model}` : 'Assigned by Admin',
      tractorOwner: currentTractor ? currentTractor.owner : 'Pending Allocation',
      ownerMobile: currentTractor ? currentTractor.mobile : '',
      createdAt: new Date().toLocaleString()
    };

    setBookings((prev) => [newBooking, ...prev]);

    // Trigger Digital Receipt Slip Modal!
    if (onBookingSuccess) {
      onBookingSuccess(newBooking);
    }
    setActivePage('my-bookings');
  };

  const [validationError, setValidationError] = useState('');

  const handleSendWhatsAppBooking = () => {
    if (!formData.farmerName || !formData.farmerMobile) {
      setValidationError(isTe ? 'దయచేసి మీ పేరు మరియు మొబైల్ నంబర్ పూరించండి.' : 'Please fill your name and mobile number first.');
      return;
    }
    setValidationError('');
    const targetPhone = currentTractor ? currentTractor.mobile.replace(/\D/g, '') : '9032004060';
    const message = encodeURIComponent(
      isTe
        ? `🌾 *అగ్రిరెంట్ స్లాట్ లభ్యత అభ్యర్థన*\n` +
        `రైతు పేరు: ${formData.farmerName}\n` +
        `మొబైల్: ${formData.farmerMobile}\n` +
        `గ్రామం: ${formData.farmerVillage}\n` +
        `పని రకం: ${formData.workType} ${formData.otherWorkDetails ? `(${formData.otherWorkDetails})` : ''}\n` +
        `విస్తీర్ణం: ${formData.landArea} ఎకరాలు\n` +
        `కోరిన తేదీ: ${formData.bookingDate}\n` +
        `ట్రాక్టర్: ${currentTractor ? `${currentTractor.brand} ${currentTractor.model}` : 'ఉత్తమ అందుబాటులో ఉన్నది'}\n` +
        `అంచనా అద్దె: ₹${estimatedCost.toLocaleString()}\n\n` +
        `👉 ట్రాక్టర్ యజమాని గారు: ఈ తేదీన మీ ట్రాక్టర్ ఖాళీగా ఉందా? దయచేసి అవును (FREE) లేదా కాదు (BUSY) అని చెప్పగలరు.`
        : `🌾 *AgriRent Slot Availability Request*\n` +
        `Farmer: ${formData.farmerName}\n` +
        `Mobile: ${formData.farmerMobile}\n` +
        `Village: ${formData.farmerVillage}\n` +
        `Operation: ${formData.workType} ${formData.otherWorkDetails ? `(${formData.otherWorkDetails})` : ''}\n` +
        `Land Area: ${formData.landArea} Acres\n` +
        `Requested Date: ${formData.bookingDate}\n` +
        `Tractor Unit: ${currentTractor ? `${currentTractor.brand} ${currentTractor.model}` : 'Best Available'}\n` +
        `Estimated Fare: ₹${estimatedCost.toLocaleString()}\n\n` +
        `👉 Tractor Owner: Please reply whether your tractor is FREE or BUSY for this slot.`
    );
    window.open(`https://wa.me/91${targetPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="form-card-wrapper page-anim">
      <div className="form-header">
        <h3>{t.bookingFormTitle}</h3>
        <p>{t.bookingFormSubtitle}</p>
      </div>

      {validationError && (
        <div style={{
          background: '#ffebee',
          color: '#c62828',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontWeight: '600',
          border: '1px solid #ffcdd2'
        }}>
          ⚠️ {validationError}
        </div>
      )}

      {/* Selected Tractor Preview Banner */}
      {currentTractor && (
        <div className="selected-tractor-banner">
          <img
            src={getAccurateTractorPhoto(currentTractor)}
            alt={getTractorDisplayName(currentTractor)}
            className="selected-tractor-thumb"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/tractor1.jpeg';
            }}
          />
          <div className="selected-tractor-details">
            <h5>{getTractorDisplayName(currentTractor)}</h5>
            <p><strong>{t.ownerLabel}</strong> {currentTractor.owner} ({currentTractor.location})</p>
            <p><strong>{isTe ? 'రేటు:' : 'Rate:'}</strong> ₹{currentTractor.pricing} {t.perHour} • 📞 {currentTractor.mobile}</p>
          </div>
          {setSelectedTractor && (
            <button
              type="button"
              className="btn btn-call"
              style={{ fontSize: '11px', padding: '6px 10px' }}
              onClick={() => setActivePage('find-tractor')}
            >
              {t.changeTractor}
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="styled-form">
        {/* Field 1: Farmer Name */}
        <div className="form-group">
          <label htmlFor="farmerName">{t.farmerNameLabel}</label>
          <input
            id="farmerName"
            type="text"
            required
            placeholder={isTe ? "ఉదా: కొండల్ రావు / శ్రీనివాస్" : "e.g. Kondal Rao / Srinivas"}
            value={formData.farmerName}
            onChange={(e) => setFormData({ ...formData, farmerName: e.target.value })}
          />
        </div>

        {/* Field 2 & 3: Mobile Number & Village */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="farmerMobile">{t.mobileNumberLabel}</label>
            <input
              id="farmerMobile"
              type="tel"
              pattern="[0-9]{10}"
              required
              placeholder={isTe ? "10 అంకెల మొబైల్ నంబర్" : "10-digit mobile number"}
              value={formData.farmerMobile}
              onChange={(e) => setFormData({ ...formData, farmerMobile: e.target.value })}
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label htmlFor="farmerVillage" style={{ margin: 0 }}>{t.villageLocationLabel}</label>
              {defaultVillage && (
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#2e7d32', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  onClick={() => setFormData({ ...formData, farmerVillage: defaultVillage })}
                >
                  📍 {isTe ? 'ప్రస్తుత ప్రాంతాన్ని వాడండి' : 'Use Active Location'}
                </button>
              )}
            </div>
            <input
              id="farmerVillage"
              type="text"
              required
              list="telangana-villages-list"
              placeholder={isTe ? "ఉదా: హసన్‌పర్తి, గజ్వేల్, ఆర్మూర్..." : "e.g. Hasanparthy, Gajwel, Armoor..."}
              value={formData.farmerVillage}
              onChange={(e) => setFormData({ ...formData, farmerVillage: e.target.value })}
            />
            <datalist id="telangana-villages-list">
              {ALL_LOCATIONS_LIST.slice(0, 150).map((loc, i) => (
                <option key={i} value={`${isTe ? (loc.villageTe || loc.village) : loc.village}, ${isTe ? (loc.districtTe || loc.district) : loc.district}`} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Field 4: Type of Work (Exact 5 items from handwritten notes) */}
        <div className="form-group">
          <label htmlFor="workType">{t.workTypeLabel}</label>
          <select
            id="workType"
            required
            value={formData.workType}
            onChange={(e) => setFormData({ ...formData, workType: e.target.value })}
          >
            <option value="Ploughing">1) {t.ploughing}</option>
            <option value="Rotavator">2) {t.rotavator}</option>
            <option value="Cultivator">3) {t.cultivator}</option>
            <option value="Trailer Services">4) {t.trailerServices}</option>
            <option value="Corn Harvesting">5) {isTe ? 'మొక్కజొన్న కోత & నూర్పిడి (Corn Harvester)' : 'Corn & Maize Harvesting'}</option>
            <option value="Straw Baling">6) {isTe ? 'గడ్డి బెయిలర్ చుట్టడం (Round Straw Baler)' : 'Round Straw Baling'}</option>
            <option value="Corn Seeding">7) {isTe ? 'మొక్కజొన్న విత్తనాలు నాటడం (Hand Push Seeder)' : 'Corn & Seed Planter'}</option>
            <option value="Other Agricultural Work">8) {t.otherAgriculturalWork}</option>
          </select>
        </div>

        {/* Conditional Field if Other Agricultural Work selected */}
        {formData.workType === 'Other Agricultural Work' && (
          <div className="form-group">
            <label htmlFor="otherWorkDetails">{t.otherWorkSpecLabel}</label>
            <textarea
              id="otherWorkDetails"
              rows="2"
              placeholder={isTe ? "పని వివరాలు రాయండి (ఉదా: కేజ్ వీల్స్, డిస్క్ హారో, గట్లు వేయడం, నూర్పిడి...)" : "Describe work (e.g. Cage wheel puddling, disc harrowing, ridging, thresher...)"}
              value={formData.otherWorkDetails}
              onChange={(e) => setFormData({ ...formData, otherWorkDetails: e.target.value })}
              required
            />
          </div>
        )}

        {/* Field 5 & 6: Land Area & Select Date */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="landArea">{t.landAreaLabel}</label>
            <input
              id="landArea"
              type="number"
              step="0.5"
              min="0.5"
              max="100"
              required
              value={formData.landArea}
              onChange={(e) => setFormData({ ...formData, landArea: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bookingDate">{t.selectDateLabel}</label>
            <input
              id="bookingDate"
              type="date"
              required
              min={TODAY_DATE}
              value={formData.bookingDate}
              onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
            />
          </div>
        </div>

        {/* Tractor Selection if not locked */}
        <div className="form-group">
          <label htmlFor="assignedTractorId">{t.assignedTractorUnitLabel}</label>
          <select
            id="assignedTractorId"
            value={formData.assignedTractorId}
            onChange={(e) => setFormData({ ...formData, assignedTractorId: e.target.value })}
          >
            {tractors.map((t) => (
              <option key={t.id} value={t.id}>
                {t.brand} {t.model} ({t.owner} - ₹{t.pricing}/hr - {t.location})
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Cost Calculator Box */}
        <div className="cost-preview-box">
          <div>
            <p><strong>{t.estWorkDuration}</strong> ~{estimatedHours} {isTe ? 'గంటలు' : 'Hours'} ({formData.landArea} {isTe ? 'ఎకరాలకు' : 'Acres'})</p>
            <p style={{ marginTop: '2px' }}>{isTe ? `గంటకు ₹${hourlyRate} మరియు డ్రైవర్‌తో సహా` : `Calculated at ₹${hourlyRate}/Hr with professional operator`}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', display: 'block', color: '#795548', textTransform: 'uppercase' }}>{t.estTotalCost}</span>
            <strong>₹{estimatedCost.toLocaleString()}</strong>
          </div>
        </div>

        {/* Submit Actions */}
        <button type="submit" className="btn btn-primary w-100" style={{ padding: '14px', fontSize: '16px' }}>
          {t.btnSubmitBooking}
        </button>

        <button
          type="button"
          className="btn btn-whatsapp w-100"
          onClick={handleSendWhatsAppBooking}
          style={{ padding: '12px' }}
        >
          {t.btnInstantWhatsApp}
        </button>
      </form>
    </div>
  );
}
