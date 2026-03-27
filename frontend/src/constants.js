export const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api"
export const WS_URL = import.meta.env.VITE_WS_URL || "ws://127.0.0.1:8000/ws/stream"
export const SYMBOLS = ["AAPL", "GOOGL", "BTC-USD", "ETH-USD", "EUR-USD"]
export const MAX_POINTS = 200    // max chart data points per symbol
export const CHART_COLORS = {
    "AAPL": "#3b82f6",
    "GOOGL": "#10b981",
    "BTC-USD": "#f59e0b",
    "ETH-USD": "#8b5cf6",
    "EUR-USD": "#ec4899"
}
export const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000]
