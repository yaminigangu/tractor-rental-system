import { useState } from 'react';
import { translations } from '../translations';
import { saveRegisteredOwner, findOwnerByIdentifier } from '../data/userData';
import { apiSendOtp, apiVerifyOtp, setStoredAuthToken, apiSaveTractor, apiSaveOwner, apiUploadImage } from '../api/apiClient';
import CustomTractorModal from '../components/CustomTractorModal';

export default function OwnerRegistration({
  setTractors,
  setActivePage,
  onGoBack,
  language = 'en',
  setLanguage,
  currentOwner,
  setCurrentOwner,
  selectedLocation
}) {
  const t = translations[language] || translations.en;
  const isTe = language === 'te';

  const defaultVillage = selectedLocation
    ? (isTe ? (selectedLocation.villageTe || selectedLocation.village) : selectedLocation.village)
    : 'Hasanparthy';
  const defaultDistrict = selectedLocation?.district || 'Hanumakonda';

  // Check if owner previously registered on this device
  const [lastOwner, setLastOwner] = useState(() => {
    try {
      const saved = localStorage.getItem('agri_last_owner');
      if (saved) return JSON.parse(saved);
      const curr = localStorage.getItem('agri_current_owner');
      if (curr) return JSON.parse(curr);
    } catch {
      // ignore
    }
    return null;
  });

  // Active Tab: 'kyc' (4-Step KYC Authentication) or 'login' (Returning Owner Login)
  const [activeTab, setActiveTab] = useState('kyc');

  // Multi-step progress (1: Identity, 2: Vehicle RC, 3: Bank/UPI, 4: Machinery)
  const [currentStep, setCurrentStep] = useState(1);
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Returning owner login state (Message Central VerifyNow SMS OTP)
  const [returningQuery, setReturningQuery] = useState('');
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtp, setLoginOtp] = useState('');
  const [loginVerificationId, setLoginVerificationId] = useState('');
  const [loginMatchedOwner, setLoginMatchedOwner] = useState(null);
  const [isSendingLoginOtp, setIsSendingLoginOtp] = useState(false);
  const [isVerifyingLoginOtp, setIsVerifyingLoginOtp] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isCustomTractorModalOpen, setIsCustomTractorModalOpen] = useState(false);
  const [submittedCustomTractor, setSubmittedCustomTractor] = useState(null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const res = await apiUploadImage(file);
      if (res && res.success && res.path) {
        handleInputChange('selectedPhoto', res.path);
        handleInputChange('photoName', 'custom_uploaded');
      } else {
        alert(isTe ? 'ఫోటో అప్‌లోడ్ విఫలమైంది.' : 'Photo upload failed. Please try again.');
      }
    } catch (err) {
      console.warn('Upload error:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Form State (Exact match to Screenshots 1 - 4)
  const [formData, setFormData] = useState({
    // Step 1: Owner Mobile & Identity
    fullName: '',
    mobile: '',
    mobile: '9440156789',

    // Step 2: Tractor RC & Vehicle Specs
    rcNumber: 'TS 03 AB 4589',
    dlNumber: 'TS-03-2018-004521',
    engineHp: '48',
    regYear: '2023',

    // Step 3: Payout Details
    upiId: '9440156789@ybl',
    bankAccount: '50100456123489',
    ifscCode: 'HDFC0000123',

    // Step 4: Machinery Specs & Location
    brand: 'Swaraj',
    modelSpecs: '744 FE High Torque (48 HP)',
    district: defaultDistrict,
    mandalBase: defaultVillage,
    whereabouts: 'Hasanparthy Rythu Vedika & Market Yard',
    priceHour: 900,
    priceAcre: 1800,
    implements: ['Ploughing', 'Rotavator', 'Trailer Services'],
    selectedPhoto: '/tractor4.jpeg',
    photoName: 'Swaraj 744 FE XT'
  });

  const brandOptions = [
    'Mahindra',
    'Swaraj',
    'John Deere',
    'Sonalika',
    'Massey Ferguson',
    'Eicher',
    'New Holland',
    'Farmtrac',
    'Kubota'
  ];

  const implementOptions = [
    { id: 'Ploughing', label: isTe ? 'దుక్కి దున్నడం' : 'Ploughing' },
    { id: 'Rotavator', label: isTe ? 'రొటవేటర్' : 'Rotavator' },
    { id: 'Cultivator', label: isTe ? 'కల్టివేటర్' : 'Cultivator' },
    { id: 'Trailer Services', label: isTe ? 'ట్రాలీ రవాణా' : 'Trailer Services' },
    { id: 'Corn Harvester', label: isTe ? 'మొక్కజొన్న కోత' : 'Corn Harvester' },
    { id: 'Straw Baler', label: isTe ? 'గడ్డి బెయిలర్' : 'Straw Baler' },
    { id: 'Corn Seeder', label: isTe ? 'విత్తన యంత్రం' : 'Corn Seeder' },
    { id: 'Other Work', label: isTe ? 'ఇతర పనులు' : 'Other Work' }
  ];

  const photoOptions = [
    { id: 'Mahindra 575 DI', label: 'Mahindra 575 DI (Red)', src: '/images/mahindra_575.jpg' },
    { id: 'Mahindra 475 DI XP Plus', label: 'Mahindra 475 DI XP Plus (Red)', src: '/tractor1.jpeg' },
    { id: 'Swaraj 744 FE XT', label: 'Swaraj 744 FE XT (Blue)', src: '/tractor4.jpeg' },
    { id: 'John Deere 5310', label: 'John Deere 5310 (Green)', src: '/images/john_deere_5310.jpg' },
    { id: 'John Deere 5075E', label: 'John Deere 5075E 4WD (Green)', src: '/tractor3.jpeg' },
    { id: 'Massey Ferguson 241 DI', label: 'Massey Ferguson 241 DI (Red)', src: '/tractor5.jpeg' },
    { id: 'Eicher 380 Super DI', label: 'Eicher 380 Super DI (Silver)', src: '/eicher_380_clean.jpg' },
    { id: 'Sonalika DI 745', label: 'Sonalika DI 745 (Blue)', src: '/tractor6.jpeg' },
    { id: 'Sonalika Tiger DI 55', label: 'Sonalika Tiger 55 (Blue)', src: '/sonalika_tiger_55.jpg' },
    { id: 'Farmtrac 60 Powermaxx', label: 'Farmtrac 60 (Blue)', src: '/farmtrac_60.jpg' },
    { id: 'New Holland 3630', label: 'New Holland 3630 (Blue)', src: '/new_holland_3630.jpg' },
    { id: 'Kubota MU4501', label: 'Kubota MU4501 4WD (Orange)', src: '/tractor7.jpeg' }
  ];

  const handleInputChange = (field, val) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: val };
      // Auto-sync photo when brand changes if not manually set to a specific model
      if (field === 'brand') {
        const brandMatch = {
          'Mahindra': { src: '/images/mahindra_575.jpg', name: 'Mahindra 575 DI' },
          'Swaraj': { src: '/tractor4.jpeg', name: 'Swaraj 744 FE XT' },
          'John Deere': { src: '/images/john_deere_5310.jpg', name: 'John Deere 5310' },
          'Massey Ferguson': { src: '/tractor5.jpeg', name: 'Massey Ferguson 241 DI' },
          'Eicher': { src: '/eicher_380_clean.jpg', name: 'Eicher 380 Super DI' },
          'Sonalika': { src: '/tractor6.jpeg', name: 'Sonalika DI 745' },
          'Farmtrac': { src: '/farmtrac_60.jpg', name: 'Farmtrac 60 Powermaxx' },
          'New Holland': { src: '/new_holland_3630.jpg', name: 'New Holland 3630' },
          'Kubota': { src: '/tractor7.jpeg', name: 'Kubota MU4501' }
        }[val];
        if (brandMatch) {
          updated.selectedPhoto = brandMatch.src;
          updated.photoName = brandMatch.name;
        }
      }
      return updated;
    });
    setErrorMsg('');
  };

  const handleImplementToggle = (itemId) => {
    setFormData(prev => {
      const exists = prev.implements.includes(itemId);
      const updated = exists
        ? prev.implements.filter(i => i !== itemId)
        : [...prev.implements, itemId];
      return { ...prev, implements: updated };
    });
  };

  const toggleLanguage = () => {
    if (setLanguage) {
      setLanguage(prev => (prev === 'en' ? 'te' : 'en'));
    }
  };

  // Demo auto-fill helper
  const handleFillDemo = () => {
    setFormData({
      fullName: 'G. Srinivas Rao',
      mobile: '9440156789',
      rcNumber: 'TS 03 AB 4589',
      dlNumber: 'TS-03-2018-004521',
      engineHp: '48',
      regYear: '2023',
      upiId: '9440156789@ybl',
      bankAccount: '50100456123489',
      ifscCode: 'HDFC0000123',
      brand: 'Swaraj',
      modelSpecs: '744 FE High Torque (48 HP)',
      district: defaultDistrict,
      mandalBase: defaultVillage,
      whereabouts: 'Hasanparthy Rythu Vedika & Market Yard',
      priceHour: 900,
      priceAcre: 1800,
      implements: ['Ploughing', 'Rotavator', 'Trailer Services'],
      selectedPhoto: '/tractor4.jpeg',
      photoName: 'Swaraj 744 FE XT'
    });
    setOtpSent(false);
    setEnteredOtp('');
    setVerificationId('');
    setErrorMsg('');
  };

  // Step 1: Send Registration OTP via Message Central
  const handleSendRegistrationOtp = async () => {
    setErrorMsg('');
    setSuccessNotice('');

    if (!formData.fullName.trim()) {
      setErrorMsg(isTe ? 'దయచేసి యజమాని పూర్తి పేరు నమోదు చేయండి.' : 'Please enter Owner Full Name.');
      return;
    }
    const cleanPhone = formData.mobile.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg(isTe ? 'దయచేసి 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.' : 'Please enter 10-digit mobile number.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await apiSendOtp({ mobileNumber: cleanPhone });
      if (!res.verificationId) {
        throw new Error(res.error || res.message || 'Failed to dispatch verification OTP.');
      }
      setVerificationId(res.verificationId);
      setOtpSent(true);
      if (res.demoOtp) {
        setEnteredOtp(res.demoOtp);
      } else {
        setEnteredOtp('');
      }
      setSuccessNotice(
        isTe
          ? `✓ +91 ${cleanPhone} కి మెసేజ్ సెంట్రల్ SMS ద్వారా ధృవీకరణ OTP పంపబడింది!`
          : `✓ Verification OTP sent to +91 ${cleanPhone} via Message Central VerifyNow!`
      );
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send SMS OTP. Please retry.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 1: Verify Registration OTP and advance to Step 2
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!formData.fullName.trim()) {
      setErrorMsg(isTe ? 'దయచేసి యజమాని పూర్తి పేరు నమోదు చేయండి.' : 'Please enter Owner Full Name.');
      return;
    }
    const cleanPhone = formData.mobile.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg(isTe ? 'దయచేసి 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.' : 'Please enter 10-digit mobile number.');
      return;
    }

    if (!otpSent || !verificationId) {
      setErrorMsg(isTe ? 'దయచేసి ముందుగా SMS OTP పంపండి.' : 'Please send verification OTP first.');
      return;
    }

    if (enteredOtp.trim().length < 4) {
      setErrorMsg(isTe ? 'దయచేసి 6-అంకెల OTP నమోదు చేయండి.' : 'Please enter the 6-digit OTP code.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await apiVerifyOtp({
        verificationId,
        code: enteredOtp.trim(),
        countryCode: '91',
        mobileNumber: cleanPhone,
        role: 'owner'
      });

      if (!res.success || !res.verified) {
        setErrorMsg(res.error || (isTe ? 'తప్పుడు OTP కోడ్. దయచేసి మళ్లీ ప్రయత్నించండి.' : 'Invalid OTP code. Please retry.'));
        setIsVerifyingOtp(false);
        return;
      }

      setSuccessNotice(isTe ? '✓ మొబైల్ నంబర్ విజయవంతంగా ధృవీకరించబడింది!' : '✓ Mobile number verified successfully!');
      setTimeout(() => setSuccessNotice(''), 3000);
      setCurrentStep(2);
    } catch (err) {
      setErrorMsg(err.message || 'OTP Verification failed');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Returning owner: Send Login OTP via Message Central
  const handleSendLoginOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessNotice('');

    const cleanInput = returningQuery.trim();
    if (!cleanInput) {
      setErrorMsg(isTe ? 'దయచేసి మీ నమోదిత మొబైల్ లేదా RC నంబర్ నమోదు చేయండి.' : 'Please enter registered mobile or RC number.');
      return;
    }

    const matched = findOwnerByIdentifier(cleanInput);
    let phone = (matched && matched.mobile) ? matched.mobile.replace(/\D/g, '') : cleanInput.replace(/\D/g, '');

    if (!matched && phone.length < 10) {
      setErrorMsg(
        isTe
          ? 'నమోదైన యజమాని కనుగొనబడలేదు. దయచేసి సరైన 10 అంకెల మొబైల్ లేదా RC నమోదు చేయండి.'
          : 'Vehicle Owner not found. Please enter a valid 10-digit mobile number or registered RC.'
      );
      return;
    }

    if (phone.length < 10) {
      setErrorMsg(isTe ? 'నమోదిత మొబైల్ సంఖ్య చెల్లదు.' : 'Invalid registered mobile number.');
      return;
    }

    setLoginMatchedOwner(matched || {
      fullName: 'Vehicle Owner',
      mobile: phone,
      rcNumber: cleanInput
    });

    setIsSendingLoginOtp(true);
    try {
      const res = await apiSendOtp({ mobileNumber: phone });
      if (!res.verificationId) {
        throw new Error(res.error || res.message || 'Failed to dispatch login OTP.');
      }
      setLoginVerificationId(res.verificationId);
      setLoginOtpSent(true);
      if (res.demoOtp) {
        setLoginOtp(res.demoOtp);
      } else {
        setLoginOtp('');
      }
      setSuccessNotice(
        isTe
          ? `✓ +91 ${phone} కి మెసేజ్ సెంట్రల్ SMS ద్వారా లాగిన్ OTP పంపబడింది!`
          : `✓ Login OTP sent to +91 ${phone} via Message Central VerifyNow!`
      );
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send login OTP via Message Central.');
    } finally {
      setIsSendingLoginOtp(false);
    }
  };

  // Returning owner: Verify OTP and log in to Owner Inbox
  const handleVerifyLoginOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (loginOtp.trim().length < 4) {
      setErrorMsg(isTe ? 'దయచేసి సరైన OTP కోడ్ నమోదు చేయండి.' : 'Please enter 6-digit OTP code.');
      return;
    }

    if (!loginVerificationId) {
      setErrorMsg('Verification session expired. Please re-send OTP.');
      setLoginOtpSent(false);
      return;
    }

    setIsVerifyingLoginOtp(true);
    try {
      const phone = (loginMatchedOwner?.mobile || returningQuery).replace(/\D/g, '');
      const res = await apiVerifyOtp({
        verificationId: loginVerificationId,
        code: loginOtp.trim(),
        countryCode: '91',
        mobileNumber: phone,
        role: 'owner'
      });

      if (!res.success || !res.verified) {
        setErrorMsg(
          res.error ||
          (isTe ? 'తప్పుడు OTP కోడ్. దయచేసి మళ్లీ ప్రయత్నించండి.' : 'Invalid OTP code. Please retry.')
        );
        setIsVerifyingLoginOtp(false);
        return;
      }

      if (res.token) {
        setStoredAuthToken(res.token);
      }

      const ownerToSave = res.owner || loginMatchedOwner || {
        fullName: 'Vehicle Owner',
        mobile: phone,
        rcNumber: returningQuery
      };

      saveRegisteredOwner(ownerToSave);

      if (setCurrentOwner) {
        setCurrentOwner(ownerToSave);
      }
      try {
        localStorage.setItem('agri_last_owner', JSON.stringify(ownerToSave));
        localStorage.setItem('agri_current_owner', JSON.stringify(ownerToSave));
      } catch (err) {
        console.warn(err);
      }

      setActivePage('owner-inbox');
    } catch (err) {
      setErrorMsg(err.message || 'OTP verification failed');
    } finally {
      setIsVerifyingLoginOtp(false);
    }
  };

    // Step 2: Next to Payout Details
    const handleNextPayout = (e) => {
      if (e) e.preventDefault();
      setErrorMsg('');

      if (!formData.rcNumber.trim()) {
        setErrorMsg(isTe ? 'దయచేసి వాహన RC నంబర్ నమోదు చేయండి.' : 'Please enter Tractor RC Registration Number.');
        return;
      }
      setCurrentStep(3);
    };

    // Step 3: Next to Machinery Details
    const handleNextMachinery = (e) => {
      if (e) e.preventDefault();
      setErrorMsg('');

      if (!formData.upiId.trim() && !formData.bankAccount.trim()) {
        setErrorMsg(isTe ? 'దయచేసి UPI ID లేదా బ్యాంక్ ఖాతా నంబర్ నమోదు చేయండి.' : 'Please enter UPI ID or Bank Account.');
        return;
      }
      setCurrentStep(4);
    };

    // Step 4: Final Submit & Enter Marketplace / Inbox
    const handleCompleteKyc = (e) => {
      if (e) e.preventDefault();
      setErrorMsg('');

      // Prevent duplicated brand name in model
      let cleanModel = (formData.modelSpecs || '').trim();
      if (cleanModel.toLowerCase().startsWith(formData.brand.toLowerCase())) {
        cleanModel = cleanModel.slice(formData.brand.length).trim();
      }
      const fullTractorTitle = cleanModel
        ? `${formData.brand} ${cleanModel}`
        : formData.brand;

      // Pick accurate photo matching the model and brand (preserve actual uploaded photo for custom tractor models)
      let resolvedPhoto = formData.selectedPhoto;
      const isCustomPhoto = resolvedPhoto && (resolvedPhoto.startsWith('/uploads') || resolvedPhoto.startsWith('http') || formData.isOtherCustom);
      
      if (!isCustomPhoto) {
        const lowerModel = (formData.modelSpecs || '').toLowerCase();
        const lowerBrand = (formData.brand || '').toLowerCase();
        if (lowerModel.includes('575') || (lowerBrand.includes('mahindra') && lowerModel.includes('sarpanch'))) {
          resolvedPhoto = '/images/mahindra_575.jpg';
        } else if (lowerModel.includes('475')) {
          resolvedPhoto = '/tractor1.jpeg';
        } else if (lowerModel.includes('744') || (lowerBrand.includes('swaraj') && lowerModel.includes('xt'))) {
          resolvedPhoto = '/tractor4.jpeg';
        } else if (lowerModel.includes('735')) {
          resolvedPhoto = '/tractor8.jpg';
        } else if (lowerModel.includes('5310')) {
          resolvedPhoto = '/images/john_deere_5310.jpg';
        } else if (lowerModel.includes('5075')) {
          resolvedPhoto = '/tractor3.jpeg';
        } else if (lowerModel.includes('380') || lowerBrand.includes('eicher')) {
          resolvedPhoto = '/eicher_380_clean.jpg';
        } else if (lowerModel.includes('farmtrac') || lowerModel.includes('60')) {
          resolvedPhoto = '/farmtrac_60.jpg';
        } else if (lowerModel.includes('3630') || lowerBrand.includes('new holland')) {
          resolvedPhoto = '/new_holland_3630.jpg';
        } else if (lowerModel.includes('tiger')) {
          resolvedPhoto = '/sonalika_tiger_55.jpg';
        } else if (lowerBrand.includes('kubota')) {
          resolvedPhoto = '/tractor7.jpeg';
        } else if (!resolvedPhoto || resolvedPhoto === '/tractor2.jpeg') {
          resolvedPhoto = '/images/mahindra_575.jpg';
        }
      }

      const newOwnerRecord = {
        fullName: formData.fullName.trim(),
        owner: formData.fullName.trim(),
        mobile: formData.mobile,
        brand: formData.brand,
        tractorModel: fullTractorTitle,
        vehicleNumber: formData.rcNumber.toUpperCase(),
        pricing: Number(formData.priceHour) || 900,
        priceAcre: Number(formData.priceAcre) || 1800,
        village: formData.mandalBase,
        district: formData.district,
        whereabouts: formData.whereabouts,
        engineHp: formData.engineHp,
        regYear: formData.regYear,
        dlNumber: formData.dlNumber,
        rcNumber: formData.rcNumber.toUpperCase(),
        bankAccount: formData.bankAccount,
        ifscCode: formData.ifscCode,
        upiId: formData.upiId,
        photo: resolvedPhoto,
        isVerified: true,
        registeredAt: new Date().toISOString().split('T')[0]
      };

      saveRegisteredOwner(newOwnerRecord);

      const newTractorEntry = {
        id: submittedCustomTractor ? submittedCustomTractor.id : Date.now(),
        owner: formData.fullName.trim(),
        mobile: formData.mobile,
        location: formData.mandalBase,
        district: formData.district,
        brand: formData.brand,
        model: cleanModel || formData.modelSpecs,
        equipment: formData.implements.join(', '),
        pricing: Number(formData.priceHour) || 900,
        priceAcre: Number(formData.priceAcre) || 1800,
        engineHp: formData.engineHp,
        availability: 'Available',
        photo: resolvedPhoto,
        rating: 4.9,
        jobsDone: 0,
        registeredAt: new Date().toLocaleDateString(),
        vehicleNumber: formData.rcNumber.toUpperCase(),
        verificationStatus: formData.isOtherCustom ? 'Pending Verification' : 'Approved',
        verification_status: formData.isOtherCustom ? 'Pending Verification' : 'Approved',
        isCaptainVerified: !formData.isOtherCustom,
        distanceKm: 1.0,
        dispatchMins: 13
      };

      if (setTractors) {
        setTractors(prev => [newTractorEntry, ...(Array.isArray(prev) ? prev : [])]);
      }

      // Persist newly registered tractor and owner directly into PostgreSQL database
      apiSaveTractor(newTractorEntry).catch((err) => {
        console.warn('Failed to save new tractor to PostgreSQL:', err);
      });
      apiSaveOwner(newOwnerRecord).catch((err) => {
        console.warn('Failed to save new owner to PostgreSQL:', err);
      });

      if (setCurrentOwner) {
        setCurrentOwner(newOwnerRecord);
        try {
          localStorage.setItem('agri_last_owner', JSON.stringify(newOwnerRecord));
          localStorage.setItem('agri_current_owner', JSON.stringify(newOwnerRecord));
        } catch (err) {
          console.warn(err);
        }
      }

      // Direct into Marketplace Fleet (Screenshot 5)
      setActivePage('find-tractor');
    };

    // Instant 1-Tap Login for recognized returning owner
    const handleOneTapOwnerLogin = (targetOwner) => {
      const ownerToLogin = targetOwner || lastOwner;
      if (!ownerToLogin) return;

      if (setCurrentOwner) {
        setCurrentOwner(ownerToLogin);
      }
      try {
        localStorage.setItem('agri_last_owner', JSON.stringify(ownerToLogin));
        localStorage.setItem('agri_current_owner', JSON.stringify(ownerToLogin));
      } catch (err) {
        console.warn(err);
      }
      setActivePage('owner-inbox');
    };

    return (
      <div className="signin-page-viewport page-anim">
        {/* Background Animated Floating Elements */}
        <div className="auth-bg-particles" aria-hidden="true">
          <span className="bg-particle p1">🌾</span>
          <span className="bg-particle p2">✨</span>
          <span className="bg-particle p3">🌱</span>
          <span className="bg-particle p4">🚜</span>
          <span className="bg-particle p5">✨</span>
          <span className="bg-particle p6">🌾</span>
        </div>

        <div className="signin-center-wrapper">
          {/* Top Header Bar matching Screenshots 1 - 4 */}
          <header className="signin-top-nav">
            <div className="signin-nav-left">
              <button
                type="button"
                className="signin-header-back-sq"
                onClick={onGoBack || (() => setActivePage('portal-select'))}
                title="Back to selection"
                aria-label="Back"
              >
                ←
              </button>
              <div className="signin-brand-group">
                <h1 className="signin-brand-title">Agrirent</h1>
                <span className="signin-brand-subtitle">
                  {isTe ? 'వ్యవసాయ యంత్రాల అద్దె వేదిక' : 'Farm Machinery Rental Platform'}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="signin-lang-pill"
              onClick={toggleLanguage}
              title={isTe ? 'Switch to English' : 'తెలుగులోకి మార్చండి'}
            >
              🌐 {isTe ? 'తెలుగు ▾' : 'English ▾'}
            </button>
          </header>

          {/* Main Container Card matching Screenshots */}
          <main className="signin-card-container">
            {/* OTP Notification Banner (Step 1) */}
            {activeTab === 'kyc' && currentStep === 1 && otpSent && (
              <div className="signin-otp-banner page-anim">
                ✓ 📲 {isTe ? `ధృవీకరణ OTP +91 ${formData.mobile} కి పంపబడింది!` : `Verification OTP sent to +91 ${formData.mobile} via Message Central!`}
              </div>
            )}

            <div className="signin-main-card">
              {/* Top Row: Back to Selection */}
              <div className="signin-card-top-row">
                <button
                  type="button"
                  className="signin-back-pill-btn"
                  onClick={onGoBack || (() => setActivePage('portal-select'))}
                >
                  ← {isTe ? 'ఎంపికకి వెనుకకు' : 'Back to Selection'}
                </button>
              </div>

              {/* RETURNING OWNER 1-TAP LOGIN CARD (If recognized member on device) */}
              {lastOwner && (
                <div className="signin-returning-farmer-card page-anim" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)', borderColor: '#93c5fd' }}>
                  <div className="returning-farmer-header">
                    <div className="returning-avatar-circle" style={{ background: '#dbeafe', borderColor: '#bfdbfe' }}>🚜</div>
                    <div className="returning-text-col">
                      <span className="returning-tag" style={{ color: '#1d4ed8' }}>
                        ✓ {isTe ? 'నమోదిత వాహన యజమాని' : 'Recognized Vehicle Owner'}
                      </span>
                      <strong className="returning-name">{lastOwner.fullName || lastOwner.owner}</strong>
                      <span className="returning-meta">
                        {lastOwner.tractorModel || 'Tractor'} • {lastOwner.vehicleNumber || lastOwner.rcNumber} • +91 {lastOwner.mobile}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="signin-returning-tap-btn"
                    style={{ background: '#1d4ed8' }}
                    onClick={() => {
                      setActiveTab('login');
                      setReturningQuery(lastOwner.mobile || lastOwner.rcNumber);
                      setLoginOtpSent(false);
                      setLoginVerificationId('');
                      setLoginOtp('');
                    }}
                  >
                    <span>⚡ {isTe ? `SMS OTP తో లాగిన్ అవ్వండి (${(lastOwner.fullName || 'Owner').split(' ')[0]}) →` : `Login via Message Central SMS (${(lastOwner.fullName || 'Owner').split(' ')[0]}) →`}</span>
                  </button>
                </div>
              )}

              {/* Segmented Switcher Pill Bar (4-Step KYC Registration vs Returning Owner Login) */}
              <div className="portal-tabs-pill" role="tablist" style={{ marginBottom: '16px' }}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'kyc'}
                  className={`portal-tab-btn ${activeTab === 'kyc' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('kyc');
                    setErrorMsg('');
                  }}
                  title={isTe ? '4-దశల KYC ధృవీకరణ' : '4-Step KYC Registration'}
                >
                  <span className="portal-tab-icon">⚡</span>
                  <span className="portal-tab-text">{isTe ? '4-దశల KYC ధృవీకరణ' : '4-Step KYC Registration'}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'login'}
                  className={`portal-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMsg('');
                  }}
                  title={isTe ? 'వాహన యజమాని లాగిన్' : 'Returning Owner Login'}
                >
                  <span className="portal-tab-icon">🔑</span>
                  <span className="portal-tab-text">{isTe ? 'వాహన యజమాని లాగిన్' : 'Returning Owner Login'}</span>
                </button>
              </div>

              {errorMsg && <div className="signin-error-box">⚠️ {errorMsg}</div>}

              {/* ========================================================
              TAB 1: 4-STEP KYC FLOW
              ======================================================== */}
              {activeTab === 'kyc' && (
                <div className="page-anim">
                  {/* Stepper 4-Circles (Identity, Vehicle RC, Bank/UPI, Machinery) */}
                  <div className="owner-stepper-track">
                    {[
                      { step: 1, label: isTe ? 'గుర్తింపు' : 'Identity' },
                      { step: 2, label: isTe ? 'వాహన RC' : 'Vehicle RC' },
                      { step: 3, label: isTe ? 'బ్యాంక్/UPI' : 'Bank/UPI' },
                      { step: 4, label: isTe ? 'యంత్రాలు' : 'Machinery' }
                    ].map((s) => {
                      const isPassed = currentStep > s.step;
                      const isCurrent = currentStep === s.step;
                      return (
                        <div
                          key={s.step}
                          className="owner-step-item"
                          onClick={() => s.step < currentStep && setCurrentStep(s.step)}
                        >
                          <div className={`owner-circle-node ${isPassed ? 'passed' : ''} ${isCurrent ? 'current' : ''}`}>
                            {isPassed ? '✓' : s.step}
                          </div>
                          <span className={`owner-step-caption ${isCurrent ? 'current' : ''} ${isPassed ? 'passed' : ''}`}>
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* ----------------------------------------------------
                  STEP 1 OF 4: Owner Mobile & Identity (Screenshot 1)
                  ---------------------------------------------------- */}
                  {currentStep === 1 && (
                    <form onSubmit={otpSent ? handleVerifyOtp : (e) => { e.preventDefault(); handleSendRegistrationOtp(); }} className="page-anim">
                      <div className="owner-step-header">
                        <span className="owner-step-mini-tag">
                          {isTe ? 'దశ 1 / 4' : 'STEP 1 OF 4'}
                        </span>
                        <h3 className="owner-step-main-title">
                          {isTe ? 'యజమాని మొబైల్ & గుర్తింపు' : 'Owner Mobile & Identity'}
                        </h3>
                      </div>

                      <div className="signin-field-group">
                        <label className="signin-field-label">
                          {isTe ? 'యజమాని పూర్తి పేరు (RC ప్రకారం) *' : 'Owner Full Name (as on RC) *'}
                        </label>
                        <div className="signin-field-input-box">
                          <span className="signin-input-icon icon-person">👤</span>
                          <input
                            type="text"
                            className="signin-input-text font-bold"
                            value={formData.fullName}
                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                            placeholder="e.g. G. Srinivas Rao"
                            autoFocus
                            disabled={otpSent}
                          />
                        </div>
                      </div>

                      <div className="signin-field-group">
                        <label className="signin-field-label">
                          {isTe ? '10-అంకెల మొబైల్ నంబర్ *' : '10-Digit Mobile Number *'}
                        </label>
                        <div className="signin-field-input-box">
                          <span className="signin-flag-badge">🇮🇳 +91</span>
                          <input
                            type="tel"
                            maxLength={10}
                            className="signin-input-text font-bold"
                            value={formData.mobile}
                            onChange={(e) => handleInputChange('mobile', e.target.value.replace(/\D/g, ''))}
                            placeholder="9440156789"
                            disabled={otpSent}
                          />
                        </div>
                      </div>

                      {!otpSent ? (
                        <button
                          type="button"
                          className="owner-btn-primary-blue"
                          style={{ marginTop: '10px' }}
                          disabled={isSendingOtp}
                          onClick={handleSendRegistrationOtp}
                        >
                          <span>
                            {isSendingOtp
                              ? (isTe ? 'SMS OTP పంపుతోంది...' : 'Sending SMS OTP via Message Central...')
                              : (isTe ? '📲 మెసేజ్ సెంట్రల్ SMS ద్వారా ధృవీకరణ OTP పంపండి →' : '📲 Send Verification OTP via Message Central →')}
                          </span>
                        </button>
                      ) : (
                        <div className="signin-field-group signin-otp-block page-anim">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="signin-field-label" style={{ fontWeight: 800, margin: 0 }}>
                              {isTe ? '6-అంకెల OTP కోడ్ నమోదు చేయండి' : 'Enter 6-Digit SMS OTP'}
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                className="signin-change-phone-btn"
                                onClick={handleSendRegistrationOtp}
                                disabled={isSendingOtp}
                              >
                                🔄 {isSendingOtp ? '...' : (isTe ? 'మళ్లీ పంపు' : 'Resend OTP')}
                              </button>
                              <button
                                type="button"
                                className="signin-change-phone-btn"
                                onClick={() => {
                                  setOtpSent(false);
                                  setVerificationId('');
                                  setEnteredOtp('');
                                }}
                              >
                                ✏️ {isTe ? 'నంబర్ మార్చు' : 'Change Phone'}
                              </button>
                            </div>
                          </div>
                          <input
                            type="text"
                            maxLength={8}
                            className="signin-otp-input"
                            value={enteredOtp}
                            onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="••••••"
                            autoFocus
                          />
                          {enteredOtp && (
                            <span className="signin-demo-otp-hint">
                              {isTe ? `సిమ్యులేటర్ ప్రివ్యూ కోడ్: ${enteredOtp}` : `Simulator test code: ${enteredOtp}`}
                            </span>
                          )}

                          <button
                            type="submit"
                            className="owner-btn-primary-blue"
                            style={{ marginTop: '14px' }}
                            disabled={isVerifyingOtp}
                          >
                            <span>
                              {isVerifyingOtp
                                ? (isTe ? 'OTP ధృవీకరిస్తోంది...' : 'Verifying with Message Central...')
                                : (isTe ? '🔐 OTP ధృవీకరించి కొనసాగించండి →' : '🔐 Verify OTP & Continue to Vehicle Specs →')}
                            </span>
                          </button>
                        </div>
                      )}
                    </form>
                  )}

                  {/* ----------------------------------------------------
                  STEP 2 OF 4: Tractor RC & Vehicle Specs (Screenshot 2)
                  ---------------------------------------------------- */}
                  {currentStep === 2 && (
                    <form onSubmit={handleNextPayout} className="page-anim">
                      <div className="owner-step-header">
                        <span className="owner-step-mini-tag">
                          {isTe ? 'దశ 2 / 4' : 'STEP 2 OF 4'}
                        </span>
                        <h3 className="owner-step-main-title">
                          {isTe ? 'ట్రాక్టర్ RC & వాహన వివరాలు' : 'Tractor RC & Vehicle Specs'}
                        </h3>
                      </div>

                      <div className="signin-field-group">
                        <label className="signin-field-label">
                          {isTe ? 'ట్రాక్టర్ RC రిజిస్ట్రేషన్ నంబర్ (తెలంగాణ RTO) *' : 'Tractor RC Registration Number (Telangana RTO) *'}
                        </label>
                        <div className="signin-field-input-box">
                          <span className="owner-bullet">•</span>
                          <input
                            type="text"
                            className="signin-input-text font-bold uppercase"
                            value={formData.rcNumber}
                            onChange={(e) => handleInputChange('rcNumber', e.target.value.toUpperCase())}
                            placeholder="TS 03 AB 4589"
                            autoFocus
                          />
                        </div>
                        <div className="owner-verified-note">
                          🔒 {isTe ? 'తెలంగాణ రవాణా RTO రికార్డుల ప్రకారం ధృవీకరించబడింది.' : 'Verified against Telangana Transport RTO records.'}
                        </div>
                      </div>

                      <div className="signin-field-group">
                        <label className="signin-field-label">
                          {isTe ? 'డ్రైవింగ్ లైసెన్స్ / ఆధార్ (ఐచ్ఛికం)' : 'Driving License / Aadhaar (Optional)'}
                        </label>
                        <div className="signin-field-input-box">
                          <span className="owner-bullet">•</span>
                          <input
                            type="text"
                            className="signin-input-text font-bold uppercase"
                            value={formData.dlNumber}
                            onChange={(e) => handleInputChange('dlNumber', e.target.value.toUpperCase())}
                            placeholder="TS-03-2018-004521"
                          />
                        </div>
                      </div>

                      <div className="owner-two-col-grid">
                        <div className="signin-field-group">
                          <label className="signin-field-label">
                            {isTe ? 'ఇంజిన్ HP *' : 'Engine HP *'}
                          </label>
                          <div className="signin-field-input-box">
                            <input
                              type="number"
                              className="signin-input-text font-bold text-center"
                              value={formData.engineHp}
                              onChange={(e) => handleInputChange('engineHp', e.target.value)}
                              placeholder="48"
                            />
                          </div>
                        </div>

                        <div className="signin-field-group">
                          <label className="signin-field-label">
                            {isTe ? 'రిజిస్ట్రేషన్ సంవత్సరం *' : 'Reg. Year *'}
                          </label>
                          <div className="signin-field-input-box">
                            <input
                              type="number"
                              className="signin-input-text font-bold text-center"
                              value={formData.regYear}
                              onChange={(e) => handleInputChange('regYear', e.target.value)}
                              placeholder="2023"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="owner-actions-flex">
                        <button
                          type="button"
                          className="owner-btn-back-white"
                          onClick={() => setCurrentStep(1)}
                        >
                          ← {isTe ? 'వెనుకకు' : 'Back'}
                        </button>
                        <button type="submit" className="owner-btn-primary-blue flex-2">
                          <span>{isTe ? 'తరువాత: చెల్లింపు వివరాలు →' : 'Next: Payout Details →'}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* ----------------------------------------------------
                  STEP 3 OF 4: Farmer Rental Payout Account (Screenshot 3 & 4)
                  ---------------------------------------------------- */}
                  {currentStep === 3 && (
                    <form onSubmit={handleNextMachinery} className="page-anim">
                      <div className="owner-step-header">
                        <span className="owner-step-mini-tag">
                          {isTe ? 'దశ 3 / 4' : 'STEP 3 OF 4'}
                        </span>
                        <h3 className="owner-step-main-title">
                          {isTe ? 'రైతు అద్దె చెల్లింపు ఖాతా' : 'Farmer Rental Payout Account'}
                        </h3>
                      </div>

                      {/* Shield Notification Note */}
                      <div className="owner-payout-shield-card">
                        <span className="owner-shield-icon">🛡️</span>
                        <span>
                          {isTe
                            ? 'పని పూర్తయిన వెంటనే అద్దె ఆదాయం నేరుగా ఈ ఖాతాకు జమ చేయబడుతుంది.'
                            : 'Rental earnings are credited directly to this account upon job completion.'}
                        </span>
                      </div>

                      {/* UPI ID Field */}
                      <div className="signin-field-group">
                        <label className="signin-field-label">
                          {isTe ? 'తక్షణ డైరెక్ట్ క్రెడిట్ కోసం UPI ID *' : 'UPI ID for Instant Direct Credit *'}
                        </label>
                        <div className="signin-field-input-box">
                          <span className="owner-upi-prefix">UPI:</span>
                          <input
                            type="text"
                            className="signin-input-text font-bold"
                            value={formData.upiId}
                            onChange={(e) => handleInputChange('upiId', e.target.value)}
                            placeholder="9440156789@ybl"
                            autoFocus
                          />
                        </div>
                      </div>

                      <div className="owner-or-divider">
                        <span>— {isTe ? 'లేదా బ్యాంక్ ఖాతా' : 'OR BANK ACCOUNT'} —</span>
                      </div>

                      {/* Bank Account */}
                      <div className="signin-field-group">
                        <label className="signin-field-label">
                          {isTe ? 'బ్యాంక్ ఖాతా నంబర్' : 'Bank Account Number'}
                        </label>
                        <div className="signin-field-input-box">
                          <span className="owner-bullet">•</span>
                          <input
                            type="text"
                            className="signin-input-text font-bold"
                            value={formData.bankAccount}
                            onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                            placeholder="50100456123489"
                          />
                        </div>
                      </div>

                      {/* IFSC Code */}
                      <div className="signin-field-group">
                        <label className="signin-field-label">
                          {isTe ? 'IFSC కోడ్' : 'IFSC Code'}
                        </label>
                        <div className="signin-field-input-box">
                          <input
                            type="text"
                            className="signin-input-text font-bold uppercase"
                            value={formData.ifscCode}
                            onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
                            placeholder="HDFC0000123"
                          />
                        </div>
                      </div>

                      <div className="owner-actions-flex">
                        <button
                          type="button"
                          className="owner-btn-back-white"
                          onClick={() => setCurrentStep(2)}
                        >
                          ← {isTe ? 'వెనుకకు' : 'Back'}
                        </button>
                        <button type="submit" className="owner-btn-primary-blue flex-2">
                          <span>{isTe ? 'తరువాత: యంత్రాల వివరాలు →' : 'Next: Machinery Details →'}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* ----------------------------------------------------
                  STEP 4 OF 4: Machinery Specs & Location (Screenshot 5 & 6)
                  ---------------------------------------------------- */}
                  {currentStep === 4 && (
                    <form onSubmit={handleCompleteKyc} className="page-anim">
                      <div className="owner-step-header">
                        <span className="owner-step-mini-tag">
                          {isTe ? 'దశ 4 / 4' : 'STEP 4 OF 4'}
                        </span>
                        <h3 className="owner-step-main-title">
                          {isTe ? 'యంత్రాల వివరాలు & లొకేషన్' : 'Machinery Specs & Location'}
                        </h3>
                      </div>

                      {/* Tractor Brand Chips */}
                      <div className="signin-field-group">
                        <label className="signin-field-label">
                          {isTe ? 'ట్రాక్టర్ బ్రాండ్ *' : 'Tractor Brand *'}
                        </label>
                        <div className="owner-brand-chips-row">
                          {brandOptions.map((brand) => (
                            <button
                              key={brand}
                              type="button"
                              className={`owner-chip-btn ${formData.brand === brand ? 'active' : ''}`}
                              onClick={() => handleInputChange('brand', brand)}
                            >
                              {brand}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Model & Specs */}
                      <div className="signin-field-group">
                        <label className="signin-field-label">
                          {isTe ? 'మోడల్ & స్పెసిఫికేషన్లు *' : 'Model & Specs *'}
                        </label>
                        <div className="signin-field-input-box">
                          <input
                            type="text"
                            className="signin-input-text font-bold"
                            value={formData.modelSpecs}
                            onChange={(e) => handleInputChange('modelSpecs', e.target.value)}
                            placeholder="744 FE High Torque (48 HP)"
                          />
                        </div>
                      </div>

                      {/* District & Mandal */}
                      <div className="owner-two-col-grid">
                        <div className="signin-field-group">
                          <label className="signin-field-label">
                            {isTe ? 'జిల్లా *' : 'District *'}
                          </label>
                          <div className="signin-field-input-box">
                            <input
                              type="text"
                              className="signin-input-text font-bold"
                              value={formData.district}
                              onChange={(e) => handleInputChange('district', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="signin-field-group">
                          <label className="signin-field-label">
                            {isTe ? 'మండలం / బేస్ *' : 'Mandal / Base *'}
                          </label>
                          <div className="signin-field-input-box">
                            <input
                              type="text"
                              className="signin-input-text font-bold"
                              value={formData.mandalBase}
                              onChange={(e) => handleInputChange('mandalBase', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Stationed Whereabouts */}
                      <div className="signin-field-group">
                        <label className="signin-field-label">
                          {isTe ? 'నిలిపి ఉంచే స్థలం (Whereabouts) *' : 'Stationed Whereabouts *'}
                        </label>
                        <div className="signin-field-input-box">
                          <span className="owner-bullet">•</span>
                          <input
                            type="text"
                            className="signin-input-text font-bold"
                            value={formData.whereabouts}
                            onChange={(e) => handleInputChange('whereabouts', e.target.value)}
                            placeholder="Hasanparthy Rythu Vedika & Market Yard"
                          />
                        </div>
                      </div>

                      {/* Pricing (Price/Hour and Price/Acre) */}
                      <div className="owner-two-col-grid">
                        <div className="signin-field-group">
                          <label className="signin-field-label">
                            {isTe ? 'ధర / గంటకు (₹)' : 'Price / Hour (₹)'}
                          </label>
                          <div className="signin-field-input-box">
                            <input
                              type="number"
                              className="signin-input-text font-bold text-center"
                              value={formData.priceHour}
                              onChange={(e) => handleInputChange('priceHour', e.target.value)}
                              placeholder="900"
                            />
                          </div>
                        </div>
                        <div className="signin-field-group">
                          <label className="signin-field-label">
                            {isTe ? 'ధర / ఎకరానికి (₹)' : 'Price / Acre (₹)'}
                          </label>
                          <div className="signin-field-input-box">
                            <input
                              type="number"
                              className="signin-input-text font-bold text-center"
                              value={formData.priceAcre}
                              onChange={(e) => handleInputChange('priceAcre', e.target.value)}
                              placeholder="1800"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Attached Implements & Services */}
                      <div className="signin-field-group">
                        <label className="signin-field-label">
                          {isTe ? 'అనుసంధానించబడిన పరికరాలు & సేవలు' : 'Attached Implements & Services'}
                        </label>
                        <div className="owner-implements-grid">
                          {implementOptions.map((item) => {
                            const isSelected = formData.implements.includes(item.id);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                className={`owner-implement-btn ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleImplementToggle(item.id)}
                              >
                                {isSelected ? '✓ ' : '+ '}
                                {item.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Machinery Photo */}
                      <div className="signin-field-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <label className="signin-field-label" style={{ margin: 0 }}>
                            {isTe ? 'యంత్రం ఫోటో' : 'Machinery Photo'}
                          </label>
                          <label
                            style={{
                              fontSize: '12px',
                              fontWeight: '700',
                              color: 'var(--primary-700)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: '#e8f5e9',
                              padding: '5px 12px',
                              borderRadius: '6px',
                              border: '1px solid #c8e6c9'
                            }}
                          >
                            📷 {isUploadingPhoto ? (isTe ? 'అప్‌లోడ్ అవుతోంది...' : 'Uploading...') : (isTe ? 'అసలు ఫోటో అప్‌లోడ్ చేయండి' : 'Upload Real Tractor Photo')}
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={handlePhotoUpload}
                              disabled={isUploadingPhoto}
                            />
                          </label>
                        </div>

                        {formData.selectedPhoto && formData.selectedPhoto.startsWith('/uploads') && (
                          <div style={{ marginBottom: '12px', padding: '10px 14px', background: '#f1f8e9', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid #c8e6c9' }}>
                            <img src={formData.selectedPhoto} alt="Uploaded Tractor" style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '13px', color: '#2e7d32' }}>✅ {isTe ? 'మీ అసలు ట్రాక్టర్ ఫోటో అప్‌లోడ్ అయింది' : 'Custom Tractor Photo Uploaded'}</div>
                              <div style={{ fontSize: '11px', color: '#666' }}>{formData.selectedPhoto}</div>
                            </div>
                          </div>
                        )}

                        {submittedCustomTractor && (
                          <div style={{
                            marginBottom: '14px',
                            padding: '12px 16px',
                            background: '#fefce8',
                            border: '2px solid #fef08a',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <img
                                src={submittedCustomTractor.photo}
                                alt="Custom Tractor"
                                style={{ width: '64px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ca8a04' }}
                              />
                              <div>
                                <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#854d0e' }}>
                                  🚜 {submittedCustomTractor.brand} {submittedCustomTractor.model} ({submittedCustomTractor.hp || 'Custom HP'})
                                </div>
                                <div style={{ fontSize: '11.5px', color: '#713f12' }}>
                                  {isTe ? 'ధృవీకరణ స్థితి:' : 'Status:'}{' '}
                                  <span style={{ background: '#fef08a', color: '#854d0e', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
                                    ⏳ {submittedCustomTractor.verificationStatus || 'Pending Verification'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsCustomTractorModalOpen(true)}
                              style={{
                                background: '#ffffff',
                                border: '1px solid #ca8a04',
                                color: '#854d0e',
                                borderRadius: '6px',
                                padding: '5px 10px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              ✏️ {isTe ? 'సవరించు' : 'Edit'}
                            </button>
                          </div>
                        )}

                        <div className="owner-photos-horizontal">
                          {photoOptions.map((photo) => {
                            const isSelected = formData.photoName === photo.id && !formData.selectedPhoto.startsWith('/uploads');
                            return (
                              <div
                                key={photo.id}
                                className={`owner-photo-card ${isSelected ? 'selected' : ''}`}
                                onClick={() => {
                                  handleInputChange('photoName', photo.id);
                                  handleInputChange('selectedPhoto', photo.src);
                                  handleInputChange('isOtherCustom', false);
                                }}
                              >
                                <img src={photo.src} alt={photo.label} className="owner-tractor-thumb" />
                                <span className="owner-photo-caption">{photo.label}</span>
                              </div>
                            );
                          })}

                          {/* Separate "Other Tractor Model" Card alongside existing models */}
                          <div
                            className={`owner-photo-card other-tractor-card ${formData.isOtherCustom ? 'selected' : ''}`}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '2px dashed #16a34a',
                              background: '#f0fdf4',
                              cursor: 'pointer',
                              minHeight: '120px',
                              padding: '12px 10px',
                              textAlign: 'center',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 5px rgba(22, 163, 74, 0.12)'
                            }}
                            onClick={() => setIsCustomTractorModalOpen(true)}
                            title={isTe ? 'జాబితాలో లేని ఇతర ట్రాక్టర్ మోడల్ నమోదు చేయండి' : 'Click to register custom tractor model with Admin Verification'}
                          >
                            <div
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                background: '#16a34a',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                fontWeight: 'bold',
                                marginBottom: '6px',
                                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)'
                              }}
                            >
                              +
                            </div>
                            <strong style={{ fontSize: '13px', color: '#166534', lineHeight: 1.2 }}>
                              {isTe ? 'ఇతర ట్రాక్టర్ మోడల్ (+)' : 'Other Tractor Model (+)'}
                            </strong>
                            <span style={{ fontSize: '10.5px', color: '#15803d', marginTop: '4px', fontWeight: 600 }}>
                              {isTe ? 'కస్టమ్ రిజిస్ట్రేషన్' : 'Custom Verification'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="owner-actions-flex" style={{ marginTop: '22px' }}>
                        <button
                          type="button"
                          className="owner-btn-back-white"
                          onClick={() => setCurrentStep(3)}
                        >
                          ← {isTe ? 'వెనుకకు' : 'Back'}
                        </button>
                        <button
                          type="submit"
                          className="owner-btn-complete-green flex-2"
                        >
                          <span>{isTe ? '4-దశల KYC పూర్తి చేసి లాగిన్ అవ్వండి →' : 'Complete 4-Step KYC & Login →'}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* ========================================================
              TAB 2: RETURNING OWNER LOGIN (Message Central VerifyNow OTP)
              ======================================================== */}
              {activeTab === 'login' && (
                <form onSubmit={loginOtpSent ? handleVerifyLoginOtp : handleSendLoginOtp} className="page-anim">
                  <div className="owner-step-header">
                    <span className="owner-step-mini-tag">RETURNING OWNER LOGIN</span>
                    <h3 className="owner-step-main-title">
                      {isTe ? 'మెసేజ్ సెంట్రల్ SMS తో ప్రవేశించండి' : 'Login via Message Central SMS OTP'}
                    </h3>
                  </div>

                  {!loginOtpSent ? (
                    <>
                      <div className="signin-field-group">
                        <label className="signin-field-label">
                          {isTe ? 'నమోదిత మొబైల్ లేదా వాహన RC నంబర్ *' : 'Registered Mobile or RC Number *'}
                        </label>
                        <div className="signin-field-input-box">
                          <span className="signin-input-icon">🔑</span>
                          <input
                            type="text"
                            className="signin-input-text font-bold"
                            placeholder="e.g. 9876543210 or TS 04 AB 7890"
                            value={returningQuery}
                            onChange={(e) => {
                              setReturningQuery(e.target.value);
                              setErrorMsg('');
                            }}
                            autoFocus
                          />
                        </div>
                      </div>

                      {returningQuery.trim() && (() => {
                        const matched = findOwnerByIdentifier(returningQuery.trim());
                        if (matched) {
                          return (
                            <div className="signin-recognized-status-banner is-member page-anim" style={{ marginTop: '10px' }}>
                              <span>✓</span>
                              <span>
                                {isTe
                                  ? `నమోదిత యజమాని గుర్తించబడ్డారు: ${matched.fullName || matched.owner} (${matched.vehicleNumber || matched.rcNumber})`
                                  : `Registered Owner Recognized: ${matched.fullName || matched.owner} (${matched.vehicleNumber || matched.rcNumber})`}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      <button
                        type="submit"
                        className="owner-btn-primary-blue"
                        style={{ marginTop: '14px' }}
                        disabled={isSendingLoginOtp}
                      >
                        <span>
                          {isSendingLoginOtp
                            ? (isTe ? 'SMS OTP పంపుతోంది...' : 'Sending SMS OTP via Message Central...')
                            : (isTe ? '📲 మెసేజ్ సెంట్రల్ SMS లాగిన్ OTP పంపండి →' : '📲 Send Login OTP via Message Central →')}
                        </span>
                      </button>

                      <div className="sancharoo-demo-box" style={{ marginTop: '20px' }}>
                        <span className="sancharoo-demo-title">💡 QUICK FILL REGISTERED OWNER:</span>
                        <button
                          type="button"
                          className="sancharoo-demo-item"
                          onClick={() => {
                            setReturningQuery('9876543210');
                            setErrorMsg('');
                          }}
                        >
                          ⚡ Ramesh Kumar (9876543210) — TS 04 AB 7890
                        </button>
                        <button
                          type="button"
                          className="sancharoo-demo-item"
                          style={{ marginTop: '6px' }}
                          onClick={() => {
                            setReturningQuery('9440156789');
                            setErrorMsg('');
                          }}
                        >
                          ⚡ Suresh Patel (9440156789) — TS 07 EF 1234
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="signin-otp-block page-anim" style={{ marginTop: '10px' }}>
                      <div className="signin-otp-banner" style={{ marginBottom: '16px' }}>
                        ✓ 📲 {isTe
                          ? `లాగిన్ OTP మెసేజ్ సెంట్రల్ ద్వారా +91 ${(loginMatchedOwner?.mobile || returningQuery).replace(/\D/g, '')} కి పంపబడింది!`
                          : `Login OTP sent via Message Central to +91 ${(loginMatchedOwner?.mobile || returningQuery).replace(/\D/g, '')}!`}
                      </div>

                      <div className="signin-field-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label className="signin-field-label" style={{ fontWeight: 800, margin: 0 }}>
                            {isTe ? '6-అంకెల SMS లాగిన్ OTP కోడ్ నమోదు చేయండి' : 'Enter 6-Digit SMS Login OTP'}
                          </label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              className="signin-change-phone-btn"
                              onClick={handleSendLoginOtp}
                              disabled={isSendingLoginOtp}
                            >
                              🔄 {isSendingLoginOtp ? '...' : (isTe ? 'మళ్లీ పంపు' : 'Resend OTP')}
                            </button>
                            <button
                              type="button"
                              className="signin-change-phone-btn"
                              onClick={() => {
                                setLoginOtpSent(false);
                                setLoginVerificationId('');
                                setLoginOtp('');
                              }}
                            >
                              ✏️ {isTe ? 'నంబర్ మార్చు' : 'Change'}
                            </button>
                          </div>
                        </div>

                        <input
                          type="text"
                          maxLength={8}
                          className="signin-otp-input"
                          value={loginOtp}
                          onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••••"
                          autoFocus
                        />
                        {loginOtp && (
                          <span className="signin-demo-otp-hint">
                            {isTe ? `సిమ్యులేటర్ ప్రివ్యూ కోడ్: ${loginOtp}` : `Simulator test code: ${loginOtp}`}
                          </span>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="owner-btn-primary-blue"
                        style={{ marginTop: '14px' }}
                        disabled={isVerifyingLoginOtp}
                      >
                        <span>
                          {isVerifyingLoginOtp
                            ? (isTe ? 'OTP ధృవీకరిస్తోంది...' : 'Verifying with Message Central...')
                            : (isTe ? '🔐 OTP ధృవీకరించి ఓనర్ ఇన్‌బాక్స్‌లోకి వెళ్లండి →' : '🔐 Verify OTP & Enter Owner Inbox →')}
                        </span>
                      </button>
                    </div>
                  )}
                </form>
              )}

              {/* Guest Browsing Link */}
              <div className="signin-guest-link-box" style={{ marginTop: '20px' }}>
                <span className="signin-guest-prompt">
                  {isTe ? 'కేవలం చూడాలనుకుంటున్నారా? ' : 'Just browsing? '}
                </span>
                <button
                  type="button"
                  className="signin-guest-btn"
                  onClick={() => setActivePage('find-tractor')}
                >
                  {isTe ? 'ట్రాక్టర్ మార్కెట్‌ప్లేస్‌ను అతిథిగా చూడండి →' : 'Explore Tractors Marketplace as Guest →'}
                </button>
              </div>
            </div>

            {/* Footer Safety Norms */}
            <footer className="signin-safety-footer">
              <span className="signin-shield-icon">🛡️</span>
              <span>
                {isTe
                  ? 'తెలంగాణ రవాణా మరియు వ్యవసాయ భద్రతా సమాచార నిబంధనలకు అగ్రిరెంట్ కట్టుబడి ఉంటుంది.'
                  : 'Agrirent adheres to Telangana transport & agriculture safety data norms.'}
              </span>
            </footer>
          </main>
        </div>

        {/* Dedicated Custom Tractor Registration Form Modal */}
        <CustomTractorModal
          isOpen={isCustomTractorModalOpen}
          onClose={() => setIsCustomTractorModalOpen(false)}
          ownerName={formData.fullName}
          ownerMobile={formData.mobile}
          defaultDistrict={formData.district || defaultDistrict}
          defaultVillage={formData.mandalBase || defaultVillage}
          language={language}
          onTractorSubmitted={(savedTractor) => {
            setSubmittedCustomTractor(savedTractor);
            handleInputChange('brand', savedTractor.brand);
            handleInputChange('modelSpecs', savedTractor.model);
            handleInputChange('selectedPhoto', savedTractor.photo);
            handleInputChange('photoName', `custom_${savedTractor.id}`);
            handleInputChange('isOtherCustom', true);
            if (setTractors) {
              setTractors((prev) => [savedTractor, ...prev]);
            }
          }}
        />
      </div>
    );
  }
