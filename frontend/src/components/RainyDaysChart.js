// frontend/src/components/RainyDaysChart.js
import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function RainyDaysChart({ data }) {
  const rainyDays = data.filter(day => day.rain_binary === 1).length;
  const dryDays = data.length - rainyDays;

  const chartData = {
    labels: ['Rainy Days (>=1mm)', 'Dry Days'],
    datasets: [{
      label: '# of Days',
      data: [rainyDays, dryDays],
      backgroundColor: ['rgba(38, 241, 127, 0.8)', 'rgba(255, 255, 255, 0.2)'],
      borderColor: ['#26F17F', '#FFFFFF'],
      borderWidth: 1,
    }]
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#FFFFFF' }
      }
    }
  };

  return <Doughnut data={chartData} options={chartOptions} />;
}

export default RainyDaysChart;