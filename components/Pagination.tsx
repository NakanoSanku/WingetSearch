import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PaginationProps } from '../types';

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 3; 
    
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...');
        pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mt-16 mb-12">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="w-10 h-10 flex items-center justify-center rounded-xl border border-border bg-white text-muted-foreground hover:text-foreground hover:border-accent/30 hover:bg-muted/30 transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-border"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-1 bg-white border border-border p-1.5 rounded-xl shadow-sm">
        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-2 text-muted-foreground text-xs font-mono">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={`
                  w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200
                  ${currentPage === page 
                    ? 'bg-foreground text-white shadow-md scale-105' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                `}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="w-10 h-10 flex items-center justify-center rounded-xl border border-border bg-white text-muted-foreground hover:text-foreground hover:border-accent/30 hover:bg-muted/30 transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-border"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};