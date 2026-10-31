import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function TractorLoadingScreen({ onComplete, language = 'en' }) {
  const isTe = language === 'te';
  const containerRef = useRef(null);
  const tractorRef = useRef(null);
  const smokeContainerRef = useRef(null);
  const emojisContainerRef = useRef(null);
  const progressBarRef = useRef(null);
  const percentTextRef = useRef(null);
  const statusTextRef = useRef(null);

  const [percent, setPercent] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);

  const statusMessages = isTe
    ? [
        '🚜 తెలంగాణ గ్రామీణ ట్రాక్టర్ ఫ్లీట్‌తో అనుసంధానిస్తోంది...',
        '🌾 33 జిల్లాల ధృవీకరించబడిన యంత్రాల యజమానులను లోడ్ చేస్తోంది...',
        '⚡ సమీప గ్రామం నుండి వేగవంతమైన డెలివరీ (~15 నిమిషాలు)...',
        '🤝 0% కమీషన్ • రైతు నుండి రైతుకు అద్దె వేదిక సిద్ధం!',
        '✅ వ్యవసాయ సేవలు సిద్ధంగా ఉన్నాయి!'
      ]
    : [
        '🚜 Connecting to Telangana Village Tractor Fleet...',
        '🌾 Verifying 33 Districts RC & KYC Machinery Owners...',
        '⚡ Calculating Nearest Village Dispatch (~15 Mins)...',
        '🤝 Securing 0% Commission Farmer-to-Farmer Rates...',
        '✅ Farm Machinery Fleet Ready!'
      ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Tractor Suspension Bounce Animation (Simulates rolling across village fields)
      gsap.to(tractorRef.current, {
        y: -6,
        rotation: 1.2,
        duration: 0.35,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });

      // 2. Continuous Exhaust Smoke Puffs
      const smokeInterval = setInterval(() => {
        if (!smokeContainerRef.current) return;
        const puff = document.createElement('div');
        puff.className = 'loader-smoke-puff';
        smokeContainerRef.current.appendChild(puff);

        gsap.fromTo(
          puff,
          {
            x: 0,
            y: 0,
            scale: 0.4,
            opacity: 0.75
          },
          {
            x: -28 - Math.random() * 20,
            y: -30 - Math.random() * 15,
            scale: 1.6,
            opacity: 0,
            duration: 1.1,
            ease: 'power1.out',
            onComplete: () => {
              if (puff.parentNode) puff.parentNode.removeChild(puff);
            }
          }
        );
      }, 240);

      // 3. Sprouting Agricultural Emojis in the Tractor's Wake (🌱, 🌾, 🌽, 🚜, ⚙️, ✨)
      const emojis = ['🌱', '🌾', '🌽', '🚜', '⚙️', '✨', '🪴', '💧'];
      const emojiInterval = setInterval(() => {
        if (!emojisContainerRef.current) return;
        const emojiEl = document.createElement('span');
        emojiEl.className = 'loader-field-emoji';
        emojiEl.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        emojisContainerRef.current.appendChild(emojiEl);

        const randomX = Math.random() * 30 - 15;
        gsap.fromTo(
          emojiEl,
          {
            x: randomX,
            y: 10,
            scale: 0.2,
            opacity: 0,
            rotation: -20 + Math.random() * 40
          },
          {
            y: -40 - Math.random() * 20,
            scale: 1.25,
            opacity: 1,
            duration: 0.6,
            ease: 'back.out(2)',
            onComplete: () => {
              gsap.to(emojiEl, {
                opacity: 0,
                y: -65,
                scale: 0.8,
                duration: 0.5,
                delay: 0.2,
                ease: 'power2.in',
                onComplete: () => {
                  if (emojiEl.parentNode) emojiEl.parentNode.removeChild(emojiEl);
                }
              });
            }
          }
        );
      }, 320);

      // 4. Progress Timeline from 0 to 100%
      const progressObj = { value: 0 };
      const mainTl = gsap.timeline({
        onComplete: () => {
          clearInterval(smokeInterval);
          clearInterval(emojiInterval);

          // Elegant Exit Transition
          gsap.to(containerRef.current, {
            opacity: 0,
            scale: 1.04,
            duration: 0.45,
            ease: 'power2.inOut',
            onComplete: () => {
              if (onComplete) onComplete();
            }
          });
        }
      });

      mainTl.to(progressObj, {
        value: 100,
        duration: 2.0,
        ease: 'power1.inOut',
        onUpdate: () => {
          const currentVal = Math.round(progressObj.value);
          setPercent(currentVal);
          if (progressBarRef.current) {
            progressBarRef.current.style.width = `${currentVal}%`;
          }

          // Cycle status messages
          if (currentVal < 25) setStatusIndex(0);
          else if (currentVal < 50) setStatusIndex(1);
          else if (currentVal < 75) setStatusIndex(2);
          else if (currentVal < 95) setStatusIndex(3);
          else setStatusIndex(4);
        }
      });

      return () => {
        clearInterval(smokeInterval);
        clearInterval(emojiInterval);
      };
    }, containerRef);

    return () => ctx.revert();
  }, [isTe, onComplete]);

  const handleSkip = () => {
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        duration: 0.25,
        onComplete: () => {
          if (onComplete) onComplete();
        }
      });
    } else if (onComplete) {
      onComplete();
    }
  };

  return (
    <div ref={containerRef} className="tractor-loading-screen" role="dialog" aria-live="polite">
      {/* Background radial glow */}
      <div className="loader-bg-glow" />

      {/* Main Loader Card */}
      <div className="loader-central-card">
        {/* Top Header Badge */}
        <div className="loader-badge">
          <span className="loader-badge-pulse" />
          <span>{isTe ? 'తెలంగాణ అగ్రిరెంట్ ప్లాట్‌ఫారమ్' : 'AgriRent Machinery Network'}</span>
        </div>

        {/* Tractor Road Animation Area */}
        <div className="loader-road-area">
          {/* Sprouting Agricultural Emojis */}
          <div ref={emojisContainerRef} className="loader-emojis-container" />

          {/* Tractor Vehicle Element with Exhaust Smoke */}
          <div ref={tractorRef} className="loader-tractor-wrapper">
            {/* Silencer Smoke Emitter */}
            <div ref={smokeContainerRef} className="loader-smoke-emitter" />

            <img
              src="/tractor-line-loader.png"
              alt="Tractor Loader"
              className="loader-tractor-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/tractor1.jpeg';
              }}
            />
          </div>

          {/* Animated Road Lines */}
          <div className="loader-road-strip">
            <div className="loader-road-dashes" />
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="loader-progress-wrap">
          <div className="loader-progress-info">
            <span ref={statusTextRef} className="loader-status-text">
              {statusMessages[statusIndex]}
            </span>
            <span ref={percentTextRef} className="loader-percent-num">
              {percent}%
            </span>
          </div>

          <div className="loader-progress-track">
            <div ref={progressBarRef} className="loader-progress-fill" style={{ width: '0%' }} />
          </div>
        </div>

        {/* JFarm Services Trust Points */}
        <div className="loader-trust-points">
          <div className="loader-trust-item">
            <span>⚡ ~15 Mins Dispatch</span>
          </div>
          <div className="loader-trust-dot">•</div>
          <div className="loader-trust-item">
            <span>🛡️ 100% KYC Verified</span>
          </div>
          <div className="loader-trust-dot">•</div>
          <div className="loader-trust-item">
            <span>🤝 0% Commission Fee</span>
          </div>
        </div>

        {/* Skip button for instant access */}
        <button type="button" className="loader-skip-btn" onClick={handleSkip}>
          {isTe ? 'దాటవేయి →' : 'Skip →'}
        </button>
      </div>
    </div>
  );
}

