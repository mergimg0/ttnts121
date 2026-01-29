"use client";

import { cn } from "@/lib/utils";
import { formatFinancialAmount } from "@/types/financials";

// ============================================================================
// PIE CHART COMPONENT
// ============================================================================

interface PieChartDataItem {
  label: string;
  value: number;
  color: string;
  percentage?: number;
}

interface PieChartProps {
  data: PieChartDataItem[];
  title?: string;
  size?: number;
  className?: string;
}

export function PieChart({
  data,
  title,
  size = 200,
  className,
}: PieChartProps) {
  // Filter out zero values
  const filteredData = data.filter((item) => item.value > 0);
  const total = filteredData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0 || filteredData.length === 0) {
    return (
      <div className={cn("text-center", className)}>
        {title && (
          <h4 className="text-[13px] font-semibold text-neutral-900 mb-4">
            {title}
          </h4>
        )}
        <div
          className="flex items-center justify-center rounded-full bg-neutral-100 mx-auto"
          style={{ width: size, height: size }}
        >
          <span className="text-sm text-neutral-500">No data</span>
        </div>
      </div>
    );
  }

  // Calculate percentages and conic gradient
  let cumulativePercent = 0;
  const segments: string[] = [];

  filteredData.forEach((item) => {
    const percentage = (item.value / total) * 100;
    const startPercent = cumulativePercent;
    cumulativePercent += percentage;
    segments.push(
      `${item.color} ${startPercent}% ${cumulativePercent}%`
    );
  });

  const gradient = `conic-gradient(${segments.join(", ")})`;

  return (
    <div className={cn("", className)}>
      {title && (
        <h4 className="text-[13px] font-semibold text-neutral-900 mb-4 text-center">
          {title}
        </h4>
      )}
      <div className="flex flex-col items-center gap-4">
        {/* Pie */}
        <div
          className="rounded-full shadow-inner"
          style={{
            width: size,
            height: size,
            background: gradient,
          }}
        />

        {/* Legend */}
        <div className="w-full space-y-2">
          {filteredData.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-neutral-700 truncate">{item.label}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-neutral-900 font-medium tabular-nums">
                    {formatFinancialAmount(item.value)}
                  </span>
                  <span className="text-neutral-400 text-xs tabular-nums">
                    ({percentage}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LINE CHART COMPONENT
// ============================================================================

interface LineChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

interface LineChartProps {
  data: LineChartDataPoint[];
  title?: string;
  height?: number;
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  showGrid?: boolean;
  className?: string;
}

export function LineChart({
  data,
  title,
  height = 200,
  primaryLabel = "Value",
  secondaryLabel,
  primaryColor = "#10B981",
  secondaryColor = "#EF4444",
  showGrid = true,
  className,
}: LineChartProps) {
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
          <span className="text-sm text-neutral-500">No data</span>
        </div>
      </div>
    );
  }

  // Calculate bounds
  const allValues = data.flatMap((d) =>
    [d.value, d.secondaryValue].filter((v): v is number => v !== undefined)
  );
  const maxValue = Math.max(...allValues, 0);
  const minValue = Math.min(...allValues, 0);
  const range = maxValue - minValue || 1;

  // Padding for chart
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = 100; // percentage based
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate points
  const getY = (value: number) => {
    const normalizedValue = (value - minValue) / range;
    return chartHeight - normalizedValue * chartHeight + padding.top;
  };

  const pointSpacing = data.length > 1 ? 100 / (data.length - 1) : 50;

  // Generate SVG path
  const generatePath = (values: (number | undefined)[]) => {
    const validPoints = values
      .map((v, i) => (v !== undefined ? { x: i * pointSpacing, y: getY(v) } : null))
      .filter((p): p is { x: number; y: number } => p !== null);

    if (validPoints.length === 0) return "";

    return validPoints
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x}% ${p.y}`)
      .join(" ");
  };

  const primaryPath = generatePath(data.map((d) => d.value));
  const secondaryPath = secondaryLabel
    ? generatePath(data.map((d) => d.secondaryValue))
    : "";

  // Grid lines
  const gridLines = 5;
  const gridValues = Array.from({ length: gridLines }, (_, i) =>
    minValue + (range * i) / (gridLines - 1)
  );

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
            style={{ backgroundColor: primaryColor }}
          />
          <span className="text-xs text-neutral-600">{primaryLabel}</span>
        </div>
        {secondaryLabel && (
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-1 rounded-full"
              style={{ backgroundColor: secondaryColor }}
            />
            <span className="text-xs text-neutral-600">{secondaryLabel}</span>
          </div>
        )}
      </div>

      <div className="relative" style={{ height }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-10 w-14 flex flex-col justify-between text-right pr-2">
          {gridValues.reverse().map((value, i) => (
            <span key={i} className="text-[10px] text-neutral-400 tabular-nums">
              {formatFinancialAmount(value)}
            </span>
          ))}
        </div>

        {/* Chart area */}
        <div className="absolute left-14 right-0 top-0 bottom-0">
          <svg
            width="100%"
            height={height}
            className="overflow-visible"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            {showGrid &&
              Array.from({ length: gridLines }).map((_, i) => {
                const y = padding.top + (chartHeight * i) / (gridLines - 1);
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

            {/* Zero line if applicable */}
            {minValue < 0 && maxValue > 0 && (
              <line
                x1="0%"
                y1={getY(0)}
                x2="100%"
                y2={getY(0)}
                stroke="#9ca3af"
                strokeWidth="1"
              />
            )}

            {/* Primary line */}
            <path
              d={primaryPath}
              fill="none"
              stroke={primaryColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Secondary line */}
            {secondaryPath && (
              <path
                d={secondaryPath}
                fill="none"
                stroke={secondaryColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data points - primary */}
            {data.map((d, i) => (
              <circle
                key={`primary-${i}`}
                cx={`${i * pointSpacing}%`}
                cy={getY(d.value)}
                r="4"
                fill="white"
                stroke={primaryColor}
                strokeWidth="2"
              />
            ))}

            {/* Data points - secondary */}
            {secondaryLabel &&
              data.map(
                (d, i) =>
                  d.secondaryValue !== undefined && (
                    <circle
                      key={`secondary-${i}`}
                      cx={`${i * pointSpacing}%`}
                      cy={getY(d.secondaryValue)}
                      r="4"
                      fill="white"
                      stroke={secondaryColor}
                      strokeWidth="2"
                    />
                  )
              )}
          </svg>

          {/* X-axis labels */}
          <div className="absolute left-0 right-0 bottom-0 flex justify-between">
            {data.map((d, i) => (
              <span
                key={i}
                className="text-[10px] text-neutral-500 text-center"
                style={{
                  position: "absolute",
                  left: `${i * pointSpacing}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {d.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// BAR CHART COMPONENT
// ============================================================================

interface BarChartDataItem {
  label: string;
  value: number;
  secondaryValue?: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartDataItem[];
  title?: string;
  height?: number;
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  horizontal?: boolean;
  className?: string;
}

export function BarChart({
  data,
  title,
  height = 200,
  primaryLabel = "Value",
  secondaryLabel,
  primaryColor = "#3B82F6",
  secondaryColor = "#10B981",
  horizontal = false,
  className,
}: BarChartProps) {
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
          <span className="text-sm text-neutral-500">No data</span>
        </div>
      </div>
    );
  }

  // Calculate max value
  const allValues = data.flatMap((d) =>
    [d.value, d.secondaryValue].filter((v): v is number => v !== undefined)
  );
  const maxValue = Math.max(...allValues, 1);

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
            className="w-3 h-3 rounded"
            style={{ backgroundColor: primaryColor }}
          />
          <span className="text-xs text-neutral-600">{primaryLabel}</span>
        </div>
        {secondaryLabel && (
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded"
              style={{ backgroundColor: secondaryColor }}
            />
            <span className="text-xs text-neutral-600">{secondaryLabel}</span>
          </div>
        )}
      </div>

      {horizontal ? (
        // Horizontal bars
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-700">{item.label}</span>
                <span className="text-neutral-900 font-medium tabular-nums">
                  {formatFinancialAmount(item.value)}
                </span>
              </div>
              <div className="h-4 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color || primaryColor,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Vertical bars
        <div className="flex items-end gap-2 justify-between" style={{ height }}>
          {data.map((item, index) => (
            <div
              key={index}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div className="w-full flex items-end justify-center gap-1" style={{ height: height - 30 }}>
                {/* Primary bar */}
                <div
                  className="flex-1 max-w-8 rounded-t transition-all duration-500"
                  style={{
                    height: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color || primaryColor,
                  }}
                />
                {/* Secondary bar */}
                {item.secondaryValue !== undefined && (
                  <div
                    className="flex-1 max-w-8 rounded-t transition-all duration-500"
                    style={{
                      height: `${(item.secondaryValue / maxValue) * 100}%`,
                      backgroundColor: secondaryColor,
                    }}
                  />
                )}
              </div>
              <span className="text-[10px] text-neutral-500 text-center truncate w-full">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// STAT COMPARISON COMPONENT
// ============================================================================

interface StatComparisonProps {
  current: number;
  previous: number;
  label: string;
  format?: "currency" | "number" | "percent";
  className?: string;
}

export function StatComparison({
  current,
  previous,
  label,
  format = "currency",
  className,
}: StatComparisonProps) {
  const change = previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : 0;
  const isPositive = change >= 0;

  const formatValue = (value: number) => {
    switch (format) {
      case "currency":
        return formatFinancialAmount(value);
      case "percent":
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  return (
    <div className={cn("", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-neutral-900">{formatValue(current)}</p>
      <div className="flex items-center gap-1 mt-1">
        <span
          className={cn(
            "text-sm font-medium tabular-nums",
            isPositive ? "text-emerald-600" : "text-red-500"
          )}
        >
          {isPositive ? "+" : ""}
          {change.toFixed(1)}%
        </span>
        <span className="text-xs text-neutral-400">vs previous period</span>
      </div>
    </div>
  );
}
