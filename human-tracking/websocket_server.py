import asyncio
import websockets
import engines.zone as engine
import threading

async def handler(websocket):
    print(f"Client connected from {websocket.remote_address}")
    try:
        await engine.process_camera(websocket, 0, 0) # cam_id=0, camera_index=0
    except websockets.exceptions.ConnectionClosedOK:
        print(f"Client disconnected from {websocket.remote_address}")
    except Exception as e:
        print(f"Error in WebSocket handler: {e}")

async def main():
    server = await websockets.serve(handler, "0.0.0.0", 8766) # port 8766
    print("WebSocket server started on ws://0.0.0.0:8766")
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main())
