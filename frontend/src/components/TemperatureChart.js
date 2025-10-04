import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
ChartJS.register(...registerables);

export default function TemperatureChart({ data }) {
  const yearly = data.reduce((a, c) => {
    const y = new Date(c.time).getFullYear();
    if (!a[y]) a[y] = { temps: 0, count: 0 };
    a[y].temps += c.temperature_2m_max;
    a[y].count += 1;
    return a;
  }, {});

  const labels = Object.keys(yearly);
  const vals = labels.map((y) => yearly[y].temps / yearly[y].count);

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
      x: { ticks: { color: '#88cc88' }, grid: { color: 'rgba(0,255,136,.1)' } },
      y: { ticks: { color: '#88cc88' }, grid: { color: 'rgba(0,255,136,.1)' } },
    },
    animation: { duration: 1800, easing: 'easeOutQuart' },
    onHover: (e, els) => { e.native.target.style.cursor = els[0] ? 'pointer' : 'default'; },
  };

  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label: 'Avg Max Temp °C',
            data: vals,
            borderColor: '#26F17F',
            backgroundColor: 'rgba(38,241,127,.15)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#26F17F',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          },
        ],
      }}
      options={opts}
    />
  );
}