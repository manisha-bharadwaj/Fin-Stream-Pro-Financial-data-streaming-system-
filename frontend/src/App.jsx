import React, { useState } from 'react';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import LivePriceChart from './components/Charts/LivePriceChart';
import CandlestickChart from './components/Charts/CandlestickChart';
import QueueHealthMonitor from './components/Monitor/QueueHealthMonitor';
import SystemStats from './components/Stats/SystemStats';
import { useMarketStream } from './hooks/useMarketStream';
import { useMetrics } from './hooks/useMetrics';
import { Activity, Clock } from 'lucide-react';

const App = () => {
    const [selectedSymbols, setSelectedSymbols] = useState(["AAPL", "BTC-USD"]);

    // Hooks
    const { tickData, isConnected, lastError } = useMarketStream(selectedSymbols);
    const { metrics, stats, metricsHistory, changeStrategy } = useMetrics();

    const handleToggleSymbol = (symbol) => {
        setSelectedSymbols(prev =>
            prev.includes(symbol)
                ? prev.filter(s => s !== symbol)
                : [...prev, symbol]
        );
    };

    return (
        <div className="min-h-screen bg-[#0f1117] text-[#e6edf3] flex flex-col font-sans selection:bg-blue-500/30">
            <Navbar
                isConnected={isConnected}
                throughput={metrics?.throughput_per_sec}
            />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar
                    selectedSymbols={selectedSymbols}
                    onToggle={handleToggleSymbol}
                    tickData={tickData}
                    stats={stats}
                />

                <main className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Error Notification */}
                    {lastError && (
                        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-500 text-sm font-bold animate-fadeIn">
                            {lastError} - Attempting to reconnect...
                        </div>
                    )}

                    {/* Section 1: Live Feed */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                                <Activity className="text-blue-500" />
                                Real-Time Price Engine
                            </h2>
                            <div className="flex items-center gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    Price Update (1ms)
                                </span>
                                <span className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                    Aggregation (1s)
                                </span>
                            </div>
                        </div>
                        <LivePriceChart
                            tickData={tickData}
                            selectedSymbols={selectedSymbols}
                        />
                    </section>

                    {/* Section 2: Historical OHLCV */}
                    <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {selectedSymbols.slice(0, 2).map(symbol => (
                            <div key={symbol} className="animate-fadeIn">
                                <CandlestickChart symbol={symbol} />
                            </div>
                        ))}
                        {selectedSymbols.length === 0 && (
                            <div className="col-span-2 h-[350px] border-2 border-dashed border-gray-800 rounded-xl flex items-center justify-center text-gray-600 font-bold text-sm uppercase tracking-widest">
                                Select symbols in sidebar to view charts
                            </div>
                        )}
                    </section>

                    {/* Section 3: System Health & Stats */}
                    <section className="grid grid-cols-1 2xl:grid-cols-2 gap-6 pb-8">
                        <QueueHealthMonitor
                            metrics={metrics}
                            metricsHistory={metricsHistory}
                            changeStrategy={changeStrategy}
                        />
                        <SystemStats stats={stats} />
                    </section>
                </main>
            </div>
        </div>
    );
};

export default App;
