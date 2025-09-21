import { useEffect, useState } from "react";
import BoxPlot from "./BoxPlot";

interface BoxPlotDataItem {
  label: string;
  values: number[];
}

interface ZoneData {
  [date: string]: {
    [zone: string]: number;
  };
}

const ZoneVisitingDuration = () => {
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
              for (const [zone, duration] of Object.entries(record)) {
                // Add up the durations instead of just counting
                result[date][zone] =
                  (result[date][zone] || 0) + Number(duration);
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

  let zoneDurations: { [zone: string]: number[] } = {};

  Object.entries(data).map(([date, zones]) => {
    Object.entries(zones).map(([zone, duration]) => {
      zoneDurations[zone] = (zoneDurations[zone] || []).concat(
        Math.round(duration * 100) / 100
      );
    });
  });

  const zoneData: BoxPlotDataItem[] = Object.entries(zoneDurations).map(
    ([zone, value]) => ({
      label: zone,
      values: value,
    })
  );

  return (
    <div>
      {zoneData.length > 0 ? (
        <BoxPlot
          data={zoneData}
          title="Zone Visiting Duration"
          width={1350}
          height={400}
        />
      ) : (
        <p>Loading zone data...</p>
      )}
    </div>
  );
};

export default ZoneVisitingDuration;
