export interface WingetPackage {
  id: string;
  version: string;
  name?: string;
  tags?: string[];
  lastUpdate?: string;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
