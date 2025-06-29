import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export interface FlagTrendsChartProps {
  labels: string[];
  data: { [severity: string]: number[] };
}

const severityColors: { [key: string]: string } = {
  Critical: 'rgba(220, 38, 38, 0.8)',
  High: 'rgba(251, 146, 60, 0.8)',
  Medium: 'rgba(251, 191, 36, 0.8)',
  Low: 'rgba(52, 211, 153, 0.8)',
};

const FlagTrendsChart: React.FC<FlagTrendsChartProps> = ({ labels, data }) => {
  const datasets = Object.keys(data).map((severity) => ({
    label: severity,
    data: data[severity],
    backgroundColor: severityColors[severity] || 'rgba(59, 130, 246, 0.8)',
    borderRadius: 6,
    maxBarThickness: 32,
  }));

  return (
    <Bar
      data={{
        labels,
        datasets,
      }}
      options={{
        responsive: true,
        plugins: {
          legend: { position: 'top' as const },
          title: { display: false },
        },
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true },
        },
      }}
    />
  );
};

export default FlagTrendsChart; 