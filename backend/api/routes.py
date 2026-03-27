from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import JSONResponse
from typing import List, Dict
import time

from backend.db import crud
from backend.schemas import Tick, QueueHealth, SystemStats, OHLCVCandle
from backend.streamer.queue_manager import queue_manager
from backend.streamer.producer import SYMBOLS

router = APIRouter(prefix="/api")

@router.get("/symbols")
async def get_symbols():
    return {"symbols": SYMBOLS}

@router.get("/ticks/{symbol}", response_model=List[Dict])
async def get_ticks(symbol: str, limit: int = 200):
    if symbol not in SYMBOLS:
        raise HTTPException(status_code=404, detail="Symbol not found")
    return await crud.get_latest_ticks(symbol, limit)

@router.get("/ohlcv/{symbol}", response_model=List[Dict])
async def get_ohlcv(symbol: str, interval: str = "1m", limit: int = 60):
    if symbol not in SYMBOLS:
        raise HTTPException(status_code=404, detail="Symbol not found")
    return await crud.get_ohlcv_aggregated(symbol, interval, limit)

@router.get("/stats", response_model=SystemStats)
async def get_stats():
    db_stats = await crud.get_system_stats()
    health = queue_manager.get_health()
    
    # Merge health data into per-symbol stats if needed
    # (e.g., mark had_recent_drops if health says so)
    for symbol in db_stats["per_symbol"]:
        db_stats["per_symbol"][symbol]["had_recent_drops"] = health.dropped_total > 0
        
    return db_stats

@router.get("/metrics", response_model=QueueHealth)
async def get_metrics():
    return queue_manager.get_health()

@router.post("/config/backpressure")
async def set_backpressure(strategy: str = Body(..., embed=True)):
    try:
        queue_manager.set_strategy(strategy)
        return {"status": "ok", "active_strategy": strategy}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
