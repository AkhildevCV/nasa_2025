import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
ChartJS.register(...registerables);

export default function RainyDaysChart({ data }) {
  const rainy = data.filter((d) => d.rain_binary === 1).length;
  const dry = data.length - rainy;

  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#fff', padding: 20 } },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,.8)',
        titleColor: '#26F17F',
        bodyColor: '#fff',
        borderColor: '#26F17F',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    animation: { animateRotate: true, duration: 1500 },
  };

  return (
    <Doughnut
      data={{
        labels: ['Rainy Days (≥1 mm)', 'Dry Days'],
        datasets: [
          {
            data: [rainy, dry],
            backgroundColor: ['rgba(38,241,127,.8)', 'rgba(255,255,255,.15)'],
            borderColor: ['#26F17F', '#fff'],
            borderWidth: 2,
          },
        ],
      }}
      options={opts}
    />
  );
}