// frontend/src/components/PrecipitationChart.js
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function PrecipitationChart({ data }) {
  // ... (data processing logic is the same)
  const yearlyData = data.reduce((acc, curr) => {
    const year = new Date(curr.time).getFullYear();
    if (!acc[year]) { acc[year] = 0; }
    acc[year] += curr.precipitation_sum;
    return acc;
  }, {});

  const labels = Object.keys(yearlyData);
  const chartData = Object.values(yearlyData);

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
      x: { 
        ticks: { color: '#88cc88' }, 
        grid: { display: false } 
      },
      y: { 
        ticks: { color: '#88cc88' }, 
        grid: { color: 'rgba(0, 255, 136, 0.1)' } 
      }
    },
    animation: {
      duration: 1500,
      easing: 'easeOutBounce',
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    onHover: (event, chartElement) => {
      event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
    }
  };

  const barChartData = {
    labels,
    datasets: [{
      label: 'Total Precipitation (mm)',
      data: chartData,
      backgroundColor: 'rgba(38, 241, 127, 0.5)',
    }]
  };

  return <Bar options={chartOptions} data={barChartData} />;
}

export default PrecipitationChart;