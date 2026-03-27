from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set, List
import asyncio
import time
import logging

from backend.schemas import Tick, QueueHealth
from backend.streamer.queue_manager import queue_manager

router = APIRouter()
logger = logging.getLogger("WebSocketManager")

class ConnectionManager:
    def __init__(self):
        # Maps websocket -> set of subscribed symbols
        self.active_connections: Dict[WebSocket, Set[str]] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[websocket] = set()
        logger.info(f"New WebSocket connection: {websocket.client}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            del self.active_connections[websocket]
            logger.info(f"WebSocket disconnected: {websocket.client}")

    async def handle_message(self, websocket: WebSocket, msg: dict):
        action = msg.get("action")
        symbols = msg.get("symbols", [])
        
        if action == "subscribe":
            self.active_connections[websocket].update(symbols)
            logger.info(f"Subscribed {websocket.client} to {symbols}")
        elif action == "unsubscribe":
            for s in symbols:
                self.active_connections[websocket].discard(s)
            logger.info(f"Unsubscribed {websocket.client} from {symbols}")

    async def broadcast(self, ticks: List[Tick], health: QueueHealth):
        dead_connections = []
        
        for websocket, subscribed_symbols in self.active_connections.items():
            # Filter ticks for this specific connection
            filtered_ticks = [t.model_dump() for t in ticks if t.symbol in subscribed_symbols]
            
            # Always send health metrics even if no ticks are relevant
            payload = {
                "ticks": filtered_ticks,
                "queue_health": health.model_dump(),
                "server_time": time.time()
            }
            
            try:
                await websocket.send_json(payload)
            except Exception as e:
                logger.error(f"Error broadcasting to {websocket.client}: {e}")
                dead_connections.append(websocket)
        
        for ws in dead_connections:
            self.disconnect(ws)

manager = ConnectionManager()

@router.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            await manager.handle_message(websocket, data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

async def broadcaster(broadcast_queue: asyncio.Queue):
    logger.info("Broadcaster task started")
    while True:
        try:
            # Wait for data from consumer
            batch = await broadcast_queue.get()
            health = queue_manager.get_health()
            await manager.broadcast(batch, health)
            broadcast_queue.task_done()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Broadcaster error: {e}")
            await asyncio.sleep(1)
