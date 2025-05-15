import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface AddTagDialogData {
  title: string;
  existingTags?: string[];
  suggestedTags?: string[];
}

@Component({
  selector: 'app-add-tag-dialog',
  templateUrl: './add-tag-dialog.component.html',
  styleUrls: ['./add-tag-dialog.component.scss']
})
export class AddTagDialogComponent implements OnInit {
  tagForm: FormGroup;
  
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddTagDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddTagDialogData
  ) {
    // Set default values if not provided
    this.data.title = this.data.title || 'Add Tag';
    this.data.existingTags = this.data.existingTags || [];
    this.data.suggestedTags = this.data.suggestedTags || [];
    
    // Initialize form
    this.tagForm = this.fb.group({
      tag: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_-]+$/)]]
    });
  }

  ngOnInit(): void {
  }

  /**
   * Submit the tag
   */
  onSubmit(): void {
    if (this.tagForm.valid) {
      this.dialogRef.close(this.tagForm.value.tag);
    }
  }

  /**
   * Select a suggested tag
   */
  selectTag(tag: string): void {
    this.tagForm.patchValue({ tag });
  }

  /**
   * Cancel and close dialog
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Check if tag already exists
   */
  tagExists(): boolean {
    const tag = this.tagForm.value.tag;
    return tag && this.data.existingTags.includes(tag);
  }

  /**
   * Get filtered suggested tags (not already in existing tags)
   */
  get filteredSuggestedTags(): string[] {
    return this.data.suggestedTags.filter(tag => !this.data.existingTags.includes(tag));
  }
}