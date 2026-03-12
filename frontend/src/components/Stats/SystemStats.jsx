import React from 'react';
import { TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react';
import { clsx } from 'clsx';

const SystemStats = ({ stats }) => {
    if (!stats) return null;

    const formatVolume = (val) => {
        if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
        if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
        return val.toFixed(1);
    };

    return (
        <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-gray-300 font-bold flex items-center gap-2 text-sm uppercase tracking-widest">
                    <Activity size={16} className="text-green-500" />
                    Live Symbol Stats
                </h2>
                <span className="text-[10px] text-gray-500 font-mono">
                    Last 60s: {stats.ticks_per_sec_last_60s.toFixed(1)} t/s
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#0f1117]/50 border-b border-gray-800">
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Symbol</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Price</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">24h Chg</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Vol</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Stored</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.values(stats.per_symbol).map((s) => (
                            <tr
                                key={s.symbol}
                                className={clsx(
                                    "border-b border-gray-800/50 hover:bg-white/5 transition-colors",
                                    s.had_recent_drops && "animate-dropFlash"
                                )}
                            >
                                <td className="px-4 py-3 font-bold text-white text-sm">{s.symbol}</td>
                                <td className="px-4 py-3 font-mono text-sm text-right">
                                    {s.latest_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                </td>
                                <td className={clsx(
                                    "px-4 py-3 text-xs font-bold text-right",
                                    s.price_change_24h_pct >= 0 ? "text-green-500" : "text-red-500"
                                )}>
                                    <div className="flex items-center justify-end gap-1">
                                        {s.price_change_24h_pct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                        {s.price_change_24h_pct >= 0 ? '+' : ''}{s.price_change_24h_pct.toFixed(2)}%
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-xs text-right font-mono">
                                    {formatVolume(s.total_volume)}
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-xs text-right font-mono">
                                    {s.tick_count.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-center">
                                        <div className={clsx(
                                            "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black tracking-tighter border",
                                            s.had_recent_drops
                                                ? "bg-red-500/10 border-red-500/30 text-red-500"
                                                : "bg-green-500/10 border-green-500/30 text-green-500"
                                        )}>
                                            <div className={clsx("w-1.5 h-1.5 rounded-full", s.had_recent_drops ? "bg-red-500" : "bg-green-500 animate-pulse-dot")} />
                                            {s.had_recent_drops ? "CONGESTED" : "STREAMING"}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SystemStats;
