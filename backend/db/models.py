import aiosqlite
import os

async def init_db(db_path: str):
    # Ensure directory exists
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    async with aiosqlite.connect(db_path) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS ticks (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol    TEXT    NOT NULL,
                price     REAL    NOT NULL,
                open      REAL,
                high      REAL,
                low       REAL,
                close     REAL,
                volume    REAL,
                timestamp REAL    NOT NULL,
                created_at REAL
            );
        """)
        
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_symbol_time
                ON ticks(symbol, timestamp DESC);
        """)
        
        await db.execute("""
            CREATE TABLE IF NOT EXISTS system_snapshots (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                snapshot_time REAL NOT NULL,
                queue_size    INTEGER,
                throughput    REAL,
                drop_rate     REAL
            );
        """)
        
        # Optimize SQLite
        await db.execute("PRAGMA journal_mode=WAL;")
        await db.execute("PRAGMA cache_size=10000;")
        await db.commit()
