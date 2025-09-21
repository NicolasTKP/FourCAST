import { useEffect, useState } from "react";
import LineChart from "./LineChart";

interface LineChartDataItem {
  label: string;
  value: number;
}

interface PurchaseRecord {
  PurchaseID: string;
  CustomerID: string;
  DateTime: string;
  ProductID: string[];
  Quantity: number[];
  Total: number;
  Promotion: boolean[];
}

interface SalesData {
  [date: string]: number;
}

const PhysSales = () => {
  const [data, setData] = useState<SalesData>({});

  useEffect(() => {
    async function loadData() {
      try {
        const indexResponse = await fetch(
          "/s3/physicalstore/purchase/index.json"
        );
        if (!indexResponse.ok) {
          throw new Error(
            `HTTP error! status: ${indexResponse.status} for index.json`
          );
        }
        const files: string[] = await indexResponse.json();

        const result: SalesData = {};

        for (const file of files) {
          try {
            const response = await fetch(
              `/s3/physicalstore/purchase/${file}`
            );
            if (!response.ok) {
              throw new Error(
                `HTTP error! status: ${response.status} for ${file}`
              );
            }
            const purchases: PurchaseRecord[] = await response.json();

            // Process each purchase record
            for (const purchase of purchases) {
              // Extract date from DateTime (format: "2025-09-01T14:55:03.057248")
              const date = purchase.DateTime.split('T')[0]; // Gets "2025-09-01"
              
              // Add purchase total to daily sales
              result[date] = (result[date] || 0) + purchase.Total;
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
        console.error("Error loading sales data:", error);
        setData({});
      }
    }

    loadData();
  }, []);

  // Transform data for LineChart
  const salesData: LineChartDataItem[] = Object.entries(data)
    .map(([date, total]) => ({
      label: date,
      value: Math.round(total * 100) / 100 // Round to 2 decimal places
    }))
    .sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime()); // Sort by date

  return (
    <div>
      {salesData.length > 0 ? (
        <LineChart 
          data={salesData} 
          title="Daily Physical Store Sales"
          width={800}
          height={300}
          showArea={true}
          showPoints={true}
          showGrid={true}
        />
      ) : (
        <p>Loading sales data...</p>
      )}
    </div>
  );
};

export default PhysSales;