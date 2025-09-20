from ultralytics import YOLO
import cv2
from deep_sort_realtime.deepsort_tracker import DeepSort
from torchreid.reid.utils import FeatureExtractor
from scipy.spatial.distance import cosine
from bs4 import BeautifulSoup
import threading
import time
import torch
from torchvision import models, transforms
import os
from collections import Counter
from datetime import datetime
import json
import base64
import asyncio

frame_size = [1280,960]

AGE_LIST = ['(0-2)', '(4-6)', '(8-12)', '(15-20)', '(25-32)', '(38-43)', '(48-53)', '(60-100)']
GENDER_LIST = ['Male', 'Female']

# Load face models
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load Caffe age & gender models
age_net = cv2.dnn.readNetFromCaffe(
    r".\\human-tracking\\model\\face_models\\deploy_age.prototxt",
    r".\\human-tracking\\model\\face_models\\age_net.caffemodel"   
)
gender_net = cv2.dnn.readNetFromCaffe(
    r".\\human-tracking\\model\\face_models\\deploy_gender.prototxt",
    r".\\human-tracking\\model\\face_models\\gender_net.caffemodel"
)

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.5] * 3, [0.5] * 3)
])

# Detect faces inside the person crop
def detect_and_analyze_face(frame, frame_with_yolo, x1, y1, x2, y2): 
    global frame_size
    # Crop the detected person from YOLO box
    person_crop = frame[y1:y2, x1:x2]

    if person_crop.size == 0:
        return None

    h, w = person_crop.shape[:2]
    if h < 100 or w < 100:  # arbitrary threshold
        person_crop = cv2.resize(person_crop, (224, 224))

    # Convert to grayscale for Haar
    gray = cv2.cvtColor(person_crop, cv2.COLOR_BGR2GRAY)

    # Detect faces
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30)
    )

    face_info = []

    for (fx, fy, fw, fh) in faces:
        face_x1 = x1 + fx
        face_y1 = y1 + fy
        face_x2 = x1 + fx + fw
        face_y2 = y1 + fy + fh

        # Draw face bounding box
        cv2.rectangle(frame_with_yolo, (face_x1, face_y1), (face_x2, face_y2), (255, 0, 255), 2)

        # Extract face crop for age/gender
        face_crop = frame[face_y1:face_y2, face_x1:face_x2]
        
        if face_crop.size > 0:
            try:
                # Preprocess for Caffe model
                blob = cv2.dnn.blobFromImage(
                    face_crop, 
                    1.0, 
                    (227, 227), 
                    (78.4263377603, 87.7689143744, 114.895847746),
                    swapRB=False
                )

                # Age prediction
                age_net.setInput(blob)
                age_preds = age_net.forward()
                age = AGE_LIST[age_preds[0].argmax()]

                # Gender prediction
                gender_net.setInput(blob)
                gender_preds = gender_net.forward()
                gender = GENDER_LIST[gender_preds[0].argmax()]

                # Annotate frame
                cv2.putText(frame_with_yolo, f"{gender}, {age}", 
                            (face_x1, face_y2 + 20),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 255), 2)

                face_info.append({
                    'bbox': (face_x1, face_y1, face_x2, face_y2),
                    'age': age,
                    'gender': gender
                })

            except Exception as e:
                print(f"Error in face analysis: {e}")

    return face_info if face_info else None

# Load model and parametersq
with open('human-tracking\\engines\\parameter.xml', 'r') as f:
    xml = f.read()
Bs_data = BeautifulSoup(xml, "xml")

inference_threshold = float(Bs_data.find('inference_threshold').text)
feature_extraction_threshold = float(Bs_data.find('feature_extraction_threshold').text)
print(f"Thresholds: {inference_threshold}, {feature_extraction_threshold}")

model = YOLO("..\\human-tracking\\model\\runs\\detect\\train\\weights\\best.pt")

extractor = FeatureExtractor(
    model_name='osnet_x1_0',
    model_path=None,  # Use a pretrained model
    device='cuda'  # Use GPU if available
)

ZONE_A = (0, 0, 200, 959)  # x1,y1,x2,y2
ZONE_B = (1079, 0, 1279, 959) 
ZONE_C = (201, 0, 400, 959) 
ZONE_D = (401, 0, 600, 959) 
ZONE_E = (879, 0, 1078, 959) 

person_embeddings = {}  # Format: {track_id: (embedding, timestamp, cam_id)}
embedding_lock = threading.Lock() #To ensure only one thread accesses the embeddings at a time
person_last_zone = {} # Format: {track_id: zone}
person_behaviour = {} # Format: {track_id: {zone: total_duration}}
person_metadata = {} # Format: {track_id: {age: age, gender: gender}}
person_last_update_time = {} # Format: {track_id: {zone: timestamp_of_last_update}}
raw_detections = {}  # Format: {track_id: (x1, y1, x2, y2)}

