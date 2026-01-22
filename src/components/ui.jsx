import React from 'react';
import clsx from 'clsx';

export const Button = ({ children, variant = 'primary', className, ...props }) => {
  return (
    <button
      className={clsx(
        'w-full font-semibold transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed',
        variant === 'primary' ? 'btn-primary' : variant === 'ghost' ? 'btn-ghost' : 'btn-secondary',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export const Input = ({ className, ...props }) => {
  return (
    <input
      className={clsx(
        'w-full px-5 py-4 bg-white/70 border border-white/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all shadow-sm placeholder:text-gray-400',
        className
      )}
      {...props}
    />
  );
};

export const Card = ({ children, className }) => {
  return (
    <div className={clsx('card', className)}>
      {children}
    </div>
  );
};

export const Chip = ({ children, active = false, className, ...props }) => {
  return (
    <button
      type="button"
      className={clsx(
        'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all',
        active ? 'bg-gray-900 text-white shadow-sm' : 'bg-white/70 text-gray-700 hover:bg-white',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
