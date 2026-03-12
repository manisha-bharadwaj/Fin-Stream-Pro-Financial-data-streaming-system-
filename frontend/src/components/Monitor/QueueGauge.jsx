import React from 'react';

const QueueGauge = ({ fillPercent = 0 }) => {
    // Semicircle gauge logic
    const radius = 80;
    const strokeWidth = 16;
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = Math.PI * normalizedRadius; // Semicircle

    // Clamp fill between 0 and 100
    const clampedFill = Math.min(Math.max(fillPercent, 0), 100);
    const strokeDashoffset = circumference - (clampedFill / 100) * circumference;

    const getColor = (fill) => {
        if (fill < 50) return '#10b981'; // Green
        if (fill < 80) return '#f59e0b'; // Yellow
        return '#ef4444'; // Red
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-[#1a1f2e] border border-gray-800 rounded-xl">
            <svg
                viewBox="0 0 200 120"
                className="w-full max-w-[240px]"
            >
                {/* Background Arc */}
                <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="#30363d"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />
                {/* Foreground Arc */}
                <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke={getColor(clampedFill)}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={`${circumference} ${circumference}`}
                    style={{
                        strokeDashoffset,
                        transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.3s ease'
                    }}
                />

                {/* Inner Text */}
                <text x="100" y="85" textAnchor="middle" className="fill-white text-3xl font-bold font-mono">
                    {clampedFill.toFixed(1)}%
                </text>
                <text x="100" y="110" textAnchor="middle" className="fill-gray-500 text-xs font-bold uppercase tracking-widest">
                    Queue Fill
                </text>
            </svg>
        </div>
    );
};

export default QueueGauge;
