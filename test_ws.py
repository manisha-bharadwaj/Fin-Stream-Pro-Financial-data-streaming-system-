
import asyncio
import websockets
import json

async def test_ws():
    uri = "ws://localhost:8000/ws/stream"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to WS")
            # Subscribe to AAPL
            await websocket.send(json.dumps({
                "action": "subscribe",
                "symbols": ["AAPL"]
            }))
            print("Subscribed to AAPL")
            # Wait for 3 messages
            for i in range(3):
                msg = await websocket.recv()
                data = json.loads(msg)
                print(f"Received message {i+1}: {list(data.keys())}")
                if "queue_health" in data:
                    print(f"Queue health: {data['queue_health']['fill_percent']}%")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_ws())
