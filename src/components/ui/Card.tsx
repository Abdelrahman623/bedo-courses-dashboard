import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  glow?: 'amber' | 'mint' | 'coral' | 'sky' | false;
  padding?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = true,
  onClick,
  padding = 'p-5',
}) => {
  return (
    <div
      className={[
        'bg-[#131722] border border-white/[0.08] rounded-xl relative overflow-hidden',
        'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]',
        hover ? 'transition-all duration-150 hover:border-white/[0.15] hover:bg-[#161B28]' : '',
        onClick ? 'cursor-pointer select-none' : '',
        padding,
        className,
      ].join(' ')}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
