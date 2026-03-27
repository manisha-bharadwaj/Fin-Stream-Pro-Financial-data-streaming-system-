import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createChart, CrosshairMode, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { API_BASE } from '../../constants';
import { clsx } from 'clsx';

const CandlestickChart = ({ symbol }) => {
    const containerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);
    const volumeSeriesRef = useRef(null);

    const [candleInterval, setCandleInterval] = useState('1m');
    const [isLoading, setIsLoading] = useState(true);
    const [noData, setNoData] = useState(false);
    const [chartReady, setChartReady] = useState(false);

    // Create chart once on mount
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        // Wait until the element has real dimensions
        const init = () => {
            const w = el.clientWidth;
            const h = el.clientHeight;
            if (w === 0 || h === 0) {
                requestAnimationFrame(init);
                return;
            }

            const chart = createChart(el, {
                width: w,
                height: h,
                layout: {
                    background: { color: 'transparent' },
                    textColor: '#9ca3af',
                },
                grid: {
                    vertLines: { color: 'rgba(48,54,61,0.4)' },
                    horzLines: { color: 'rgba(48,54,61,0.4)' },
                },
                crosshair: { mode: CrosshairMode.Normal },
                rightPriceScale: { borderColor: 'rgba(48,54,61,0.4)' },
                timeScale: {
                    borderColor: 'rgba(48,54,61,0.4)',
                    timeVisible: true,
                    secondsVisible: false,
                },
                handleScroll: true,
                handleScale: true,
            });

            const candleSeries = chart.addSeries(CandlestickSeries, {
                upColor: '#10b981',
                downColor: '#ef4444',
                borderUpColor: '#10b981',
                borderDownColor: '#ef4444',
                wickUpColor: '#10b981',
                wickDownColor: '#ef4444',
            });

            const volumeSeries = chart.addSeries(HistogramSeries, {
                color: '#6366f1',
                priceFormat: { type: 'volume' },
                priceScaleId: 'volume',
            });
            chart.priceScale('volume').applyOptions({
                scaleMargins: { top: 0.8, bottom: 0 },
            });

            chartRef.current = chart;
            seriesRef.current = candleSeries;
            volumeSeriesRef.current = volumeSeries;
            setChartReady(true);

            const ro = new ResizeObserver(entries => {
                for (const entry of entries) {
                    const { width, height } = entry.contentRect;
                    if (width > 0 && height > 0) {
                        chart.applyOptions({ width, height });
                    }
                }
            });
            ro.observe(el);

            return () => {
                ro.disconnect();
                chart.remove();
            };
        };

        const cleanup = init();
        return () => { if (typeof cleanup === 'function') cleanup(); };
    }, []);

    // Fetch data — runs only once chart is ready, and on symbol/interval change
    const fetchData = useCallback(async () => {
        if (!seriesRef.current || !volumeSeriesRef.current) return;

        setIsLoading(true);
        try {
            const res = await fetch(
                `${API_BASE}/ohlcv/${symbol}?interval=${candleInterval}&limit=60`
            );
            if (!res.ok) return;
            const raw = await res.json();

            if (!raw || raw.length === 0) {
                setNoData(true);
                return;
            }
            setNoData(false);

            const candleData = raw
                .map(d => ({
                    time: Math.floor(new Date(d.bucket_time).getTime() / 1000),
                    open: Number(d.open),
                    high: Number(d.high),
                    low: Number(d.low),
                    close: Number(d.close),
                }))
                .sort((a, b) => a.time - b.time);

            const volumeData = raw
                .map(d => ({
                    time: Math.floor(new Date(d.bucket_time).getTime() / 1000),
                    value: Number(d.volume),
                    color: d.close >= d.open ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)',
                }))
                .sort((a, b) => a.time - b.time);

            seriesRef.current.setData(candleData);
            volumeSeriesRef.current.setData(volumeData);
            chartRef.current?.timeScale().fitContent();
        } catch (err) {
            console.error(`[CandlestickChart] Error fetching OHLCV for ${symbol}:`, err);
        } finally {
            setIsLoading(false);
        }
    }, [symbol, candleInterval]);

    useEffect(() => {
        if (!chartReady) return;
        fetchData();
        const timer = setInterval(fetchData, 10000);
        return () => clearInterval(timer);
    }, [chartReady, fetchData]);

    return (
        <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 flex flex-col h-[350px] shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 shrink-0">
                <div className="flex items-center gap-2">
                    <div
                        className={clsx(
                            'w-2 h-2 rounded-full',
                            isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
                        )}
                    />
                    <span className="text-white font-bold">{symbol}</span>
                    <span className="text-gray-500 text-[10px] uppercase tracking-widest font-black">
                        OHLCV
                    </span>
                </div>
                <div className="flex bg-[#0f1117] rounded-lg p-0.5 border border-gray-800">
                    {['1m', '5m', '15m'].map(int => (
                        <button
                            key={int}
                            onClick={() => setCandleInterval(int)}
                            className={clsx(
                                'px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all',
                                candleInterval === int
                                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                                    : 'text-gray-500 hover:text-gray-300'
                            )}
                        >
                            {int}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart area */}
            <div className="flex-1 relative min-h-0">
                <div ref={containerRef} className="absolute inset-0" />
                {noData && !isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm font-semibold pointer-events-none">
                        No data for this period
                    </div>
                )}
            </div>
        </div>
    );
};

export default CandlestickChart;
