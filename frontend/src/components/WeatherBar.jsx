import { useState } from 'react';
import { translations } from '../translations';

export default function WeatherBar({
  language = 'en',
  selectedLocation,
  weatherData,
  isLoadingWeather = false,
  onOpenLocationPicker
}) {
  const t = translations[language] || translations.en;
  const isTe = language === 'te';
  const [showForecast, setShowForecast] = useState(false);

  // Fallback defaults if weatherData is still loading or empty
  const locationLabel = selectedLocation
    ? `${isTe ? (selectedLocation.villageTe || selectedLocation.village) : selectedLocation.village}, ${isTe ? (selectedLocation.districtTe || selectedLocation.district) : selectedLocation.district}`
    : t.weatherLocation;

  const tempDisplay = weatherData?.temperature ? `${weatherData.temperature}°C` : '31°C';
  const conditionDisplay = weatherData?.condition || (isTe ? 'ఎండగా / స్వచ్ఛం' : 'Sunny');
  const iconDisplay = weatherData?.icon || '🌤️';
  const soilConditionDisplay = weatherData?.soilCondition || (isTe ? 'అనుకూలమైన తేమ' : 'Optimal Moisture');
  const rainRiskDisplay = weatherData?.rainRisk !== undefined ? `${weatherData.rainRisk}%` : '0%';
  const advisoryDisplay = weatherData?.advisory || (isTe ? 'దుక్కి మరియు రొటవేటర్‌కు అత్యంత అనుకూలం' : 'Perfect for Ploughing & Rotavator');
  const badgeDisplay = weatherData?.badge || (isTe ? 'నేల సిద్ధం' : 'Soil Ready');
  const statusClass = weatherData?.statusClass || 'status-ready';

  return (
    <div className="weather-advisory-container">
      <div className={`weather-advisory-bar ${isLoadingWeather ? 'weather-loading' : ''}`}>
        {/* Weather Icon with Animated Pulse */}
        <div className="weather-icon-pulse" title={conditionDisplay}>
          {iconDisplay}
        </div>

        {/* Content Area */}
        <div className="weather-content">
          <div className="weather-header-row">
            <span className="weather-tag">
              {isTe ? 'వ్యవసాయ వాతావరణం' : 'Agri Weather Advisory'}
            </span>
            <strong className="weather-location">
              {locationLabel} ({tempDisplay} {conditionDisplay})
            </strong>
            {onOpenLocationPicker && (
              <button
                className="weather-change-loc-btn"
                onClick={onOpenLocationPicker}
                title={isTe ? 'వేరే ప్రాంతం లేదా గ్రామం ఎంచుకోండి' : 'Change selected Telangana village or district'}
              >
                📍 {isTe ? 'ప్రాంతం మార్చండి' : 'Change Locality'}
              </button>
            )}
          </div>
          <p className="weather-text">
            <strong>{isTe ? 'నేల స్థితి:' : 'Soil Condition:'}</strong> {soilConditionDisplay} •{' '}
            <strong>{isTe ? 'వర్ష ప్రమాదం:' : 'Rain Risk:'}</strong> {rainRiskDisplay} •{' '}
            <span>{advisoryDisplay}</span>
          </p>
        </div>

        {/* Status Badge & Forecast Toggle */}
        <div className="weather-actions-wrap">
          <div className={`weather-badge-status ${statusClass}`}>
            <span className="soil-indicator">● {badgeDisplay}</span>
          </div>
          {weatherData?.forecast && weatherData.forecast.length > 0 && (
            <button
              className="forecast-toggle-btn"
              onClick={() => setShowForecast((prev) => !prev)}
              title={isTe ? '3 రోజుల వ్యవసాయ సూచన చూడండి' : 'View 3-day farming weather forecast'}
            >
              {showForecast ? '▲' : '▼'}{' '}
              <span>{isTe ? '3 రోజుల సూచన' : '3-Day Forecast'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable 3-Day Agricultural Forecast Drawer */}
      {showForecast && weatherData?.forecast && (
        <div className="weather-forecast-drawer">
          <div className="forecast-drawer-header">
            <h4>
              🌾 {isTe ? 'ప్రాంతీయ వ్యవసాయ సూచన (తదుపరి 3 రోజులు)' : 'Regional Agricultural Forecast (Next 3 Days)'}
            </h4>
            <div className="forecast-metrics-inline">
              <span>💧 {isTe ? 'తేమ:' : 'Humidity:'} {weatherData.humidity || 52}%</span>
              <span>💨 {isTe ? 'గాలి వేగం:' : 'Wind Speed:'} {weatherData.windSpeed || 10} km/h</span>
            </div>
          </div>
          <div className="forecast-days-grid">
            {weatherData.forecast.map((fc, idx) => (
              <div key={idx} className="forecast-day-card">
                <div className="forecast-day-title">{fc.day}</div>
                <div className="forecast-day-temp">
                  <span className="temp-high">{fc.tempMax}°C</span> /{' '}
                  <span className="temp-low">{fc.tempMin}°C</span>
                </div>
                <div className="forecast-day-rain">
                  🌧️ {isTe ? 'వర్ష సూచన:' : 'Rain:'} <strong>{fc.rainProb}%</strong>
                </div>
                <div className="forecast-day-status">
                  ✓ {fc.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
