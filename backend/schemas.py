from pydantic import BaseModel
from typing import Dict, List, Optional

class Tick(BaseModel):
    symbol: str
    price: float
    open: float
    high: float
    low: float
    close: float
    volume: float
    timestamp: float        # unix epoch float (time.time())
    created_at: float       # time tick was created (for latency calc)

class OHLCVCandle(BaseModel):
    symbol: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    bucket_time: str        # ISO8601 string

class QueueHealth(BaseModel):
    queue_size: int
    queue_capacity: int
    fill_percent: float
    enqueued_total: int
    dropped_total: int
    drop_rate_percent: float
    throughput_per_sec: float
    avg_latency_ms: float
    active_strategy: str
    uptime_seconds: float

class SymbolStat(BaseModel):
    symbol: str
    latest_price: float
    price_change_24h_pct: float
    total_volume: float
    tick_count: int
    had_recent_drops: bool

class SystemStats(BaseModel):
    total_ticks_stored: int
    ticks_per_sec_last_60s: float
    per_symbol: Dict[str, SymbolStat]
