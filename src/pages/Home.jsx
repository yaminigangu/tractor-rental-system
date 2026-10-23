import WeatherBar from '../components/WeatherBar';
import { translations } from '../translations';

export default function Home({
  setActivePage,
  setServiceFilter,
  language = 'en',
  selectedLocation,
  weatherData,
  isLoadingWeather,
  onOpenLocationPicker
}) {
  const t = translations[language] || translations.en;
  const isTe = language === 'te';

  const agriculturalServices = [
    {
      id: 'Ploughing',
      icon: '🌱',
      title: isTe ? 'దుక్కి దున్నడం (Ploughing)' : 'Ploughing (దుక్కి / Tillage)',
      desc: isTe
        ? 'మొదటి సారి లోతైన దుక్కి దున్నడం ద్వారా భూమి సారవంతం అవుతుంది మరియు విత్తనాలు బాగా మొలకెత్తుతాయి.'
        : 'Deep soil turning and primary tillage for superior seed penetration and moisture retention.',
      badge: isTe ? 'ప్రాథమిక దుక్కి' : 'Primary Tillage'
    },
    {
      id: 'Rotavator',
      icon: '⚙️',
      title: isTe ? 'రొటవేటర్ (Rotavator)' : 'Rotavator (రొటవేటర్)',
      desc: isTe
        ? 'వరి, పత్తి, మొక్కజొన్న విత్తనాలు నాటడానికి నేలను మెత్తగా చూర్ణం చేసి చదును చేయడం.'
        : 'Rapid soil pulverization and smooth seedbed preparation for paddy, maize, cotton, and vegetables.',
      badge: isTe ? 'విత్తన మడి తయారీ' : 'Seedbed Prep'
    },
    {
      id: 'Cultivator',
      icon: '🌾',
      title: isTe ? 'కల్టివేటర్ (Cultivator)' : 'Cultivator (కల్టివేటర్)',
      desc: isTe
        ? 'కలుపు మొక్కలను తొలగించడం, నేలలో గాలి ప్రసరణ పెంచడం మరియు విత్తనాలకు మునుపు చదును చేయడం.'
        : 'Secondary tillage, weed removal, soil aeration, and pre-sowing soil smoothing.',
      badge: isTe ? 'కలుపు తొలగింపు' : 'Secondary Tillage'
    },
    {
      id: 'Trailer Services',
      icon: '🚛',
      title: isTe ? 'ట్రాలీ రవాణా (Trailer Services)' : 'Trailer Services (ట్రాలీ రవాణా)',
      desc: isTe
        ? 'పంట దిగుబడి మార్కెట్‌కు చేరవేయడం, పశువుల ఎరువు, ఎరువులు మరియు వ్యవసాయ సామాగ్రి రవాణా.'
        : 'Farm produce transport, organic manure delivery, harvesting logistics, and heavy haulage.',
      badge: isTe ? 'వ్యవసాయ రవాణా' : 'Farm Transport'
    },
    {
      id: 'Corn Harvester',
      icon: '🌽',
      title: isTe ? 'మొక్కజొన్న కోత యంత్రం (Corn Harvester)' : 'Corn & Maize Harvester',
      desc: isTe
        ? 'మొక్కజొన్న పంట కోత, కంకుల ఒలుపు మరియు గింజలను నూర్పిడి చేసి శుభ్రం చేయడం.'
        : 'High-efficiency maize harvesting, cob snapping, and grain threshing directly in the field.',
      badge: isTe ? 'కోత & నూర్పిడి' : 'Crop Harvesting'
    },
    {
      id: 'Straw Baler',
      icon: '📦',
      title: isTe ? 'రౌండ్ స్ట్రా బెయిలర్ (Straw Baler)' : 'Round Straw Baler (గడ్డి బెయిలర్)',
      desc: isTe
        ? 'వరి, మొక్కజొన్న ఎండుగడ్డిని సేకరించి గుండ్రటి గడ్డి కట్టలుగా చుట్టే ఆధునిక యంత్రం.'
        : 'Tractor-driven collection, compression, and bundling of loose crop residues into dense round bales.',
      badge: isTe ? 'గడ్డి చుట్టడం' : 'Residue Baling'
    },
    {
      id: 'Corn Seeder',
      icon: '🌱',
      title: isTe ? 'హ్యాండ్ కార్న్ సీడర్ (Corn Seeder)' : 'Hand Push Corn Seeder',
      desc: isTe
        ? 'మొక్కజొన్న, వేరుశనగ, సోయా విత్తనాలను నిర్ణీత దూరంలో ఖచ్చితంగా నాటే చేతి యంత్రం.'
        : 'Precision push planter for maize, corn, and groundnut seeds with uniform spacing.',
      badge: isTe ? 'విత్తనాలు నాటడం' : 'Precision Sowing'
    }
  ];

  const handleServiceClick = (serviceId) => {
    if (setServiceFilter) {
      setServiceFilter(serviceId);
    }
    setActivePage('find-tractor');
  };

  return (
    <div className="home-view page-anim">
      {/* Agricultural Weather & Soil Advisory Widget */}
      <WeatherBar
        language={language}
        selectedLocation={selectedLocation}
        weatherData={weatherData}
        isLoadingWeather={isLoadingWeather}
        onOpenLocationPicker={onOpenLocationPicker}
      />

      {/* Hero Banner */}
      <div className="hero-banner">
        <span className="hero-tagline">{t.heroTagline}</span>
        <h2>{t.heroTitle}</h2>
        <p>{t.heroDesc}</p>
        <div className="hero-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setActivePage('find-tractor')}
          >
            {t.btnBookTractor}
          </button>
          <button
            className="btn btn-outline-white"
            onClick={() => setActivePage('owner-registration')}
          >
            {t.btnRegisterTractor}
          </button>
        </div>
      </div>

      {/* Our Agricultural Services Section (Exact Match to Notebook Image 2) */}
      <div className="services-section">
        <div className="section-header">
          <h3>{t.ourServicesTitle}</h3>
          <p>{t.ourServicesSubtitle}</p>
        </div>

        <div className="services-grid">
          {agriculturalServices.map((service) => (
            <div
              key={service.id}
              className="service-card"
              onClick={() => handleServiceClick(service.id)}
            >
              <div className="service-card-icon">{service.icon}</div>
              <h4>{service.title}</h4>
              <p>{service.desc}</p>
              <div className="service-cta">
                <span>{t.hireTractorsFor} {service.id}</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Users / Roles Section (from Notebook Image 2) */}
      <div className="roles-section">
        <div className="section-header">
          <h3>👥 {isTe ? 'మన గ్రామీణ వేదిక ఎవరి కోసం?' : 'How Our Community Platform Serves You'}</h3>
          <p>{isTe ? 'రైతులు, ట్రాక్టర్ యజమానులు మరియు అడ్మిన్ కోసం ప్రత్యేక సేవలు:' : 'Built tailored for our village ecosystem with three clear stakeholders:'}</p>
        </div>

        <div className="roles-grid">
          <div className="role-card">
            <span className="role-card-badge" style={{ backgroundColor: '#e8f5e9', color: '#2e7d32' }}>
              {isTe ? 'భూమి ఉన్న రైతుల కోసం' : 'For Land Owners'}
            </span>
            <h4>{isTe ? '👨‍🌾 రైతు (Farmer)' : '👨‍🌾 Farmer'}</h4>
            <ul>
              <li>{isTe ? 'హసన్‌పర్తి మరియు పరిసర గ్రామాల్లో సిద్ధంగా ఉన్న ట్రాక్టర్లు' : 'Find available tractors nearby in Hasanparthy & local villages'}</li>
              <li>{isTe ? 'గంటకు మరియు ఎకరానికి పారదర్శకమైన ధరలు' : 'Clear hourly and per-acre pricing transparently displayed'}</li>
              <li>{isTe ? 'దుక్కి, రొటవేటర్ లేదా ట్రాలీ కోసం సులభంగా తేదీ ఎంపిక' : 'Book ploughing, rotavating, or trailer with preferred date'}</li>
              <li>{isTe ? 'నేరుగా ఫోన్ కాల్ లేదా వాట్సాప్ ద్వారా బుకింగ్' : 'One-click phone calling and WhatsApp booking dispatch'}</li>
            </ul>
          </div>

          <div className="role-card">
            <span className="role-card-badge" style={{ backgroundColor: '#fff3e0', color: '#e65100' }}>
              {isTe ? 'ట్రాక్టర్ యజమానుల కోసం' : 'For Machinery Owners'}
            </span>
            <h4>{isTe ? '🚜 ట్రాక్టర్ యజమాని (Tractor Owner)' : '🚜 Tractor Owner'}</h4>
            <ul>
              <li>{isTe ? 'మీ ట్రాక్టర్ బ్రాండ్, మోడల్ మరియు పరికరాలను నమోదు చేయండి' : 'Register your tractor brand, model, and attachments'}</li>
              <li>{isTe ? 'ట్రాక్టర్ ఖాళీగా లేకుండా ఎల్లప్పుడూ అద్దె ఆదాయం పొందండి' : 'Showcase your availability status to avoid idle machinery'}</li>
              <li>{isTe ? 'పక్క గ్రామాల రైతుల నుండి నేరుగా పని ఆర్డర్లు అందుకోండి' : 'Get direct calls and work orders from neighborhood farmers'}</li>
              <li>{isTe ? 'వ్యవసాయ సీజన్లలో మంచి సంపాదన పొందండి' : 'Earn consistent rental income during agricultural seasons'}</li>
            </ul>
          </div>

          <div className="role-card">
            <span className="role-card-badge" style={{ backgroundColor: '#e1f5fe', color: '#0288d1' }}>
              {isTe ? 'వ్యవస్థ సమన్వయకర్త' : 'System Coordinator'}
            </span>
            <h4>{isTe ? '🛡️ అడ్మిన్ (Website Admin)' : '🛡️ Website Admin'}</h4>
            <ul>
              <li>{isTe ? 'రైతుల బుకింగ్ అభ్యర్థనలను సమీక్షించి ధృవీకరించండి' : 'Review, verify, and approve incoming farmer booking requests'}</li>
              <li>{isTe ? 'అన్ని ట్రాక్టర్ల పని స్థితిని పర్యవేక్షించండి' : 'Monitor operational fleet status across all registered units'}</li>
              <li>{isTe ? 'సకాలంలో పని పూర్తయ్యేలా సమన్వయం చేయండి' : 'Ensure fair execution, timely completion, and local support'}</li>
              <li>{isTe ? 'పూర్తయిన ఎకరాలు మరియు ఆదాయ లెక్కలు చూడండి' : 'Live metrics of active acres serviced and fleet usage'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
