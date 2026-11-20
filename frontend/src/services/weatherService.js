// Weather Service for AgriRent using Open-Meteo with Telangana Agro-Climatic Fallbacks

// Interpret WMO weather codes to agricultural terms & emojis
export function parseWmoCode(code, language = 'en') {
  const isTe = language === 'te';
  if (code === 0) {
    return {
      condition: isTe ? 'ఎండగా / స్వచ్ఛం' : 'Sunny & Clear',
      icon: '☀️',
      soilCondition: isTe ? 'అనుకూలమైన తేమ' : 'Optimal Moisture',
      advisory: isTe ? 'దుక్కి మరియు రొటవేటర్‌కు అత్యంత అనుకూలం' : 'Perfect for Ploughing & Rotavator',
      badge: isTe ? 'నేల సిద్ధం' : 'Soil Ready',
      statusClass: 'status-ready'
    };
  }
  if (code >= 1 && code <= 3) {
    return {
      condition: isTe ? 'పాక్షిక మేఘావృతం' : 'Partly Cloudy',
      icon: '⛅',
      soilCondition: isTe ? 'మధ్యస్థ తేమ' : 'Good Soil Moisture',
      advisory: isTe ? 'దుక్కి, కల్టివేటర్ మరియు ఎరువులు వేయడానికి ఉత్తమం' : 'Ideal for Ploughing, Cultivator & Sowing',
      badge: isTe ? 'దుక్కి సమయం' : 'Tillage Ready',
      statusClass: 'status-ready'
    };
  }
  if (code >= 51 && code <= 67) {
    return {
      condition: isTe ? 'తేలికపాటి జల్లులు / వర్షం' : 'Light Showers / Rain',
      icon: '🌦️',
      soilCondition: isTe ? 'ఎక్కువ తేమ / తడి నేల' : 'High Moisture / Wet Soil',
      advisory: isTe ? 'వర్ష జల్లులు: పొడి దుక్కి ఆపి, వరి మడులకు సిద్ధం చేయండి' : 'Wet field: Delay dry ploughing, prepare for transplantation',
      badge: isTe ? 'తేమ ఎక్కువ' : 'High Moisture',
      statusClass: 'status-wet'
    };
  }
  if (code >= 80 && code <= 99) {
    return {
      condition: isTe ? 'భారీ వర్ష సూచన / ఉరుములు' : 'Rain Showers / Thunderstorms',
      icon: '⛈️',
      soilCondition: isTe ? 'నీటి నిల్వ / చిత్తడి' : 'Marshy / High Moisture',
      advisory: isTe ? 'వర్ష సూచన: కేజ్ వీల్స్‌తో వరి దమ్ము పనులకు అనుకూలం' : 'Ideal for Wet Land Paddy Puddling with Cage Wheels',
      badge: isTe ? 'వరి దమ్ముకు సిద్ధం' : 'Paddy Ready',
      statusClass: 'status-alert'
    };
  }
  // Default clear/hazy
  return {
    condition: isTe ? 'సాధారణ వాతావరణం' : 'Hazy Sunshine',
    icon: '🌤️',
    soilCondition: isTe ? 'అనుకూలమైన తేమ' : 'Optimal Moisture',
    advisory: isTe ? 'దుక్కి మరియు రొటవేటర్ పనులకు అనుకూలం' : 'Suitable for Ploughing & Field Prep',
    badge: isTe ? 'నేల సిద్ధం' : 'Soil Ready',
    statusClass: 'status-ready'
  };
}

