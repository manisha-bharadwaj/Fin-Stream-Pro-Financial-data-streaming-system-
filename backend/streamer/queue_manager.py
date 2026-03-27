import queue
import threading
import time
from collections import deque
from typing import Optional, Dict
import statistics
from backend.config import settings
from backend.schemas import Tick, QueueHealth

class QueueManager:
    def __init__(self):
        self._queue = queue.Queue(maxsize=settings.QUEUE_MAX_SIZE)
        self._lock = threading.Lock()
        self._enqueued_total = 0
        self._dropped_total = 0
        self._processed_total = 0
        self._latency_samples: deque = deque(maxlen=1000)
        self._throughput_window: deque = deque(maxlen=60)  # 1 entry per second
        self._start_time = time.time()
        self._strategy = settings.BACKPRESSURE_STRATEGY
        self._sample_counter: Dict[str, int] = {}   # per-symbol counter for SAMPLE mode

    def enqueue(self, tick: Tick) -> bool:
        strategy = self._strategy
        qsize = self._queue.qsize()
        capacity = settings.QUEUE_MAX_SIZE
        fill_percent = qsize / capacity if capacity > 0 else 0

        # Backpressure Logic
        if strategy == "SAMPLE":
            if fill_percent > settings.SAMPLE_THRESHOLD:
                symbol = tick.symbol
                with self._lock:
                    count = self._sample_counter.get(symbol, 0)
                    self._sample_counter[symbol] = count + 1
                    if (count + 1) % settings.SAMPLE_RATE != 0:
                        with self._lock:
                            self._dropped_total += 1
                        return False

        try:
            if strategy == "DROP":
                self._queue.put_nowait(tick)
            elif strategy == "BLOCK":
                self._queue.put(tick, block=True, timeout=1.0)
            else: # SAMPLE or default
                self._queue.put_nowait(tick)
            
            with self._lock:
                self._enqueued_total += 1
            return True
        except queue.Full:
            with self._lock:
                self._dropped_total += 1
            return False

    def dequeue(self, timeout=0.1) -> Optional[Tick]:
        try:
            return self._queue.get(timeout=timeout)
        except queue.Empty:
            return None

    def record_processed(self, tick: Tick):
        latency = time.time() - tick.created_at
        with self._lock:
            self._latency_samples.append(latency)
            self._processed_total += 1

    def get_health(self) -> QueueHealth:
        with self._lock:
            qsize = self._queue.qsize()
            capacity = settings.QUEUE_MAX_SIZE
            fill_pct = (qsize / capacity * 100) if capacity > 0 else 0
            
            # Throughput: processed in last second (estimated from window)
            throughput = 0
            if len(self._throughput_window) >= 2:
                # Latest - second latest
                throughput = self._throughput_window[-1] - self._throughput_window[-2]
            
            avg_latency = statistics.mean(self._latency_samples) * 1000 if self._latency_samples else 0
            
            total_attempted = self._enqueued_total + self._dropped_total
            drop_rate = (self._dropped_total / total_attempted * 100) if total_attempted > 0 else 0

            return QueueHealth(
                queue_size=qsize,
                queue_capacity=capacity,
                fill_percent=fill_pct,
                enqueued_total=self._enqueued_total,
                dropped_total=self._dropped_total,
                drop_rate_percent=drop_rate,
                throughput_per_sec=float(throughput),
                avg_latency_ms=avg_latency,
                active_strategy=self._strategy,
                uptime_seconds=time.time() - self._start_time
            )

    def set_strategy(self, strategy: str):
        if strategy not in ["DROP", "BLOCK", "SAMPLE"]:
            raise ValueError(f"Invalid strategy: {strategy}")
        with self._lock:
            self._strategy = strategy

    def record_throughput_tick(self):
        with self._lock:
            self._throughput_window.append(self._processed_total)

queue_manager = QueueManager()
