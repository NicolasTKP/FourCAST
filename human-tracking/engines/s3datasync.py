import os
import time
import json
import glob
import boto3
import shutil
from datetime import datetime, timedelta
from botocore.exceptions import BotoCoreError, ClientError

class S3DataSync:
    def __init__(
        self,
        bucket_name="physicalstore",
        local_base_folder_customer="temp/customer",
        local_base_folder_visitzone="temp/visit_zone",
        s3_base_prefix_customer="customer/",
        s3_base_prefix_visitzone="visit_zone/",
        check_interval=30,
        max_days_to_keep=3  # New parameter: keep only last x days of folders
    ):
        try:
            self.s3 = boto3.client('s3')
            print("✅ S3 client initialized")
            
            self.s3.head_bucket(Bucket=bucket_name)
            print(f"✅ Bucket '{bucket_name}' exists and is accessible")
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                print(f"❌ ERROR: Bucket '{bucket_name}' does not exist!")
            elif error_code == '403':
                print(f"❌ ERROR: Access denied to bucket '{bucket_name}'!")
            else:
                print(f"❌ AWS Error: {e}")
            exit(1)
        except Exception as e:
            print(f"❌ Failed to initialize S3 client: {e}")
            exit(1)
        
        self.bucket = bucket_name
        self.local_base_folder_customer = local_base_folder_customer
        self.local_base_folder_visitzone = local_base_folder_visitzone
        self.s3_base_prefix_customer = s3_base_prefix_customer.rstrip('/') + '/'
        self.s3_base_prefix_visitzone = s3_base_prefix_visitzone.rstrip('/') + '/'
        self.check_interval = check_interval
        self.max_days_to_keep = max_days_to_keep
        
        # Get current date in format DDMMYYYY
        self.current_date = datetime.now().strftime("%d%m%Y")
        
        # Set up paths with current date for customer
        self.local_folder_customer = os.path.join(self.local_base_folder_customer, self.current_date)
        self.main_s3_file_customer = f"{self.current_date}.json"
        self.main_s3_key_customer = self.s3_base_prefix_customer + self.main_s3_file_customer

        # Set up paths with current date for visit_zone
        self.local_folder_visitzone = os.path.join(self.local_base_folder_visitzone, self.current_date)
        self.main_s3_file_visitzone = f"{self.current_date}.json"
        self.main_s3_key_visitzone = self.s3_base_prefix_visitzone + self.main_s3_file_visitzone

        # Create directories if they don't exist
        os.makedirs(self.local_folder_customer, exist_ok=True)
        os.makedirs(self.local_folder_visitzone, exist_ok=True)
        
        # Clean up old folders before starting
        self.cleanup_old_folders()
        
        print(f"📁 Customer Local folder: {os.path.abspath(self.local_folder_customer)}")
        print(f"☁️  Customer S3 target: s3://{self.bucket}/{self.main_s3_key_customer}")
        print(f"📁 Visit Zone Local folder: {os.path.abspath(self.local_folder_visitzone)}")
        print(f"☁️  Visit Zone S3 target: s3://{self.bucket}/{self.main_s3_key_visitzone}")
        print(f"📅 Using today's date: {self.current_date}")
        print(f"🗑️  Keeping only last {self.max_days_to_keep} days of folders")

    def cleanup_old_folders(self):
        """Remove folders older than max_days_to_keep for both customer and visit_zone"""
        print("🧹 Checking for old folders to clean up...")
        
        # Clean up customer folders
        self._cleanup_folder_type_folders(self.local_base_folder_customer, "customer")
        
        # Clean up visit_zone folders
        self._cleanup_folder_type_folders(self.local_base_folder_visitzone, "visit_zone")

    def _cleanup_folder_type_folders(self, base_folder, folder_type):
        """Clean up old folders for a specific folder type"""
        if not os.path.exists(base_folder):
            return
        
        # Get all subfolders (should be date folders)
        try:
            all_folders = [f for f in os.listdir(base_folder) 
                          if os.path.isdir(os.path.join(base_folder, f))]
            
            # Filter to only include folders that match the date format (DDMMYYYY)
            date_folders = []
            for folder in all_folders:
                if len(folder) == 8 and folder.isdigit():
                    try:
                        # Try to parse the date to ensure it's valid
                        date_obj = datetime.strptime(folder, "%d%m%Y")
                        date_folders.append((folder, date_obj))
                    except ValueError:
                        # Not a valid date folder, skip it
                        continue
            
            # Sort folders by date (oldest first)
            date_folders.sort(key=lambda x: x[1])
            
            # Calculate cutoff date
            cutoff_date = datetime.now() - timedelta(days=self.max_days_to_keep)
            
            # Remove folders older than max_days_to_keep
            removed_count = 0
            for folder_name, folder_date in date_folders:
                if folder_date < cutoff_date:
                    folder_path = os.path.join(base_folder, folder_name)
                    try:
                        shutil.rmtree(folder_path)
                        print(f"🗑️  Removed old {folder_type} folder: {folder_name}")
                        removed_count += 1
                    except Exception as e:
                        print(f"❌ Failed to remove {folder_type} folder {folder_name}: {e}")
            
            if removed_count > 0:
                print(f"✅ Removed {removed_count} old {folder_type} folders")
            else:
                print(f"✅ No old {folder_type} folders to remove")
                
        except Exception as e:
            print(f"❌ Error cleaning up {folder_type} folders: {e}")

    def find_json_files(self, folder_type):
        """Find JSON files in the specified folder type"""
        if folder_type == "customer":
            return glob.glob(os.path.join(self.local_folder_customer, "*.json"))
        elif folder_type == "visitzone":
            return glob.glob(os.path.join(self.local_folder_visitzone, "*.json"))
        else:
            return []

    def validate_json(self, file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data
        except Exception as e:
            print(f"❌ Invalid JSON in {os.path.basename(file_path)}: {e}")
            return None

    def append_to_s3_file(self, new_data, folder_type):
        """Append new data to the appropriate S3 JSON file"""
        try:
            # Determine the correct S3 key based on folder type
            if folder_type == "customer":
                s3_key = self.main_s3_key_customer
            elif folder_type == "visitzone":
                s3_key = self.main_s3_key_visitzone
            else:
                print(f"❌ Unknown folder type: {folder_type}")
                return False
            
            # Try to download existing data first
            try:
                response = self.s3.get_object(Bucket=self.bucket, Key=s3_key)
                existing_data = json.loads(response['Body'].read().decode('utf-8'))
                if not isinstance(existing_data, list):
                    existing_data = [existing_data]
            except ClientError as e:
                if e.response['Error']['Code'] == 'NoSuchKey':
                    existing_data = []
                else:
                    raise e
            
            # Append new data
            if isinstance(new_data, list):
                existing_data.extend(new_data)
            else:
                existing_data.append(new_data)
            
            # Upload updated data back to S3
            updated_json = json.dumps(existing_data, indent=2)
            self.s3.put_object(
                Bucket=self.bucket,
                Key=s3_key,
                Body=updated_json,
                ContentType='application/json'
            )
            
            return True
            
        except Exception as e:
            print(f"❌ Failed to append to S3 file: {e}")
            return False

    def process_local_files(self, folder_type):
        """Process files for a specific folder type (customer or visitzone)"""
        files = self.find_json_files(folder_type)
        if not files:
            print(f"⏭️ No JSON files found in {folder_type} folder")
            return 0
            
        print(f"📋 Found {len(files)} files in {folder_type}: {[os.path.basename(f) for f in files]}")
        
        success_count = 0
        all_new_data = []
        
        for file_path in files:
            filename = os.path.basename(file_path)
            print(f"\n--- Processing {folder_type}: {filename} ---")
            
            new_data = self.validate_json(file_path)
            if new_data is not None:
                if isinstance(new_data, list):
                    all_new_data.extend(new_data)
                else:
                    all_new_data.append(new_data)
                print(f"✓ Data extracted from {filename}")
            else:
                print(f"🗑️ Deleting invalid JSON: {filename}")
                try:
                    os.remove(file_path)
                except OSError:
                    pass
        
        # Append all new data to the appropriate S3 file
        if all_new_data:
            if self.append_to_s3_file(all_new_data, folder_type):
                success_count = len(all_new_data)
                if folder_type == "customer":
                    s3_key = self.main_s3_key_customer
                else:
                    s3_key = self.main_s3_key_visitzone
                print(f"🎉✅ Appended {success_count} records to s3://{self.bucket}/{s3_key}")
                
                # Clean up processed files
                for file_path in files:
                    try:
                        os.remove(file_path)
                        print(f"🗑️ Removed local file: {os.path.basename(file_path)}")
                    except OSError:
                        pass
            else:
                print(f"❌ Failed to append {folder_type} data to S3")
        
        return success_count

    def run(self):
        print("\n" + "="*60)
        print("🚀 S3 Data Accumulation Service Started")
        print("="*60)
        print(f"📁 Monitoring Customer: {os.path.abspath(self.local_folder_customer)}")
        print(f"☁️  Customer S3 file: s3://{self.bucket}/{self.main_s3_key_customer}")
        print(f"📁 Monitoring Visit Zone: {os.path.abspath(self.local_folder_visitzone)}")
        print(f"☁️  Visit Zone S3 file: s3://{self.bucket}/{self.main_s3_key_visitzone}")
        print(f"📅 Date: {self.current_date}")
        print(f"⏰ Check interval: {self.check_interval} seconds")
        print(f"🗑️  Keeping only last {self.max_days_to_keep} days of folders")
        print("="*60)
        print("Press Ctrl+C to stop\n")
        
        # Counter for periodic cleanup
        cleanup_counter = 0
        cleanup_interval = 24  # Clean up every 24 cycles (30 sec * 24 = 12 minutes)
        
        try:
            while True:
                # Process customer files
                customer_count = self.process_local_files("customer")
                if customer_count > 0:
                    print(f"\n📊 Processed {customer_count} new customer records")
                
                # Process visit zone files
                visitzone_count = self.process_local_files("visitzone")
                if visitzone_count > 0:
                    print(f"\n📊 Processed {visitzone_count} new visit zone records")
                
                # Periodically clean up old folders
                cleanup_counter += 1
                if cleanup_counter >= cleanup_interval:
                    self.cleanup_old_folders()
                    cleanup_counter = 0
                
                time.sleep(self.check_interval)
        except KeyboardInterrupt:
            print("\n🛑 S3 Data Service Stopped")

if __name__ == "__main__":
    sync_service = S3DataSync()
    sync_service.run()