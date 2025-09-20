import { useEffect, useState } from "react";
import PieChart from "./PieChart";

interface PieChartDataItem {
  label: string;
  value: number;
}

interface CustomerRecord {
  CustomerID: string;
  Age: number;
  Gender: string;
}

const OnlAgeDistribution = () => {
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

        let ageCounts: { [ageRange: string]: number } = {};

        const getAgeRange = (age: number): string => {
          if (age <= 18) return '0-18';
          if (age <= 30) return '19-30';
          if (age <= 45) return '31-45';
          if (age <= 60) return '46-60';
          return '60+';
        };

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

            for (const customer of customers) {
              const age = customer.Age;

              if (typeof age === 'number' && !isNaN(age)) {
                const ageRange = getAgeRange(age);
                ageCounts[ageRange] = (ageCounts[ageRange] || 0) + 1;
              } else {
                console.warn('Invalid age value or format:', age, 'in customer:', customer);
              }
            }
          } catch (fileError) {
            console.error(
              `Error fetching or processing file ${file}:`,
              fileError
            );
          }
        }

        const ageData: PieChartDataItem[] = Object.entries(ageCounts)
          .map(([ageRange, count]) => ({
            label: ageRange,
            value: count,
          }))
          .sort((a, b) => {
            const order = ['0-18', '19-30', '31-45', '46-60', '60+'];
            return order.indexOf(a.label) - order.indexOf(b.label);
          });

        console.log('Final age data:', ageData);
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

export default OnlAgeDistribution;
