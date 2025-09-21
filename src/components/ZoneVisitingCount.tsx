import { useEffect, useState } from "react";
import BarChart from "./BarChart";

interface ChartDataItem {
  label: string;
  value: number;
}

interface ZoneData {
  [date: string]: {
    [zone: string]: number;
  };
}

const ZoneVisitingCount = () => {
  const [data, setData] = useState<ZoneData>({});

  useEffect(() => {
    async function loadData() {
      try {
        const indexResponse = await fetch(
          "/s3/physicalstore/visit_zone/index.json"
        );
        if (!indexResponse.ok) {
          throw new Error(
            `HTTP error! status: ${indexResponse.status} for index.json`
          );
        }
        const files: string[] = await indexResponse.json();

        const result: ZoneData = {};

        for (const file of files) {
          try {
            const response = await fetch(
              `/s3/physicalstore/visit_zone/${file}`
            );
            if (!response.ok) {
              throw new Error(
                `HTTP error! status: ${response.status} for ${file}`
              );
            }
            const visits: Record<string, any>[] = await response.json();

            const date = file.replace(".json", "");
            result[date] = {};

            for (const record of visits) {
              for (const zone of Object.keys(record)) {
                result[date][zone] = (result[date][zone] || 0) + 1;
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
        console.error("Error loading zone data:", error);
        setData({}); // Ensure data is reset or remains empty on error
      }
    }

    loadData();
  }, []);

  let zoneCounts: { [zone: string]: number } = {};

  Object.entries(data).map(([date, zones]) => {
    Object.entries(zones).map(([zone, count]) => {
      zoneCounts[zone] = (zoneCounts[zone] || 0) + count;
    });
  });

  const chartData: ChartDataItem[] = Object.entries(zoneCounts).map(
    ([zone, count]) => ({
      label: zone,
      value: count,
    })
  );

  const zones = Object.keys(zoneCounts);
  const counts = Object.values(zoneCounts);

  return (
    <div>
      {zones.length > 0 ? (
        <BarChart
          data={chartData}
          title="Zone Visiting Count"
          width={500}
          height={300}
        />
      ) : (
        <p>Loading zone data...</p>
      )}
    </div>
  );
};

export default ZoneVisitingCount;
