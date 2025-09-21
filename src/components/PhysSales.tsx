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

interface PhysSalesProps {
  timeline: string | null;
}

const PhysSales = ({ timeline }: PhysSalesProps) => {
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

        const allPurchases: PurchaseRecord[] = [];

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
            allPurchases.push(...purchases);
          } catch (fileError) {
            console.error(
              `Error fetching or processing file ${file}:`,
              fileError
            );
          }
        }

        // Filter purchases based on timeline
        const now = new Date();
        let filteredPurchases = allPurchases;

        if (timeline === "Last Week") {
          const lastWeek = subDays(now, 7);
          filteredPurchases = allPurchases.filter(
            (p) => new Date(p.DateTime) >= lastWeek
          );
        } else if (timeline === "Last Month") {
          const lastMonth = subMonths(now, 1);
          filteredPurchases = allPurchases.filter(
            (p) => new Date(p.DateTime) >= lastMonth
          );
        } else if (timeline === "Last 3 Days") {
          const last3Days = subDays(now, 3);
          filteredPurchases = allPurchases.filter(
            (p) => new Date(p.DateTime) >= last3Days
          );
        }

        const result: SalesData = {};
        for (const purchase of filteredPurchases) {
          const date = purchase.DateTime.split('T')[0];
          result[date] = (result[date] || 0) + purchase.Total;
        }

        setData(result);
      } catch (error) {
        console.error("Error loading sales data:", error);
        setData({});
      }
    }

    loadData();
  }, [timeline]); // Re-run effect when timeline changes

  const salesData: LineChartDataItem[] = Object.entries(data)
    .map(([date, total]) => ({
      label: date,
      value: Math.round(total * 100) / 100
    }))
    .sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime());

  return (
    <div>
      {salesData.length > 0 ? (
        <LineChart 
          data={salesData} 
          title="Daily Physical Store Sales"
          width={800}
          height={270}
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
