import React from 'react';
import clsx from 'clsx';

export const Button = ({ children, variant = 'primary', className, ...props }) => {
  return (
    <button
      className={clsx(
        'w-full font-bold transition-all transform active:scale-95',
        variant === 'primary' ? 'btn-primary' : 'btn-secondary',
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
        'w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pastel-blue/50 focus:bg-white transition-all',
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
