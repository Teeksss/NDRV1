import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { Inject } from '@angular/core';
import { environment } from '../../environments/environment';

type Theme = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeKey = 'ndr-theme';
  private readonly defaultTheme: Theme = environment.defaultTheme as Theme || 'auto';
  private currentThemeSubject = new BehaviorSubject<Theme>(this.defaultTheme);
  public readonly currentTheme$ = this.currentThemeSubject.asObservable();

  constructor(@Inject(DOCUMENT) private document: Document) {}

  /**
   * Initialize theme from local storage or default
   */
  initializeTheme(): void {
    const savedTheme = localStorage.getItem(this.themeKey) as Theme || this.defaultTheme;
    this.setTheme(savedTheme);
  }

  /**
   * Set theme and apply it
   */
  setTheme(theme: Theme): void {
    // Save to local storage
    localStorage.setItem(this.themeKey, theme);
    
    // Update current theme
    this.currentThemeSubject.next(theme);
    
    // Apply theme classes to document
    this.applyTheme(theme);
  }

  /**
   * Apply theme classes to document
   */
  private applyTheme(theme: Theme): void {
    // Remove all theme classes first
    this.document.body.classList.remove('theme-light', 'theme-dark', 'theme-auto');
    
    // Add new theme class
    this.document.body.classList.add(`theme-${theme}`);
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): Theme {
    return this.currentThemeSubject.value;
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    const currentTheme = this.getCurrentTheme();
    
    if (currentTheme === 'light') {
      this.setTheme('dark');
    } else if (currentTheme === 'dark') {
      this.setTheme('light');
    } else {
      // If auto, switch to light
      this.setTheme('light');
    }
  }

  /**
   * Check if current theme is dark
   */
  isDarkTheme(): boolean {
    const currentTheme = this.getCurrentTheme();
    
    if (currentTheme === 'dark') {
      return true;
    } else if (currentTheme === 'auto') {
      // Check system preference
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    return false;
  }
}