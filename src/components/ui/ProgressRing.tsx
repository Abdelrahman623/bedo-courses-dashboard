import React from 'react';
import { motion } from 'framer-motion';
import { ringCircumference, ringOffset, getAccentColor } from '../../lib/utils';

interface ProgressRingProps {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  animate?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 100,
  stroke = 8,
  color,
  trackColor = 'rgba(255,255,255,0.06)',
  label,
  sublabel,
  animate = true,
}) => {
  const activeColor = color ?? getAccentColor();
  const r = (size - stroke) / 2;
  const circ = ringCircumference(r);
  const offset = ringOffset(r, value);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center flex-col gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <motion.circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={activeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={animate ? { strokeDashoffset: circ } : { strokeDashoffset: offset }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' as const }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && (
          <span className="font-bold leading-none" style={{ fontSize: size * 0.18, color: activeColor }}>{label}</span>
        )}
        {sublabel && (
          <span className="text-txt-muted mt-0.5 text-center leading-tight" style={{ fontSize: size * 0.1 }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};
