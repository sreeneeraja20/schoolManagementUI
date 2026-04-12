import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { HasUnsavedChanges } from '../interfaces/has-unsaved-changes.interface';

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (component.hasUnsavedChanges && component.hasUnsavedChanges()) {
    const translate = inject(TranslateService);
    const message = translate.instant('BREADCRUMB.UNSAVED_CHANGES');
    return window.confirm(message);
  }
  return true;
};
