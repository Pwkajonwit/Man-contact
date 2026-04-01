import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const CorporateButton: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-md uppercase tracking-wide text-xs";
  
  const variants = {
    primary: "bg-brand-green text-brand-white hover:opacity-90 active:bg-brand-green/80",
    secondary: "bg-brand-gray text-brand-dark hover:bg-brand-dark/10 active:bg-brand-dark/20",
    outline: "bg-transparent border border-brand-gray text-brand-dark hover:bg-brand-gray active:bg-brand-gray/50",
    danger: "bg-red-600 text-brand-white hover:bg-red-700 active:bg-red-800",
  };

  const sizes = {
    sm: "h-8 px-4",
    md: "h-11 px-6", // Touch-friendly (min 44px)
    lg: "h-14 px-8 text-sm",
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        "shadow-none",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default CorporateButton;