// Generate realistic offline fallback data based on location
export function getFallbackWeather(location, language = 'en') {
  const isTe = language === 'te';
  const villageName = isTe ? (location.villageTe || location.village) : location.village;
  const districtName = isTe ? (location.districtTe || location.district) : location.district;
  
  // Seed realistic variations based on lat/lon
  const seed = Math.abs(Math.round(((location.lat || 18) + (location.lon || 79)) * 10)) % 5;
  const baseTemp = 30 + (seed % 4);
  const rainRisk = (seed * 7) % 35; // e.g. 0%, 7%, 14%, 21%, 28%
  
  return {
    locationName: `${villageName}, ${districtName}`,
    temperature: baseTemp,
    humidity: 48 + (seed * 4),
    windSpeed: 8 + seed,
    rainRisk: rainRisk,
    icon: seed === 3 ? '⛅' : '🌤️',
    condition: isTe ? (seed === 3 ? 'పాక్షిక మేఘావృతం' : 'ఎండ / స్వచ్ఛం') : (seed === 3 ? 'Partly Cloudy' : 'Sunny'),
    soilCondition: isTe ? 'అనుకూలమైన తేమ' : 'Optimal Moisture',
    advisory: isTe ? 'దుక్కి మరియు రొటవేటర్‌కు అత్యంత అనుకూలం' : 'Perfect for Ploughing & Rotavator',
    badge: isTe ? 'నేల సిద్ధం' : 'Soil Ready',
    statusClass: 'status-ready',
    forecast: [
      {
        day: isTe ? 'నేడు' : 'Today',
        tempMax: baseTemp + 2,
        tempMin: 22,
        rainProb: rainRisk,
        status: isTe ? 'దుక్కికి శ్రేష్టం' : 'Excellent for Ploughing'
      },
      {
        day: isTe ? 'రేపు' : 'Tomorrow',
        tempMax: baseTemp + 3,
        tempMin: 23,
        rainProb: Math.min(100, rainRisk + 5),
        status: isTe ? 'రొటవేటర్‌కు సిద్ధం' : 'Ready for Rotavator'
      },
      {
        day: isTe ? 'ఎల్లుండి' : 'Day 3',
        tempMax: baseTemp + 1,
        tempMin: 21,
        rainProb: Math.max(0, rainRisk - 5),
        status: isTe ? 'విత్తనాలకు అనుకూలం' : 'Ideal for Sowing'
      }
    ]
  };
}

// Fetch live weather data from Open-Meteo with caching and graceful fallback
const weatherCache = new Map();

export async function fetchRegionWeather(location, language = 'en') {
  if (!location || !location.lat || !location.lon) {
    return getFallbackWeather(location || {}, language);
  }

  const cacheKey = `${location.districtId}_${location.village}_${language}`;
  const cached = weatherCache.get(cacheKey);
  const now = Date.now();

  // Cache for 10 minutes
  if (cached && (now - cached.timestamp < 10 * 60 * 1000)) {
    return cached.data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FKolkata`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Weather API responded with status ${response.status}`);
    }

    const data = await response.json();
    const current = data.current || {};
    const daily = data.daily || {};

    const isTe = language === 'te';
    const villageName = isTe ? (location.villageTe || location.village) : location.village;
    const districtName = isTe ? (location.districtTe || location.district) : location.district;

    const weatherInterpretation = parseWmoCode(current.weather_code ?? 0, language);
    const rainChance = daily.precipitation_probability_max?.[0] ?? Math.round((current.precipitation || 0) * 20);

    const result = {
      locationName: `${villageName}, ${districtName}`,
      temperature: Math.round(current.temperature_2m ?? 31),
      humidity: Math.round(current.relative_humidity_2m ?? 50),
      windSpeed: Math.round(current.wind_speed_10m ?? 9),
      rainRisk: rainChance,
      icon: weatherInterpretation.icon,
      condition: weatherInterpretation.condition,
      soilCondition: weatherInterpretation.soilCondition,
      advisory: weatherInterpretation.advisory,
      badge: weatherInterpretation.badge,
      statusClass: weatherInterpretation.statusClass,
      forecast: (daily.time || []).slice(0, 3).map((dateStr, idx) => {
        const daysOfWeekEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const daysOfWeekTe = ['ఆదివారం', 'సోమవారం', 'మంగళవారం', 'బుధవారం', 'గురువారం', 'శుక్రవారం', 'శనివారం'];
        const dateObj = new Date(dateStr);
        const dayLabel = idx === 0
          ? (isTe ? 'నేడు' : 'Today')
          : idx === 1
          ? (isTe ? 'రేపు' : 'Tomorrow')
          : (isTe ? daysOfWeekTe[dateObj.getDay()] : daysOfWeekEn[dateObj.getDay()]);

        const maxT = Math.round(daily.temperature_2m_max?.[idx] ?? 33);
        const minT = Math.round(daily.temperature_2m_min?.[idx] ?? 23);
        const pRisk = daily.precipitation_probability_max?.[idx] ?? 0;

        return {
          day: dayLabel,
          tempMax: maxT,
          tempMin: minT,
          rainProb: pRisk,
          status: pRisk > 40
            ? (isTe ? 'వరి పనులకు అనుకూలం' : 'Ideal for Wet Land / Paddy')
            : (isTe ? 'దుక్కి & రొటవేటర్‌కు అనుకూలం' : 'Suitable for Ploughing & Tillage')
        };
      })
    };

    weatherCache.set(cacheKey, { timestamp: now, data: result });
    return result;
  } catch (error) {
    console.warn('Live weather fetch failed, utilizing regional agro fallback:', error.message);
    const fallback = getFallbackWeather(location, language);
    weatherCache.set(cacheKey, { timestamp: now, data: fallback });
    return fallback;
  }
}
