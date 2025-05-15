import { format, formatDistance, formatRelative } from 'date-fns';
import { tr } from 'date-fns/locale';

/**
 * Format date as readable string with user's locale
 * @param date Date string or object
 * @param formatString Optional format string
 * @returns Formatted date string
 */
export const formatDate = (date?: string | Date | number | null, formatString: string = 'dd.MM.yyyy HH:mm'): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date)
      : date;
    
    return format(dateObj, formatString, { locale: tr });
  } catch (error) {
    console.error('Date formatting error:', error);
    return '-';
  }
};

/**
 * Format date as relative time (e.g. "5 minutes ago")
 * @param date Date string or object
 * @returns Relative time string
 */
export const formatRelativeTime = (date?: string | Date | number | null): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date)
      : date;
    
    return formatDistance(dateObj, new Date(), { 
      addSuffix: true,
      locale: tr
    });
  } catch (error) {
    console.error('Relative time formatting error:', error);
    return '-';
  }
};

/**
 * Format number with thousands separators
 * @param value Number to format
 * @returns Formatted number string
 */
export const formatNumber = (value?: number | null): string => {
  if (value === undefined || value === null) return '-';
  
  try {
    return new Intl.NumberFormat('tr-TR').format(value);
  } catch (error) {
    console.error('Number formatting error:', error);
    return value.toString();
  }
};

/**
 * Format bytes to human readable format
 * @param bytes Bytes to format
 * @param decimals Decimal places
 * @returns Formatted bytes string
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format percentage
 * @param value Value to format as percentage
 * @param decimals Decimal places
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format duration in seconds to human readable format
 * @param seconds Duration in seconds
 * @returns Formatted duration string
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  } else {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  }
};

/**
 * Format IP address ranges for display
 * @param startIp Start IP address
 * @param endIp End IP address
 * @returns Formatted IP range
 */
export const formatIpRange = (startIp: string, endIp: string): string => {
  if (startIp === endIp) {
    return startIp;
  }
  return `${startIp} - ${endIp}`;
};

/**
 * Truncate text to specified length
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Format JSON for display
 * @param json JSON object
 * @returns Formatted JSON string
 */
export const formatJson = (json: any): string => {
  try {
    return JSON.stringify(json, null, 2);
  } catch (error) {
    console.error('JSON formatting error:', error);
    return '';
  }
};