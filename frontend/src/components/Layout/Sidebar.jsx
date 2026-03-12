import React from 'react';
import { SYMBOLS, CHART_COLORS } from '../../constants';
import { clsx } from 'clsx';
import { Check, Database } from 'lucide-react';

const Sidebar = ({ selectedSymbols, onToggle, tickData, stats }) => {
    return (
        <aside className="w-64 min-h-[calc(100vh-64px)] bg-[#161b22] border-r border-gray-800 flex flex-col sticky top-16">
            <div className="p-4 border-b border-gray-800">
                <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Markets</h2>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
                {SYMBOLS.map((symbol) => {
                    const data = tickData[symbol] || [];
                    const latestTick = data[data.length - 1];
                    const firstTick = data[0];
                    const isSelected = selectedSymbols.includes(symbol);

                    let changePercent = 0;
                    if (latestTick && firstTick) {
                        changePercent = ((latestTick.price - firstTick.price) / firstTick.price) * 100;
                    }

                    return (
                        <div
                            key={symbol}
                            onClick={() => onToggle(symbol)}
                            className={clsx(
                                "group cursor-pointer px-4 py-3 border-l-2 transition-all hover:bg-white/5",
                                isSelected ? "border-blue-500 bg-blue-500/5" : "border-transparent"
                            )}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: CHART_COLORS[symbol] }}
                                    />
                                    <span className="text-sm font-bold text-gray-200">{symbol}</span>
                                </div>
                                {isSelected && <Check className="w-3.5 h-3.5 text-blue-500" />}
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-lg font-mono text-white">
                                    {latestTick?.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) || "--"}
                                </span>
                                <span className={clsx(
                                    "text-xs font-medium",
                                    changePercent >= 0 ? "text-green-500" : "text-red-500"
                                )}>
                                    {changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-4 bg-[#0d1117] border-t border-gray-800">
                <div className="flex items-center gap-2 text-gray-500">
                    <Database className="w-4 h-4" />
                    <div>
                        <p className="text-[10px] uppercase font-bold tracking-tight">System Records</p>
                        <p className="text-sm font-mono text-gray-300">
                            {stats?.total_ticks_stored?.toLocaleString() || "0"}
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
