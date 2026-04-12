import { ValidatorFn } from '@angular/forms';

export interface FormFieldOption {
  label: string;
  value: any;
}

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'textarea'
       | 'dropdown' | 'multiSelect' | 'calendar' | 'checkbox'
       | 'toggle' | 'radio';
  required?: boolean;
  validators?: ValidatorFn[];
  placeholder?: string;
  options?: FormFieldOption[];
  defaultValue?: any;
  disabled?: boolean;
  colSpan?: 1 | 2;
  order?: number;
  showIf?: (formValue: any) => boolean;
  hint?: string;
  maxLength?: number;
  min?: number;
  max?: number;
  rows?: number;
}

export interface DynamicFormConfig {
  fields: FormField[];
  columns?: 1 | 2;
  submitLabel?: string;
  cancelLabel?: string;
}
