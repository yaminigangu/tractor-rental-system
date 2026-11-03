import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

// 10 Major Agricultural Tractor Models with Authentic Livery & Specifications
export const TRACTOR_MODELS = [
  {
    id: 'mahindra-575',
    brand: 'Mahindra',
    modelName: 'Mahindra 575 DI Sarpanch',
    shortName: 'Mahindra 575',
    hp: '47 HP',
    primaryColor: '#dc2626',
    secondaryColor: '#991b1b',
    rimColor: '#eab308',
    chassisColor: '#334155',
    badgeText: 'MAHINDRA 575',
    fenderColor: '#dc2626'
  },
  {
    id: 'swaraj-744',
    brand: 'Swaraj',
    modelName: 'Swaraj 744 FE XT',
    shortName: 'Swaraj 744',
    hp: '48 HP',
    primaryColor: '#2563eb',
    secondaryColor: '#1d4ed8',
    rimColor: '#cbd5e1',
    chassisColor: '#1e293b',
    badgeText: 'SWARAJ 744',
    fenderColor: '#ffffff'
  },
  {
    id: 'john-deere-5310',
    brand: 'John Deere',
    modelName: 'John Deere 5310 GearPro',
    shortName: 'John Deere 5310',
    hp: '55 HP',
    primaryColor: '#15803d',
    secondaryColor: '#14532d',
    rimColor: '#facc15',
    chassisColor: '#1e293b',
    badgeText: 'JOHN DEERE 5310',
    fenderColor: '#15803d'
  },
  {
    id: 'massey-241',
    brand: 'Massey Ferguson',
    modelName: 'Massey Ferguson 241 DI',
    shortName: 'Massey 241',
    hp: '42 HP',
    primaryColor: '#b91c1c',
    secondaryColor: '#7f1d1d',
    rimColor: '#cbd5e1',
    chassisColor: '#64748b',
    badgeText: 'MASSEY 241',
    fenderColor: '#b91c1c'
  },
  {
    id: 'farmtrac-60',
    brand: 'Farmtrac',
    modelName: 'Farmtrac 60 Powermaxx',
    shortName: 'Farmtrac 60',
    hp: '55 HP',
    primaryColor: '#1d4ed8',
    secondaryColor: '#1e3a8a',
    rimColor: '#cbd5e1',
    chassisColor: '#334155',
    badgeText: 'FARMTRAC 60',
    fenderColor: '#1d4ed8'
  },
  {
    id: 'sonalika-745',
    brand: 'Sonalika',
    modelName: 'Sonalika DI 745 Sikander',
    shortName: 'Sonalika 745',
    hp: '50 HP',
    primaryColor: '#1e40af',
    secondaryColor: '#172554',
    rimColor: '#eab308',
    chassisColor: '#1e293b',
    badgeText: 'SONALIKA 745',
    fenderColor: '#1e40af'
  },
  {
    id: 'new-holland-3630',
    brand: 'New Holland',
    modelName: 'New Holland 3630 TX Super',
    shortName: 'New Holland',
    hp: '55 HP',
    primaryColor: '#0284c7',
    secondaryColor: '#0369a1',
    rimColor: '#ffffff',
    chassisColor: '#1e293b',
    badgeText: 'NEW HOLLAND',
    fenderColor: '#0284c7'
  },
  {
    id: 'kubota-4501',
    brand: 'Kubota',
    modelName: 'Kubota MU4501 4WD',
    shortName: 'Kubota 4501',
    hp: '45 HP',
    primaryColor: '#ea580c',
    secondaryColor: '#c2410c',
    rimColor: '#ffffff',
    chassisColor: '#334155',
    badgeText: 'KUBOTA 4501',
    fenderColor: '#ffffff'
  },
  {
    id: 'eicher-380',
    brand: 'Eicher',
    modelName: 'Eicher 380 Super DI',
    shortName: 'Eicher 380',
    hp: '40 HP',
    primaryColor: '#3b82f6',
    secondaryColor: '#1d4ed8',
    rimColor: '#cbd5e1',
    chassisColor: '#334155',
    badgeText: 'EICHER 380',
    fenderColor: '#3b82f6'
  },
  {
    id: 'kartar-4000',
    brand: 'Kartar',
    modelName: 'Kartar 4000 Combine Harvester',
    shortName: 'Kartar 4000',
    hp: '101 HP',
    primaryColor: '#16a34a',
    secondaryColor: '#15803d',
    rimColor: '#eab308',
    chassisColor: '#14532d',
    badgeText: 'KARTAR 4000',
    fenderColor: '#16a34a'
  }
];

// Machinery implement configuration
const MACHINERY_CONFIGS = {
  plough: {
    id: 'plough',
    icon: '🌱',
    labelEn: 'Ploughing Active',
    labelTe: 'దుక్కి దున్నడం',
    implementEn: '3-Disc Furrow Plough',
    implementTe: '3-డిస్క్ నాగలి దుక్కి',
    defaultModelId: 'mahindra-575',
    sproutIcon: '🌱'
  },
  rotavator: {
    id: 'rotavator',
    icon: '🔄',
    labelEn: 'Rotavator Active',
    labelTe: 'రొటవేటర్ సేద్యం',
    implementEn: 'Heavy-Duty Rotary Tiller',
    implementTe: 'హెవీ రొటవేటర్',
    defaultModelId: 'swaraj-744',
    sproutIcon: '🌾'
  },
  cultivator: {
    id: 'cultivator',
    icon: '🌾',
    labelEn: 'Cultivator Active',
    labelTe: 'కల్టివేటర్ సేద్యం',
    implementEn: '9-Tyne Spring Cultivator',
    implementTe: '9-టైన్ స్ప్రింగ్ కల్టివేటర్',
    defaultModelId: 'farmtrac-60',
    sproutIcon: '🌿'
  },
  harvester: {
    id: 'harvester',
    icon: '🌽',
    labelEn: 'Harvester Active',
    labelTe: 'కోత యంత్రం',
    implementEn: 'Maize & Paddy Grain Header',
    implementTe: 'మొక్కజొన్న/వరి కోత హెడర్',
    defaultModelId: 'kartar-4000',
    sproutIcon: '🌽'
  },
  baler: {
    id: 'baler',
    icon: '📦',
    labelEn: 'Straw Baler Active',
    labelTe: 'గడ్డి బెయిలర్',
    implementEn: 'Round Straw Baler',
    implementTe: 'రౌండ్ గడ్డి బెయిలర్',
    defaultModelId: 'john-deere-5310',
    sproutIcon: '📦'
  },
  seeder: {
    id: 'seeder',
    icon: '🌱',
    labelEn: 'Seed Planter Active',
    labelTe: 'విత్తన నాటే యంత్రం',
    implementEn: 'Precision Multi-Crop Planter',
    implementTe: 'విత్తన సీడర్ డ్రిల్',
    defaultModelId: 'mahindra-575',
    sproutIcon: '🌱'
  },
  trailer: {
    id: 'trailer',
    icon: '🚚',
    labelEn: 'Trailer Trolley Active',
    labelTe: 'ట్రాలీ రవాణా',
    implementEn: '4-Ton Farm Tipping Trolley',
    implementTe: '4-టన్ హైడ్రాలిక్ ట్రాలీ',
    defaultModelId: 'sonalika-745',
    sproutIcon: '🌾'
  },
  all: {
    id: 'all',
    icon: '🚜',
    labelEn: 'All Fleet Drive',
    labelTe: 'అన్ని ట్రాక్టర్లు',
    implementEn: 'Fleet Demonstration',
    implementTe: 'యంత్రాల ప్రదర్శన',
    defaultModelId: 'mahindra-575',
    sproutIcon: '🌱'
  }
};

