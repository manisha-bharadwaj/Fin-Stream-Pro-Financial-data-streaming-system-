import aiosqlite
import time
from typing import List, Dict, Any
from config import settings
from schemas import Tick, QueueHealth

async def insert_ticks_batch(ticks: List[Tick]):
    async with aiosqlite.connect(settings.DB_PATH) as db:
        data = [
            (t.symbol, t.price, t.open, t.high, t.low, t.close, t.volume, t.timestamp, t.created_at)
            for t in ticks
        ]
        await db.executemany(
            "INSERT INTO ticks (symbol, price, open, high, low, close, volume, timestamp, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
            data
        )
        await db.commit()

async def get_latest_ticks(symbol: str, limit: int = 200) -> List[Dict[str, Any]]:
    async with aiosqlite.connect(settings.DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM ticks WHERE symbol=? ORDER BY timestamp DESC LIMIT ?",
            (symbol, limit)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

async def get_ohlcv_aggregated(symbol: str, interval: str = "1m", limit: int = 60) -> List[Dict[str, Any]]:
    intervals = {
        "1m": 60,
        "5m": 300,
        "15m": 900
    }
    interval_secs = intervals.get(interval, 60)
    
    async with aiosqlite.connect(settings.DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        # Subqueries to get the first and last price in each bucket
        query = f"""
            WITH buckets AS (
                SELECT 
                    CAST(timestamp / {interval_secs} AS INT) * {interval_secs} as bucket,
                    MIN(timestamp) as min_ts,
                    MAX(timestamp) as max_ts,
                    MIN(price) as low,
                    MAX(price) as high,
                    SUM(volume) as volume
                FROM ticks
                WHERE symbol = ?
                GROUP BY bucket
            )
            SELECT 
                b.bucket,
                b.low,
                b.high,
                b.volume,
                (SELECT price FROM ticks t_start WHERE t_start.symbol = ? AND t_start.timestamp = b.min_ts LIMIT 1) as open,
                (SELECT price FROM ticks t_end WHERE t_end.symbol = ? AND t_end.timestamp = b.max_ts LIMIT 1) as close
            FROM buckets b
            ORDER BY b.bucket DESC
            LIMIT ?
        """
        async with db.execute(query, (symbol, symbol, symbol, limit)) as cursor:
            rows = await cursor.fetchall()
            return [
                {
                    "symbol": symbol,
                    "open": row["open"],
                    "high": row["high"],
                    "low": row["low"],
                    "close": row["close"],
                    "volume": row["volume"],
                    "bucket_time": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(row["bucket"]))
                }
                for row in rows
            ]

async def get_system_stats() -> Dict[str, Any]:
    async with aiosqlite.connect(settings.DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        
        # Total ticks
        async with db.execute("SELECT COUNT(*) as count FROM ticks") as cursor:
            total_ticks = (await cursor.fetchone())["count"]
            
        # Ticks last 60s
        now = time.time()
        async with db.execute("SELECT COUNT(*) as count FROM ticks WHERE timestamp > ?", (now - 60,)) as cursor:
            ticks_last_60s = (await cursor.fetchone())["count"]
            
        # Per symbol stats
        per_symbol = {}
        async with db.execute("""
            SELECT symbol, MAX(price) as latest_price, SUM(volume) as total_volume, COUNT(*) as tick_count
            FROM ticks
            GROUP BY symbol
        """) as cursor:
            rows = await cursor.fetchall()
            for row in rows:
                per_symbol[row["symbol"]] = {
                    "symbol": row["symbol"],
                    "latest_price": row["latest_price"],
                    "price_change_24h_pct": 0.0, # Placeholder
                    "total_volume": row["total_volume"],
                    "tick_count": row["tick_count"],
                    "had_recent_drops": False # To be updated by health check
                }
                
        return {
            "total_ticks_stored": total_ticks,
            "ticks_per_sec_last_60s": ticks_last_60s / 60.0,
            "per_symbol": per_symbol
        }

async def save_snapshot(health: QueueHealth):
    async with aiosqlite.connect(settings.DB_PATH) as db:
        await db.execute(
            "INSERT INTO system_snapshots (snapshot_time, queue_size, throughput, drop_rate) VALUES (?,?,?,?)",
            (time.time(), health.queue_size, health.throughput_per_sec, health.drop_rate_percent)
        )
        await db.commit()
