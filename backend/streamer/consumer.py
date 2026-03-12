import threading
import asyncio
import logging
from typing import List
from config import settings
from streamer.queue_manager import queue_manager
from db import crud
from schemas import Tick

class TickConsumer(threading.Thread):
    def __init__(self, shutdown_event: threading.Event, 
                 broadcast_queue: asyncio.Queue, 
                 loop: asyncio.AbstractEventLoop):
        super().__init__(name="Consumer-Main")
        self.shutdown_event = shutdown_event
        self.broadcast_queue = broadcast_queue
        self.loop = loop
        self.logger = logging.getLogger(self.name)

    def run(self):
        self.logger.info("Started consumer")
        batch = []
        
        while not self.shutdown_event.is_set():
            tick = queue_manager.dequeue(timeout=0.1)
            if tick is None:
                continue
            
            batch.append(tick)
            queue_manager.record_processed(tick)

            if len(batch) >= settings.CONSUMER_BATCH_SIZE:
                self._process_batch(batch)
                batch = []

        # Flush remaining
        if batch:
            self.logger.info(f"Flushing {len(batch)} remaining ticks on shutdown")
            self._process_batch(batch)

    def _process_batch(self, batch: List[Tick]):
        if not batch:
            return
            
        try:
            # Check if loop is still running
            if self.loop.is_running():
                future = asyncio.run_coroutine_threadsafe(
                    crud.insert_ticks_batch(batch), self.loop
                )
                future.result(timeout=5.0)
                
                # Put in broadcast queue for WebSocket
                self.loop.call_soon_threadsafe(
                    self.broadcast_queue.put_nowait, batch.copy()
                )
            else:
                # Fallback to synchronous insert if loop is closed
                import sqlite3
                from config import settings
                conn = sqlite3.connect(settings.DB_PATH)
                try:
                    data = [
                        (t.symbol, t.price, t.open, t.high, t.low, t.close, t.volume, t.timestamp, t.created_at)
                        for t in batch
                    ]
                    conn.executemany(
                        "INSERT INTO ticks (symbol, price, open, high, low, close, volume, timestamp, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
                        data
                    )
                    conn.commit()
                finally:
                    conn.close()
        except Exception as e:
            self.logger.error(f"Error processing batch: {e}", exc_info=True)

def start_consumer(shutdown_event: threading.Event, 
                   broadcast_queue: asyncio.Queue, 
                   loop: asyncio.AbstractEventLoop) -> TickConsumer:
    c = TickConsumer(shutdown_event, broadcast_queue, loop)
    c.daemon = True
    c.start()
    return c
