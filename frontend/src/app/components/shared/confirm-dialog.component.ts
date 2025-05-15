import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: 'primary' | 'accent' | 'warn';
}

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {
    // Set default values if not provided
    this.data.confirmButtonText = this.data.confirmButtonText || 'Confirm';
    this.data.cancelButtonText = this.data.cancelButtonText || 'Cancel';
    this.data.confirmButtonColor = this.data.confirmButtonColor || 'primary';
  }

  /**
   * Close dialog with true result (confirmed)
   */
  onConfirm(): void {
    this.dialogRef.close(true);
  }

  /**
   * Close dialog with false result (cancelled)
   */
  onCancel(): void {
    this.dialogRef.close(false);
  }
}