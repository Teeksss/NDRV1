import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'safeHtml'
})
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  /**
   * Transform a string to SafeHtml to allow rendering in templates
   * Note: Be careful with user-generated content to prevent XSS attacks
   */
  transform(value: string): SafeHtml {
    if (!value) return '';
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}