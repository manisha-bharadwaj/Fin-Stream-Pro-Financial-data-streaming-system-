import React, { useState, useEffect } from 'react';
import {
    ComposedChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { API_BASE } from '../../constants';
import { clsx } from 'clsx';

const CandlestickChart = ({ symbol }) => {
    const [candles, setCandles] = useState([]);
    const [candleInterval, setCandleInterval] = useState("1m");
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await fetch(`${API_BASE}/ohlcv/${symbol}?interval=${candleInterval}&limit=60`);
            if (res.ok) {
                const data = await res.json();
                console.log(`OHLCV Data for ${symbol}:`, data);
                // Map and reverse
                setCandles(data.map(d => ({
                    ...d,
                    range: [d.low, d.high], // For the wick line
                    body: [d.open, d.close],
                    isGreen: d.close >= d.open
                })).reverse());
            }
        } catch (err) {
            console.error(`Error fetching OHLCV for ${symbol}:`, err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        fetchData();
        const timer = setInterval(fetchData, 10000);
        return () => clearInterval(timer);
    }, [symbol, candleInterval]);

    // Custom shape for candlestick body
    const CandleBody = (props) => {
        const { x, y, width, height, payload } = props;
        const isGreen = payload?.isGreen;
        return (
            <rect
                x={x}
                y={y}
                width={width}
                height={Math.max(height, 2)} // Ensure body is visible even if open == close
                fill={isGreen ? '#10b981' : '#ef4444'}
                className="transition-all duration-300"
            />
        );
    };

    // Custom shape for wicks
    const WickLine = (props) => {
        const { x, y, width, height, payload } = props;
        const isGreen = payload?.isGreen;
        return (
            <line
                x1={x + width / 2}
                y1={y}
                x2={x + width / 2}
                y2={y + height}
                stroke={isGreen ? '#10b981' : '#ef4444'}
                strokeWidth={1}
            />
        );
    };

    return (
        <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 flex flex-col h-[350px] shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={clsx("w-2 h-2 rounded-full", isLoading ? "bg-yellow-500 animate-pulse" : "bg-green-500")} />
                    <span className="text-white font-bold">{symbol}</span>
                    <span className="text-gray-500 text-[10px] uppercase tracking-widest font-black">OHLCV</span>
                </div>
                <div className="flex bg-[#0f1117] rounded-lg p-0.5 border border-gray-800">
                    {["1m", "5m", "15m"].map(int => (
                        <button
                            key={int}
                            onClick={() => setCandleInterval(int)}
                            className={clsx(
                                "px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all",
                                candleInterval === int ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30" : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            {int}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={candles} margin={{ top: 10, right: 0, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#30363d" opacity={0.5} />
                        {!isLoading && candles.length === 0 && (
                            <text x="50%" y="50%" textAnchor="middle" fill="#555" fontSize={14} fontWeight="bold">
                                No data for this period
                            </text>
                        )}
                        <XAxis
                            dataKey="bucket_time"
                            tickFormatter={(time) => time ? time.split('T')[1].substring(0, 5) : ''}
                            minTickGap={30}
                            fontSize={10}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            yAxisId="price"
                            domain={['auto', 'auto']}
                            orientation="right"
                            tickFormatter={(val) => val ? val.toLocaleString() : ''}
                            width={50}
                            fontSize={10}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            yAxisId="volume"
                            orientation="left"
                            hide
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e2530', border: '1px solid #444c56', borderRadius: '8px', fontSize: '11px' }}
                            itemStyle={{ color: '#e6edf3' }}
                        />
                        <Bar
                            yAxisId="volume"
                            dataKey="volume"
                            fill="#6366f1"
                            opacity={0.1}
                            barSize={8}
                        />
                        {/* Wicks */}
                        <Bar
                            yAxisId="price"
                            dataKey="range"
                            shape={<WickLine />}
                        />
                        {/* Bodies */}
                        <Bar
                            yAxisId="price"
                            dataKey="body"
                            shape={<CandleBody />}
                        >
                            {candles.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.isGreen ? '#10b981' : '#ef4444'} />
                            ))}
                        </Bar>
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CandlestickChart;
