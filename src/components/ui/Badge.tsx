import React from 'react';
import { STATUS_COLORS, STATUS_LABELS } from '../../lib/utils';

type StatusKey = keyof typeof STATUS_COLORS;

interface BadgeProps {
  status?: StatusKey;
  label?: string;
  color?: string;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  status, label, color, size = 'sm', dot = true,
}) => {
  const c = color || (status ? STATUS_COLORS[status] : '#8A94A8');
  const text = label || (status ? STATUS_LABELS[status as keyof typeof STATUS_LABELS] : '');
  const px = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${px}`}
      style={{ background: `${c}20`, color: c, border: `1px solid ${c}30` }}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c }} />
      )}
      {text}
    </span>
  );
};
