import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

interface AdminBreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate: (route: string) => void;
}

export const AdminBreadcrumbs: React.FC<AdminBreadcrumbsProps> = ({ items, onNavigate }) => {
  return (
    <nav className="flex items-center space-x-1.5 text-xs text-stone-500 font-medium overflow-x-auto py-1 whitespace-nowrap">
      <button
        onClick={() => onNavigate('/admin')}
        className="flex items-center text-stone-600 hover:text-[#7F1D1D] transition-colors"
      >
        <Home className="w-3.5 h-3.5 mr-1" />
        <span>Admin</span>
      </button>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={index} className="flex items-center space-x-1.5">
            <ChevronRight className="w-3 h-3 text-stone-400 shrink-0" />
            {isLast || !item.route ? (
              <span className="text-stone-900 font-semibold">{item.label}</span>
            ) : (
              <button
                onClick={() => onNavigate(item.route!)}
                className="text-stone-600 hover:text-[#7F1D1D] transition-colors"
              >
                {item.label}
              </button>
            )}
          </div>
        );
      })}
    </nav>
  );
};
