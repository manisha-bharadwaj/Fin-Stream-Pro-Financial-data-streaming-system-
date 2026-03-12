import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { clsx } from 'clsx';

const MetricCard = ({ title, value, unit, trend, color = 'blue', icon: Icon }) => {
    const colorClasses = {
        blue: 'text-blue-400',
        green: 'text-green-500',
        red: 'text-red-500',
        yellow: 'text-yellow-500',
        purple: 'text-purple-400',
    };

    return (
        <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 relative group hover:border-gray-700 transition-all">
            {Icon && (
                <div className="absolute top-4 right-4 text-gray-700 group-hover:text-gray-600 transition-colors">
                    <Icon size={20} />
                </div>
            )}

            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>

            <div className="flex items-baseline gap-2">
                <span className={clsx("text-2xl font-mono font-bold", colorClasses[color])}>
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </span>
                {unit && <span className="text-gray-600 text-xs font-medium">{unit}</span>}
            </div>

            {trend !== undefined && (
                <div className={clsx(
                    "flex items-center gap-1 mt-3 text-xs font-bold",
                    trend >= 0 ? "text-green-500" : "text-red-500"
                )}>
                    {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>{Math.abs(trend).toFixed(1)}%</span>
                </div>
            )}
        </div>
    );
};

export default MetricCard;
