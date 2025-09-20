import { useEffect, useState } from "react";
import BoxPlot from "./BoxPlot";

interface BoxPlotDataItem {
  label: string;
  values: number[];
}

interface ProductRecord {
  ProductID: string;
  ProductZone: string;
  Name: string;
  Price: number;
  Category: string;
  Brand: string;
  Stock: number;
  LikeCount: number;
  WishlistCount: number;
  AvgRating: number;
  ViewCount: number;
  AddToCartCount: number;
  TotalPurchase: number;
}

interface ProductData {
  [metric: string]: number[];
}

const ProductInfluence = () => {
  const [data, setData] = useState<ProductData>({});

  useEffect(() => {
    async function loadData() {
      try {
        const indexResponse = await fetch(
          "/s3/onlstores/Product/index.json"
        );
        if (!indexResponse.ok) {
          throw new Error(
            `HTTP error! status: ${indexResponse.status} for index.json`
          );
        }
        const files: string[] = await indexResponse.json();

        const result: ProductData = {
          Stock: [],
          LikeCount: [],
          WishlistCount: [],
          AvgRating: [],
          ViewCount: [],
          AddToCartCount: [],
          TotalPurchase: [],
          Price: []
        };

        for (const file of files) {
          try {
            const response = await fetch(
              `/s3/onlstores/Product/${file}`
            );
            if (!response.ok) {
              throw new Error(
                `HTTP error! status: ${response.status} for ${file}`
              );
            }
            const products: ProductRecord[] = await response.json();

            // Process each product record
            for (const product of products) {
              // Filter out invalid values and add to respective arrays
              if (typeof product.Stock === 'number' && !isNaN(product.Stock)) {
                result.Stock.push(product.Stock);
              }
              if (typeof product.LikeCount === 'number' && !isNaN(product.LikeCount)) {
                result.LikeCount.push(product.LikeCount);
              }
              if (typeof product.WishlistCount === 'number' && !isNaN(product.WishlistCount)) {
                result.WishlistCount.push(product.WishlistCount);
              }
              if (typeof product.AvgRating === 'number' && !isNaN(product.AvgRating)) {
                result.AvgRating.push(Math.round(product.AvgRating * 100) / 100);
              }
              if (typeof product.ViewCount === 'number' && !isNaN(product.ViewCount)) {
                result.ViewCount.push(product.ViewCount);
              }
              if (typeof product.AddToCartCount === 'number' && !isNaN(product.AddToCartCount)) {
                result.AddToCartCount.push(product.AddToCartCount);
              }
              if (typeof product.TotalPurchase === 'number' && !isNaN(product.TotalPurchase)) {
                result.TotalPurchase.push(product.TotalPurchase);
              }
              if (typeof product.Price === 'number' && !isNaN(product.Price)) {
                result.Price.push(Math.round(product.Price * 100) / 100);
              }
            }
          } catch (fileError) {
            console.error(
              `Error fetching or processing file ${file}:`,
              fileError
            );
          }
        }

        setData(result);
      } catch (error) {
        console.error("Error loading product data:", error);
        setData({});
      }
    }

    loadData();
  }, []);

  // Transform data for BoxPlot - only include metrics that have data
  const productData: BoxPlotDataItem[] = Object.entries(data)
    .filter(([metric, values]) => values.length > 0)
    .map(([metric, values]) => ({
      label: metric,
      values: values,
    }))
    .sort((a, b) => {
      // Custom sort order for better visualization
      const order = ['Price', 'Stock', 'AvgRating', 'LikeCount', 'WishlistCount', 'ViewCount', 'AddToCartCount', 'TotalPurchase'];
      return order.indexOf(a.label) - order.indexOf(b.label);
    });

  return (
    <div>
      {productData.length > 0 ? (
        <BoxPlot 
          data={productData} 
          title="Product Performance Metrics Distribution"
          width={1300}
          height={600}
        />
      ) : (
        <p>Loading product data...</p>
      )}
    </div>
  );
};

export default ProductInfluence;