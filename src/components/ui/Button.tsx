import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'mint' | 'outline' | 'secondary' | 'tonal' | 'tonalTertiary';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

// Theme roles: `primary` is the one solid CTA (tonal gradient of the primary role);
// `tonal` / `tonalTertiary` bring the secondary / tertiary roles into buttons as a tinted
// fill + outline, so a page can show two or three theme colors without any gradient.
// `mint` is the semantic SUCCESS action (confirm/approve) and is intentionally not themed.
const variants = {
  primary:
    'btn-accent-gradient text-[#0D0F14] font-semibold hover:brightness-110 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.28),0_1px_2px_rgba(0,0,0,0.4)]',
  tonal:
    'bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/30 hover:bg-accent-secondary/20 hover:border-accent-secondary/50 active:bg-accent-secondary/10',
  tonalTertiary:
    'bg-accent-tertiary/10 text-accent-tertiary border border-accent-tertiary/30 hover:bg-accent-tertiary/20 hover:border-accent-tertiary/50 active:bg-accent-tertiary/10',
  mint:
    'bg-status-completed text-[#0D0F14] hover:brightness-110 font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.4)]',
  secondary:
    'bg-white/[0.06] hover:bg-white/[0.10] active:bg-white/[0.04] text-zinc-200 border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]',
  ghost:
    'bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] active:bg-white/[0.03]',
  outline:
    'bg-transparent border border-white/[0.12] hover:border-white/[0.24] hover:bg-white/[0.04] text-zinc-200 active:bg-white/[0.02]',
  danger:
    'bg-rose-500/10 text-rose-400 border border-rose-500/25 hover:bg-rose-500/20 active:bg-rose-500/10',
};

const sizes = {
  sm: 'px-2.5 py-1 text-xs rounded-lg gap-1.5 font-medium',
  md: 'px-3.5 py-1.5 text-sm rounded-lg gap-2 font-medium',
  lg: 'px-5 py-2.5 text-sm rounded-xl gap-2 font-medium',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  onClick,
  type = 'button',
  style,
  ...rest
}) => {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center transition-all duration-100 cursor-pointer select-none',
        'disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className,
      ].join(' ')}
      style={style}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading ? (
        <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : icon}
      {children}
    </button>
  );
};
