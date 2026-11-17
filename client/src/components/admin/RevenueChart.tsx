// RevenueChart.tsx client/src/components/admin/RevenueChart.tsx
// Revenue by day (or month for Year), with a gradient fill and period-average line.

// STEP 41 (part 7): The sales chart

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ScriptableContext,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { DashboardResponse } from "../../types/admin";
import { naira } from "../../utils/format";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
);

const PRIMARY = "#322bd0";
const MUTED = "#565e74";
const GRID = "#eaf2ff";

const shortNaira = (value: number) =>
  value >= 1_000_000
    ? `₦${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
    : value >= 1000
      ? `₦${Math.round(value / 1000)}K`
      : `₦${value}`;

const RevenueChart = ({ chart }: { chart: DashboardResponse["chart"] }) => {
  const average =
    chart.length > 0
      ? chart.reduce((sum, point) => sum + point.sales, 0) / chart.length
      : 0;

  const data = {
    labels: chart.map((point) => point.label),
    datasets: [
      {
        label: "Sales",
        data: chart.map((point) => point.sales),
        borderColor: PRIMARY,
        borderWidth: 3,
        tension: 0.4,
        cubicInterpolationMode: "monotone" as const,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: PRIMARY,
        fill: true,
        backgroundColor: (context: ScriptableContext<"line">) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return "rgba(50,43,208,0.12)";
          const gradient = ctx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom,
          );
          gradient.addColorStop(0, "rgba(50,43,208,0.25)");
          gradient.addColorStop(1, "rgba(50,43,208,0)");
          return gradient;
        },
      },
      {
        label: "Period average",
        data: chart.map(() => average),
        borderColor: "#a3a1b8",
        borderWidth: 2,
        borderDash: [6, 6],
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      tooltip: {
        backgroundColor: "#0b1c30",
        padding: 12,
        callbacks: {
          label: (item: {
            dataset: { label?: string };
            parsed: { y: number | null };
          }) => `${item.dataset.label}: ${naira(item.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: MUTED, maxTicksLimit: 7, maxRotation: 0 },
      },
      y: {
        beginAtZero: true,
        grid: { color: GRID },
        border: { display: false },
        ticks: {
          color: MUTED,
          callback: (value: string | number) => shortNaira(Number(value)),
        },
      },
    },
  };

  return (
    <div
      className="h-80"
      role="img"
      aria-label={`Sales chart, ${chart.length} points. Period average ${naira(Math.round(average))}.`}
    >
      <Line data={data} options={options} />
    </div>
  );
};

export default RevenueChart;
