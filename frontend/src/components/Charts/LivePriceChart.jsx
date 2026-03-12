import React, { useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { CHART_COLORS } from '../../constants';

const LivePriceChart = ({ tickData, selectedSymbols }) => {
    // Optimized: Merge data using a Map for O(N) performance
    const chartData = useMemo(() => {
        const timestampMap = new Map();

        selectedSymbols.forEach(symbol => {
            const data = tickData[symbol] || [];
            data.forEach(tick => {
                // Group by second for the baseline chart
                const ts = Math.floor(tick.timestamp);
                if (!timestampMap.has(ts)) {
                    timestampMap.set(ts, { timestamp: ts });
                }
                timestampMap.get(ts)[symbol] = tick.price;
            });
        });

        const result = Array.from(timestampMap.values())
            .sort((a, b) => a.timestamp - b.timestamp)
            .slice(-60); // Show last 60 unique seconds

        console.log(`Chart Update: ${result.length} points across ${selectedSymbols.length} symbols`);
        return result;
    }, [tickData, selectedSymbols]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1e2530] border border-gray-700 p-3 rounded-lg shadow-xl z-50">
                    <p className="text-gray-400 text-[10px] mb-2 font-mono">
                        {new Date(label * 1000).toLocaleTimeString()}
                    </p>
                    <div className="space-y-1">
                        {payload.map((item, index) => (
                            <div key={index} className="flex items-center justify-between gap-4">
                                <span className="text-[10px] font-bold" style={{ color: item.color }}>
                                    {item.name}:
                                </span>
                                <span className="text-[10px] font-mono text-white">
                                    {item.value?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    if (!chartData || chartData.length === 0) {
        return (
            <div className="w-full h-[350px] bg-[#1a1f2e] border border-gray-800 rounded-xl flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Waiting for stream data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-[350px] bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 shadow-2xl">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#30363d" />
                    <XAxis
                        dataKey="timestamp"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={(ts) => new Date(ts * 1000).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        stroke="#8b949e"
                        fontSize={10}
                        minTickGap={30}
                    />
                    <YAxis
                        domain={['auto', 'auto']}
                        orientation="right"
                        tickFormatter={(val) => val.toLocaleString()}
                        stroke="#8b949e"
                        fontSize={10}
                        width={60}
                    />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
                    <Legend iconType="circle" verticalAlign="top" align="right" wrapperStyle={{ fontSize: '10px', paddingBottom: '20px' }} />
                    {selectedSymbols.map(symbol => (
                        <Line
                            key={symbol}
                            type="monotone"
                            dataKey={symbol}
                            name={symbol}
                            stroke={CHART_COLORS[symbol]}
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                            connectNulls={true}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default LivePriceChart;
