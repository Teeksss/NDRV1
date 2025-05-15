import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appHighlight]'
})
export class HighlightDirective implements OnChanges {
  @Input() appHighlight: string = '';
  @Input() caseSensitive: boolean = false;
  @Input() highlightClass: string = 'highlight';
  
  private originalContent: string;

  constructor(private el: ElementRef) {
    // Store original content when directive is initialized
    this.originalContent = this.el.nativeElement.innerHTML;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appHighlight'] || changes['caseSensitive']) {
      // Reset content to original
      this.el.nativeElement.innerHTML = this.originalContent;
      
      // Apply highlighting if search term exists
      if (this.appHighlight && this.appHighlight.trim() !== '') {
        this.highlightText();
      }
    }
  }

  /**
   * Apply highlighting to text that matches the search term
   */
  private highlightText(): void {
    const textToHighlight = this.el.nativeElement.innerHTML;
    const searchTerm = this.caseSensitive ? this.appHighlight : this.appHighlight.toLowerCase();
    
    // If no text to highlight or no search term, return
    if (!textToHighlight || !searchTerm) {
      return;
    }
    
    // Create regex pattern with word boundaries for better matching
    // Use case insensitive flag if needed
    const regex = new RegExp(`(${this.escapeRegExp(searchTerm)})`, this.caseSensitive ? 'g' : 'gi');
    
    // Replace matching text with highlighted version
    const newText = textToHighlight.replace(regex, `<span class="${this.highlightClass}">$1</span>`);
    
    // Set the highlighted content
    this.el.nativeElement.innerHTML = newText;
  }

  /**
   * Escape special regex characters to prevent errors
   */
  private escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}