import React, { useState, useEffect } from 'react';
import { Activity, Zap } from 'lucide-react';
import { clsx } from 'clsx';

const Navbar = ({ isConnected, throughput = 0 }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const isHighTraffic = throughput > 500;

    return (
        <nav className="w-full h-16 bg-[#0f1117] border-b border-gray-800 flex items-center justify-between px-6 sticky top-0 z-50">
            {/* Left: Branding */}
            <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                    <Zap className="text-white w-5 h-5 fill-current" />
                </div>
                <div>
                    <h1 className="text-white font-bold text-lg leading-tight">FinStream Pro</h1>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Financial Data Streaming</p>
                </div>
            </div>

            {/* Center: Throughput Badge */}
            <div className="flex items-center gap-4">
                <div className={clsx(
                    "flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-semibold transition-all duration-300",
                    isHighTraffic
                        ? "bg-blue-500/10 border-blue-500/50 text-blue-400 animate-pulse"
                        : "bg-gray-800/50 border-gray-700 text-gray-400"
                )}>
                    <Activity className="w-4 h-4" />
                    <span>{throughput.toLocaleString()} ticks/sec</span>
                </div>
            </div>

            {/* Right: Status & Clock */}
            <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                    <p className="text-white font-mono text-sm leading-none">{time.toLocaleTimeString()}</p>
                    <p className="text-gray-500 text-[10px] uppercase tracking-widest">{time.toLocaleDateString()}</p>
                </div>

                <div className={clsx(
                    "flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold transition-all",
                    isConnected
                        ? "bg-green-500/10 text-green-500"
                        : "bg-red-500/10 text-red-500"
                )}>
                    <div className={clsx(
                        "w-2 h-2 rounded-full",
                        isConnected ? "bg-green-500 animate-pulse-dot" : "bg-red-500"
                    )} />
                    {isConnected ? "LIVE" : "DISCONNECTED"}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
