import pytest
import threading
import time
from streamer.queue_manager import QueueManager
from schemas import Tick
from config import settings

def create_mock_tick(symbol="AAPL"):
    return Tick(
        symbol=symbol,
        price=150.0,
        open=150.0,
        high=151.0,
        low=149.0,
        close=150.0,
        volume=1000.0,
        timestamp=time.time(),
        created_at=time.time()
    )

def test_drop_strategy():
    # Fresh QueueManager with maxsize=100
    # Overriding settings for test isolation
    settings.QUEUE_MAX_SIZE = 100
    qm = QueueManager()
    qm.set_strategy("DROP")
    
    total_attempted = 500
    num_threads = 10
    ticks_per_thread = 50
    
    def producer_task():
        for _ in range(ticks_per_thread):
            qm.enqueue(create_mock_tick())
            
    threads = [threading.Thread(target=producer_task) for _ in range(num_threads)]
    for t in threads: t.start()
    for t in threads: t.join()
    
    health = qm.get_health()
    print(f"\n[DROP Test] Attempted: {total_attempted}, Enqueued: {health.enqueued_total}, Dropped: {health.dropped_total}")
    
    assert health.queue_size <= 100
    assert health.dropped_total > 0
    assert health.enqueued_total + health.dropped_total == total_attempted
    print(f"Throughput: {health.throughput_per_sec} ticks/sec")

def test_block_strategy():
    settings.QUEUE_MAX_SIZE = 100
    qm = QueueManager()
    qm.set_strategy("BLOCK")
    
    total_to_process = 200
    processed_count = 0
    
    def consumer_task():
        nonlocal processed_count
        while processed_count < total_to_process:
            tick = qm.dequeue(timeout=0.1)
            if tick:
                qm.record_processed(tick)
                processed_count += 1
                time.sleep(0.005) # Slow consumer
                
    def producer_task():
        for _ in range(total_to_process):
            qm.enqueue(create_mock_tick())
            
    c_threads = [threading.Thread(target=consumer_task) for _ in range(5)]
    for t in c_threads: t.start()
    
    p_thread = threading.Thread(target=producer_task)
    p_thread.start()
    p_thread.join()
    
    for t in c_threads: t.join()
    
    health = qm.get_health()
    print(f"\n[BLOCK Test] Attempted: {total_to_process}, Enqueued: {health.enqueued_total}, Dropped: {health.dropped_total}")
    
    assert health.dropped_total == 0
    assert health.enqueued_total == total_to_process
    print(f"Throughput: {health.throughput_per_sec} ticks/sec")

def test_sample_strategy():
    settings.QUEUE_MAX_SIZE = 100
    settings.SAMPLE_THRESHOLD = 0.8
    settings.SAMPLE_RATE = 3
    qm = QueueManager()
    qm.set_strategy("SAMPLE")
    
    # Fill up to threshold
    for _ in range(80):
        qm.enqueue(create_mock_tick())
        
    # Push 100 more ticks while over threshold
    for _ in range(100):
        qm.enqueue(create_mock_tick())
        
    health = qm.get_health()
    print(f"\n[SAMPLE Test] Attempted: 180, Enqueued: {health.enqueued_total}, Dropped: {health.dropped_total}")
    
    # If 100 ticks pushed while > 80%, and strategy is SAMPLE 3
    # ~33-34 should be enqueued, ~66-67 dropped
    assert health.enqueued_total < 180
    assert health.dropped_total > 0
    print(f"Throughput: {health.throughput_per_sec} ticks/sec")

if __name__ == "__main__":
    # If run directly, execute tests
    test_drop_strategy()
    test_block_strategy()
    test_sample_strategy()
