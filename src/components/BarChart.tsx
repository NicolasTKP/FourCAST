import React from 'react';
import './BarChart.css';

export interface ChartDataItem {
  label: string;
  value: number;
}

const BarChart = ({ 
  data = [] as ChartDataItem[], 
  title = "Bar Chart",
  width = 1300,
  height = 600,
  showValues = true,
  showGrid = true
}) => {
  // Sample data if none provided
  const sampleData = [
    { label: "Jan", value: 65 },
    { label: "Feb", value: 45 },
    { label: "Mar", value: 85 },
    { label: "Apr", value: 30 },
    { label: "May", value: 70 },
    { label: "Jun", value: 55 },
  ];

  const chartData = data.length > 0 ? data : sampleData;
  const maxValue = Math.max(...chartData.map(item => item.value));
  const chartHeight = height - 80; // Reserve space for labels and title

  return (
    <div className="bar-chart-container">
      <h2 className="bar-chart-title">{title}</h2>
      
      <div 
        className="bar-chart-wrapper" 
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {/* Y-axis labels */}
        {showGrid && (
          <div 
            className="bar-chart-y-axis" 
            style={{ height: `${chartHeight}px` }}
          >
            {[1, 0.75, 0.5, 0.25, 0].map((ratio, index) => (
              <div key={index} className="bar-chart-y-label">
                {Math.round(maxValue * ratio)}
              </div>
            ))}
          </div>
        )}

        {/* Chart area */}
        <div className="bar-chart-area">
          {/* Grid lines */}
          {showGrid && (
            <div className="bar-chart-grid">
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
                <div 
                  key={index}
                  className="bar-chart-grid-line"
                  style={{ bottom: `${ratio * chartHeight + 40}px` }}
                />
              ))}
            </div>
          )}
          
          {/* Bars container */}
          <div className="bar-chart-bars">
            {chartData.map((item, index) => {
              const barHeight = (item.value / maxValue) * chartHeight;
              const barWidth = Math.max(20, (width - 100) / chartData.length * 0.6);
              
              return (
                <div key={index} className="bar-chart-item">
                  {/* Value label on hover */}
                  {showValues && (
                    <div className="bar-chart-value">
                      {item.value}
                    </div>
                  )}
                  
                  {/* Bar */}
                  <div
                    className="bar-chart-bar"
                    style={{
                      height: `${barHeight}px`,
                      width: `${barWidth}px`
                    }}
                    title={`${item.label}: ${item.value}`}
                  />
                  
                  {/* X-axis label */}
                  <div className="bar-chart-x-label">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarChart;