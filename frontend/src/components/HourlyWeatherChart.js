import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import { Chart as ChartJS, registerables } from 'chart.js';
import GlassCard from './GlassCard';

ChartJS.register(...registerables);

export default function HourlyWeatherChart({ data, targetDate, season, predictionMethod, yearsUsed }) {
  const [selectedMetric, setSelectedMetric] = useState('temperature');

  const metrics = {
    temperature: {
      label: 'Temperature',
      color: '#ff6b6b',
      unit: '°C',
      icon: '🌡️',
      gradient: ['rgba(255,107,107,0.2)', 'rgba(255,107,107,0)']
    },
    precipitation: {
      label: 'Precipitation',
      color: '#4ecdc4',
      unit: 'mm',
      icon: '💧',
      gradient: ['rgba(78,205,196,0.2)', 'rgba(78,205,196,0)']
    },
    humidity: {
      label: 'Humidity',
      color: '#95e1d3',
      unit: '%',
      icon: '💨',
      gradient: ['rgba(149,225,211,0.2)', 'rgba(149,225,211,0)']
    },
    wind_speed: {
      label: 'Wind Speed',
      color: '#26f17f',
      unit: 'm/s',
      icon: '🌬️',
      gradient: ['rgba(38,241,127,0.2)', 'rgba(38,241,127,0)']
    },
    pressure: {
      label: 'Pressure',
      color: '#a78bfa',
      unit: 'hPa',
      icon: '📊',
      gradient: ['rgba(167,139,250,0.2)', 'rgba(167,139,250,0)']
    }
  };

  const hours = data.map(d => `${d.hour}:00`);
  const values = data.map(d => d[selectedMetric]);
  const currentMetric = metrics[selectedMetric];

  // Calculate stats
  const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  const max = Math.max(...values).toFixed(1);
  const min = Math.min(...values).toFixed(1);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        titleColor: currentMetric.color,
        bodyColor: '#fff',
        borderColor: currentMetric.color,
        borderWidth: 2,
        cornerRadius: 12,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => `${context.parsed.y}${currentMetric.unit}`
        }
      }
    },
    scales: {
      x: {
        ticks: { 
          color: '#88cc88',
          maxRotation: 45,
          minRotation: 45
        },
        grid: { display: false }
      },
      y: {
        ticks: { 
          color: '#88cc88',
          callback: (value) => `${value}${currentMetric.unit}`
        },
        grid: { color: 'rgba(0,255,136,.1)' }
      }
    },
    animation: {
      duration: 1500,
      easing: 'easeInOutQuart'
    }
  };

  const chartData = {
    labels: hours,
    datasets: [{
      label: currentMetric.label,
      data: values,
      borderColor: currentMetric.color,
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, currentMetric.gradient[0]);
        gradient.addColorStop(1, currentMetric.gradient[1]);
        return gradient;
      },
      tension: 0.4,
      fill: true,
      pointRadius: 5,
      pointHoverRadius: 8,
      pointBackgroundColor: currentMetric.color,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointHoverBorderWidth: 3
    }]
  };

  return (
    <div className="hourly-weather-container">
      {/* Season and Prediction Info Banner */}
      <GlassCard className="info-banner">
        <div className="info-grid">
          <div className="info-item">
            <span className="info-icon">🌍</span>
            <div>
              <div className="info-label">Season</div>
              <div className="info-value">{season || 'Unknown'}</div>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">🤖</span>
            <div>
              <div className="info-label">Prediction Method</div>
              <div className="info-value">{predictionMethod || 'N/A'}</div>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">📅</span>
            <div>
              <div className="info-label">Historical Years Used</div>
              <div className="info-value">{yearsUsed || 0}</div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Metric Selector */}
      <GlassCard className="metric-selector-card">
        <h3 className="selector-title">Select Weather Metric</h3>
        <div className="metric-buttons">
          {Object.entries(metrics).map(([key, metric]) => (
            <motion.button
              key={key}
              className={`metric-btn ${selectedMetric === key ? 'active' : ''}`}
              onClick={() => setSelectedMetric(key)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                borderColor: selectedMetric === key ? metric.color : 'rgba(255,255,255,0.1)'
              }}
            >
              <span className="metric-icon">{metric.icon}</span>
              <span className="metric-name">{metric.label}</span>
            </motion.button>
          ))}
        </div>
      </GlassCard>

      {/* Stats Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedMetric}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="hourly-stats-grid"
        >
          <StatCard
            label="Average"
            value={avg}
            unit={currentMetric.unit}
            color={currentMetric.color}
            icon="📈"
          />
          <StatCard
            label="Maximum"
            value={max}
            unit={currentMetric.unit}
            color={currentMetric.color}
            icon="⬆️"
          />
          <StatCard
            label="Minimum"
            value={min}
            unit={currentMetric.unit}
            color={currentMetric.color}
            icon="⬇️"
          />
        </motion.div>
      </AnimatePresence>

      {/* Main Chart */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedMetric + '-chart'}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard className="hourly-chart-card">
            <div className="chart-header">
              <h4>
                {currentMetric.icon} {currentMetric.label} - Hourly Breakdown
              </h4>
              <span className="chart-date">📅 {targetDate}</span>
            </div>
            <div className="hourly-chart-box">
              <Line data={chartData} options={chartOptions} />
            </div>
            {data[0]?.predicted && (
              <div className="prediction-badge">
                ⚡ AI Predicted using {yearsUsed} years of historical data
              </div>
            )}
          </GlassCard>
        </motion.div>
      </AnimatePresence>

      {/* Hour-by-Hour Details */}
      <GlassCard className="hourly-details-card">
        <h4>Hour-by-Hour Details</h4>
        <div className="hourly-details-grid">
          {data.map((hour, idx) => (
            <motion.div
              key={idx}
              className="hour-detail-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
            >
              <div className="hour-time">{hour.hour}:00</div>
              <div className="hour-metrics">
                <div className="hour-metric">
                  🌡️ {hour.temperature}°C
                </div>
                <div className="hour-metric">
                  💧 {hour.precipitation}mm
                </div>
                <div className="hour-metric">
                  💨 {hour.humidity}%
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function StatCard({ label, value, unit, color, icon }) {
  return (
    <motion.div
      className="stat-card"
      whileHover={{ y: -5, boxShadow: `0 10px 30px ${color}30` }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <span className="stat-icon">{icon}</span>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={{ color }}>
          {value}
          <span className="stat-unit">{unit}</span>
        </div>
      </div>
    </motion.div>
  );
}