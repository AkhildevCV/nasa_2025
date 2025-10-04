import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import './App.css';

import Background from './components/Background';
import Loader from './components/Loader';
import Map from './components/Map';
import TemperatureChart from './components/TemperatureChart';
import PrecipitationChart from './components/PrecipitationChart';
import RainyDaysChart from './components/RainyDaysChart';
import AnimatedCounter from './components/AnimatedCounter';
import GlassCard from './components/GlassCard';
import MagneticButton from './components/MagneticButton';

const API_URL = 'http://127.0.0.1:8000';

function App() {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [date, setDate] = useState('2025-10-04');
  const [lat, setLat] = useState(10.8505);
  const [lon, setLon] = useState(76.2711);
  const [zoom, setZoom] = useState(10);
  const [address, setAddress] = useState('Pallur, Kerala, India');
  const [searchQuery, setSearchQuery] = useState('Pallur, Kerala');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const resultsRef = useRef(null);

  /* ---- scroll-trigger containers ---- */
  const [mapRef, mapInView] = useInView({ threshold: 0.3, triggerOnce: true });
  const [controlsRef, controlsInView] = useInView({ threshold: 0.3, triggerOnce: true });
  const [metricsRef, metricsInView] = useInView({ threshold: 0.3, triggerOnce: true });
  const [chartsRef, chartsInView] = useInView({ threshold: 0.2, triggerOnce: true });
  useEffect(() => {
    const t = setTimeout(() => setIsPageLoading(false), 2500);
    return () => clearTimeout(t);
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
    /* ---- zoom is NOT reset ---- */
  };
  const handleZoomChange = (z) => setZoom(z);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
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
    setLoading(true); setError(''); setResults(null);
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

  const handleClear = () => { setResults(null); setError(''); };

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
          <Background />
          <Hero />

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
                <span className="pin">📍</span> {address}
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
                <MagneticButton type="submit" disabled={loading}>Search</MagneticButton>
              </form>
              <div className="coord-line">
                <input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  onBlur={() => getAddressFromCoords(lat, lon)}
                  placeholder="Latitude"
                />
                <input
                  type="number"
                  step="any"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  onBlur={() => getAddressFromCoords(lat, lon)}
                  placeholder="Longitude"
                />
              </div>
              <div className="analysis-line">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <MagneticButton onClick={handleAnalysis} disabled={loading}>
                  {loading ? 'Analysing…' : 'Analyse'}
                </MagneticButton>
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

          {/* <motion.div
            ref={feelRef}
            initial={{ opacity: 0, y: 60 }}
            animate={feelInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="feel-section"
          >
            <GlassCard>
              <h3>How does it feel right now?</h3>
              <div className="feel-grid">
                <FeelRadial label="Hot" value={78} color="#FF6B6B" />
                <FeelRadial label="Cold" value={34} color="#4ECDC4" />
                <FeelRadial label="Windy" value={62} color="#FFE66D" />
              </div>
            </GlassCard>
          </motion.div> */}

          {error && <ErrorBanner msg={error} onDismiss={() => setError('')} />}

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
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Metric({ label, value, unit, decimals = 1, delta, help }) {
  return (
    <div className="metric">
      <h3>{label}</h3>
      <p>
        <AnimatedCounter to={value} decimals={decimals} />
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

function Hero() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const onMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const rotateX = useTransform(mouseY, [-150, 150], [10, -10]);
  const rotateY = useTransform(mouseX, [-150, 150], [-10, 10]);

  /* ---- glitter letters ---- */
  const letters = 'lluvia'.split('');
  const subLetters = 'Will it rain on my parade?'.split('');

  return (
    <div className="hero" onMouseMove={onMouseMove}>
      <motion.div
        style={{ rotateX, rotateY }}
        className="hero-text"
      >
        <motion.div className="hero-title">
          {letters.map((ch, i) => (
            <motion.span
              key={i}
              className="hero-letter"
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 400 }}
              whileHover={{
                scale: 1.3,
                rotate: 10,
                color: '#fff',
                textShadow: '0 0 20px #26F17F',
              }}
            >
              {ch}
            </motion.span>
          ))}
        </motion.div>
        <motion.div className="hero-sub">
          {subLetters.map((ch, i) => (
            <motion.span
              key={i}
              className="hero-sub-letter"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.02, ease: 'easeOut' }}
              whileHover={{ color: '#26F17F', scale: 1.1 }}
            >
              {ch === ' ' ? '\u00A0' : ch}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default App; 