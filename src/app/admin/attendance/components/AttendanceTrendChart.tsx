"use client";

import { cn } from "@/lib/utils";

interface TrendDataPoint {
  date: string;
  rate: number;
}

interface AttendanceTrendChartProps {
  data: TrendDataPoint[];
  title?: string;
  height?: number;
  className?: string;
}

export function AttendanceTrendChart({
  data,
  title = "Attendance Trend",
  height = 250,
  className,
}: AttendanceTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className={cn("", className)}>
        {title && (
          <h4 className="text-[13px] font-semibold text-neutral-900 mb-4">
            {title}
          </h4>
        )}
        <div
          className="flex items-center justify-center bg-neutral-50 rounded-xl"
          style={{ height }}
        >
          <span className="text-sm text-neutral-500">No data available</span>
        </div>
      </div>
    );
  }

  // Calculate bounds - attendance rates are 0-100%
  const maxValue = Math.max(...data.map((d) => d.rate), 100);
  const minValue = Math.min(...data.map((d) => d.rate), 0);
  // Add some padding at the bottom
  const chartMin = Math.max(0, minValue - 10);
  const chartMax = Math.min(100, maxValue + 5);
  const range = chartMax - chartMin || 1;

  // Padding for chart
  const padding = { top: 20, right: 20, bottom: 50, left: 50 };
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate Y position for a value
  const getY = (value: number) => {
    const normalizedValue = (value - chartMin) / range;
    return chartHeight - normalizedValue * chartHeight + padding.top;
  };

  // Point spacing
  const pointSpacing = data.length > 1 ? 100 / (data.length - 1) : 50;

  // Generate SVG path for the line
  const linePath = data
    .map((d, i) => {
      const x = i * pointSpacing;
      const y = getY(d.rate);
      return `${i === 0 ? "M" : "L"} ${x}% ${y}`;
    })
    .join(" ");

  // Generate area fill path
  const areaPath = `${linePath} L 100% ${chartHeight + padding.top} L 0% ${
    chartHeight + padding.top
  } Z`;

  // Grid lines (every 20%)
  const gridLines = [0, 20, 40, 60, 80, 100].filter(
    (v) => v >= chartMin && v <= chartMax
  );

  // Color based on average rate
  const avgRate = data.reduce((sum, d) => sum + d.rate, 0) / data.length;
  const lineColor =
    avgRate >= 80
      ? "#10B981" // Green
      : avgRate >= 60
        ? "#F59E0B" // Amber
        : "#EF4444"; // Red

  // Format date for x-axis labels
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  // Determine which labels to show (max ~7 labels)
  const labelInterval = Math.max(1, Math.ceil(data.length / 7));

  return (
    <div className={cn("", className)}>
      {title && (
        <h4 className="text-[13px] font-semibold text-neutral-900 mb-4">
          {title}
        </h4>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-1 rounded-full"
            style={{ backgroundColor: lineColor }}
          />
          <span className="text-xs text-neutral-600">Attendance Rate</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-neutral-500">
            Avg: {Math.round(avgRate)}%
          </span>
        </div>
      </div>

      <div className="relative" style={{ height }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-12 w-12 flex flex-col justify-between text-right pr-2">
          {gridLines.reverse().map((value, i) => (
            <span
              key={i}
              className="text-[10px] text-neutral-400 tabular-nums"
              style={{
                position: "absolute",
                top: getY(gridLines[gridLines.length - 1 - i]) - 6,
                right: 8,
              }}
            >
              {value}%
            </span>
          ))}
        </div>

        {/* Chart area */}
        <div className="absolute left-12 right-0 top-0 bottom-0">
          <svg
            width="100%"
            height={height}
            className="overflow-visible"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            {gridLines.map((value, i) => {
              const y = getY(value);
              return (
                <line
                  key={i}
                  x1="0%"
                  y1={y}
                  x2="100%"
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* 70% threshold line */}
            {chartMin <= 70 && chartMax >= 70 && (
              <line
                x1="0%"
                y1={getY(70)}
                x2="100%"
                y2={getY(70)}
                stroke="#F59E0B"
                strokeWidth="1"
                strokeDasharray="6 3"
              />
            )}

            {/* Area fill */}
            <path
              d={areaPath}
              fill={lineColor}
              opacity="0.1"
            />

            {/* Main line */}
            <path
              d={linePath}
              fill="none"
              stroke={lineColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {data.map((d, i) => (
              <g key={i}>
                <circle
                  cx={`${i * pointSpacing}%`}
                  cy={getY(d.rate)}
                  r="5"
                  fill="white"
                  stroke={lineColor}
                  strokeWidth="2"
                />
                {/* Tooltip trigger area */}
                <title>
                  {formatDate(d.date)}: {d.rate}%
                </title>
              </g>
            ))}
          </svg>

          {/* X-axis labels */}
          <div className="absolute left-0 right-0 bottom-0 h-10 flex">
            {data.map((d, i) => {
              // Only show labels at intervals
              if (i % labelInterval !== 0 && i !== data.length - 1) {
                return null;
              }
              return (
                <span
                  key={i}
                  className="text-[10px] text-neutral-500 text-center absolute"
                  style={{
                    left: `${i * pointSpacing}%`,
                    transform: "translateX(-50%)",
                    top: 5,
                  }}
                >
                  {formatDate(d.date)}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* 70% threshold legend */}
      <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
        <span className="w-4 h-0.5 bg-amber-500 opacity-60" />
        <span>70% at-risk threshold</span>
      </div>
    </div>
  );
}
