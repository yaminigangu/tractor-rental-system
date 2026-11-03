import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function TractorFarmerScene({ language = 'en' }) {
  const isTe = language === 'te';

  // Refs for GSAP animation targets
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

  // Player controls
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1); // 1 = normal, 2 = turbo

  useEffect(() => {
    // Master GSAP Context
    const ctx = gsap.context(() => {
      // 1. Continuous Wheel Spin (Front & Big Rear Wheel)
      const wheelTween = gsap.to([frontWheelRef.current, rearWheelRef.current], {
        rotation: 360,
        duration: 1.1 / speedMultiplier,
        repeat: -1,
        ease: 'none',
        transformOrigin: '50% 50%'
      });

      // 2. Tractor Suspension Engine Chug & Terrain Vibration
      const chassisTween = gsap.to(tractorChassisRef.current, {
        y: -4,
        rotation: 0.9,
        duration: 0.32 / speedMultiplier,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        transformOrigin: 'bottom center'
      });

      // 3. Farmer Sitting & Bobbing with Driver Seat Spring
      const farmerTween = gsap.to(farmerRef.current, {
        y: -3,
        rotation: -0.6,
        duration: 0.32 / speedMultiplier,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        transformOrigin: 'bottom center'
      });

      // 4. Farmer Hands & Steering Wheel Realistic Micro-Adjustment
      const steerTween = gsap.to(steeringRef.current, {
        rotation: 10,
        duration: 0.75 / speedMultiplier,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
        transformOrigin: '40% 60%'
      });

      // 5. Traditional Turban (Rumal) Flapping in the Wind
      const turbanTween = gsap.to(turbanTailRef.current, {
        rotation: -14,
        scaleX: 1.12,
        duration: 0.28 / speedMultiplier,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        transformOrigin: 'left center'
      });

      // 6. Infinite Farmland Soil & Furrow Scrolling
      const groundTween = gsap.to(groundTrackRef.current, {
        x: -96,
        duration: 0.9 / speedMultiplier,
        repeat: -1,
        ease: 'none'
      });

      // 7. Golden Telangana Sun Rays Gentle Pulse
      gsap.to(sunRaysRef.current, {
        scale: 1.08,
        opacity: 0.85,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        transformOrigin: 'center center'
      });

      // 8. Continuous Diesel Exhaust Smoke Puffs
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

      // 9. Red Mud / Soil Dust Kicked up by Rear Giant Tire
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

      // Manage playback pause/resume
      if (!isPlaying) {
        wheelTween.pause();
        chassisTween.pause();
        farmerTween.pause();
        steerTween.pause();
        turbanTween.pause();
        groundTween.pause();
      }

      return () => {
        clearInterval(smokeInterval);
        clearInterval(dustInterval);
      };
    }, sceneWrapperRef);

    return () => ctx.revert();
  }, [isPlaying, speedMultiplier]);

  const togglePlay = () => setIsPlaying(prev => !prev);
  const toggleSpeed = () => setSpeedMultiplier(prev => (prev === 1 ? 1.75 : 1));

  return (
    <div className="tractor-video-card" ref={sceneWrapperRef}>
      {/* Top Video Header HUD Bar */}
      <div className="video-card-top-bar">
        <div className="video-live-indicator">
          <span className={`live-pulse-dot ${isPlaying ? 'active' : ''}`} />
          <span className="live-tag-text">
            {isTe ? 'లైవ్ అగ్రి-డ్రైవ్' : 'LIVE AGRI-DRIVE'} • GSAP 60FPS
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

        {/* Layer 2: Animated SVG Scene (Tractor + Farmer) */}
        <div className="scene-stage-actors">
          {/* Exhaust Smoke Puffs Container */}
          <div className="scene-smoke-emitter" ref={smokeContainerRef} />

          {/* Wheel Dust Particles Container */}
          <div className="scene-dust-emitter" ref={dustContainerRef} />

          {/* SVG Tractor + Farmer Model */}
          <svg
            className="scene-tractor-svg"
            viewBox="0 0 340 190"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Vibrant Mahindra Agricultural Red Gradient */}
              <linearGradient id="tractorRedGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#991b1b" />
              </linearGradient>

              {/* Metallic Grille & Engine Block */}
              <linearGradient id="metalEngineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>

              {/* Heavy Duty Tire Rubber */}
              <radialGradient id="tireRubberGradient" cx="50%" cy="50%" r="50%">
                <stop offset="65%" stopColor="#1e293b" />
                <stop offset="90%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </radialGradient>

              {/* Golden Wheel Rim */}
              <linearGradient id="goldenRimGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="60%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#a16207" />
              </linearGradient>

              {/* Headlight Golden Beam */}
              <linearGradient id="headlightBeamGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#fde047" stopOpacity="0.85" />
                <stop offset="60%" stopColor="#fde047" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Headlight Forward Beam Cone */}
            <polygon
              points="285,118 340,105 340,150 285,125"
              fill="url(#headlightBeamGradient)"
              className="headlight-beam"
            />

            {/* Tractor Body & Chassis (Bounces with Engine Chug) */}
            <g id="tractorChassis" ref={tractorChassisRef}>
              {/* Heavy Chassis Frame */}
              <rect x="75" y="112" width="195" height="18" rx="4" fill="url(#metalEngineGradient)" />

              {/* Engine Hood / Bonnet */}
              <path
                d="M175 92 L280 92 C285 92 288 95 288 100 L288 126 C288 128 286 130 284 130 L175 130 Z"
                fill="url(#tractorRedGradient)"
              />

              {/* Chrome Grille and Front Emblem */}
              <rect x="282" y="98" width="5" height="28" rx="2" fill="#cbd5e1" />
              <line x1="284" y1="102" x2="284" y2="122" stroke="#475569" strokeWidth="2" strokeDasharray="2 2" />

              {/* Headlight Lamp */}
              <circle cx="282" cy="120" r="5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />

              {/* Rear Fender / Wheel Arch (Covers giant rear tire) */}
              <path
                d="M60 115 C60 70 120 70 140 115 L124 118 C110 85 85 85 76 118 Z"
                fill="url(#tractorRedGradient)"
              />

              {/* Driver Platform & Spring Footrest */}
              <rect x="110" y="125" width="60" height="7" rx="2" fill="#334155" />
              <rect x="135" y="132" width="22" height="4" rx="1" fill="#64748b" />

              {/* Driver Seat Bracket & Suspension Spring */}
              <line x1="102" y1="125" x2="102" y2="108" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />
              <path d="M92 108 L114 108 C116 108 118 106 118 104 L118 90 C118 88 115 86 112 86 L108 86 C105 86 102 89 102 92 Z" fill="#0f172a" />

              {/* Exhaust Pipe & Chimney Stack */}
              <g id="exhaustStack">
                <rect x="238" y="52" width="7" height="42" rx="2" fill="#1e293b" />
                <path d="M236 52 L247 52 L245 47 L238 47 Z" fill="#475569" />
                {/* Exhaust rain flap */}
                <ellipse cx="241" cy="46" rx="5" ry="2" fill="#64748b" />
              </g>

              {/* Steering Column & Wheel */}
              <g id="steeringAssembly" ref={steeringRef}>
                <line x1="152" y1="110" x2="168" y2="88" stroke="#0f172a" strokeWidth="4.5" strokeLinecap="round" />
                <ellipse cx="170" cy="86" rx="9" ry="3.5" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" transform="rotate(-30 170 86)" />
              </g>
            </g>

            {/* ========================================================
                FARMER CHARACTER (Animated Indian Farmer in Turban)
               ======================================================== */}
            <g id="farmerDriver" ref={farmerRef}>
              {/* Farmer Body (White Kurta Attire) */}
              <path
                d="M112 104 C112 85 125 78 138 78 C148 78 156 86 156 104 L148 120 L118 120 Z"
                fill="#f8fafc"
                stroke="#cbd5e1"
                strokeWidth="1.2"
              />
              {/* Kurta Collar button line */}
              <line x1="138" y1="78" x2="140" y2="98" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />

              {/* Farmer Arms Extending to Steering Wheel */}
              <path
                d="M138 88 L160 92 L168 87"
                stroke="#f8fafc"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Farmer Hands on Wheel */}
              <circle cx="168" cy="87" r="4.5" fill="#f59e0b" />

              {/* Farmer Neck & Face */}
              <circle cx="140" cy="65" r="11" fill="#f59e0b" />
              {/* Friendly Mustache */}
              <path d="M137 68 C140 70 144 70 147 67" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
              {/* Eye */}
              <circle cx="144" cy="62" r="1.5" fill="#0f172a" />
              {/* Smile Line */}
              <path d="M140 71 Q143 74 146 71" stroke="#b45309" strokeWidth="1" fill="none" />

              {/* Saffron / Festive Telangana Turban (Paga / Rumal) */}
              <g id="turbanHead">
                {/* Main Turban Wrap Bulbs */}
                <ellipse cx="140" cy="56" rx="14" ry="9" fill="#f97316" />
                <ellipse cx="142" cy="53" rx="12" ry="7" fill="#fb923c" />
                <ellipse cx="136" cy="55" rx="8" ry="7" fill="#ea580c" />
                {/* Front Jewel / Golden Band */}
                <path d="M132 58 Q142 61 150 56" stroke="#fbbf24" strokeWidth="2" fill="none" />

                {/* Free Turban Tail (Flaps in the wind with GSAP) */}
                <path
                  id="turbanTail"
                  ref={turbanTailRef}
                  d="M128 56 Q116 54 110 60 Q118 64 126 62 Z"
                  fill="#ea580c"
                />
              </g>
            </g>

            {/* ========================================================
                WHEELS (Spin Continuously via GSAP)
               ======================================================== */}
            {/* Front Wheel (Smaller) - Center at (252, 134) */}
            <g id="frontWheel" ref={frontWheelRef} style={{ transformOrigin: '252px 134px' }}>
              {/* Outer Rubber Tire */}
              <circle cx="252" cy="134" r="23" fill="url(#tireRubberGradient)" />
              {/* Tire Tread Ribs */}
              <circle cx="252" cy="134" r="21" stroke="#334155" strokeWidth="3" strokeDasharray="6 4" fill="none" />
              {/* Golden Wheel Hub */}
              <circle cx="252" cy="134" r="12" fill="url(#goldenRimGradient)" stroke="#78350f" strokeWidth="1.5" />
              {/* Center Axle Nut */}
              <circle cx="252" cy="134" r="4.5" fill="#1e293b" />
              <line x1="252" y1="123" x2="252" y2="145" stroke="#78350f" strokeWidth="2" />
              <line x1="241" y1="134" x2="263" y2="134" stroke="#78350f" strokeWidth="2" />
            </g>

            {/* Rear Giant Agricultural Wheel - Center at (94, 122) */}
            <g id="rearWheel" ref={rearWheelRef} style={{ transformOrigin: '94px 122px' }}>
              {/* Outer Chunky Mud Tire */}
              <circle cx="94" cy="122" r="46" fill="url(#tireRubberGradient)" />
              {/* Deep Agricultural Chevron Tread Lugs */}
              <circle cx="94" cy="122" r="42" stroke="#475569" strokeWidth="6" strokeDasharray="12 7" fill="none" />
              {/* Rim Lip */}
              <circle cx="94" cy="122" r="33" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
              {/* Heavy Duty Red / Gold Wheel Disc */}
              <circle cx="94" cy="122" r="27" fill="url(#goldenRimGradient)" stroke="#854d0e" strokeWidth="2" />
              {/* 6 Wheel Hub Bolt Nuts */}
              <circle cx="94" cy="122" r="9" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              <circle cx="94" cy="108" r="2" fill="#0f172a" />
              <circle cx="106" cy="115" r="2" fill="#0f172a" />
              <circle cx="106" cy="129" r="2" fill="#0f172a" />
              <circle cx="94" cy="136" r="2" fill="#0f172a" />
              <circle cx="82" cy="129" r="2" fill="#0f172a" />
              <circle cx="82" cy="115" r="2" fill="#0f172a" />
            </g>
          </svg>
        </div>

        {/* Layer 3: Moving Farmland Soil & Furrow Tracks */}
        <div className="scene-ground-container">
          <div className="scene-ground-track" ref={groundTrackRef}>
            {/* Repeated furrow soil lines and crop marks */}
            {[...Array(20)].map((_, i) => (
              <span key={i} className="ground-furrow-pattern">
                <span className="soil-track-bar" />
                <span className="soil-sprout-mark">🌱</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Video Telemetry Footer */}
      <div className="video-card-bottom-bar">
        <div className="video-spec-badge">
          <span className="spec-dot">●</span>
          <span>Mahindra 575 DI Sarpanch • 47 HP</span>
        </div>
        <div className="video-spec-badge secondary">
          <span>⚡ ~15 Mins Quick Village Dispatch</span>
        </div>
      </div>
    </div>
  );
}
