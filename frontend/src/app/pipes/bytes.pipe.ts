import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'bytes'
})
export class BytesPipe implements PipeTransform {
  private units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  /**
   * Transform bytes into a human-readable format
   * @param bytes The number of bytes
   * @param precision The number of decimal places (default 2)
   * @returns Formatted string like "1.5 MB"
   */
  transform(bytes: number, precision: number = 2): string {
    if (bytes == 0) return '0 B';
    if (isNaN(bytes) || !isFinite(bytes)) return '-';
    
    // Get the unit that the value should be measured in
    const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024));
    
    // Return the formatted value
    if (unitIndex >= this.units.length) {
      return bytes + ' ' + this.units[this.units.length - 1];
    }
    
    // Calculate the value in the appropriate unit
    const value = bytes / Math.pow(1024, unitIndex);
    
    // Format to the specified precision
    return value.toFixed(precision) + ' ' + this.units[unitIndex];
  }
}