import os
import json
import boto3
from dotenv import load_dotenv
import time

load_dotenv()

region = os.getenv("AWS_REGION")
access_key = os.getenv("AWS_ACCESS_KEY_ID")
secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")

def download_s3_bucket(bucket_name, download_dir):
    os.makedirs(download_dir, exist_ok=True)
    s3 = boto3.client(
        "s3",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region,
    )

    # List all objects
    response = s3.list_objects_v2(Bucket=bucket_name)

    if "Contents" not in response:
        print("No files in bucket")
        return

    for obj in response["Contents"]:
        key = obj["Key"]

        if key.endswith("/"):
            continue

        local_path = os.path.join(download_dir, key)
        os.makedirs(os.path.dirname(local_path), exist_ok=True)

        print(f"Downloading {key} -> {local_path}")
        s3.download_file(bucket_name, key, local_path)

        # Update index.json for this directory
        folder_path = os.path.dirname(local_path)
        index_file = os.path.join(folder_path, "index.json")

        files = [
            f for f in os.listdir(folder_path)
            if os.path.isfile(os.path.join(folder_path, f)) and f != "index.json"
        ]

        with open(index_file, "w") as f:
            json.dump(files, f, indent=2)

if __name__ == "__main__":
    while True:
        print("Starting S3 download sync...")

        # Third bucket
        BUCKET_NAME = "modelpredictionresult"
        DOWNLOAD_DIR = os.path.expanduser("../FourCAST/public/s3/modelpredictionresult")
        download_s3_bucket(BUCKET_NAME, DOWNLOAD_DIR)

        # First bucket
        BUCKET_NAME = "onlstores"
        DOWNLOAD_DIR = os.path.expanduser("../FourCAST/public/s3/onlstores")
        download_s3_bucket(BUCKET_NAME, DOWNLOAD_DIR)

        # Second bucket
        BUCKET_NAME = "physicalstore"
        DOWNLOAD_DIR = os.path.expanduser("../FourCAST/public/s3/physicalstore")
        download_s3_bucket(BUCKET_NAME, DOWNLOAD_DIR)


        print("Sync complete. Waiting 1 hour...\n")
        time.sleep(3600)
