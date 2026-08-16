import React from 'react';

interface CircularProgressProps {
  value: number;
  maxValue?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showValue?: boolean;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  maxValue = 5,
  size = 120,
  strokeWidth = 8,
  label,
  showValue = true
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = (value / maxValue) * 100;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = (val: number) => {
    if (val < 2) return '#ef4444'; // red
    if (val < 3.5) return '#f59e0b'; // orange
    return '#10b981'; // green
  };

  const color = getColor(value);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${color})`
            }}
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{value.toFixed(1)}</span>
            <span className="text-xs text-slate-400">/ {maxValue}</span>
          </div>
        )}
      </div>
      {label && (
        <span className="mt-2 text-sm font-medium text-slate-300">{label}</span>
      )}
    </div>
  );
};

export default CircularProgress;
