import React, { useState, useRef } from 'react';
import './LineChart.css';

export interface LineChartDataItem {
  label: string;
  value: number;
}

export interface LineChartSeries {
  name: string;
  data: LineChartDataItem[];
  color?: string;
}

const LineChart = ({ 
  data = [] as LineChartDataItem[], 
  series = [] as LineChartSeries[],
  title = "Line Chart",
  width = 1300,
  height = 600,
  showValues = true,
  showGrid = true,
  showArea = false,
  showPoints = true
}) => {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });
  const svgRef = useRef<SVGSVGElement>(null);

  // Sample data if none provided
  const sampleData = [
    { label: "Jan", value: 65 },
    { label: "Feb", value: 45 },
    { label: "Mar", value: 85 },
    { label: "Apr", value: 30 },
    { label: "May", value: 70 },
    { label: "Jun", value: 55 },
    { label: "Jul", value: 95 },
    { label: "Aug", value: 75 }
  ];

  // Use series data if provided, otherwise use single data array
  const chartSeries = series.length > 0 ? series : [{ name: "Series 1", data: data.length > 0 ? data : sampleData }];
  const chartHeight = height - 80; // Reserve space for labels and title
  const chartWidth = width - 100; // Reserve space for y-axis

  // Find global min and max for scaling across all series
  const allValues = chartSeries.flatMap(s => s.data.map(d => d.value));
  const globalMin = Math.min(...allValues);
  const globalMax = Math.max(...allValues);
  const range = globalMax - globalMin;

  // Get all unique labels across series
  const allLabels = [...new Set(chartSeries.flatMap(s => s.data.map(d => d.label)))];
  
  // Color palette for multiple series
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16'];

  // Function to convert value to pixel position
  const valueToPixel = (value: number) => {
    return chartHeight - ((value - globalMin) / range) * chartHeight;
  };

  // Function to convert label index to pixel position
  const labelToPixel = (index: number) => {
    return (index / (allLabels.length - 1)) * chartWidth;
  };

  // Generate path for line
  const generateLinePath = (seriesData: LineChartDataItem[]) => {
    return seriesData.map((point, index) => {
      const x = labelToPixel(allLabels.indexOf(point.label));
      const y = valueToPixel(point.value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  // Generate area path (for filled area under line)
  const generateAreaPath = (seriesData: LineChartDataItem[]) => {
    const linePath = generateLinePath(seriesData);
    const firstX = labelToPixel(0);
    const lastX = labelToPixel(allLabels.indexOf(seriesData[seriesData.length - 1].label));
    const bottomY = chartHeight;
    
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const handleMouseEnter = (event: React.MouseEvent, point: LineChartDataItem, seriesName: string) => {
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      content: `${seriesName}: ${point.label} = ${point.value}`
    });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!svgRef.current || !tooltip.visible) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    setTooltip(prev => ({
      ...prev,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }));
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  return (
    <div className="line-chart-container">
      <h2 className="line-chart-title">{title}</h2>
      
      <div 
        className="line-chart-wrapper" 
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {/* Y-axis labels */}
        {showGrid && (
          <div 
            className="line-chart-y-axis" 
            style={{ height: `${chartHeight}px` }}
          >
            {[1, 0.75, 0.5, 0.25, 0].map((ratio, index) => (
              <div key={index} className="line-chart-y-label">
                {Math.round(globalMin + (range * ratio))}
              </div>
            ))}
          </div>
        )}

        {/* Chart area */}
        <div className="line-chart-area" style={{ width: `${chartWidth}px`, height: `${chartHeight}px` }}>
          {/* Grid lines */}
          {showGrid && (
            <div className="line-chart-grid">
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
                <div 
                  key={index}
                  className="line-chart-grid-line"
                  style={{ top: `${ratio * chartHeight}px` }}
                />
              ))}
            </div>
          )}

          {/* SVG for lines and points */}
          <svg
            ref={svgRef}
            className="line-chart-svg"
            width={chartWidth}
            height={chartHeight}
            onMouseMove={handleMouseMove}
          >
            {chartSeries.map((seriesItem, seriesIndex) => {
              const seriesColor = seriesItem.color || colors[seriesIndex % colors.length];
              
              return (
                <g key={seriesIndex}>
                  {/* Area fill (if enabled) */}
                  {showArea && (
                    <path
                      className="line-chart-area-fill"
                      d={generateAreaPath(seriesItem.data)}
                      style={{ fill: `${seriesColor}20` }}
                    />
                  )}
                  
                  {/* Line */}
                  <path
                    className="line-chart-line"
                    d={generateLinePath(seriesItem.data)}
                    style={{ stroke: seriesColor }}
                  />
                  
                  {/* Points */}
                  {showPoints && seriesItem.data.map((point, pointIndex) => {
                    const x = labelToPixel(allLabels.indexOf(point.label));
                    const y = valueToPixel(point.value);
                    
                    return (
                      <circle
                        key={pointIndex}
                        className="line-chart-point"
                        cx={x}
                        cy={y}
                        r="4"
                        style={{ fill: seriesColor }}
                        onMouseEnter={(e) => handleMouseEnter(e, point, seriesItem.name)}
                        onMouseLeave={handleMouseLeave}
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>

          {/* X-axis labels */}
          <div className="line-chart-x-axis">
            {allLabels.map((label, index) => {
              // Calculate how many labels we can fit (estimate ~80px per label)
              const maxLabels = Math.floor(chartWidth / 80);
              const step = Math.max(1, Math.ceil(allLabels.length / maxLabels));
              
              // Only show labels at intervals to prevent overlap
              const shouldShow = index % step === 0 || index === allLabels.length - 1;
              
              return shouldShow ? (
                <div
                  key={index}
                  className="line-chart-x-label"
                  style={{ left: `${labelToPixel(index) + 20}px` }}
                >
                  {label}
                </div>
              ) : null;
            })}
          </div>

          {/* Legend (for multiple series) */}
          {chartSeries.length > 1 && (
            <div className="line-chart-legend">
              {chartSeries.map((seriesItem, index) => (
                <div key={index} className="line-chart-legend-item">
                  <div 
                    className="line-chart-legend-color"
                    style={{ backgroundColor: seriesItem.color || colors[index % colors.length] }}
                  />
                  <span>{seriesItem.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tooltip */}
          <div 
            className={`line-chart-tooltip ${tooltip.visible ? 'visible' : ''}`}
            style={{
              left: `${tooltip.x + 10}px`,
              top: `${tooltip.y - 10}px`
            }}
          >
            {tooltip.content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineChart;