import asyncio
import threading
import logging
import os
import uvicorn
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import sys
from pathlib import Path

# Add the parent directory to sys.path to allow absolute imports from the 'backend' package
# even when running from within the 'backend' directory itself.
root_dir = str(Path(__file__).resolve().parent.parent)
if root_dir not in sys.path:
    sys.path.append(root_dir)

from backend.config import settings
from backend.db import models, crud
from backend.api import routes, websocket
from backend.streamer.producer import start_producers, SYMBOLS
from backend.streamer.consumer import start_consumer
from backend.streamer.queue_manager import queue_manager

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("FinStreamPro")

async def throughput_tracker_task():
    """Background task to record throughput every second."""
    while True:
        queue_manager.record_throughput_tick()
        await asyncio.sleep(1)

async def metrics_snapshot_task():
    """Background task to save queue health snapshot to DB every 10 seconds."""
    while True:
        await asyncio.sleep(10)
        health = queue_manager.get_health()
        await crud.save_snapshot(health)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    logger.info("Initializing FinStream Pro API...")
    
    # 1. Ensure data directory exists
    os.makedirs(os.path.dirname(settings.DB_PATH), exist_ok=True)
    
    # 2. Init DB
    logger.info(f"DBInit: Initializing database at {settings.DB_PATH}")
    await models.init_db(settings.DB_PATH)
    logger.info("DBInit: Database initialized with WAL mode")
    
    # 3. Create broadcast queue
    broadcast_queue = asyncio.Queue()
    
    # 4. Get event loop
    loop = asyncio.get_running_loop()
    logger.info(f"FinStreamPro: Event loop acquired: {id(loop)}")
    
    # 5. Create shutdown event
    shutdown_event = threading.Event()
    
    # 6. Start consumer BEFORE producers
    logger.info("TickConsumer: Starting consumer thread")
    app.state.consumer = start_consumer(shutdown_event, broadcast_queue, loop)
    
    # 7. Start producers
    app.state.producers = start_producers(shutdown_event)
    
    # 8. Start background tasks
    logger.info("WebSocketManager: Starting broadcaster task")
    app.state.tasks = [
        asyncio.create_task(websocket.broadcaster(broadcast_queue)),
        asyncio.create_task(metrics_snapshot_task()),
        asyncio.create_task(throughput_tracker_task())
    ]
    
    app.state.shutdown_event = shutdown_event
    logger.info("FinStreamPro: FinStream Pro startup complete")
    
    yield
    
    # Shutdown logic
    logger.info("Shutting down FinStream Pro...")
    app.state.shutdown_event.set()
    
    for t in app.state.producers:
        t.join(timeout=5)
    app.state.consumer.join(timeout=5)
    
    for task in app.state.tasks:
        task.cancel()
        
    logger.info("All threads stopped cleanly")

app = FastAPI(title="FinStream Pro API", lifespan=lifespan)

@app.middleware("http")
async def add_process_time_header(request, call_next):
    start = time.time()
    response = await call_next(request)
    response.headers["X-Process-Time"] = str(time.time() - start)
    return response

# CORS configuration
allow_all = "*" in settings.ALLOWED_ORIGINS or getattr(settings, "ALLOWED_ORIGINS", []) == "*"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else settings.ALLOWED_ORIGINS,
    allow_credentials=not allow_all,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time"]
)

# Include routers
app.include_router(routes.router)
app.include_router(websocket.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
