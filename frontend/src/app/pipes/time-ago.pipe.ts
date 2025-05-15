import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo'
})
export class TimeAgoPipe implements PipeTransform {
  /**
   * Transform a date into a time ago string (e.g., "5 minutes ago")
   */
  transform(value: any): string {
    if (!value) return '';

    // Convert input to date
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', value);
      return '';
    }

    // Get current time
    const now = new Date();
    
    // Calculate time difference in seconds
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    // Time units in seconds
    const MINUTE = 60;
    const HOUR = MINUTE * 60;
    const DAY = HOUR * 24;
    const WEEK = DAY * 7;
    const MONTH = DAY * 30;
    const YEAR = DAY * 365;
    
    // Determine the appropriate time unit
    if (diffInSeconds < 30) {
      return 'just now';
    } else if (diffInSeconds < MINUTE) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 2 * MINUTE) {
      return 'a minute ago';
    } else if (diffInSeconds < HOUR) {
      return `${Math.floor(diffInSeconds / MINUTE)} minutes ago`;
    } else if (diffInSeconds < 2 * HOUR) {
      return 'an hour ago';
    } else if (diffInSeconds < DAY) {
      return `${Math.floor(diffInSeconds / HOUR)} hours ago`;
    } else if (diffInSeconds < 2 * DAY) {
      return 'yesterday';
    } else if (diffInSeconds < WEEK) {
      return `${Math.floor(diffInSeconds / DAY)} days ago`;
    } else if (diffInSeconds < 2 * WEEK) {
      return 'a week ago';
    } else if (diffInSeconds < MONTH) {
      return `${Math.floor(diffInSeconds / WEEK)} weeks ago`;
    } else if (diffInSeconds < 2 * MONTH) {
      return 'a month ago';
    } else if (diffInSeconds < YEAR) {
      return `${Math.floor(diffInSeconds / MONTH)} months ago`;
    } else if (diffInSeconds < 2 * YEAR) {
      return 'a year ago';
    } else {
      return `${Math.floor(diffInSeconds / YEAR)} years ago`;
    }
  }
}