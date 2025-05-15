import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Grid,
  useTheme
} from '@mui/material';
import {
  Refresh,
  ZoomIn,
  ZoomOut,
  FilterList,
  GetApp,
  Timeline
} from '@mui/icons-material';
import Chart from 'react-apexcharts';
import { useSettings } from '../../hooks/useSettings';
import { formatNumber, formatDate } from '../../utils/formatters';

interface DataSeries {
  name: string;
  data: Array<number | null>;
}

interface MetricsChartProps {
  title: string;
  type?: 'line' | 'area' | 'bar';
  series: DataSeries[];
  categories: string[]; // X-axis labels (usually dates)
  loading?: boolean;
  error?: string;
  height?: number;
  stacked?: boolean;
  onRefresh?: () => void;
  onTimeRangeChange?: (range: string) => void;
  timeRange?: string;
  yAxisFormatter?: (value: number) => string;
  showLegend?: boolean;
  showDataLabels?: boolean;
  allowDownload?: boolean;
  allowZoom?: boolean;
  allowTimeRangeChange?: boolean;
  colors?: string[];
}

const MetricsChart: React.FC<MetricsChartProps> = ({
  title,
  type = 'line',
  series,
  categories,
  loading = false,
  error,
  height = 350,
  stacked = false,
  onRefresh,
  onTimeRangeChange,
  timeRange = '24h',
  yAxisFormatter = (value) => formatNumber(value),
  showLegend = true,
  showDataLabels = false,
  allowDownload = true,
  allowZoom = true,
  allowTimeRangeChange = true,
  colors
}) => {
  const theme = useTheme();
  const chartRef = useRef<any>(null);
  const { settings } = useSettings();
  
  // Format dates according to user settings
  const formatDateLabel = (date: string): string => {
    try {
      const dateObj = new Date(date);
      return formatDate(dateObj, settings?.display?.dateFormat);
    } catch (error) {
      return date;
    }
  };
  
  // Chart options
  const options = {
    chart: {
      id: 'metrics-chart',
      type,
      toolbar: {
        show: allowZoom,
        tools: {
          download: false, // We'll handle download ourselves
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      },
      animations: {
        enabled: settings?.display?.chartAnimation !== false,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      },
      background: 'transparent',
      fontFamily: theme.typography.fontFamily
    },
    colors: colors || [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.info.main
    ],
    dataLabels: {
      enabled: showDataLabels,
      formatter: (value: number) => yAxisFormatter(value)
    },
    stroke: {
      curve: 'smooth',
      width: type === 'bar' ? 0 : 2
    },
    fill: {
      type: type === 'area' ? 'gradient' : 'solid',
      opacity: type === 'area' ? 0.3 : 1,
      gradient: {
        shade: 'dark',
        type: 'vertical',
        shadeIntensity: 0.5,
        gradientToColors: undefined,
        inverseColors: true,
        opacityFrom: 0.7,
        opacityTo: 0.3,
        stops: [0, 90, 100]
      }
    },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 3,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
      padding: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
      }
    },
    legend: {
      show: showLegend,
      position: 'bottom',
      horizontalAlign: 'center',
      floating: false,
      fontSize: '14px',
      fontFamily: theme.typography.fontFamily,
      labels: {
        colors: theme.palette.text.primary
      },
      itemMargin: {
        horizontal: 10,
        vertical: 5
      }
    },
    markers: {
      size: 4,
      strokeWidth: 0,
      hover: {
        size: 6
      }
    },
    tooltip: {
      enabled: true,
      shared: true,
      followCursor: true,
      theme: theme.palette.mode, // Use dark or light theme based on app theme
      x: {
        formatter: (val: number, opts: any) => {
          return formatDateLabel(categories[val]);
        }
      },
      y: {
        formatter: (val: number) => yAxisFormatter(val)
      }
    },
    xaxis: {
      categories,
      labels: {
        show: true,
        rotate: -45,
        rotateAlways: false,
        style: {
          colors: theme.palette.text.secondary,
          fontSize: '12px'
        },
        formatter: (value: string) => formatDateLabel(value)
      },
      axisBorder: {
        show: true,
        color: theme.palette.divider
      },
      axisTicks: {
        show: true,
        color: theme.palette.divider
      },
      crosshairs: {
        show: true,
        position: 'back',
        stroke: {
          color: theme.palette.primary.main,
          width: 1,
          dashArray: 3
        }
      }
    },
    yaxis: {
      show: true,
      min: 0,
      forceNiceScale: true,
      decimalsInFloat: 0,
      labels: {
        show: true,
        style: {
          colors: theme.palette.text.secondary,
          fontSize: '12px'
        },
        formatter: yAxisFormatter
      },
      axisBorder: {
        show: true,
        color: theme.palette.divider
      },
      axisTicks: {
        show: true,
        color: theme.palette.divider
      },
      crosshairs: {
        show: true,
        position: 'back',
        stroke: {
          color: theme.palette.primary.main,
          width: 1,
          dashArray: 3
        }
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        endingShape: 'rounded',
        dataLabels: {
          position: 'top',
        }
      },
      area: {
        fillTo: 'end'
      }
    },
    states: {
      hover: {
        filter: {
          type: 'lighten',
          value: 0.1
        }
      },
      active: {
        filter: {
          type: 'darken',
          value: 0.1
        }
      }
    }
  };
  
  // Add stacked option if needed
  if (stacked) {
    options.chart.stacked = true;
    options.plotOptions.bar = {
      ...options.plotOptions.bar,
      horizontal: false,
      dataLabels: {
        position: 'center',
      }
    };
  }
  
  // Handle time range change
  const handleTimeRangeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const range = event.target.value as string;
    if (onTimeRangeChange) {
      onTimeRangeChange(range);
    }
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };
  
  // Handle zoom in button click
  const handleZoomIn = () => {
    if (chartRef.current && chartRef.current.chart) {
      chartRef.current.chart.zoomX(0.5, 1);
    }
  };
  
  // Handle zoom out button click
  const handleZoomOut = () => {
    if (chartRef.current && chartRef.current.chart) {
      chartRef.current.chart.zoomX(0, 2);
    }
  };
  
  // Handle download as PNG
  const handleDownload = () => {
    if (chartRef.current && chartRef.current.chart) {
      chartRef.current.chart.dataURI().then(({ imgURI }) => {
        const link = document.createElement('a');
        link.href = imgURI;
        link.download = `${title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }
  };
  
  return (
    <Paper
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
        <Typography variant="h6">{title}</Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {allowTimeRangeChange && onTimeRangeChange && (
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                onChange={handleTimeRangeChange}
                label="Time Range"
              >
                <MenuItem value="24h">Last 24 Hours</MenuItem>
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
                <MenuItem value="90d">Last 90 Days</MenuItem>
              </Select>
            </FormControl>
          )}
          
          {allowZoom && (
            <>
              <IconButton size="small" onClick={handleZoomIn}>
                <ZoomIn />
              </IconButton>
              <IconButton size="small" onClick={handleZoomOut}>
                <ZoomOut />
              </IconButton>
            </>
          )}
          
          {allowDownload && (
            <IconButton size="small" onClick={handleDownload}>
              <GetApp />
            </IconButton>
          )}
          
          {onRefresh && (
            <IconButton size="small" onClick={handleRefresh}>
              <Refresh />
            </IconButton>
          )}
        </Box>
      </Box>
      
      <Box sx={{ flexGrow: 1, position: 'relative', minHeight: '200px' }}>
        {loading ? (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <Chart
            ref={chartRef}
            options={options}
            series={series}
            type={type}
            height={height}
          />
        )}
      </Box>
    </Paper>
  );
};

export default MetricsChart;