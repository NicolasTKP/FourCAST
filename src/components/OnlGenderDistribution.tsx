import { useEffect, useState } from "react";
import PieChart from "./PieChart";

interface PieChartDataItem {
  label: string;
  value: number;
}

interface CustomerRecord {
  Age: string;
  Gender: string;
  DateTime: string;
  InStoreDuration: number;
}

const OnlGenderDistribution = () => {
  const [data, setData] = useState<PieChartDataItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const indexResponse = await fetch(
          "/s3/onlstores/Customer/index.json"
        );
        if (!indexResponse.ok) {
          throw new Error(
            `HTTP error! status: ${indexResponse.status} for index.json`
          );
        }
        const files: string[] = await indexResponse.json();

        // Object to count gender occurrences
        let genderCounts: { [gender: string]: number } = {};

        for (const file of files) {
          try {
            const response = await fetch(
              `/s3/onlstores/Customer/${file}`
            );
            if (!response.ok) {
              throw new Error(
                `HTTP error! status: ${response.status} for ${file}`
              );
            }
            const customers: CustomerRecord[] = await response.json();

            // Count each gender occurrence with filtering
            for (const customer of customers) {
              const gender = customer.Gender;

              // Debug: Log unexpected gender values
              if (!gender || gender === '' || gender === 'null' || gender === 'undefined') {
                console.warn('Found invalid gender value:', gender, 'in customer:', customer);
                continue; // Skip invalid entries
              }
              
              // Only count valid gender values
              if (gender && typeof gender === 'string') {
                genderCounts[gender] = (genderCounts[gender] || 0) + 1;
              } else {
                console.warn('Unexpected gender format:', gender, 'in customer:', customer);
              }
            }
          } catch (fileError) {
            console.error(
              `Error fetching or processing file ${file}:`,
              fileError
            );
          }
        }

        // Transform to PieChart format and sort by gender
        const genderData: PieChartDataItem[] = Object.entries(genderCounts)
          .filter(([gender, count]) => {
            // Filter out any remaining invalid entries
            return gender && gender !== 'null' && gender !== 'undefined' && count > 0;
          })
          .map(([gender, count]) => ({
            label: gender,
            value: count,
          }));

        console.log('Final gender data:', genderData); // Debug: Check final data
        console.log('Total customers processed:', Object.values(genderCounts).reduce((sum, count) => sum + count, 0));

        setData(genderData);
      } catch (error) {
        console.error("Error loading customer data:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div>
      {loading ? (
        <p>Loading customer gender data...</p>
      ) : data.length > 0 ? (
        <PieChart 
          data={data} 
          title="Customer Gender Distribution" 
          width={1000}
          height={600}
          showValues={true}
          showLegend={true}
          showCenter={true}
        />
      ) : (
        <p>No customer data available.</p>
      )}
    </div>
  );
};

export default OnlGenderDistribution;