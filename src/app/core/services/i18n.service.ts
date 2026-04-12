import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private translate = inject(TranslateService);

  init(): void {
    this.translate.addLangs(['en', 'ta']);
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  setLanguage(lang: 'en' | 'ta'): void {
    this.translate.use(lang);
  }

  getCurrentLang(): string {
    return this.translate.currentLang ?? 'en';
  }

  instant(key: string): string {
    return this.translate.instant(key);
  }
}
