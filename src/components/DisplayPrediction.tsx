import { useEffect, useState } from "react";
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

interface PredictionRecord {
  Date: string;
  Total: number;
}

const DisplayPrediction = () => {
  const [predictionData, setPredictionData] = useState<LineChartDataItem[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        // Load prediction data
        const predictionResponse = await fetch(
          "/s3/modelpredictionresult/pricemodel/prediction.json"
        );
        if (!predictionResponse.ok) {
          throw new Error(
            `HTTP error! status: ${predictionResponse.status} for prediction.json`
          );
        }
        const predictions: PredictionRecord[] = await predictionResponse.json();
        
        // Process prediction data
        const processedData = predictions
          .filter(record => 
            record.Date && 
            typeof record.Total === 'number' && 
            !isNaN(record.Total)
          )
          .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime())
          .map(record => ({
            label: new Date(record.Date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            }),
            value: record.Total
          }));

        setPredictionData(processedData);

      } catch (error) {
        console.error("Error loading prediction data:", error);
        setPredictionData([]);
      }
    }

    loadData();
  }, []);

  // Create chart series
  const chartSeries: LineChartSeries[] = predictionData.length > 0 ? [{
    name: 'Predicted Sales',
    color: '#dc2626', // Red color for predictions
    data: predictionData,
  }] : [];

  return (
    <div>
      {chartSeries.length > 0 ? (
        <LineChart 
          series={chartSeries} 
          title="Sales Prediction Analysis"
          width={1350}
          height={580}
        />
      ) : (
        <p>Loading prediction data...</p>
      )}
      
      {/* Debug info */}
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>Prediction data points: {predictionData.length}</p>
      </div>
    </div>
  );
};

export default DisplayPrediction;