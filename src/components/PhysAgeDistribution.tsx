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

const PhysAgeDistribution = () => {
  const [data, setData] = useState<PieChartDataItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const indexResponse = await fetch(
          "/s3/physicalstore/customer/index.json"
        );
        if (!indexResponse.ok) {
          throw new Error(
            `HTTP error! status: ${indexResponse.status} for index.json`
          );
        }
        const files: string[] = await indexResponse.json();

        // Object to count age occurrences
        let ageCounts: { [age: string]: number } = {};

        for (const file of files) {
          try {
            const response = await fetch(
              `/s3/physicalstore/customer/${file}`
            );
            if (!response.ok) {
              throw new Error(
                `HTTP error! status: ${response.status} for ${file}`
              );
            }
            const customers: CustomerRecord[] = await response.json();

            // Count each age occurrence with filtering
            for (const customer of customers) {
              const age = customer.Age;
              
              // Debug: Log unexpected age values
              if (!age || age === '' || age === 'null' || age === 'undefined') {
                console.warn('Found invalid age value:', age, 'in customer:', customer);
                continue; // Skip invalid entries
              }
              
              // Only count valid age ranges that match the expected format
              if (age && typeof age === 'string' && age.match(/^\(\d+-\d+\)$/)) {
                ageCounts[age] = (ageCounts[age] || 0) + 1;
              } else {
                console.warn('Unexpected age format:', age, 'in customer:', customer);
              }
            }
          } catch (fileError) {
            console.error(
              `Error fetching or processing file ${file}:`,
              fileError
            );
          }
        }

        // Transform to PieChart format and sort by age ranges
        const ageData: PieChartDataItem[] = Object.entries(ageCounts)
          .filter(([age, count]) => {
            // Filter out any remaining invalid entries
            return age && age !== 'null' && age !== 'undefined' && count > 0;
          })
          .map(([age, count]) => ({
            label: age,
            value: count,
          }))
          .sort((a, b) => {
            // Sort by the starting age number for better visualization
            const getStartAge = (ageRange: string) => {
              const match = ageRange.match(/\((\d+)-/);
              return match ? parseInt(match[1]) : 0;
            };
            return getStartAge(a.label) - getStartAge(b.label);
          });

        console.log('Final age data:', ageData); // Debug: Check final data
        console.log('Total customers processed:', Object.values(ageCounts).reduce((sum, count) => sum + count, 0));

        setData(ageData);
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
        <p>Loading customer age data...</p>
      ) : data.length > 0 ? (
        <PieChart 
          data={data} 
          title="Customer Age Distribution" 
          width={650}
          height={400}
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

export default PhysAgeDistribution;