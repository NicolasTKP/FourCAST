import json
import datetime
import random

def extend_purchase_data(purchase_file_path, product_file_path, start_date_str):
    # Load existing purchase data
    with open(purchase_file_path, 'r') as f:
        purchase_data = json.load(f)

    # Load product data to get valid ProductIDs
    with open(product_file_path, 'r') as f:
        product_data = json.load(f)
    
    valid_product_ids = [product['ProductID'] for product in product_data]

    # Determine the last PurchaseID
    last_purchase_id_num = 0
    if purchase_data:
        last_purchase_id = max(purchase_data, key=lambda x: int(x['PurchaseID'][2:]))['PurchaseID']
        last_purchase_id_num = int(last_purchase_id[2:])

    # Define start and end dates for new data generation
    start_date = datetime.datetime.strptime(start_date_str, '%Y-%m-%d')
    end_date = datetime.datetime.now()

    new_purchase_entries = []
    current_purchase_id_num = last_purchase_id_num

    current_date = start_date
    while current_date <= end_date:
        # Generate a random number of purchases for each day (e.g., 1 to 5)
        num_daily_purchases = random.randint(1, 5)
        
        for _ in range(num_daily_purchases):
            current_purchase_id_num += 1
            purchase_id = f"PU{current_purchase_id_num:05d}"
            
            customer_id = f"C{random.randint(1, 2000):05d}" # Assuming customer IDs range from C00001 to C02000
            
            # Generate random time for the purchase
            random_hour = random.randint(0, 23)
            random_minute = random.randint(0, 59)
            random_second = random.randint(0, 59)
            random_microsecond = random.randint(0, 999999)
            
            purchase_datetime = current_date.replace(
                hour=random_hour,
                minute=random_minute,
                second=random_second,
                microsecond=random_microsecond
            ).isoformat()

            # Select 1 to 5 random product IDs
            num_products_in_purchase = random.randint(1, min(5, len(valid_product_ids)))
            selected_product_ids = random.sample(valid_product_ids, num_products_in_purchase)
            
            quantities = [random.randint(1, 10) for _ in selected_product_ids]
            
            # Generate a random total (simplified as we don't have product prices in purchase_table)
            total = round(random.uniform(100.0, 50000.0), 2)
            
            promotion = random.choice([True, False])

            new_purchase_entries.append({
                "PurchaseID": purchase_id,
                "CustomerID": customer_id,
                "DateTime": purchase_datetime,
                "ProductID": selected_product_ids,
                "Quantity": quantities,
                "Total": total,
                "Promotion": promotion
            })
        
        current_date += datetime.timedelta(days=1)

    # Append new entries to existing data
    purchase_data.extend(new_purchase_entries)

    # Write the updated data back to the JSON file
    with open(purchase_file_path, 'w') as f:
        json.dump(purchase_data, f, indent=4)

    print(f"Successfully extended purchase data from {start_date_str} to {end_date.strftime('%Y-%m-%d')}.")
    print(f"Total entries after extension: {len(purchase_data)}")

# Paths to the JSON files (relative to the current working directory of the script)
purchase_file = '..//public/s3/physicalstore/purchase/purchases_physical.json'
product_file = '../public/s3/physicalstore/product/products_physical.json'
start_date_for_extension = '2024-01-01'

if __name__ == "__main__":
    extend_purchase_data(purchase_file, product_file, start_date_for_extension)
