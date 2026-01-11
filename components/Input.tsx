import React from 'react';
import { Search } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {label}
        </label>
      )}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
          <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-accent transition-colors duration-200" />
        </div>
        <input
          className={`w-full h-14 pl-12 pr-4 bg-white text-foreground placeholder:text-muted-foreground/60 border border-border rounded-xl font-medium text-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md ${className}`}
          {...props}
        />
      </div>
    </div>
  );
};