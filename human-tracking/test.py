import os
import json
import random
from datetime import datetime, timedelta

AGE_LIST = ['(0-2)', '(4-6)', '(8-12)', '(15-20)', '(25-32)', '(38-43)', '(48-53)', '(60-100)']
GENDER_LIST = ["Male", "Female"]

# Output folder
output_dir = "synthetic_data"
os.makedirs(output_dir, exist_ok=True)

# Start date: first day of 2024
start_date = datetime(2024, 1, 1)
# End date: today
end_date = datetime.now()

# Calculate number of days between start and today
total_days = (end_date - start_date).days + 1  # include today

# Generate JSON files
for i in range(total_days):
    current_date = start_date + timedelta(days=i)
    date_str = current_date.strftime("%d%m%Y")   # e.g. "01012024"
    
    # Generate random records for the day
    day_data = []
    for _ in range(random.randint(5, 20)):  # 5–20 entries per file
        # Random time within the day
        random_time = current_date.replace(
            hour=random.randint(0, 23),
            minute=random.randint(0, 59),
            second=random.randint(0, 59)
        )
        datetime_str = random_time.strftime("%d%m%Y %H:%M:%S")

        entry = {
            "Age": random.choice(AGE_LIST),
            "Gender": random.choice(GENDER_LIST),
            "DateTime": datetime_str,
            "InStoreDuration": round(random.uniform(0.1, 120.0), 2)  # duration in minutes
        }
        day_data.append(entry)
    
    # Save JSON file
    file_path = os.path.join(output_dir, f"{date_str}.json")
    with open(file_path, "w") as f:
        json.dump(day_data, f, indent=4)

print(f"✅ Generated {total_days} JSON files from {start_date.strftime('%d-%m-%Y')} to {end_date.strftime('%d-%m-%Y')} in folder: {output_dir}")