async def process_camera(websocket, cam_id, camera_index):
    global person_behaviour, person_last_update_time, ZONE_A, ZONE_B,ZONE_C, ZONE_D, ZONE_E, frame_size
    tracker = DeepSort(max_age=1, embedder="torchreid", embedder_gpu=True) # Set to False for CPU
    cap = cv2.VideoCapture(camera_index) 
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, frame_size[0]) #Set the reslution of the camera
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, frame_size[1])

    while cap.isOpened():
        ret, frame = cap.read()
        
        if not ret or frame is None:
            print(f"[Camera {cam_id}] Failed to grab frame")
            break
        
        print("Frame shape:", frame.shape)

        results = model(frame, conf=inference_threshold)  # Threshold for confidence score for human detection
        frame_with_yolo = results[0].plot()

        cv2.putText(frame_with_yolo, f"Human Detected: {len(person_embeddings)}", (10, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
        cv2.rectangle(frame_with_yolo, ZONE_A[:2], ZONE_A[2:], (0, 255, 0), 2)
        cv2.putText(frame_with_yolo, "Zone A", (ZONE_A[0], ZONE_A[1] - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

        cv2.rectangle(frame_with_yolo, ZONE_B[:2], ZONE_B[2:], (0, 0, 255), 2)
        cv2.putText(frame_with_yolo, "Zone B", (ZONE_B[0], ZONE_B[1] - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

        cv2.rectangle(frame_with_yolo, ZONE_C[:2], ZONE_C[2:], (255, 0, 0), 2)
        cv2.putText(frame_with_yolo, "Zone C", (ZONE_C[0], ZONE_C[1] - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)

        cv2.rectangle(frame_with_yolo, ZONE_D[:2], ZONE_D[2:], (0, 255, 255), 2)
        cv2.putText(frame_with_yolo, "Zone D", (ZONE_D[0], ZONE_D[1] - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)

        cv2.rectangle(frame_with_yolo, ZONE_E[:2], ZONE_E[2:], (255, 0, 255), 2)
        cv2.putText(frame_with_yolo, "Zone E", (ZONE_E[0], ZONE_E[1] - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 255), 2)

        if len(results) == 0 or len(results[0].boxes) == 0:
            # Encode frame and send over WebSocket even if no detections
            _, buffer = cv2.imencode('.jpg', frame_with_yolo)
            encoded_frame = base64.b64encode(buffer).decode('utf-8')
            await websocket.send(encoded_frame)
            continue

        detections = []
        detection_coords = []
        for result in results:
            for i, box in enumerate(result.boxes.xyxy):
                x1, y1, x2, y2 = map(int, box.tolist())
                conf = float(result.boxes.conf[i])
                cls = int(result.boxes.cls[i])

                if cls == 0:
                    detections.append(([x1, y1, x2, y2], conf, "human"))
                    detection_coords.append((x1, y1, x2, y2))

        tracked_objects = tracker.update_tracks(detections, frame=frame)

        for i, track in enumerate(tracked_objects):
            if track.is_confirmed() and i < len(detection_coords):
                track_id = track.track_id
                x1, y1, x2, y2 = detection_coords[i]
                box_width = x2 - x1
                center_x = int((x1 + x2) / 2)
                center_y = int((y1 + y2) / 2)

                cv2.circle(frame_with_yolo, (center_x, center_y), 5, (255, 255, 0), -1)

                # Determine current zone
                current_zone = None
                if ZONE_A[0] <= center_x <= ZONE_A[2] and ZONE_A[1] <= center_y <= ZONE_A[3]:
                    current_zone = 'A'
                elif ZONE_B[0] <= center_x <= ZONE_B[2] and ZONE_B[1] <= center_y <= ZONE_B[3]:
                    current_zone = 'B'
                elif ZONE_C[0] <= center_x <= ZONE_C[2] and ZONE_C[1] <= center_y <= ZONE_C[3]:
                    current_zone = 'C'
                elif ZONE_D[0] <= center_x <= ZONE_D[2] and ZONE_D[1] <= center_y <= ZONE_D[3]:
                    current_zone = 'D'
                elif ZONE_E[0] <= center_x <= ZONE_E[2] and ZONE_E[1] <= center_y <= ZONE_E[3]:
                    current_zone = 'E'
                else:
                    current_zone = 'none'

                # Check for zone change and update duration
                if current_zone is not None:
                    last_zone = person_last_zone.get(track_id)
                    
                    # increment the person_behaviour by duration of (last update time - current time)
                    if last_zone is not None and track_id in person_last_update_time and last_zone in person_last_update_time[track_id]:
                        duration = time.time() - person_last_update_time[track_id][last_zone]

                        if track_id in person_metadata:
                            person_metadata[track_id]["InStoreDuration"] += duration
                            person_metadata[track_id]["InStoreDuration"] = round(person_metadata[track_id]["InStoreDuration"], 2)

                        if track_id not in person_behaviour:
                            person_behaviour[track_id] = {}
                        if last_zone not in person_behaviour[track_id]:
                            person_behaviour[track_id][last_zone] = 0.0
                        person_behaviour[track_id][last_zone] += duration
                        person_behaviour[track_id][last_zone] = round(person_behaviour[track_id][last_zone], 2)
                        print(f"Track {track_id} spent {duration:.2f} seconds in Zone {last_zone}. Total: {person_behaviour[track_id][last_zone]:.2f}")

                    # Update las update time for the current zone
                    if track_id not in person_last_update_time:
                        person_last_update_time[track_id] = {}
                    person_last_update_time[track_id][current_zone] = time.time()
                    person_last_zone[track_id] = current_zone
                    
                    # track age and gender
                    if track_id not in person_metadata:
                        person_metadata[track_id] = {
                            "Age": None,
                            "Gender": None,
                            "DateTime": datetime.now().strftime("%d%m%Y %H:%M:%S"),
                            "InStoreDuration": 0,
                            "AgeSamples": [],
                            "GenderSamples": []
                        }

                    if len(person_metadata[track_id]["AgeSamples"]) < 10:
                        face_info = detect_and_analyze_face(frame, frame_with_yolo, x1, y1, x2, y2)
                        if face_info:
                            detected_age = face_info[0]['age']
                            detected_gender = face_info[0]['gender']

                            person_metadata[track_id]["AgeSamples"].append(detected_age)
                            person_metadata[track_id]["GenderSamples"].append(detected_gender)
                            
                            person_metadata[track_id]["Age"] = Counter(person_metadata[track_id]["AgeSamples"]).most_common(1)[0][0]
                            person_metadata[track_id]["Gender"] = Counter(person_metadata[track_id]["GenderSamples"]).most_common(1)[0][0]

                
                person_crop = frame[y1:y2, x1:x2]
                
                if person_crop.size != 0:
                    embedding = extractor(person_crop)
                    embedding = embedding[0]

                    best_match_id = None
                    best_similarity = float("inf")

                    with embedding_lock:
                        for existing_id, stored_embedding in person_embeddings.items():
                            similarity = cosine(embedding.cpu(), stored_embedding.cpu())
                            if similarity < feature_extraction_threshold and similarity < best_similarity: # Threshold for similarity (lower = more similar)
                                best_match_id = existing_id
                                best_similarity = similarity

                        if best_match_id is not None:
                            track_id = best_match_id
                        else:
                            person_embeddings[track_id] = embedding
                            cv2.putText(frame_with_yolo, f"Human Detected: {len(person_embeddings)}", (10, 40),
                                        cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)

                cv2.putText(frame_with_yolo, f"ID: {track_id}", (x1+50, y1 - 70),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
                
                # Display the current duration in the zone
                if current_zone is not None and track_id in person_behaviour and current_zone in person_behaviour[track_id]:
                    current_stay_duration = person_behaviour[track_id][current_zone]
                    cv2.putText(frame_with_yolo, f"Duration: {current_zone} {current_stay_duration:.2f}s", (x1+50, y1 - 40), 
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
                else:
                    # If not currently in a zone or no entry time recorded, display 0.0s
                    cv2.putText(frame_with_yolo, f"Duration: 0.00s", (x1+150, y1 + 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)
                              
        # Encode frame and send over WebSocket
        _, buffer = cv2.imencode('.jpg', frame_with_yolo)
        encoded_frame = base64.b64encode(buffer).decode('utf-8')
        await websocket.send(encoded_frame)

        cleaned_person_behaviour = [meta.copy() for meta in person_behaviour.values()]
        print("Person Behaviour:", cleaned_person_behaviour)

        cleaned_person_metadata = [meta.copy() for meta in person_metadata.values()]
        for meta in cleaned_person_metadata:
            del meta["AgeSamples"]
            del meta["GenderSamples"]
        print("Person Metadata:", cleaned_person_metadata)

        today = datetime.now().strftime("%d%m%Y")

        script_dir = os.path.dirname(__file__)
        base_temp_dir = os.path.join(script_dir, '..', 'temp')

        customer_dir = os.path.join(base_temp_dir, 'customer', today)
        visit_zone_dir = os.path.join(base_temp_dir, 'visit_zone', today)

        if not os.path.exists(customer_dir):
            os.makedirs(customer_dir, exist_ok=True)
            open(os.path.join(customer_dir, "log.txt"), "w").close()


        if not os.path.exists(visit_zone_dir):
            os.makedirs(visit_zone_dir, exist_ok=True)
            open(os.path.join(visit_zone_dir, "log.txt"), "w").close()

        customer_file_path = os.path.join(customer_dir, f"{today}.json")
        with open(customer_file_path, "w") as f:
            json.dump(cleaned_person_metadata, f, indent=4)

        visit_zone_file_path = os.path.join(visit_zone_dir, f"{today}.json")
        with open(visit_zone_file_path, "w") as f:
            json.dump(cleaned_person_behaviour, f, indent=4)

    cap.release()

