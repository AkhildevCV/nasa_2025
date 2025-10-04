// frontend/src/App.js
import React, { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import Map from './components/Map';
import TemperatureChart from './components/TemperatureChart';
import PrecipitationChart from './components/PrecipitationChart';
import RainyDaysChart from './components/RainyDaysChart';
import AnimatedButton from './components/AnimatedButton';
import AnimatedCounter from './components/AnimatedCounter';
import Loader from './components/Loader';
import Logo from './components/Logo';
import Background from './components/Background'; // --- NEW: Import the background ---

const API_URL = 'http://127.0.0.1:8000';

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.2 } } };
const itemVariants = { hidden: { opacity: 0, y: 50 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } };

function App() {
  const [isPageLoading, setIsPageLoading] = useState(true);
  // ... (rest of state and functions are the same as before)
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

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const getAddressFromCoords = useCallback(async (newLat, newLon) => {
    try {
      const response = await axios.post(`${API_URL}/reverse_geocode`, { lat: newLat, lon: newLon });
      setAddress(response.data.address);
      const locationName = response.data.address.split(',')[0];
      setSearchQuery(locationName);
    } catch (err) { setAddress("Unknown Location"); }
  }, []);

  const handleMapClick = (latlng) => {
    setLat(latlng.lat);
    setLon(latlng.lng);
    getAddressFromCoords(latlng.lat, latlng.lng);
  };
  const handleZoomChange = (newZoom) => setZoom(newZoom);
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    try {
      const response = await axios.post(`${API_URL}/geocode`, { query: searchQuery });
      setLat(response.data.lat);
      setLon(response.data.lon);
      setAddress(response.data.address);
      setZoom(13);
    } catch (err) { setError("Location not found."); }
  };
  const handleAnalysis = async () => {
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const response = await axios.post(`${API_URL}/analyze`, { lat: parseFloat(lat), lon: parseFloat(lon), target_date: date });
      setResults(response.data);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } catch (err) { setError(err.response ? err.response.data.detail : 'Failed to connect.'); }
    setLoading(false);
  };
  const handleClearResults = () => {
    setResults(null);
    setError('');
  };

  return (
    <> {/* Use a Fragment to wrap the app and background */}
      <Background /> {/* --- NEW: Add the background component --- */}
      <AnimatePresence>
        {isPageLoading ? <Loader key="loader" /> : (
          <motion.div key="main-app" className="App" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <header className="header">
              <Logo text="lluvia" />
              <p>Climate-Aware Historical Weather Analysis</p>
            </header>
            
            {/* ... (rest of the App.js return statement is the same) ... */}
            <Map lat={lat} lon={lon} zoom={zoom} onMapClick={handleMapClick} onZoomChange={handleZoomChange} />
            <div className="location-info"><p><strong>Current Location:</strong> {address}</p></div>
            <div className="controls">
              <form className="search-form" onSubmit={handleSearch}>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search for a place..."/>
                <AnimatedButton type="submit" disabled={loading}>Search</AnimatedButton>
              </form>
              <div className="coord-inputs">
                <input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} onBlur={() => getAddressFromCoords(lat, lon)} placeholder="Latitude"/>
                <input type="number" step="any" value={lon} onChange={(e) => setLon(e.target.value)} onBlur={() => getAddressFromCoords(lat, lon)} placeholder="Longitude"/>
              </div>
              <div className="analysis-controls">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <AnimatedButton onClick={handleAnalysis} disabled={loading}>{loading ? 'Analyzing...' : `Analyze`}</AnimatedButton>
                <AnimatePresence>
                  {results && (
                    <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}>
                      <AnimatedButton onClick={handleClearResults} className="clear-button">Clear</AnimatedButton>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            <AnimatePresence>
              {results && (
                <motion.div ref={resultsRef} variants={containerVariants} initial="hidden" animate="show" exit="hidden">
                  <motion.div className="results-grid" variants={itemVariants}>
                    <Metric label="Rain Probability" value={results.stats.ml_rain_probability} unit="%" helpText={results.stats.prediction_method}/>
                    <Metric label="Trend-Adjusted Avg Temp" value={results.stats.projected_temp_max} unit="°C" delta={`${(results.stats.temp_trend_per_year * 10).toFixed(2)}°C / decade`}/>
                    <Metric label="Trend-Adjusted Avg Precip" value={Math.max(0, results.stats.projected_precip)} unit=" mm" decimals={2} delta={`${results.stats.precip_trend_per_year.toFixed(2)} mm / year`}/>
                  </motion.div>
                  <motion.div className="charts-grid" variants={itemVariants}>
                    <div className="chart-container">
                      <h4>Historical Temperature Trend (Max °C)</h4>
                      <TemperatureChart data={results.df} />
                    </div>
                    <div className="chart-container">
                      <h4>Rainy vs. Dry Day History</h4>
                      <RainyDaysChart data={results.df} />
                    </div>
                  </motion.div>
                  <motion.div className="chart-container" style={{marginTop: '2rem'}} variants={itemVariants}>
                    <h4>Historical Precipitation (Total mm)</h4>
                    <PrecipitationChart data={results.df} />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Metric({ label, value, unit = "", decimals = 1, delta, helpText }) {
  return (
    <div className="metric">
      <h3>{label}</h3>
      <p><AnimatedCounter to={value} decimals={decimals} />{unit}</p>
      {delta && <span className="delta">{delta}</span>}
      {helpText && <span className="delta" style={{fontSize: '0.8rem', display: 'block'}}>{helpText}</span>}
    </div>
  );
}

export default App;