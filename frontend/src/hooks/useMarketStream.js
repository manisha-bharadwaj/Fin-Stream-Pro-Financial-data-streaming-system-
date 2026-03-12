import { useState, useEffect, useRef } from 'react';
import { WS_URL, RECONNECT_DELAYS, MAX_POINTS } from '../constants';

export const useMarketStream = (subscribedSymbols) => {
    const wsRef = useRef(null);
    const reconnectAttempt = useRef(0);
    const reconnectTimer = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [tickData, setTickData] = useState({});
    const [queueHealth, setQueueHealth] = useState(null);
    const [lastError, setLastError] = useState(null);

    const connect = () => {
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);

        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket Connected');
            setIsConnected(true);
            reconnectAttempt.current = 0;
            setLastError(null);

            // Subscribe to symbols
            ws.send(JSON.stringify({
                action: "subscribe",
                symbols: subscribedSymbols
            }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.queue_health) {
                    setQueueHealth(data.queue_health);
                }

                if (data.ticks && data.ticks.length > 0) {
                    setTickData(prev => {
                        const next = { ...prev };
                        data.ticks.forEach(tick => {
                            const symbol = tick.symbol;
                            const existing = next[symbol] || [];
                            next[symbol] = [
                                ...existing.slice(-MAX_POINTS + 1),
                                {
                                    price: tick.price,
                                    timestamp: tick.timestamp,
                                    volume: tick.volume,
                                    high: tick.high,
                                    low: tick.low
                                }
                            ];
                        });
                        return next;
                    });
                }
            } catch (err) {
                console.error('Error parsing WS message:', err);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
            setLastError("WebSocket connection error");
        };

        ws.onclose = () => {
            console.log('WebSocket Disconnected');
            setIsConnected(false);

            // Reconnect logic
            const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt.current, RECONNECT_DELAYS.length - 1)];
            reconnectAttempt.current += 1;
            console.log(`Reconnecting in ${delay}ms... (Attempt ${reconnectAttempt.current})`);
            reconnectTimer.current = setTimeout(connect, delay);
        };
    };

    useEffect(() => {
        connect();
        return () => {
            if (wsRef.current) wsRef.current.close();
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
        };
    }, []);

    // Update subscriptions when symbols change
    useEffect(() => {
        if (isConnected && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                action: "subscribe",
                symbols: subscribedSymbols
            }));
        }
    }, [subscribedSymbols, isConnected]);

    return { tickData, queueHealth, isConnected, lastError };
};
