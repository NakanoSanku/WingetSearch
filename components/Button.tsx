import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  disabled,
  ...props
}) => {
  const baseStyles = "relative inline-flex items-center justify-center font-medium transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed group";
  
  const variants = {
    primary: "bg-gradient-to-r from-accent to-accent-secondary text-white shadow-sm hover:shadow-accent hover:-translate-y-0.5 active:scale-[0.98] border border-transparent",
    secondary: "bg-white text-foreground border border-border hover:border-accent/30 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]",
    outline: "bg-transparent border border-border text-foreground hover:bg-muted active:scale-[0.98]",
    ghost: "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50",
  };

  const sizes = {
    sm: "h-9 px-4 text-xs rounded-lg",
    md: "h-12 px-6 text-sm rounded-xl",
    lg: "h-14 px-8 text-base rounded-xl",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {!isLoading && icon && <span className="mr-2 transition-transform duration-200 group-hover:scale-110">{icon}</span>}
      {children}
    </button>
  );
};