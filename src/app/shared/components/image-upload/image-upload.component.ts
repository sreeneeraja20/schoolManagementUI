import { Component, EventEmitter, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ButtonModule],
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.scss'
})
export class ImageUploadComponent {
  @Input() imageUrl: string | null = null;
  @Input() label: string = 'Upload Photo';
  @Input() maxSizeKB: number = 500;
  @Input() acceptTypes: string = 'image/png,image/jpeg,image/jpg';
  @Input() width: string = '150px';
  @Input() height: string = '150px';
  @Input() readonly: boolean = false;
  @Input() tooLargeKey: string = 'STUDENTS.PHOTO_TOO_LARGE';
  @Input() invalidTypeKey: string = 'STUDENTS.PHOTO_INVALID_TYPE';
  @Input() removeLabel: string = 'STUDENTS.REMOVE_PHOTO';

  @Output() imageChange = new EventEmitter<string>();
  @Output() imageRemove = new EventEmitter<void>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  errorMessage: string = '';
  isDragOver: boolean = false;

  openFilePicker(): void {
    if (this.readonly) return;
    this.fileInput.nativeElement.click();
  }

  onSpaceKey(event: Event): void {
    event.preventDefault();
    this.openFilePicker();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
      input.value = '';
    }
  }

  onDragOver(event: DragEvent): void {
    if (this.readonly) return;
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(): void {
    if (this.readonly) return;
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    if (this.readonly) return;
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  private processFile(file: File): void {
    this.errorMessage = '';
    const allowedTypes = this.acceptTypes.split(',').map(t => t.trim());
    if (!allowedTypes.includes(file.type)) {
      this.errorMessage = this.invalidTypeKey;
      return;
    }
    if (file.size > this.maxSizeKB * 1024) {
      this.errorMessage = this.tooLargeKey;
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      this.imageChange.emit(result);
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.errorMessage = '';
    this.imageRemove.emit();
  }
}
