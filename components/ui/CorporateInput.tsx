import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const CorporateInput: React.FC<InputProps> = ({
  label,
  error,
  className,
  ...props
}) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="text-xs font-bold uppercase tracking-widest text-brand-dark/60 ml-1">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full h-11 px-4 text-sm font-medium transition-all bg-brand-gray border border-brand-gray rounded-md",
          "placeholder:text-brand-dark/40",
          "focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500",
          className
        )}
        {...props}
      />
      {error && <span className="text-[10px] text-red-500 ml-1 font-medium">{error}</span>}
    </div>
  );
};

export default CorporateInput;
