import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CorporateCard: React.FC<CardProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "bg-brand-white border border-brand-gray rounded-md shadow-none p-6",
        "transition-colors hover:border-brand-green/20 overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default CorporateCard;
