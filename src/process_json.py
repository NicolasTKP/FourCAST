import json
import random

def process_purchase_data(product_file_path, purchase_file_path):
    with open(product_file_path, 'r') as f:
        product_data = json.load(f)

    with open(purchase_file_path, 'r') as f:
        purchase_data = json.load(f)

    valid_product_ids = {product['ProductID'] for product in product_data}
    
    # Filter out products with 0 stock from valid_product_ids
    valid_product_ids_with_stock = {product['ProductID'] for product in product_data if product['Stock'] > 0}

    modified_purchase_data = []
    for purchase in purchase_data:
        modified_product_ids = []
        for product_id in purchase['ProductID']:
            if product_id not in valid_product_ids:
                # Replace with a random valid product ID that has stock
                if valid_product_ids_with_stock:
                    modified_product_ids.append(random.choice(list(valid_product_ids_with_stock)))
                else:
                    # Fallback if no products have stock (shouldn't happen with typical data)
                    modified_product_ids.append(random.choice(list(valid_product_ids)))
            else:
                modified_product_ids.append(product_id)
        purchase['ProductID'] = modified_product_ids
        modified_purchase_data.append(purchase)

    with open(purchase_file_path, 'w') as f:
        json.dump(modified_purchase_data, f, indent=4)

    print(f"Processed {len(purchase_data)} purchases. Invalid product IDs replaced.")

if __name__ == "__main__":
    product_online_table_path = '../../React Apps/FourCAST/public/s3/onlstores/Product/Product_Online_Table.json'
    purchase_table_path = '../../React Apps/FourCAST/public/s3/onlstores/Purchase/purchase_table.json'
    process_purchase_data(product_online_table_path, purchase_table_path)
