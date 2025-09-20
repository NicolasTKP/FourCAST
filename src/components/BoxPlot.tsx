import React from 'react';
import './BoxPlot.css';

export interface BoxPlotDataItem {
  label: string;
  values: number[]; // Array of data points for each category
}

const BoxPlot = ({ 
  data = [] as BoxPlotDataItem[], 
  title = "Box Plot",
  width = 1300,
  height = 600,
  showValues = true,
  showGrid = true
}) => {
  // Sample data if none provided
  const sampleData = [
    { label: "Group A", values: [12, 15, 18, 20, 22, 25, 28, 30, 35, 40, 45] },
    { label: "Group B", values: [8, 12, 16, 18, 22, 26, 30, 32, 38, 42] },
    { label: "Group C", values: [15, 20, 25, 28, 30, 32, 35, 38, 42, 45, 50, 55] },
    { label: "Group D", values: [10, 14, 18, 22, 24, 26, 28, 30, 34, 38] },
    { label: "Group E", values: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70] }
  ];

  const chartData = data.length > 0 ? data : sampleData;
  const chartHeight = height - 80; // Reserve space for labels and title

  // Calculate statistics for each box plot
  const calculateStats = (values:number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    
    const q1Index = Math.floor(n * 0.25);
    const medianIndex = Math.floor(n * 0.5);
    const q3Index = Math.floor(n * 0.75);
    
    const q1 = sorted[q1Index];
    const median = n % 2 === 0 
      ? (sorted[medianIndex - 1] + sorted[medianIndex]) / 2 
      : sorted[medianIndex];
    const q3 = sorted[q3Index];
    
    const iqr = q3 - q1;
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;
    
    // Find actual whisker endpoints (closest values within fences)
    const lowerWhisker = sorted.find(val => val >= lowerFence) || sorted[0];
    const upperWhisker = sorted.reverse().find(val => val <= upperFence) || sorted[0];
    sorted.reverse(); // restore original order
    
    // Find outliers
    const outliers = sorted.filter(val => val < lowerFence || val > upperFence);
    
    return {
      min: sorted[0],
      max: sorted[n - 1],
      q1,
      median,
      q3,
      lowerWhisker,
      upperWhisker,
      outliers
    };
  };

  // Calculate stats for all data
  const allStats = chartData.map(item => ({
    ...item,
    stats: calculateStats(item.values)
  }));

  // Find global min and max for scaling
  const globalMin = Math.min(...allStats.map(item => Math.min(...item.values)));
  const globalMax = Math.max(...allStats.map(item => Math.max(...item.values)));
  const range = globalMax - globalMin;

  // Function to convert value to pixel position
  const valueToPixel = (value:number) => {
    return ((globalMax - value) / range) * chartHeight;
  };

  return (
    <div className="box-plot-container">
      <h2 className="box-plot-title">{title}</h2>
      
      <div 
        className="box-plot-wrapper" 
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {/* Y-axis labels */}
        {showGrid && (
          <div 
            className="box-plot-y-axis" 
            style={{ height: `${chartHeight}px` }}
          >
            {[1, 0.75, 0.5, 0.25, 0].map((ratio, index) => (
              <div key={index} className="box-plot-y-label">
                {Math.round(globalMin + (range * ratio))}
              </div>
            ))}
          </div>
        )}

        {/* Chart area */}
        <div className="box-plot-area">
          {/* Grid lines */}
          {showGrid && (
            <div className="box-plot-grid">
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
                <div 
                  key={index}
                  className="box-plot-grid-line"
                  style={{ top: `${ratio * chartHeight}px` }}
                />
              ))}
            </div>
          )}
          
          {/* Box plots container */}
          <div className="box-plot-boxes">
            {allStats.map((item, index) => {
              const boxWidth = Math.max(40, (width - 100) / chartData.length * 0.6);
              const stats = item.stats;
              
              // Calculate positions
              const upperWhiskerPos = valueToPixel(stats.upperWhisker);
              const q3Pos = valueToPixel(stats.q3);
              const medianPos = valueToPixel(stats.median);
              const q1Pos = valueToPixel(stats.q1);
              const lowerWhiskerPos = valueToPixel(stats.lowerWhisker);
              
              const boxHeight = q1Pos - q3Pos;
              const upperWhiskerHeight = q3Pos - upperWhiskerPos;
              const lowerWhiskerHeight = lowerWhiskerPos - q1Pos;
              
              return (
                <div key={index} className="box-plot-item">
                  {/* Statistics tooltip on hover */}
                  {showValues && (
                    <div className="box-plot-stats">
                      Max: {stats.max}<br/>
                      Q3: {stats.q3}<br/>
                      Median: {stats.median}<br/>
                      Q1: {stats.q1}<br/>
                      Min: {stats.min}
                      {stats.outliers.length > 0 && (
                        <>
                          <br/>Outliers: {stats.outliers.join(', ')}
                        </>
                      )}
                    </div>
                  )}
                  
                  <div className="box-plot-whisker-container">
                    {/* Upper whisker */}
                    <div 
                      className="box-plot-whisker-top"
                      style={{ height: `${upperWhiskerHeight}px` }}
                    />
                    <div className="box-plot-whisker-cap-top" />
                    
                    {/* Box (Q1 to Q3) */}
                    <div
                      className="box-plot-box"
                      style={{
                        height: `${boxHeight}px`,
                        width: `${boxWidth}px`
                      }}
                      title={`${item.label}: Q1=${stats.q1}, Median=${stats.median}, Q3=${stats.q3}`}
                    >
                      {/* Median line */}
                      <div 
                        className="box-plot-median"
                        style={{ 
                          top: `${medianPos - q3Pos - 1}px`
                        }}
                      />
                    </div>
                    
                    <div className="box-plot-whisker-cap-bottom" />
                    {/* Lower whisker */}
                    <div 
                      className="box-plot-whisker-bottom"
                      style={{ height: `${lowerWhiskerHeight}px` }}
                    />
                    
                    {/* Outliers */}
                    <div className="box-plot-outliers">
                      {stats.outliers.map((outlier, outlierIndex) => (
                        <div
                          key={outlierIndex}
                          className="box-plot-outlier"
                          style={{
                            top: `${valueToPixel(outlier) - upperWhiskerPos}px`
                          }}
                          title={`Outlier: ${outlier}`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* X-axis label */}
                  <div className="box-plot-x-label">
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

export default BoxPlot;