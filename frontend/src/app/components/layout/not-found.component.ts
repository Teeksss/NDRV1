import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss']
})
export class NotFoundComponent {
  constructor(
    private router: Router,
    private location: Location
  ) { }

  /**
   * Navigate back to previous page
   */
  goBack(): void {
    this.location.back();
  }

  /**
   * Navigate to home page
   */
  goHome(): void {
    this.router.navigate(['/dashboard']);
  }
}