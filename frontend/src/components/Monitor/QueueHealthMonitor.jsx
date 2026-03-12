import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Maximize2, Trash2, Clock, CheckCircle, Activity, ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';
import QueueGauge from './QueueGauge';
import MetricCard from './MetricCard';

const QueueHealthMonitor = ({ metrics, metricsHistory, changeStrategy }) => {
    if (!metrics) return null;

    const strategies = [
        {
            id: 'DROP',
            label: 'DROP',
            color: 'red',
            icon: Trash2,
            desc: 'Discard new ticks when queue is full. Fastest, some data loss.'
        },
        {
            id: 'BLOCK',
            label: 'BLOCK',
            color: 'blue',
            icon: ShieldAlert,
            desc: 'Pause producers until space is available. No data loss, may slow system.'
        },
        {
            id: 'SAMPLE',
            label: 'SAMPLE',
            color: 'yellow',
            icon: Activity,
            desc: 'Accept every Nth tick above 80% capacity. Balanced intake approach.'
        }
    ];

    const activeStrat = strategies.find(s => s.id === metrics.active_strategy) || strategies[0];

    return (
        <div className="space-y-4">
            <h2 className="text-gray-300 font-bold flex items-center gap-2">
                <Maximize2 size={18} className="text-indigo-500" />
                Queue Health & Backpressure
            </h2>

            {/* Row 1: Gauge & Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                    <QueueGauge fillPercent={metrics.fill_percent} />
                </div>
                <div className="md:col-span-3 grid grid-cols-2 gap-4">
                    <MetricCard
                        title="Throughput"
                        value={metrics.throughput_per_sec}
                        unit="t/s"
                        color="blue"
                        icon={Activity}
                    />
                    <MetricCard
                        title="Drop Rate"
                        value={metrics.drop_rate_percent}
                        unit="%"
                        color={metrics.drop_rate_percent > 1 ? "red" : "green"}
                        icon={Trash2}
                    />
                    <MetricCard
                        title="Avg Latency"
                        value={metrics.avg_latency_ms.toFixed(2)}
                        unit="ms"
                        color="yellow"
                        icon={Clock}
                    />
                    <MetricCard
                        title="Total Processed"
                        value={metrics.enqueued_total}
                        color="purple"
                        icon={CheckCircle}
                    />
                </div>
            </div>

            {/* Row 2: Sparkline (Fill History) */}
            <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 overflow-hidden">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Capacity History (60s)</p>
                <div className="h-16 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={metricsHistory}>
                            <defs>
                                <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={activeStrat.id === 'DROP' ? '#ef4444' : '#3b82f6'} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={activeStrat.id === 'DROP' ? '#ef4444' : '#3b82f6'} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="fill_percent"
                                stroke={activeStrat.id === 'DROP' ? '#ef4444' : '#3b82f6'}
                                fillOpacity={1}
                                fill="url(#fillGradient)"
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Row 3: Strategy Selection */}
            <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-gray-400 italic">Backpressure Strategy</span>
                    <div className="flex gap-2">
                        {strategies.map((strat) => (
                            <button
                                key={strat.id}
                                onClick={() => changeStrategy(strat.id)}
                                className={clsx(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                                    metrics.active_strategy === strat.id
                                        ? {
                                            'bg-red-500/20 border-red-500/50 text-red-500': strat.id === 'DROP',
                                            'bg-blue-500/20 border-blue-500/50 text-blue-500': strat.id === 'BLOCK',
                                            'bg-yellow-500/20 border-yellow-500/50 text-yellow-500': strat.id === 'SAMPLE',
                                        }[strat.id]
                                        : "bg-[#0f1117] border-gray-800 text-gray-500 hover:border-gray-600"
                                )}
                            >
                                <strat.icon size={14} />
                                {strat.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="bg-[#0f1117] p-3 rounded-lg border border-gray-800">
                    <p className="text-gray-400 text-xs leading-relaxed">
                        <span className="text-white font-bold">{metrics.active_strategy}:</span> {activeStrat.desc}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QueueHealthMonitor;
