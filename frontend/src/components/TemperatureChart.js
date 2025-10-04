// frontend/src/components/TemperatureChart.js
import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function TemperatureChart({ data }) {
  // ... (data processing logic is the same)
  const yearlyData = data.reduce((acc, curr) => {
    const year = new Date(curr.time).getFullYear();
    if (!acc[year]) { acc[year] = { temps: [], count: 0 }; }
    acc[year].temps.push(curr.temperature_2m_max);
    acc[year].count++;
    return acc;
  }, {});

  const labels = Object.keys(yearlyData);
  const chartData = labels.map(year => {
    const sum = yearlyData[year].temps.reduce((a, b) => a + b, 0);
    return sum / yearlyData[year].count;
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 30, 0, 0.9)',
        titleColor: '#00ff88',
        bodyColor: '#ffffff',
        borderColor: '#00cc66',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false
      }
    },
    scales: {
      x: { ticks: { color: '#88cc88' }, grid: { color: 'rgba(0, 255, 136, 0.1)' } },
      y: { ticks: { color: '#88cc88' }, grid: { color: 'rgba(0, 255, 136, 0.1)' } }
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutQuint',
    },
  };

  const lineChartData = {
    labels,
    datasets: [{
      label: 'Avg. Max Temp (°C)',
      data: chartData,
      borderColor: '#26F17F',
      backgroundColor: 'rgba(38, 241, 127, 0.2)',
      tension: 0.4, // Make the line smoother
      fill: true
    }]
  };

  return <Line options={chartOptions} data={lineChartData} />;
}

export default TemperatureChart;