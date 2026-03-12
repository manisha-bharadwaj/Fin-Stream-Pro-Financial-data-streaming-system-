import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../constants';

export const useMetrics = () => {
    const [metrics, setMetrics] = useState(null);
    const [stats, setStats] = useState(null);
    const [metricsHistory, setMetricsHistory] = useState([]);

    const fetchMetrics = async () => {
        try {
            const res = await fetch(`${API_BASE}/metrics`);
            if (res.ok) {
                const data = await res.json();
                setMetrics(data);
                setMetricsHistory(prev => [
                    ...prev.slice(-59),
                    { ...data, time: Date.now() }
                ]);
            }
        } catch (err) {
            console.error('Error fetching metrics:', err);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE}/stats`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const changeStrategy = async (strategy) => {
        try {
            const res = await fetch(`${API_BASE}/config/backpressure`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ strategy })
            });
            if (res.ok) {
                const data = await res.json();
                // Optimistically update strategy if backend returns it
                if (metrics) {
                    setMetrics({ ...metrics, active_strategy: strategy });
                }
                return true;
            }
        } catch (err) {
            console.error('Error changing strategy:', err);
        }
        return false;
    };

    useEffect(() => {
        const metricsInterval = setInterval(fetchMetrics, 1000);
        const statsInterval = setInterval(fetchStats, 2000);

        // Initial fetch
        fetchMetrics();
        fetchStats();

        return () => {
            clearInterval(metricsInterval);
            clearInterval(statsInterval);
        };
    }, []);

    return { metrics, stats, metricsHistory, changeStrategy };
};
