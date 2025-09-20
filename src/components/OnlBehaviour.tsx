import { useEffect, useState } from "react";
import BoxPlot from "./BoxPlot";
import LineChart from "./LineChart";

export interface LineChartDataItem {
  label: string;
  value: number;
}

export interface LineChartSeries {
  name: string;
  data: LineChartDataItem[];
  color?: string;
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

const OnlBehaviour = () => {
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
              if (typeof product.LikeCount === 'number' && !isNaN(product.LikeCount)) {
                result.LikeCount.push(product.LikeCount);
              }
              if (typeof product.WishlistCount === 'number' && !isNaN(product.WishlistCount)) {
                result.WishlistCount.push(product.WishlistCount);
              }
              if (typeof product.AddToCartCount === 'number' && !isNaN(product.AddToCartCount)) {
                result.AddToCartCount.push(product.AddToCartCount);
              }
              if (typeof product.TotalPurchase === 'number' && !isNaN(product.TotalPurchase)) {
                result.TotalPurchase.push(product.TotalPurchase);
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

  // Transform data for LineChart - only include metrics that have data
  const productData: LineChartSeries[] = Object.entries(data)
    .filter(([metric, values]) => values.length > 0)
    .map(([metric, values]) => ({
      name: metric,
      data: values.map((value, index) => ({ label: `Point ${index + 1}`, value: value })),
    }))
    .sort((a, b) => {
      // Custom sort order for better visualization
      const order = ['LikeCount', 'WishlistCount', 'AddToCartCount', 'TotalPurchase'];
      return order.indexOf(a.name) - order.indexOf(b.name);
    });

  return (
    <div>
      {productData.length > 0 ? (
        <LineChart 
          series={productData} 
          title="Online Behaviour Analysis"
          width={1300}
          height={600}
        />
      ) : (
        <p>Loading product data...</p>
      )}
    </div>
  );
};

export default OnlBehaviour;
