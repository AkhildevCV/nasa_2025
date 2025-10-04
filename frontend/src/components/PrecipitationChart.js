import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
ChartJS.register(...registerables);

export default function PrecipitationChart({ data }) {
  const yearly = data.reduce((a, c) => {
    const y = new Date(c.time).getFullYear();
    if (!a[y]) a[y] = 0;
    a[y] += c.precipitation_sum;
    return a;
  }, {});

  const labels = Object.keys(yearly);
  const vals = Object.values(yearly);

  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
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
    scales: {
      x: { ticks: { color: '#88cc88' }, grid: { display: false } },
      y: { ticks: { color: '#88cc88' }, grid: { color: 'rgba(0,255,136,.1)' } },
    },
    animation: { duration: 1500, easing: 'easeOutBounce' },
    onHover: (e, els) => { e.native.target.style.cursor = els[0] ? 'pointer' : 'default'; },
  };

  return (
    <Bar
      data={{
        labels,
        datasets: [
          {
            label: 'Total Precipitation (mm)',
            data: vals,
            backgroundColor: 'rgba(38,241,127,.5)',
            borderColor: '#26F17F',
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
      }}
      options={opts}
    />
  );
}