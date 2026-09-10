import React, { ReactNode } from 'react';

export interface StatCardItem {
  id: string;
  label: string;
  value: string | number;
  subtext?: string;
  icon: ReactNode;
  iconBg?: string;
  change?: string;
  positive?: boolean;
  highlight?: boolean;
}

interface AdminStatsProps {
  stats: StatCardItem[];
}

export const AdminStats: React.FC<AdminStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className={`bg-white border rounded-xl p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-sm ${
            stat.highlight
              ? 'border-amber-300 ring-1 ring-amber-100 bg-linear-to-br from-white to-amber-50/40'
              : 'border-stone-200/90'
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              {stat.label}
            </span>
            <div
              className={`p-2.5 rounded-lg shrink-0 ${
                stat.iconBg || 'bg-amber-50 text-amber-800'
              }`}
            >
              {stat.icon}
            </div>
          </div>

          <div className="mt-2.5">
            <div className="text-2xl font-bold font-serif text-stone-900 tracking-tight">
              {stat.value}
            </div>
            {stat.subtext && (
              <div className="flex items-center text-xs text-stone-500 mt-1">
                {stat.change && (
                  <span
                    className={`font-semibold mr-1.5 ${
                      stat.positive ? 'text-emerald-700' : 'text-stone-600'
                    }`}
                  >
                    {stat.change}
                  </span>
                )}
                <span>{stat.subtext}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
