import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  children: ReactNode;
}

export default function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' && 'bg-primary text-white hover:opacity-90',
        variant === 'outline' && 'border border-border hover:bg-surface-muted',
        variant === 'ghost' && 'hover:bg-surface-muted',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
