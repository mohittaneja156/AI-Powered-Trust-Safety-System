import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export interface FlagSeverityDonutChartProps {
  data: { [severity: string]: number };
}

const severityColors: { [key: string]: string } = {
  Critical: '#dc2626',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#16a34a',
};

const FlagSeverityDonutChart: React.FC<FlagSeverityDonutChartProps> = ({ data }) => {
  const labels = Object.keys(data);
  const values = labels.map(l => data[l]);
  const backgroundColors = labels.map(l => severityColors[l] || '#64748b');

  return (
    <div className="flex flex-col items-center w-full">
      <Doughnut
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: backgroundColors,
              borderWidth: 2,
            },
          ],
        }}
        options={{
          plugins: {
            legend: {
              display: true,
              position: 'bottom' as const,
              labels: { boxWidth: 18, font: { size: 14 } },
            },
          },
          cutout: '70%',
        }}
      />
      <div className="mt-2 text-sm text-gray-600 font-medium">Flag Severity Breakdown</div>
    </div>
  );
};

export default FlagSeverityDonutChart; 