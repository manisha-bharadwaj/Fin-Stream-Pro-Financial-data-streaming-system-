# ⚡ FinStream Pro — Financial Data Streaming System

## Architecture Overview

┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                      │
│  LivePriceChart  CandlestickChart  QueueMonitor  StatsTable  │
└──────────┬────────────────────────────────┬─────────────────┘
           │ REST /api/*                    │ WS /ws/stream
           ▼                                ▼
┌─────────────────────────────────────────────────────────────┐
│                     FASTAPI SERVER (Python)                  │
│   Routes    WebSocket Broadcaster    Metrics Endpoint        │
└──────────────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    async bridge    ┌──────▼──────┐   REST responses
           │        │  CONSUMER   │
           │        │  Thread     │
           │        └──────┬──────┘
           │         batch │ insert
           │               ▼
           │        ┌──────────────┐
           │        │   SQLite DB  │
           │        │  (WAL mode)  │
           │        └──────────────┘
           │
    ┌──────▼──────────────────────┐
    │      BOUNDED QUEUE          │
    │   queue.Queue(maxsize=500)  │
    │   Strategy: DROP/BLOCK/SAMPLE│
    └──────▲──────────────────────┘
           │ enqueue (1000+ ticks/sec)
    ┌──────┴──────────────────────────────────┐
    │  PRODUCER THREADS (5x)                  │
    │  AAPL  GOOGL  BTC-USD  ETH-USD  EUR-USD  │
    └─────────────────────────────────────────┘

## How Backpressure Works

"At 1000 ticks/sec across 5 producers with maxsize=500:
- **Normal load**: queue stays at 20-30% fill
- **Spike to 5000 ticks/sec**: queue fills to 100% in ~0.1s
- **DROP strategy**: 4000/5000 = 80% of ticks discarded, system stays stable
- **BLOCK strategy**: producers freeze, downstream consumers keep up
- **SAMPLE strategy**: accept 1-in-5 ticks above 80% fill, ~64% throughput maintained"

## Quick Start (Local Dev)

### macOS / Linux
```bash
make install
make dev
```

### Windows (PowerShell)
```powershell
.\setup.ps1 install
.\setup.ps1 dev
```

Open: http://localhost:5173

## Quick Start (Docker)
```bash
docker compose up --build
```
Open: http://localhost

## API Reference Table
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /api/symbols | List active symbols |
| GET    | /api/ticks/{symbol} | Raw tick history |
| GET    | /api/ohlcv/{symbol} | OHLCV candles |
| GET    | /api/stats | System throughput |
| GET    | /api/metrics | Queue health |
| POST   | /api/config/backpressure | Switch strategy |
| WS     | /ws/stream | Live tick stream |

## Configuration Reference
| Variable | Description | Default |
|----------|-------------|---------|
| QUEUE_MAX_SIZE | Maximum number of items in the ingestion queue | 500 |
| PRODUCER_THREADS | Number of concurrent producer threads | 5 |
| CONSUMER_BATCH_SIZE | Number of ticks per SQLite batch insert | 50 |
| WS_BROADCAST_INTERVAL_MS | Frequency of WebSocket broadcasts | 100 |
| BACKPRESSURE_STRATEGY | Strategy when queue is full (DROP/BLOCK/SAMPLE) | DROP |
| DB_PATH | Path to SQLite database file | ./data/finstream.db |
| ALLOWED_ORIGINS | CORS allowed origins | ["http://localhost:5173"] |
| LOG_LEVEL | Logging level (DEBUG/INFO/WARNING/ERROR) | INFO |

## Performance Notes
- **SQLite WAL mode**: enables concurrent reads during bulk writes
- **Batch insert size 50**: reduces SQLite write overhead by 50x vs row-by-row
- **Bounded queue maxsize 500**: ~0.5s buffer at 1000 ticks/sec
- **daemon=True threads**: clean process exit without zombie threads
- **asyncio bridge**: uses `call_soon_threadsafe` to safely cross sync/async boundary

## Tech Stack
| Component | Technology | Purpose |
|-----------|------------|---------|
| Backend | FastAPI | High-performance Web Framework |
| Database | SQLite | Persistent Storage with WAL mode |
| Frontend | React | UI Library |
| Visualization | Recharts | Charting and Graphs |
| Containerization | Docker | Deployment and Orchestration |
| Icons | Lucide React | Modern UI Icons |