function normalizeServiceMode(service) {
  if (!service) return 'all';
  const s = service.toLowerCase();
  if (s.includes('plough') || s.includes('దుక్కి')) return 'plough';
  if (s.includes('rotavat') || s.includes('రొటవేటర్')) return 'rotavator';
  if (s.includes('cultivat') || s.includes('కల్టివేటర్')) return 'cultivator';
  if (s.includes('harvest') || s.includes('కోత')) return 'harvester';
  if (s.includes('baler') || s.includes('straw') || s.includes('బెయిలర్')) return 'baler';
  if (s.includes('seeder') || s.includes('plant') || s.includes('విత్తన')) return 'seeder';
  if (s.includes('trailer') || s.includes('trolley') || s.includes('ట్రాలీ')) return 'trailer';
  return 'all';
}

export default function TractorFarmerScene({
  language = 'en',
  activeService = 'All',
  selectedModelId = null,
  onModelSelect = null
}) {
  const isTe = language === 'te';
  const serviceMode = normalizeServiceMode(activeService);
  const currentServiceConfig = MACHINERY_CONFIGS[serviceMode] || MACHINERY_CONFIGS.all;

  // Active Tractor Model State
  const [internalModelId, setInternalModelId] = useState(() => {
    if (selectedModelId) return selectedModelId;
    return currentServiceConfig.defaultModelId || 'mahindra-575';
  });

  // When activeService changes, switch default model if user hasn't explicitly locked one
  useEffect(() => {
    if (selectedModelId) {
      setInternalModelId(selectedModelId);
    } else if (serviceMode === 'harvester') {
      setInternalModelId('kartar-4000');
    } else if (serviceMode === 'rotavator') {
      setInternalModelId('swaraj-744');
    } else if (serviceMode === 'cultivator') {
      setInternalModelId('farmtrac-60');
    } else if (serviceMode === 'baler') {
      setInternalModelId('john-deere-5310');
    } else if (serviceMode === 'trailer') {
      setInternalModelId('sonalika-745');
    } else if (serviceMode === 'plough') {
      setInternalModelId('mahindra-575');
    }
  }, [serviceMode, selectedModelId]);

  const activeModel =
    TRACTOR_MODELS.find(m => m.id === (selectedModelId || internalModelId)) ||
    TRACTOR_MODELS[0];

  const handleSelectModel = (model) => {
    setInternalModelId(model.id);
    if (onModelSelect) {
      onModelSelect(model);
    }
  };

  // Master Scene Refs
  const sceneWrapperRef = useRef(null);
  const tractorChassisRef = useRef(null);
  const farmerRef = useRef(null);
  const steeringRef = useRef(null);
  const turbanTailRef = useRef(null);
  const frontWheelRef = useRef(null);
  const rearWheelRef = useRef(null);
  const groundTrackRef = useRef(null);
  const smokeContainerRef = useRef(null);
  const dustContainerRef = useRef(null);
  const sunRaysRef = useRef(null);

  // Implement Specific Refs
  const ploughRef = useRef(null);
  const ploughDiscsRef = useRef(null);
  const rotavatorBodyRef = useRef(null);
  const rotavatorBladesRef = useRef(null);
  const cultivatorTinesRef = useRef(null);
  const harvesterReelRef = useRef(null);
  const harvesterCropsRef = useRef(null);
  const balerWheelRef = useRef(null);
  const balerPickupRef = useRef(null);
  const strawBaleRef = useRef(null);
  const seederWheelRef = useRef(null);
  const trailerChassisRef = useRef(null);
  const trailerWheel1Ref = useRef(null);
  const trailerWheel2Ref = useRef(null);

  // Player controls
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1); // 1 = normal, 2 = turbo

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Wheel Spin Tweens
      const wheelsToSpin = [frontWheelRef.current, rearWheelRef.current];
      if (trailerWheel1Ref.current) wheelsToSpin.push(trailerWheel1Ref.current);
      if (trailerWheel2Ref.current) wheelsToSpin.push(trailerWheel2Ref.current);
      if (balerWheelRef.current) wheelsToSpin.push(balerWheelRef.current);

      const activeWheels = wheelsToSpin.filter(Boolean);
      let wheelTween = null;
      if (activeWheels.length > 0) {
        wheelTween = gsap.to(activeWheels, {
          rotation: 360,
          duration: 1.1 / speedMultiplier,
          repeat: -1,
          ease: 'none',
          transformOrigin: '50% 50%'
        });
      }

      // 2. Tractor Suspension Engine Chug & Vibration
      let chassisTween = null;
      if (tractorChassisRef.current) {
        chassisTween = gsap.to(tractorChassisRef.current, {
          y: -3.5,
          rotation: 0.8,
          duration: 0.32 / speedMultiplier,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          transformOrigin: 'bottom center'
        });
      }

      // 3. Farmer Sitting & Bobbing with Seat Spring
      let farmerTween = null;
      if (farmerRef.current) {
        farmerTween = gsap.to(farmerRef.current, {
          y: -3,
          rotation: -0.6,
          duration: 0.32 / speedMultiplier,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          transformOrigin: 'bottom center'
        });
      }

      // 4. Steering Wheel Micro-Adjustment
      let steerTween = null;
      if (steeringRef.current) {
        steerTween = gsap.to(steeringRef.current, {
          rotation: 10,
          duration: 0.75 / speedMultiplier,
          repeat: -1,
          yoyo: true,
          ease: 'power1.inOut',
          transformOrigin: '40% 60%'
        });
      }

      // 5. Turban Flapping in the Wind
      let turbanTween = null;
      if (turbanTailRef.current) {
        turbanTween = gsap.to(turbanTailRef.current, {
          rotation: -14,
          scaleX: 1.12,
          duration: 0.28 / speedMultiplier,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          transformOrigin: 'left center'
        });
      }

      // 6. Ground Soil Track Infinite Scrolling
      let groundTween = null;
      if (groundTrackRef.current) {
        groundTween = gsap.to(groundTrackRef.current, {
          x: -96,
          duration: 0.9 / speedMultiplier,
          repeat: -1,
          ease: 'none'
        });
      }

      // 7. Golden Sun Rays Pulse
      if (sunRaysRef.current) {
        gsap.to(sunRaysRef.current, {
          scale: 1.08,
          opacity: 0.85,
          duration: 2.2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          transformOrigin: 'center center'
        });
      }

      // ==========================================
      // MODE-SPECIFIC IMPLEMENT TWEENS
      // ==========================================

      if (serviceMode === 'plough') {
        if (ploughRef.current) {
          gsap.to(ploughRef.current, {
            y: 2,
            rotation: 1,
            duration: 0.28 / speedMultiplier,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            transformOrigin: 'right top'
          });
        }
        if (ploughDiscsRef.current) {
          gsap.to(ploughDiscsRef.current, {
            rotation: 360,
            duration: 1.5 / speedMultiplier,
            repeat: -1,
            ease: 'none',
            transformOrigin: 'center center'
          });
        }
      }

      if (serviceMode === 'rotavator') {
        if (rotavatorBladesRef.current) {
          gsap.to(rotavatorBladesRef.current, {
            rotation: 360,
            duration: 0.22 / speedMultiplier,
            repeat: -1,
            ease: 'none',
            transformOrigin: '24px 136px'
          });
        }
        if (rotavatorBodyRef.current) {
          gsap.to(rotavatorBodyRef.current, {
            y: 1.5,
            duration: 0.16 / speedMultiplier,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
          });
        }
      }

      if (serviceMode === 'cultivator' && cultivatorTinesRef.current) {
        gsap.to(cultivatorTinesRef.current, {
          x: 2,
          y: -2,
          rotation: -1.5,
          duration: 0.18 / speedMultiplier,
          repeat: -1,
          yoyo: true,
          ease: 'power1.inOut',
          transformOrigin: 'top center'
        });
      }

      if (serviceMode === 'harvester' || activeModel.id === 'kartar-4000') {
        if (harvesterReelRef.current) {
          gsap.to(harvesterReelRef.current, {
            rotation: 360,
            duration: 1.1 / speedMultiplier,
            repeat: -1,
            ease: 'none',
            transformOrigin: '312px 124px'
          });
        }
        if (harvesterCropsRef.current) {
          gsap.to(harvesterCropsRef.current, {
            x: -45,
            duration: 0.9 / speedMultiplier,
            repeat: -1,
            ease: 'none'
          });
        }
      }

      if (serviceMode === 'baler') {
        if (balerPickupRef.current) {
          gsap.to(balerPickupRef.current, {
            rotation: 360,
            duration: 0.55 / speedMultiplier,
            repeat: -1,
            ease: 'none',
            transformOrigin: '26px 138px'
          });
        }
        if (strawBaleRef.current) {
          gsap.to(strawBaleRef.current, {
            y: -3,
            rotation: -5,
            duration: 0.35 / speedMultiplier,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            transformOrigin: '-48px 138px'
          });
        }
      }

      if (serviceMode === 'seeder' && seederWheelRef.current) {
        gsap.to(seederWheelRef.current, {
          rotation: 360,
          duration: 0.85 / speedMultiplier,
          repeat: -1,
          ease: 'none',
          transformOrigin: '-10px 140px'
        });
      }

      if (serviceMode === 'trailer' && trailerChassisRef.current) {
        gsap.to(trailerChassisRef.current, {
          y: -3,
          rotation: 0.7,
          duration: 0.36 / speedMultiplier,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          transformOrigin: 'right bottom'
        });
      }

      // Exhaust Smoke Interval
      const smokeInterval = setInterval(() => {
        if (!smokeContainerRef.current || !isPlaying) return;
        const puff = document.createElement('div');
        puff.className = 'scene-smoke-puff';
        smokeContainerRef.current.appendChild(puff);

        const offsetX = (Math.random() - 0.5) * 6;
        gsap.fromTo(
          puff,
          {
            x: offsetX,
            y: 0,
            scale: 0.35,
            opacity: 0.7
          },
          {
            x: -28 - Math.random() * 22,
            y: -34 - Math.random() * 18,
            scale: 1.7,
            opacity: 0,
            duration: 1.2 / speedMultiplier,
            ease: 'power1.out',
            onComplete: () => {
              if (puff.parentNode) puff.parentNode.removeChild(puff);
            }
          }
        );
      }, 260 / speedMultiplier);

      // Dust Particles Interval
      const dustInterval = setInterval(() => {
        if (!dustContainerRef.current || !isPlaying) return;
        const dust = document.createElement('div');
        dust.className = 'scene-dust-particle';
        dustContainerRef.current.appendChild(dust);

        gsap.fromTo(
          dust,
          {
            x: 0,
            y: 0,
            scale: 0.3,
            opacity: 0.65
          },
          {
            x: -22 - Math.random() * 20,
            y: -12 - Math.random() * 10,
            scale: 1.3,
            opacity: 0,
            duration: 0.65 / speedMultiplier,
            ease: 'power2.out',
            onComplete: () => {
              if (dust.parentNode) dust.parentNode.removeChild(dust);
            }
          }
        );
      }, 200 / speedMultiplier);

      if (!isPlaying) {
        if (wheelTween) wheelTween.pause();
        if (chassisTween) chassisTween.pause();
        if (farmerTween) farmerTween.pause();
        if (steerTween) steerTween.pause();
        if (turbanTween) turbanTween.pause();
        if (groundTween) groundTween.pause();
      }

      return () => {
        clearInterval(smokeInterval);
        clearInterval(dustInterval);
      };
    }, sceneWrapperRef);

    return () => ctx.revert();
  }, [serviceMode, activeModel.id, isPlaying, speedMultiplier]);

  const togglePlay = () => setIsPlaying(prev => !prev);
  const toggleSpeed = () => setSpeedMultiplier(prev => (prev === 1 ? 1.75 : 1));

  const isCombineHarvester = serviceMode === 'harvester' || activeModel.id === 'kartar-4000';

  return (
    <div className="tractor-video-card" ref={sceneWrapperRef}>
      {/* Top Header HUD Bar */}
      <div className="video-card-top-bar">
        <div className="video-category-tag">
          <span className="category-tag-icon">{currentServiceConfig.icon}</span>
          <span className="category-tag-text">
            {isTe ? currentServiceConfig.labelTe : currentServiceConfig.labelEn}
          </span>
        </div>

        <div className="video-hud-actions">
          <button
            type="button"
            className="video-action-pill"
            onClick={toggleSpeed}
            title={speedMultiplier === 1 ? 'Switch to Turbo 2x speed' : 'Switch to 1x normal speed'}
          >
            ⚡ {speedMultiplier === 1 ? '1x Normal' : '2x Turbo'}
          </button>
          <button
            type="button"
            className="video-action-pill"
            onClick={togglePlay}
            title={isPlaying ? 'Pause animation' : 'Play animation'}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
        </div>
      </div>

      {/* Main Animated Scene Viewport */}
      <div className="video-stage-viewport">
        {/* Layer 1: Agricultural Sky & Sun Rays */}
        <div className="scene-sky-backdrop">
          <div className="scene-sun-sphere" ref={sunRaysRef}>
            <span className="sun-inner-glow" />
          </div>
          <div className="scene-distant-hills" />
          <div className="scene-field-horizon">
            <span className="horizon-crop-icon">🌾</span>
            <span className="horizon-crop-icon">🌴</span>
            <span className="horizon-crop-icon">🌾</span>
            <span className="horizon-crop-icon">🌴</span>
            <span className="horizon-crop-icon">🌾</span>
          </div>
        </div>

        {/* Layer 2: Animated SVG Scene */}
        <div className="scene-stage-actors">
          <div
            className="scene-smoke-emitter"
            ref={smokeContainerRef}
            style={{ left: isCombineHarvester ? '38%' : '68%' }}
          />

          <div className="scene-dust-emitter" ref={dustContainerRef} />

          <svg
            className="scene-tractor-svg"
            viewBox="-55 0 405 190"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="metalEngineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>

              <linearGradient id="ploughSteelGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="40%" stopColor="#cbd5e1" />
                <stop offset="80%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>

              <radialGradient id="tireRubberGradient" cx="50%" cy="50%" r="50%">
                <stop offset="65%" stopColor="#1e293b" />
                <stop offset="90%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </radialGradient>

              <linearGradient id="goldenRimGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="60%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#a16207" />
              </linearGradient>

              <linearGradient id="headlightBeamGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#fde047" stopOpacity="0.85" />
                <stop offset="60%" stopColor="#fde047" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
              </linearGradient>

              <linearGradient id="harvesterGlass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.5" />
              </linearGradient>

              <linearGradient id="kartarGreen" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="60%" stopColor="#16a34a" />
                <stop offset="100%" stopColor="#15803d" />
              </linearGradient>
            </defs>

            {/* COMBINE HARVESTER (When Harvester selected or Kartar 4000 model chosen) */}
            {isCombineHarvester ? (
              <g id="combineHarvesterGroup">
                <path
                  d="M70 70 L235 70 L260 95 L260 134 L60 134 L60 90 Z"
                  fill="url(#kartarGreen)"
                  stroke="#14532d"
                  strokeWidth="2"
                />

                <path d="M70 95 L255 95 L255 102 L70 102 Z" fill="#eab308" />
                <text x="115" y="88" fill="#ffffff" fontSize="9" fontWeight="900" letterSpacing="1">
                  KARTAR 4000
                </text>

                <rect x="95" y="44" width="6" height="28" rx="2" fill="#1e293b" />
                <ellipse cx="98" cy="43" rx="4" ry="2" fill="#475569" />

                <g id="unloadingAuger">
                  <path d="M160 55 L45 35 L45 42 L160 62 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
                  <polygon points="45,35 32,48 38,50 48,42" fill="#1e293b" />
                  <circle cx="160" cy="58" r="7" fill="#ca8a04" />
                </g>

                <path
                  d="M195 50 L255 50 L265 95 L195 95 Z"
                  fill="url(#harvesterGlass)"
                  stroke="#0284c7"
                  strokeWidth="2"
                />
                <rect x="190" y="45" width="75" height="7" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />

                <g transform="translate(68, -12)">
                  <circle cx="140" cy="67" r="10" fill="#f59e0b" />
                  <ellipse cx="140" cy="58" rx="13" ry="8" fill="#f97316" />
                  <path d="M128 58 Q118 56 112 61" stroke="#ea580c" strokeWidth="3" fill="none" />
                  <path d="M136 78 C136 68 152 68 152 78 L152 94 L132 94 Z" fill="#f8fafc" />
                  <ellipse cx="162" cy="76" rx="8" ry="3" fill="#1e293b" transform="rotate(-25 162 76)" />
                  <line x1="150" y1="84" x2="162" y2="76" stroke="#0f172a" strokeWidth="3" />
                </g>

                <polygon points="255,105 296,128 296,138 255,124" fill="#15803d" stroke="#14532d" strokeWidth="1.5" />

                <g ref={frontWheelRef} style={{ transformOrigin: '225px 132px' }}>
                  <circle cx="225" cy="132" r="32" fill="url(#tireRubberGradient)" />
                  <circle cx="225" cy="132" r="28" stroke="#475569" strokeWidth="5" strokeDasharray="10 6" fill="none" />
                  <circle cx="225" cy="132" r="18" fill="url(#goldenRimGradient)" stroke="#854d0e" strokeWidth="1.5" />
                  <circle cx="225" cy="132" r="6" fill="#1e293b" />
                </g>
                <g ref={rearWheelRef} style={{ transformOrigin: '95px 138px' }}>
                  <circle cx="95" cy="138" r="21" fill="url(#tireRubberGradient)" />
                  <circle cx="95" cy="138" r="19" stroke="#334155" strokeWidth="3" strokeDasharray="6 4" fill="none" />
                  <circle cx="95" cy="138" r="11" fill="url(#goldenRimGradient)" stroke="#78350f" strokeWidth="1.5" />
                  <circle cx="95" cy="138" r="4" fill="#1e293b" />
                </g>

                <polygon points="292,138 335,142 338,146 290,146" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
                <polygon points="296,132 328,138 328,142 296,138" fill="#facc15" />

                <g id="harvesterReel" ref={harvesterReelRef} style={{ transformOrigin: '312px 124px' }}>
                  <circle cx="312" cy="124" r="4" fill="#1e293b" />
                  {[0, 72, 144, 216, 288].map((angle, idx) => {
                    const rad = (angle * Math.PI) / 180;
                    const x = 312 + Math.cos(rad) * 20;
                    const y = 124 + Math.sin(rad) * 20;
                    return (
                      <g key={idx}>
                        <line x1="312" y1="124" x2={x} y2={y} stroke="#ca8a04" strokeWidth="2" />
                        <circle cx={x} cy={y} r="3" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
                        <line x1={x} y1={y} x2={x + 4} y2={y + 5} stroke="#1e293b" strokeWidth="1.5" />
                      </g>
                    );
                  })}
                  <circle cx="312" cy="124" r="16" stroke="#ca8a04" strokeWidth="1.2" strokeDasharray="4 4" fill="none" />
                </g>

                <g ref={harvesterCropsRef}>
                  <text x="326" y="146" fontSize="14">🌽</text>
                  <text x="342" y="146" fontSize="14">🌾</text>
                </g>
              </g>
            ) : (
              /* AGRICULTURAL TRACTOR (Styled in Selected Model's Authentic Colors) */
              <g id="tractorWithImplement">
                {/* 1. Plough Implement */}
                {serviceMode === 'plough' && (
                  <g id="ploughImplement" ref={ploughRef}>
                    <path d="M75 116 L52 118 L46 126 L75 126" fill="#334155" stroke="#1e293b" strokeWidth="2" />
                    <line x1="75" y1="110" x2="52" y2="118" stroke="#64748b" strokeWidth="3" />
                    <path d="M52 118 L-8 140" stroke="#b91c1c" strokeWidth="7" strokeLinecap="round" />
                    <line x1="44" y1="123" x2="44" y2="142" stroke="#1e293b" strokeWidth="4.5" />
                    <line x1="24" y1="129" x2="24" y2="145" stroke="#1e293b" strokeWidth="4.5" />
                    <line x1="4" y1="135" x2="4" y2="148" stroke="#1e293b" strokeWidth="4.5" />

                    <g ref={ploughDiscsRef}>
                      <g transform="translate(44, 142) rotate(-22)">
                        <ellipse cx="0" cy="0" rx="13" ry="16" fill="url(#ploughSteelGradient)" stroke="#0f172a" strokeWidth="1.8" />
                        <circle cx="0" cy="0" r="4" fill="#334155" stroke="#cbd5e1" strokeWidth="1" />
                        <path d="M-6 -10 A 10 13 0 0 1 -6 10" stroke="#f8fafc" strokeWidth="1.5" strokeOpacity="0.7" fill="none" />
                      </g>
                      <g transform="translate(24, 145) rotate(-22)">
                        <ellipse cx="0" cy="0" rx="13" ry="16" fill="url(#ploughSteelGradient)" stroke="#0f172a" strokeWidth="1.8" />
                        <circle cx="0" cy="0" r="4" fill="#334155" stroke="#cbd5e1" strokeWidth="1" />
                        <path d="M-6 -10 A 10 13 0 0 1 -6 10" stroke="#f8fafc" strokeWidth="1.5" strokeOpacity="0.7" fill="none" />
                      </g>
                      <g transform="translate(4, 148) rotate(-22)">
                        <ellipse cx="0" cy="0" rx="13" ry="16" fill="url(#ploughSteelGradient)" stroke="#0f172a" strokeWidth="1.8" />
                        <circle cx="0" cy="0" r="4" fill="#334155" stroke="#cbd5e1" strokeWidth="1" />
                        <path d="M-6 -10 A 10 13 0 0 1 -6 10" stroke="#f8fafc" strokeWidth="1.5" strokeOpacity="0.7" fill="none" />
                      </g>
                    </g>

                    <path d="M42 144 Q38 138 32 141 Q28 147 38 149 Z" fill="#78350f" />
                    <path d="M22 147 Q18 141 12 144 Q8 150 18 152 Z" fill="#78350f" />
                    <path d="M2 150 Q-2 144 -8 147 Q-12 153 -2 155 Z" fill="#78350f" />
                  </g>
                )}

                {/* 2. Rotavator Implement */}
                {serviceMode === 'rotavator' && (
                  <g id="rotavatorImplement">
                    <line x1="75" y1="122" x2="48" y2="124" stroke="#1e293b" strokeWidth="4.5" strokeDasharray="4 2" />
                    <path d="M75 116 L48 116 L48 126" stroke="#475569" strokeWidth="3" fill="none" />

                    <g ref={rotavatorBodyRef}>
                      <rect x="42" y="112" width="14" height="15" rx="3" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                      <circle cx="49" cy="119" r="3.5" fill="#eab308" />
                      <path d="M52 120 C42 110 6 110 0 126 L52 126 Z" fill="#2563eb" stroke="#1d4ed8" strokeWidth="2" />
                      <line x1="6" y1="121" x2="48" y2="121" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" />
                      <path d="M0 126 L-14 142 L-9 144 L4 126 Z" fill="#1d4ed8" stroke="#1e40af" strokeWidth="1" />
                      <path d="M48 126 L48 144 L36 146" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
                    </g>

                    <g ref={rotavatorBladesRef} style={{ transformOrigin: '24px 136px' }}>
                      <circle cx="24" cy="136" r="4.5" fill="#0f172a" />
                      <path d="M24 136 L24 122 L17 122" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                      <path d="M24 136 L38 136 L38 129" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                      <path d="M24 136 L24 150 L31 150" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                      <path d="M24 136 L10 136 L10 143" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    </g>

                    <circle cx="-16" cy="140" r="2.5" fill="#854d0e" />
                    <circle cx="-22" cy="143" r="2" fill="#a16207" />
                    <circle cx="-18" cy="146" r="3" fill="#78350f" />
                  </g>
                )}

                {/* 3. Cultivator Implement */}
                {serviceMode === 'cultivator' && (
                  <g id="cultivatorImplement">
                    <line x1="75" y1="114" x2="52" y2="114" stroke="#334155" strokeWidth="3.5" />
                    <line x1="75" y1="124" x2="52" y2="120" stroke="#334155" strokeWidth="3.5" />
                    <rect x="0" y="116" width="54" height="6" rx="2" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
                    <rect x="6" y="110" width="42" height="5" rx="1.5" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />

                    <g transform="translate(-10, 138)">
                      <circle cx="0" cy="0" r="11" fill="url(#tireRubberGradient)" />
                      <circle cx="0" cy="0" r="6" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
                      <line x1="0" y1="-16" x2="0" y2="0" stroke="#334155" strokeWidth="2.5" />
                    </g>

                    <g ref={cultivatorTinesRef}>
                      {[46, 32, 18, 4].map((posX, i) => (
                        <g key={i} transform={`translate(${posX}, 122)`}>
                          <circle cx="0" cy="4" r="4.5" fill="none" stroke="#eab308" strokeWidth="2" strokeDasharray="3 1" />
                          <path d="M0 8 C1 16 -6 22 -7 26" stroke="#1e293b" strokeWidth="3.2" fill="none" strokeLinecap="round" />
                          <polygon points="-7,26 -11,28 -7,22 -3,28" fill="#e2e8f0" stroke="#475569" strokeWidth="0.8" />
                        </g>
                      ))}
                    </g>
                  </g>
                )}

                {/* 4. Straw Baler Implement */}
                {serviceMode === 'baler' && (
                  <g id="balerImplement">
                    <line x1="75" y1="124" x2="32" y2="128" stroke="#334155" strokeWidth="5" />
                    <ellipse cx="2" cy="116" rx="34" ry="26" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
                    <path d="M-8 92 C-14 104 -14 128 -8 140" stroke="#ca8a04" strokeWidth="2" fill="none" />
                    <rect x="-28" y="106" width="18" height="20" rx="2" fill="#15803d" />
                    <text x="-25" y="119" fill="#ffffff" fontSize="7" fontWeight="900">BALER</text>

                    <g ref={balerWheelRef} style={{ transformOrigin: '4px 138px' }}>
                      <circle cx="4" cy="138" r="15" fill="url(#tireRubberGradient)" />
                      <circle cx="4" cy="138" r="8" fill="#eab308" stroke="#78350f" strokeWidth="1.2" />
                      <circle cx="4" cy="138" r="3" fill="#1e293b" />
                    </g>

                    <g ref={balerPickupRef} style={{ transformOrigin: '26px 138px' }}>
                      <circle cx="26" cy="138" r="7" fill="#1e293b" stroke="#ca8a04" strokeWidth="1.5" />
                      <line x1="26" y1="131" x2="26" y2="145" stroke="#eab308" strokeWidth="2" />
                      <line x1="19" y1="138" x2="33" y2="138" stroke="#eab308" strokeWidth="2" />
                    </g>

                    <g ref={strawBaleRef} style={{ transformOrigin: '-48px 138px' }}>
                      <ellipse cx="-48" cy="138" rx="14" ry="14" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.8" />
                      <circle cx="-48" cy="138" r="9" stroke="#eab308" strokeWidth="1.2" fill="none" />
                      <circle cx="-48" cy="138" r="4" stroke="#ca8a04" strokeWidth="1.2" fill="none" />
                      <line x1="-59" y1="134" x2="-37" y2="134" stroke="#2563eb" strokeWidth="1.5" />
                      <line x1="-59" y1="142" x2="-37" y2="142" stroke="#2563eb" strokeWidth="1.5" />
                    </g>
                  </g>
                )}

                {/* 5. Seed Planter Implement */}
                {serviceMode === 'seeder' && (
                  <g id="seederImplement">
                    <line x1="75" y1="120" x2="48" y2="120" stroke="#334155" strokeWidth="4" />
                    <line x1="75" y1="126" x2="48" y2="126" stroke="#334155" strokeWidth="4" />
                    <rect x="0" y="118" width="52" height="6" rx="2" fill="#1e293b" />

                    <rect x="26" y="98" width="22" height="18" rx="2" fill="#22c55e" stroke="#15803d" strokeWidth="1.5" />
                    <rect x="28" y="95" width="18" height="4" rx="1" fill="#cbd5e1" />
                    <text x="29" y="110" fill="#ffffff" fontSize="6.5" fontWeight="800">SEED</text>

                    <rect x="4" y="98" width="18" height="18" rx="2" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5" />
                    <rect x="6" y="95" width="14" height="4" rx="1" fill="#cbd5e1" />
                    <text x="6.5" y="110" fill="#ffffff" fontSize="6.5" fontWeight="800">FERT</text>

                    <path d="M38 116 Q34 130 32 144" stroke="#94a3b8" strokeWidth="3" fill="none" strokeDasharray="2 1" />
                    <path d="M26 116 Q22 130 18 144" stroke="#94a3b8" strokeWidth="3" fill="none" strokeDasharray="2 1" />
                    <path d="M12 116 Q8 130 4 144" stroke="#94a3b8" strokeWidth="3" fill="none" strokeDasharray="2 1" />

                    <ellipse cx="32" cy="144" rx="6" ry="8" fill="#475569" stroke="#cbd5e1" strokeWidth="1" />
                    <ellipse cx="18" cy="144" rx="6" ry="8" fill="#475569" stroke="#cbd5e1" strokeWidth="1" />
                    <ellipse cx="4" cy="144" rx="6" ry="8" fill="#475569" stroke="#cbd5e1" strokeWidth="1" />

                    <g ref={seederWheelRef} style={{ transformOrigin: '-10px 140px' }}>
                      <circle cx="-10" cy="140" r="11" fill="url(#tireRubberGradient)" />
                      <circle cx="-10" cy="140" r="5" fill="#e2e8f0" stroke="#334155" strokeWidth="1" />
                    </g>

                    <circle cx="31" cy="147" r="1.8" fill="#facc15" />
                    <circle cx="17" cy="147" r="1.8" fill="#facc15" />
                    <circle cx="3" cy="147" r="1.8" fill="#facc15" />
                  </g>
                )}

                {/* 6. Trailer Trolley Implement */}
                {serviceMode === 'trailer' && (
                  <g id="trailerImplement" ref={trailerChassisRef}>
                    <polygon points="75,124 45,122 45,127 75,127" fill="#334155" />
                    <circle cx="72" cy="125" r="3" fill="#cbd5e1" />
                    <rect x="-52" y="104" width="96" height="26" rx="2" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="2" />
                    
                    <line x1="-34" y1="104" x2="-34" y2="130" stroke="#7f1d1d" strokeWidth="2" />
                    <line x1="-16" y1="104" x2="-16" y2="130" stroke="#7f1d1d" strokeWidth="2" />
                    <line x1="2" y1="104" x2="2" y2="130" stroke="#7f1d1d" strokeWidth="2" />
                    <line x1="20" y1="104" x2="20" y2="130" stroke="#7f1d1d" strokeWidth="2" />

                    <rect x="-51" y="125" width="94" height="4" fill="#fef08a" />
                    <line x1="-40" y1="125" x2="-36" y2="129" stroke="#b91c1c" strokeWidth="2" />
                    <line x1="-20" y1="125" x2="-16" y2="129" stroke="#b91c1c" strokeWidth="2" />
                    <line x1="0" y1="125" x2="4" y2="129" stroke="#b91c1c" strokeWidth="2" />
                    <line x1="20" y1="125" x2="24" y2="129" stroke="#b91c1c" strokeWidth="2" />

                    <ellipse cx="-38" cy="98" rx="13" ry="8" fill="#d97706" stroke="#92400e" strokeWidth="1" />
                    <ellipse cx="-16" cy="97" rx="14" ry="8" fill="#b45309" stroke="#78350f" strokeWidth="1" />
                    <ellipse cx="8" cy="97" rx="14" ry="8" fill="#d97706" stroke="#92400e" strokeWidth="1" />
                    <ellipse cx="28" cy="98" rx="13" ry="8" fill="#b45309" stroke="#78350f" strokeWidth="1" />
                    <ellipse cx="-26" cy="88" rx="13" ry="7" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
                    <ellipse cx="-4" cy="87" rx="14" ry="7" fill="#d97706" stroke="#92400e" strokeWidth="1" />
                    <ellipse cx="18" cy="88" rx="13" ry="7" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
                    <line x1="-48" y1="104" x2="-14" y2="82" stroke="#451a03" strokeWidth="1.2" />
                    <line x1="-14" y1="82" x2="18" y2="104" stroke="#451a03" strokeWidth="1.2" />
                    <line x1="18" y1="82" x2="42" y2="104" stroke="#451a03" strokeWidth="1.2" />

                    <g ref={trailerWheel1Ref} style={{ transformOrigin: '-24px 136px' }}>
                      <circle cx="-24" cy="136" r="17" fill="url(#tireRubberGradient)" />
                      <circle cx="-24" cy="136" r="14" stroke="#334155" strokeWidth="2.5" strokeDasharray="5 3" fill="none" />
                      <circle cx="-24" cy="136" r="9" fill="url(#goldenRimGradient)" stroke="#78350f" strokeWidth="1.2" />
                      <circle cx="-24" cy="136" r="3.5" fill="#1e293b" />
                    </g>
                    <g ref={trailerWheel2Ref} style={{ transformOrigin: '18px 136px' }}>
                      <circle cx="18" cy="136" r="17" fill="url(#tireRubberGradient)" />
                      <circle cx="18" cy="136" r="14" stroke="#334155" strokeWidth="2.5" strokeDasharray="5 3" fill="none" />
                      <circle cx="18" cy="136" r="9" fill="url(#goldenRimGradient)" stroke="#78350f" strokeWidth="1.2" />
                      <circle cx="18" cy="136" r="3.5" fill="#1e293b" />
                    </g>
                  </g>
                )}

                {/* Headlight Forward Cone */}
                <polygon
                  points="285,118 340,105 340,150 285,125"
                  fill="url(#headlightBeamGradient)"
                  className="headlight-beam"
                />

                {/* TRACTOR CHASSIS & BONNET (Dynamic Brand Paint & Decals) */}
                <g id="tractorChassis" ref={tractorChassisRef}>
                  <rect x="75" y="112" width="195" height="18" rx="4" fill={activeModel.chassisColor || '#334155'} />
                  
                  {/* Engine Bonnet / Hood */}
                  <path
                    d="M175 92 L280 92 C285 92 288 95 288 100 L288 126 C288 128 286 130 284 130 L175 130 Z"
                    fill={activeModel.primaryColor}
                  />

                  {/* Tractor Model Decal Badge on Bonnet */}
                  <rect x="188" y="103" width="82" height="11" rx="2" fill="rgba(0,0,0,0.45)" />
                  <text
                    x="229"
                    y="111"
                    fill="#ffffff"
                    fontSize="6.2"
                    fontWeight="900"
                    textAnchor="middle"
                    letterSpacing="0.4"
                  >
                    {activeModel.badgeText}
                  </text>

                  {/* Grille & Emblem */}
                  <rect x="282" y="98" width="5" height="28" rx="2" fill="#cbd5e1" />
                  <line x1="284" y1="102" x2="284" y2="122" stroke="#475569" strokeWidth="2" strokeDasharray="2 2" />
                  <circle cx="282" cy="120" r="5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
                  
                  {/* Rear Wheel Arch Fender */}
                  <path
                    d="M60 115 C60 70 120 70 140 115 L124 118 C110 85 85 85 76 118 Z"
                    fill={activeModel.fenderColor || activeModel.primaryColor}
                  />

                  <rect x="110" y="125" width="60" height="7" rx="2" fill="#334155" />
                  <rect x="135" y="132" width="22" height="4" rx="1" fill="#64748b" />
                  <line x1="102" y1="125" x2="102" y2="108" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />
                  <path d="M92 108 L114 108 C116 108 118 106 118 104 L118 90 C118 88 115 86 112 86 L108 86 C105 86 102 89 102 92 Z" fill="#0f172a" />

                  {/* Exhaust Pipe */}
                  <g id="exhaustStack">
                    <rect x="238" y="52" width="7" height="42" rx="2" fill="#1e293b" />
                    <path d="M236 52 L247 52 L245 47 L238 47 Z" fill="#475569" />
                    <ellipse cx="241" cy="46" rx="5" ry="2" fill="#64748b" />
                  </g>

                  {/* Steering */}
                  <g id="steeringAssembly" ref={steeringRef}>
                    <line x1="152" y1="110" x2="168" y2="88" stroke="#0f172a" strokeWidth="4.5" strokeLinecap="round" />
                    <ellipse cx="170" cy="86" rx="9" ry="3.5" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" transform="rotate(-30 170 86)" />
                  </g>
                </g>

                {/* FARMER DRIVER */}
                <g id="farmerDriver" ref={farmerRef}>
                  <path
                    d="M112 104 C112 85 125 78 138 78 C148 78 156 86 156 104 L148 120 L118 120 Z"
                    fill="#f8fafc"
                    stroke="#cbd5e1"
                    strokeWidth="1.2"
                  />
                  <line x1="138" y1="78" x2="140" y2="98" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
                  <path
                    d="M138 88 L160 92 L168 87"
                    stroke="#f8fafc"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="168" cy="87" r="4.5" fill="#f59e0b" />
                  <circle cx="140" cy="65" r="11" fill="#f59e0b" />
                  <path d="M137 68 C140 70 144 70 147 67" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="144" cy="62" r="1.5" fill="#0f172a" />
                  <path d="M140 71 Q143 74 146 71" stroke="#b45309" strokeWidth="1" fill="none" />

                  <g id="turbanHead">
                    <ellipse cx="140" cy="56" rx="14" ry="9" fill="#f97316" />
                    <ellipse cx="142" cy="53" rx="12" ry="7" fill="#fb923c" />
                    <ellipse cx="136" cy="55" rx="8" ry="7" fill="#ea580c" />
                    <path d="M132 58 Q142 61 150 56" stroke="#fbbf24" strokeWidth="2" fill="none" />
                    <path
                      id="turbanTail"
                      ref={turbanTailRef}
                      d="M128 56 Q116 54 110 60 Q118 64 126 62 Z"
                      fill="#ea580c"
                    />
                  </g>
                </g>

                {/* TRACTOR WHEELS */}
                <g id="frontWheel" ref={frontWheelRef} style={{ transformOrigin: '252px 134px' }}>
                  <circle cx="252" cy="134" r="23" fill="url(#tireRubberGradient)" />
                  <circle cx="252" cy="134" r="21" stroke="#334155" strokeWidth="3" strokeDasharray="6 4" fill="none" />
                  <circle cx="252" cy="134" r="12" fill={activeModel.rimColor || '#eab308'} stroke="#78350f" strokeWidth="1.5" />
                  <circle cx="252" cy="134" r="4.5" fill="#1e293b" />
                  <line x1="252" y1="123" x2="252" y2="145" stroke="#78350f" strokeWidth="2" />
                  <line x1="241" y1="134" x2="263" y2="134" stroke="#78350f" strokeWidth="2" />
                </g>

                <g id="rearWheel" ref={rearWheelRef} style={{ transformOrigin: '94px 122px' }}>
                  <circle cx="94" cy="122" r="46" fill="url(#tireRubberGradient)" />
                  <circle cx="94" cy="122" r="42" stroke="#475569" strokeWidth="6" strokeDasharray="12 7" fill="none" />
                  <circle cx="94" cy="122" r="33" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
                  <circle cx="94" cy="122" r="27" fill={activeModel.rimColor || '#eab308'} stroke="#854d0e" strokeWidth="2" />
                  <circle cx="94" cy="122" r="9" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                  <circle cx="94" cy="108" r="2" fill="#0f172a" />
                  <circle cx="106" cy="115" r="2" fill="#0f172a" />
                  <circle cx="106" cy="129" r="2" fill="#0f172a" />
                  <circle cx="94" cy="136" r="2" fill="#0f172a" />
                  <circle cx="82" cy="129" r="2" fill="#0f172a" />
                  <circle cx="82" cy="115" r="2" fill="#0f172a" />
                </g>
              </g>
            )}
          </svg>
        </div>

        {/* Layer 3: Moving Farmland Soil & Furrow Tracks */}
        <div className="scene-ground-container">
          <div className="scene-ground-track" ref={groundTrackRef}>
            {[...Array(20)].map((_, i) => (
              <span key={i} className="ground-furrow-pattern">
                <span className="soil-track-bar" />
                <span className="soil-sprout-mark">{currentServiceConfig.sproutIcon}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Horizontal Interactive Tractor Model Strip (Allows farmer to see & switch tractor models) */}
      <div className="video-model-strip-wrap">
        <span className="video-model-strip-label">
          {isTe ? 'ట్రాక్టర్ మోడల్స్:' : 'TRACTOR MODELS:'}
        </span>
        <div className="video-model-strip">
          {TRACTOR_MODELS.map((m) => {
            const isModelActive = activeModel.id === m.id;
            return (
              <button
                key={m.id}
                type="button"
                className={`video-model-pill ${isModelActive ? 'active' : ''}`}
                onClick={() => handleSelectModel(m)}
                title={m.modelName}
              >
                <span
                  className="model-pill-dot"
                  style={{ backgroundColor: m.primaryColor }}
                />
                <span className="model-pill-name">{m.shortName}</span>
                <span className="model-pill-hp">{m.hp}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Video Telemetry Footer (Clearly displaying Model Name + Implement) */}
      <div className="video-card-bottom-bar">
        <div className="video-spec-badge">
          <span className="spec-dot" style={{ color: activeModel.primaryColor }}>●</span>
          <span className="spec-model-brand">
            {activeModel.modelName} ({activeModel.hp})
          </span>
          {serviceMode !== 'all' && (
            <span className="spec-implement-tag">
              • {isTe ? currentServiceConfig.implementTe : currentServiceConfig.implementEn}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
