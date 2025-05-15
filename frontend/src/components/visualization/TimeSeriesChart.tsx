import React, { useRef, useEffect, useState } from 'react';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';
import * as d3 from 'd3';

interface DataPoint {
  date: Date;
  value: number;
}

interface Series {
  id: string;
  name: string;
  color?: string;
  data: DataPoint[];
}

interface ChartOptions {
  title?: string;
  type?: 'line' | 'area' | 'bar';
  stacked?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  dateFormat?: string;
  yAxisFormat?: (value: number) => string;
  xAxisTickCount?: number;
  yAxisTickCount?: number;
  animated?: boolean;
  curveType?: 'linear' | 'step' | 'natural' | 'cardinal';
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

interface TimeSeriesChartProps {
  series: Series[];
  options?: ChartOptions;
  height?: number;
  loading?: boolean;
  emptyStateMessage?: string;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  series,
  options = {},
  height = 300,
  loading = false,
  emptyStateMessage = 'No data available'
}) => {
  const theme = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [noData, setNoData] = useState<boolean>(false);
  
  // Set default options
  const defaultOptions: ChartOptions = {
    type: 'line',
    stacked: false,
    showGrid: true,
    showLegend: true,
    dateFormat: 'MM/dd HH:mm',
    animated: true,
    curveType: 'cardinal',
    margin: {
      top: 20,
      right: 30,
      bottom: 50,
      left: 60
    }
  };
  
  const chartOptions: ChartOptions = { ...defaultOptions, ...options };
  
  // Create chart when component mounts or data changes
  useEffect(() => {
    if (loading) return;
    
    // Check if we have valid data
    const hasData = series.some(s => s.data && s.data.length > 0);
    setNoData(!hasData);
    
    if (!hasData || !svgRef.current) return;
    
    // Clear any existing chart
    d3.select(svgRef.current).selectAll('*').remove();
    
    renderChart();
  }, [series, options, loading, theme.palette.mode]);
  
  // Render chart
  const renderChart = () => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const {
      top = 20,
      right = 30,
      bottom = 50,
      left = 60
    } = chartOptions.margin || {};
    
    // Calculate chart dimensions
    const chartWidth = width - left - right;
    const chartHeight = height - top - bottom;
    
    // Create chart group
    const g = svg.append('g')
      .attr('transform', `translate(${left},${top})`);
    
    // Combine all data points for scales
    let allDataPoints: DataPoint[] = [];
    series.forEach(s => {
      allDataPoints = [...allDataPoints, ...s.data];
    });
    
    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(allDataPoints, d => d.date) as [Date, Date])
      .range([0, chartWidth]);
    
    let yScale;
    if (chartOptions.stacked) {
      // For stacked charts, calculate the sum of values at each date
      const stackedData = d3.group(allDataPoints, d => d.date);
      const stackedSums = Array.from(stackedData, ([date, values]) => ({
        date,
        value: d3.sum(values, d => d.value)
      }));
      
      yScale = d3.scaleLinear()
        .domain([0, d3.max(stackedSums, d => d.value) || 0])
        .range([chartHeight, 0])
        .nice();
    } else {
      yScale = d3.scaleLinear()
        .domain([0, d3.max(allDataPoints, d => d.value) || 0])
        .range([chartHeight, 0])
        .nice();
    }
    
    // Create axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(chartOptions.xAxisTickCount || 5)
      .tickFormat(d => {
        const date = d as Date;
        const format = chartOptions.dateFormat || 'MM/dd HH:mm';
        return d3.timeFormat(format)(date);
      });
    
    const yAxis = d3.axisLeft(yScale)
      .ticks(chartOptions.yAxisTickCount || 5)
      .tickFormat(d => {
        if (chartOptions.yAxisFormat) {
          return chartOptions.yAxisFormat(d as number);
        }
        return d.toString();
      });
    
    // Create grid lines if enabled
    if (chartOptions.showGrid) {
      g.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(xAxis.tickSize(-chartHeight).tickFormat(() => ''));
      
      g.append('g')
        .attr('class', 'grid')
        .call(yAxis.tickSize(-chartWidth).tickFormat(() => ''));
    }
    
    // Add X axis
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('y', 10)
      .attr('x', -5)
      .attr('dy', '.35em')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');
    
    // Add Y axis
    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis);
    
    // Add axis labels if provided
    if (chartOptions.xAxisLabel) {
      g.append('text')
        .attr('class', 'x-axis-label')
        .attr('x', chartWidth / 2)
        .attr('y', chartHeight + 40)
        .style('text-anchor', 'middle')
        .text(chartOptions.xAxisLabel);
    }
    
    if (chartOptions.yAxisLabel) {
      g.append('text')
        .attr('class', 'y-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -chartHeight / 2)
        .attr('y', -40)
        .style('text-anchor', 'middle')
        .text(chartOptions.yAxisLabel);
    }
    
    // Create tooltip
    const tooltip = d3.select(tooltipRef.current);
    
    // Create curve function based on option
    let curveFunction;
    switch (chartOptions.curveType) {
      case 'linear':
        curveFunction = d3.curveLinear;
        break;
      case 'step':
        curveFunction = d3.curveStep;
        break;
      case 'natural':
        curveFunction = d3.curveNatural;
        break;
      case 'cardinal':
      default:
        curveFunction = d3.curveCardinal;
    }
    
    // Draw series based on chart type
    series.forEach((s, index) => {
      const seriesColor = s.color || d3.schemeCategory10[index % 10];
      
      if (chartOptions.type === 'line' || chartOptions.type === 'area') {
        // Create line generator
        const line = d3.line<DataPoint>()
          .x(d => xScale(d.date))
          .y(d => yScale(d.value))
          .curve(curveFunction);
        
        // Draw line
        const path = g.append('path')
          .datum(s.data)
          .attr('class', 'line')
          .attr('fill', 'none')
          .attr('stroke', seriesColor)
          .attr('stroke-width', 2)
          .attr('d', line);
          
        // Add animation if enabled
        if (chartOptions.animated) {
          const totalLength = path.node()?.getTotalLength() || 0;
          path
            .attr('stroke-dasharray', totalLength + ' ' + totalLength)
            .attr('stroke-dashoffset', totalLength)
            .transition()
            .duration(1000)
            .attr('stroke-dashoffset', 0);
        }
        
        // Draw area if area chart
        if (chartOptions.type === 'area') {
          const area = d3.area<DataPoint>()
            .x(d => xScale(d.date))
            .y0(chartHeight)
            .y1(d => yScale(d.value))
            .curve(curveFunction);
          
          g.append('path')
            .datum(s.data)
            .attr('class', 'area')
            .attr('fill', seriesColor)
            .attr('fill-opacity', 0.2)
            .attr('d', area);
        }
      } else if (chartOptions.type === 'bar') {
        // Calculate bar width based on data points and chart width
        const barWidth = chartWidth / (allDataPoints.length / series.length) * 0.8;
        
        // Draw bars
        g.selectAll(`.bar-${index}`)
          .data(s.data)
          .enter()
          .append('rect')
          .attr('class', `bar-${index}`)
          .attr('x', d => xScale(d.date) - barWidth / 2)
          .attr('y', d => yScale(d.value))
          .attr('width', barWidth)
          .attr('height', d => chartHeight - yScale(d.value))
          .attr('fill', seriesColor)
          .attr('fill-opacity', 0.7)
          .on('mouseover', function(event, d) {
            d3.select(this).attr('fill-opacity', 1);
            showTooltip(event, d, s.name);
          })
          .on('mouseout', function() {
            d3.select(this).attr('fill-opacity', 0.7);
            hideTooltip();
          });
      }
      
      // Add points
      g.selectAll(`.point-${index}`)
        .data(s.data)
        .enter()
        .append('circle')
        .attr('class', `point-${index}`)
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.value))
        .attr('r', 3)
        .attr('fill', seriesColor)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .on('mouseover', function(event, d) {
          d3.select(this).attr('r', 5);
          showTooltip(event, d, s.name);
        })
        .on('mouseout', function() {
          d3.select(this).attr('r', 3);
          hideTooltip();
        });
    });
    
    // Add legend if enabled
    if (chartOptions.showLegend && series.length > 1) {
      const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width - right - 100},${top})`);
      
      series.forEach((s, i) => {
        const legendItem = legend.append('g')
          .attr('transform', `translate(0,${i * 20})`);
        
        legendItem.append('rect')
          .attr('width', 10)
          .attr('height', 10)
          .attr('fill', s.color || d3.schemeCategory10[i % 10]);
        
        legendItem.append('text')
          .attr('x', 15)
          .attr('y', 9)
          .attr('font-size', '12px')
          .text(s.name);
      });
    }
    
    // Tooltip functions
    function showTooltip(event: any, d: DataPoint, seriesName: string) {
      tooltip
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY - 25}px`)
        .style('opacity', 1);
      
      const dateFormat = d3.timeFormat(chartOptions.dateFormat || 'MM/dd HH:mm');
      
      tooltip.html(`
        <div><strong>${seriesName}</strong></div>
        <div>${dateFormat(d.date)}</div>
        <div>Value: ${d.value}</div>
      `);
    }
    
    function hideTooltip() {
      tooltip.style('opacity', 0);
    }
    
    // Adjust styles for dark mode
    if (theme.palette.mode === 'dark') {
      svg.selectAll('.domain, .tick line')
        .attr('stroke', theme.palette.text.secondary);
      
      svg.selectAll('.tick text')
        .attr('fill', theme.palette.text.secondary);
      
      svg.selectAll('.grid line')
        .attr('stroke', theme.