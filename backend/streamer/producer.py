import threading
import random
import time
import logging
from typing import List
from backend.config import settings
from backend.schemas import Tick
from backend.streamer.queue_manager import queue_manager

SYMBOLS = ["AAPL", "GOOGL", "BTC-USD", "ETH-USD", "EUR-USD"]
BASE_PRICES = {
    "AAPL": 182.50,
    "GOOGL": 141.20,
    "BTC-USD": 43200.0,
    "ETH-USD": 2650.0,
    "EUR-USD": 1.0842
}

class TickProducer(threading.Thread):
    def __init__(self, symbol: str, shutdown_event: threading.Event):
        super().__init__(name=f"Producer-{symbol}")
        self.symbol = symbol
        self.shutdown_event = shutdown_event
        self.price = BASE_PRICES[symbol]
        self.last_close = self.price
        self.logger = logging.getLogger(self.name)

    def run(self):
        self.logger.info(f"Started producer for {self.symbol}")
        last_log_time = time.time()
        
        while not self.shutdown_event.is_set():
            # Generate tick using random walk
            self.price += random.gauss(0, self.price * 0.001)
            # Ensure price doesn't drop too low
            self.price = max(self.price, BASE_PRICES[self.symbol] * 0.5)
            
            high = self.price * random.uniform(1.0, 1.002)
            low = self.price * random.uniform(0.998, 1.0)
            
            if self.symbol in ["BTC-USD", "ETH-USD"]:
                volume = random.uniform(0.1, 50)
            else:
                volume = random.uniform(100, 10000)

            tick = Tick(
                symbol=self.symbol,
                price=round(self.price, 4),
                open=round(self.last_close, 4),
                high=round(high, 4),
                low=round(low, 4),
                close=round(self.price, 4),
                volume=round(volume, 2),
                timestamp=time.time(),
                created_at=time.time()
            )
            
            self.last_close = self.price
            queue_manager.enqueue(tick)
            
            # Periodic logging
            if time.time() - last_log_time > 5:
                health = queue_manager.get_health()
                self.logger.debug(f"{self.symbol} health: {health.dropped_total} drops")
                last_log_time = time.time()
            
            # Sleep to simulate ticker frequency (~1000/sec)
            # Sleep to simulate ticker frequency (~200/sec per symbol)
            time.sleep(0.005)

def start_producers(shutdown_event: threading.Event) -> List[TickProducer]:
    threads = []
    for symbol in SYMBOLS:
        t = TickProducer(symbol, shutdown_event)
        t.daemon = True
        t.start()
        threads.append(t)
    return threads
