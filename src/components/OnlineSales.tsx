import { useEffect, useState } from "react";
import LineChart from "./LineChart";
import { format, subDays, subMonths } from 'date-fns';

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

interface OnlSalesProps {
  timeline: string | null;
}

const OnlineSales = ({ timeline }: OnlSalesProps) => {
  const [data, setData] = useState<SalesData>({});

  useEffect(() => {
    async function loadData() {
      try {
        const indexResponse = await fetch(
          "/s3/onlstores/Purchase/index.json"
        );
        if (!indexResponse.ok) {
          throw new Error(
            `HTTP error! status: ${indexResponse.status} for index.json`
          );
        }
        const files: string[] = await indexResponse.json();

        let allSalesData: SalesData = {};

        for (const file of files) {
          try {
            const response = await fetch(
              `/s3/onlstores/Purchase/${file}`
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
              allSalesData[date] = (allSalesData[date] || 0) + purchase.Total;
            }
          } catch (fileError) {
            console.error(
              `Error fetching or processing file ${file}:`,
              fileError
            );
          }
        }

        // Filter sales data based on timeline
        const now = new Date();
        let filteredSalesData: SalesData = {};

        if (timeline === "Last Week") {
          const lastWeek = subDays(now, 7);
          // Filter object entries by date
          Object.entries(allSalesData).forEach(([date, total]) => {
            if (new Date(date) >= lastWeek) {
              filteredSalesData[date] = total;
            }
          });
        } else if (timeline === "Last Month") {
          const lastMonth = subMonths(now, 1);
          Object.entries(allSalesData).forEach(([date, total]) => {
            if (new Date(date) >= lastMonth) {
              filteredSalesData[date] = total;
            }
          });
        } else if (timeline === "Last 3 Days") {
          const last3Days = subDays(now, 3);
          Object.entries(allSalesData).forEach(([date, total]) => {
            if (new Date(date) >= last3Days) {
              filteredSalesData[date] = total;
            }
          });
        } else {
          // No timeline filter or "All" - use all data
          filteredSalesData = allSalesData;
        }

        setData(filteredSalesData);
      } catch (error) {
        console.error("Error loading sales data:", error);
        setData({});
      }
    }

    loadData();
  }, [timeline]); // Added timeline to dependency array

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
          title="Daily Online Store Sales"
          width={650}
          height={370}
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

export default OnlineSales;