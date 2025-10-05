import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import './App.css';

import Hero from './components/Hero';
import Loader from './components/Loader';
import Map from './components/Map';
import TemperatureChart from './components/TemperatureChart';
import PrecipitationChart from './components/PrecipitationChart';
import RainyDaysChart from './components/RainyDaysChart';
import HourlyWeatherChart from './components/HourlyWeatherChart';
import AnimatedCounter from './components/AnimatedCounter';
import GlassCard from './components/GlassCard';
import MagneticButton from './components/MagneticButton';
import InteractiveWeatherBackground from './components/Background';

const API_URL = 'http://127.0.0.1:8000';

/* ================================================================== */
/* APP COMPONENT                                                      */
/* ================================================================== */

function App() {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [date, setDate] = useState('');
  const [viewMode, setViewMode] = useState('daily');

  /* -----------  DEFAULT MAP CENTRE  ----------- */
  const [lat, setLat] = useState(20.0);
  const [lon, setLon] = useState(0.0);
  const [zoom, setZoom] = useState(10);
  const [address, setAddress] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resultsRef = useRef(null);
  const mainContentRef = useRef(null);
  const dateInputRef = useRef(null);

  const [mapRef, mapInView] = useInView({ threshold: 0.3, triggerOnce: true });
  const [controlsRef, controlsInView] = useInView({ threshold: 0.3, triggerOnce: true });
  const [metricsRef, metricsInView] = useInView({ threshold: 0.3, triggerOnce: true });
  const [chartsRef, chartsInView] = useInView({ threshold: 0.2, triggerOnce: true });

  /* -------------------  VALIDATION LOGIC  ------------------------- */
  const locationIsReady = Boolean(
    (searchQuery && searchQuery.trim()) || (String(lat).trim() !== '' && String(lon).trim() !== '')
  );
  const formIsComplete = locationIsReady && date;
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const t = setTimeout(() => setIsPageLoading(false), 2500);
    return () => clearTimeout(t);
  }, []);

  const handleHeroAnimationComplete = useCallback(() => {
    setTimeout(() => {
      mainContentRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 2500);
  }, []);

  const getAddressFromCoords = useCallback(async (lt, ln) => {
    try {
      const { data } = await axios.post(`${API_URL}/reverse_geocode`, { lat: lt, lon: ln });
      setAddress(data.address);
      setSearchQuery(data.address.split(',')[0]);
    } catch {
      setAddress('Unknown Location');
    }
  }, []);

  const handleMapClick = (latlng) => {
    setLat(latlng.lat);
    setLon(latlng.lng);
    getAddressFromCoords(latlng.lat, latlng.lng);
  };
  const handleZoomChange = (z) => setZoom(z);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery?.trim()) return;
    try {
      const { data } = await axios.post(`${API_URL}/geocode`, { query: searchQuery });
      setLat(data.lat);
      setLon(data.lon);
      setAddress(data.address);
      setZoom(13);
      setError('');
    } catch {
      setError('Location not found. Try another search.');
    }
  };

  const handleAnalysis = async () => {
    if (!formIsComplete) return;
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const { data } = await axios.post(`${API_URL}/analyze`, {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        target_date: date,
      });
      setResults(data);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 600);
    } catch (err) {
      setError(err.response?.data?.detail || 'Backend connection failed.');
    }
    setLoading(false);
  };

  const handleClear = () => {
    setResults(null);
    setError('');
    setViewMode('daily');
  };

  const handleDateWrapperClick = () => {
    dateInputRef.current?.showPicker?.();
  };
    
  // *** NEW FEATURE: DYNAMIC TOOLTIP FOR THE ANALYSE BUTTON ***
  const getButtonTooltip = () => {
    if (loading) return "Analysis in progress...";
    if (formIsComplete) return "Start weather analysis";
    if (!locationIsReady && !date) {
        return "Please enter a location and select a date";
    }
    if (!locationIsReady) {
        return "Please enter a location to proceed";
    }
    if (!date) {
        return "Please select a date to proceed";
    }
    return ""; // Default case
  };

  const hasHourlyData = results?.hourly_data && Array.isArray(results.hourly_data) && results.hourly_data.length > 0;

  /* ------------------------------------------------------------------ */
  /* ---------------------------  RENDER  ----------------------------- */
  /* ------------------------------------------------------------------ */

  return (
    <AnimatePresence mode="wait">
      {isPageLoading ? (
        <Loader key="loader" />
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="app-shell"
        >
          <InteractiveWeatherBackground
            rainProbability={results?.stats?.ml_rain_probability}
            temperature={results?.stats?.projected_temp_max}
            precipitation={results?.stats?.projected_precip}
            season={results?.season}
            hourlyData={results?.hourly_data}
            autoMode={true}
          />

          <Hero onAnimationComplete={handleHeroAnimationComplete} />

          <div ref={mainContentRef} className="main-content">
            <motion.div
              ref={mapRef}
              initial={{ opacity: 0, y: 60 }}
              animate={mapInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <GlassCard className="map-card">
                <Map
                  lat={lat}
                  lon={lon}
                  zoom={zoom}
                  onMapClick={handleMapClick}
                  onZoomChange={handleZoomChange}
                />
                <div className="location-bar">
                  <span className="pin">📍</span> {address ?? 'Select a location'}
                </div>
              </GlassCard>
            </motion.div>

            <motion.div
              ref={controlsRef}
              initial={{ opacity: 0, y: 60 }}
              animate={controlsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
            >
              <GlassCard className="controls-card">
                <form onSubmit={handleSearch} className="search-line">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for a place…"
                  />
                  <MagneticButton type="submit" disabled={loading}>
                    Search
                  </MagneticButton>
                </form>

                <div className="coord-line">
                  <input
                    type="number"
                    step="any"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    onBlur={() => getAddressFromCoords(lat, lon)}
                    placeholder="Latitude"
                    className="no-spin"
                  />
                  <input
                    type="number"
                    step="any"
                    value={lon}
                    onChange={(e) => setLon(e.target.value)}
                    onBlur={() => getAddressFromCoords(lat, lon)}
                    placeholder="Longitude"
                    className="no-spin"
                  />
                </div>

                <div className="analysis-line">
                  <div 
                    className="date-wrapper" 
                    onClick={handleDateWrapperClick}
                    data-date-selected={!!date}
                  >
                    <input
                      ref={dateInputRef}
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="stunning-date"
                    />
                  </div>
                   {/* This wrapper provides the tooltip */}
                  <div className="button-wrapper" title={getButtonTooltip()}>
                    <MagneticButton onClick={handleAnalysis} disabled={!formIsComplete || loading}>
                      {loading ? 'Analysing…' : 'Analyse'}
                    </MagneticButton>
                  </div>
                  {results && (
                    <motion.button
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 'auto', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      onClick={handleClear}
                      className="clear"
                    >
                      Clear
                    </motion.button>
                  )}
                </div>
              </GlassCard>
            </motion.div>

            {error && <ErrorBanner msg={error} onDismiss={() => setError('')} />}
            
            <AnimatePresence>
              {loading && <AnalysisLoader />}
            </AnimatePresence>

            <AnimatePresence>
              {results && (
                <motion.div
                  ref={resultsRef}
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 60 }}
                  className="results-area"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="view-toggle-container"
                  >
                    <GlassCard className="view-toggle-card">
                      <div className="toggle-wrapper">
                        <button
                          className={`toggle-btn ${viewMode === 'daily' ? 'active' : ''}`}
                          onClick={() => setViewMode('daily')}
                        >
                          <span className="toggle-icon">📊</span>
                          Daily Stats
                        </button>
                        <button
                          className={`toggle-btn ${viewMode === 'hourly' ? 'active' : ''}`}
                          onClick={() => setViewMode('hourly')}
                          disabled={!hasHourlyData}
                          title={!hasHourlyData ? 'Hourly data not available' : ''}
                        >
                          <span className="toggle-icon">⏰</span>
                          Hourly Breakdown
                        </button>
                        <motion.div
                          className="toggle-slider"
                          animate={{ x: viewMode === 'hourly' ? '100%' : '0%' }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      </div>
                      {!hasHourlyData && (
                        <p className="toggle-hint">
                          ℹ️ Hourly data available for dates from 1940 onwards
                        </p>
                      )}
                    </GlassCard>
                  </motion.div>

                  <AnimatePresence mode="wait">
                    {viewMode === 'daily' ? (
                      <motion.div
                        key="daily-view"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                      >
                        <motion.div
                          ref={metricsRef}
                          initial={{ opacity: 0, y: 60 }}
                          animate={metricsInView ? { opacity: 1, y: 0 } : {}}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="metrics-grid"
                        >
                          <Metric
                            label="Rain Probability"
                            value={results.stats.ml_rain_probability}
                            unit="%"
                            help={results.stats.prediction_method}
                          />
                          <Metric
                            label="Trend-Adjusted Avg Temp"
                            value={results.stats.projected_temp_max}
                            unit="°C"
                            delta={`${(results.stats.temp_trend_per_year * 10).toFixed(2)}°C / decade`}
                          />
                          <Metric
                            label="Trend-Adjusted Avg Precip"
                            value={Math.max(0, results.stats.projected_precip)}
                            unit=" mm"
                            decimals={2}
                            delta={`${results.stats.precip_trend_per_year.toFixed(2)} mm / year`}
                          />
                        </motion.div>

                        <motion.div
                          ref={chartsRef}
                          initial={{ opacity: 0, y: 60 }}
                          animate={chartsInView ? { opacity: 1, y: 0 } : {}}
                          transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                          className="charts-grid"
                        >
                          <GlassCard>
                            <h4>Historical Temperature Trend (Max °C)</h4>
                            <div className="chart-box">
                              <TemperatureChart data={results.df} />
                            </div>
                          </GlassCard>
                          <GlassCard>
                            <h4>Rainy vs Dry Days</h4>
                            <div className="chart-box">
                              <RainyDaysChart data={results.df} />
                            </div>
                          </GlassCard>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 60 }}
                          animate={chartsInView ? { opacity: 1, y: 0 } : {}}
                          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                        >
                          <GlassCard style={{ marginTop: '2rem' }}>
                            <h4>Historical Precipitation (Total mm)</h4>
                            <div className="chart-box">
                              <PrecipitationChart data={results.df} />
                            </div>
                          </GlassCard>
                        </motion.div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="hourly-view"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                      >
                        {hasHourlyData ? (
                          <HourlyWeatherChart
                            data={results.hourly_data}
                            targetDate={date}
                            season={results.season}
                            predictionMethod={results.prediction_method}
                            yearsUsed={results.years_used}
                          />
                        ) : (
                          <GlassCard>
                            <div className="no-hourly-data">
                              <span className="icon">⚠️</span>
                              <h3>Hourly Data Unavailable</h3>
                              <p>Historical hourly data is only available for dates from 1940 to present.</p>
                            </div>
                          </GlassCard>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================================================================== */
/* OTHER COMPONENTS                                                   */
/* ================================================================== */

function Metric({ label, value, unit, decimals = 1, delta, help }) {
  return (
    <div className="metric">
      <h3>{label}</h3>
      <p>
        <AnimatedCounter to={value || 0} decimals={decimals} />
        {unit}
      </p>
      {delta && <span className="delta">{delta}</span>}
      {help && <span className="help">{help}</span>}
    </div>
  );
}

function ErrorBanner({ msg, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="error-banner"
    >
      {msg}
      <button onClick={onDismiss}>✕</button>
    </motion.div>
  );
}

function AnalysisLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="analysis-loader-overlay"
    >
      <div className="analysis-loader-box">
        <div className="analysis-loader-spinner" />
        <p>Analyzing weather patterns…</p>
      </div>
    </motion.div>
  );
}

export default App;
