import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, ToastModule],
  templateUrl: './toast.component.html',
})
export class ToastComponent {
  private messageService = inject(MessageService);

  success(detail: string, summary = 'Success'): void {
    this.messageService.add({ severity: 'success', summary, detail, life: 3000 });
  }

  error(detail: string, summary = 'Error'): void {
    this.messageService.add({ severity: 'error', summary, detail, life: 4000 });
  }

  warn(detail: string, summary = 'Warning'): void {
    this.messageService.add({ severity: 'warn', summary, detail, life: 3000 });
  }

  info(detail: string, summary = 'Info'): void {
    this.messageService.add({ severity: 'info', summary, detail, life: 3000 });
  }
}
