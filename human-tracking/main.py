import engines.zone as engine
import threading

thread0 = threading.Thread(target=engine.process_camera, args=(0, 0))

thread0.start()

thread0.join()