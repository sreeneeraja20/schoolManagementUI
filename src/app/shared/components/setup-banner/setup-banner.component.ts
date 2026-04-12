import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-setup-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './setup-banner.component.html',
  styleUrl: './setup-banner.component.scss'
})
export class SetupBannerComponent {
  @Input() message = 'Setup is required before using this module.';
}
