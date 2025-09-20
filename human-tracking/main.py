import engines.zone as engine
import threading
import engines.zone as engine
from engines.s3datasync import S3DataSync
import threading
import subprocess
import sys
import os


# Start S3 sync service
s3_sync = S3DataSync()  # Create instance
s3_thread = threading.Thread(target=s3_sync.run, daemon=True)  # Create thread
s3_thread.start()  # Start the thread

thread0 = threading.Thread(target=engine.process_camera, args=(0, 0))

thread0.start()

thread0.join()