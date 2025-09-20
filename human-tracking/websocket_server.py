import asyncio
import websockets
import engines.zone as engine
import threading
from engines.s3datasync import S3DataSync


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
    # Start S3 sync service
    s3_sync = S3DataSync()  # Create instance
    s3_thread = threading.Thread(target=s3_sync.run, daemon=True)  # Create thread
    s3_thread.start()  # Start the thread
    asyncio.run(main())

