import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { I18nService } from './core/services/i18n.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  private i18nService = inject(I18nService);

  ngOnInit(): void {
    this.i18nService.init();
  }
}
