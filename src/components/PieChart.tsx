import React, { useState, useRef } from 'react';
import './PieChart.css';

export interface PieChartDataItem {
  label: string;
  value: number;
}

const PieChart = ({ 
  data = [] as PieChartDataItem[], 
  title = "Pie Chart",
  width = 800,
  height = 600,
  showValues = true,
  showLegend = true,
  showCenter = true
}) => {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });
  const svgRef = useRef<SVGSVGElement>(null);

  // Sample data if none provided
  const sampleData = [
    { label: "Product A", value: 35 },
    { label: "Product B", value: 25 },
    { label: "Product C", value: 20 },
    { label: "Product D", value: 15 },
    { label: "Product E", value: 5 }
  ];

  const chartData = data.length > 0 ? data : sampleData;
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  // Color palette
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280',
    '#14b8a6', '#f43f5e', '#8b5cf6', '#06b6d4', '#84cc16'
  ];

  // Calculate pie chart dimensions
  const centerX = showLegend ? (width * 0.4) : (width / 2);
  const centerY = height / 2;
  const radius = Math.min(centerX - 50, centerY - 50);
  const innerRadius = showCenter ? radius * 0.4 : 0; // For donut chart effect

  // Generate pie slices
  const generateSlices = () => {
    let currentAngle = -Math.PI / 2; // Start from top
    
    return chartData.map((item, index) => {
      const percentage = (item.value / total) * 100;
      const angle = (item.value / total) * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      // Calculate path for pie slice
      const x1 = centerX + Math.cos(startAngle) * radius;
      const y1 = centerY + Math.sin(startAngle) * radius;
      const x2 = centerX + Math.cos(endAngle) * radius;
      const y2 = centerY + Math.sin(endAngle) * radius;

      const largeArcFlag = angle > Math.PI ? 1 : 0;

      let pathData;
      if (innerRadius > 0) {
        // Donut chart path
        const x3 = centerX + Math.cos(endAngle) * innerRadius;
        const y3 = centerY + Math.sin(endAngle) * innerRadius;
        const x4 = centerX + Math.cos(startAngle) * innerRadius;
        const y4 = centerY + Math.sin(startAngle) * innerRadius;

        pathData = [
          `M ${centerX + Math.cos(startAngle) * innerRadius} ${centerY + Math.sin(startAngle) * innerRadius}`,
          `L ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          `L ${x3} ${y3}`,
          `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
          'Z'
        ].join(' ');
      } else {
        // Regular pie chart path
        pathData = [
          `M ${centerX} ${centerY}`,
          `L ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          'Z'
        ].join(' ');
      }

      // Calculate label position
      const labelRadius = radius * 0.7;
      const labelAngle = startAngle + angle / 2;
      const labelX = centerX + Math.cos(labelAngle) * labelRadius;
      const labelY = centerY + Math.sin(labelAngle) * labelRadius;

      currentAngle = endAngle;

      return {
        ...item,
        pathData,
        color: colors[index % colors.length],
        percentage: percentage.toFixed(1),
        labelX,
        labelY,
        angle: labelAngle
      };
    });
  };

  const slices = generateSlices();

  const handleMouseEnter = (event: React.MouseEvent, slice: any) => {
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      content: `${slice.label}: ${slice.value} (${slice.percentage}%)`
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
    <div className="pie-chart-container">
      <h2 className="pie-chart-title">{title}</h2>
      
      <div className="pie-chart-wrapper" style={{ width: `${width}px`, height: `${height}px` }}>
        {/* SVG Chart */}
        <div className="pie-chart-svg-container">
          <svg
            ref={svgRef}
            width={showLegend ? width * 0.7 : width}
            height={height}
            onMouseMove={handleMouseMove}
          >
            {/* Pie slices */}
            {slices.map((slice, index) => (
              <g key={index} className="pie-chart-slice">
                <path
                  className="pie-chart-slice-path"
                  d={slice.pathData}
                  fill={slice.color}
                  onMouseEnter={(e) => handleMouseEnter(e, slice)}
                  onMouseLeave={handleMouseLeave}
                />
                
                {/* Slice labels */}
                {showValues && slice.percentage !== '0.0' && (
                  <text
                    className="pie-chart-label"
                    x={slice.labelX}
                    y={slice.labelY}
                  >
                    {slice.percentage}%
                  </text>
                )}
              </g>
            ))}
            
            {/* Center label for donut chart */}
            {showCenter && innerRadius > 0 && (
              <g>
                <text className="pie-chart-center-label" x={centerX} y={centerY - 10}>
                  Total
                </text>
                <text className="pie-chart-center-value" x={centerX} y={centerY + 10}>
                  {total}
                </text>
              </g>
            )}
          </svg>

          {/* Tooltip */}
          <div 
            className={`pie-chart-tooltip ${tooltip.visible ? 'visible' : ''}`}
            style={{
              left: `${tooltip.x + 10}px`,
              top: `${tooltip.y - 10}px`
            }}
          >
            {tooltip.content}
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="pie-chart-legend">
            {slices.map((slice, index) => (
              <div 
                key={index} 
                className="pie-chart-legend-item"
                onMouseEnter={(e) => handleMouseEnter(e, slice)}
                onMouseLeave={handleMouseLeave}
              >
                <div 
                  className="pie-chart-legend-color"
                  style={{ backgroundColor: slice.color }}
                />
                <div className="pie-chart-legend-text">
                  <span className="pie-chart-legend-label">{slice.label}</span>
                  <span className="pie-chart-legend-value">
                    {slice.value} ({slice.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PieChart;