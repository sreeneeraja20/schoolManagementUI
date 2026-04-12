import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

export interface CsvColumnConfig {
  field: string;
  label: string;
  required: boolean;
}

export interface CsvImportConfig {
  entityType: 'student' | 'staff';
  columns: CsvColumnConfig[];
  exampleRow: string;
  templateFilename: string;
}

@Component({
  selector: 'app-csv-import-dialog',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonModule, DialogModule],
  templateUrl: './csv-import-dialog.component.html',
  styleUrl: './csv-import-dialog.component.scss'
})
export class CsvImportDialogComponent {
  @Input() visible = false;
  @Input() config!: CsvImportConfig;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() importRows = new EventEmitter<Record<string, string>[]>();

  private translate = inject(TranslateService);

  previewRows: Record<string, string>[] = [];
  allRows: Record<string, string>[] = [];
  errors: string[] = [];
  fileName = '';
  isParsed = false;

  get dialogTitle(): string {
    if (!this.config) return '';
    return this.config.entityType === 'student'
      ? this.translate.instant('IMPORT.TITLE_STUDENTS')
      : this.translate.instant('IMPORT.TITLE_STAFF');
  }

  onDialogHide(): void {
    this.reset();
    this.visibleChange.emit(false);
  }

  reset(): void {
    this.previewRows = [];
    this.allRows = [];
    this.errors = [];
    this.fileName = '';
    this.isParsed = false;
  }

  close(): void {
    this.visible = false;
    this.onDialogHide();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.fileName = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.parseCsv((e.target?.result as string) ?? '');
    };
    reader.readAsText(file);
    input.value = '';
  }

  parseCsv(text: string): void {
    this.errors = [];
    this.allRows = [];
    this.previewRows = [];

    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
    if (lines.length < 2) {
      this.errors.push(this.translate.instant('IMPORT.ERROR_EMPTY'));
      this.isParsed = true;
      return;
    }

    const fileHeaders = this.parseLine(lines[0]).map(h => h.trim());
    const colIndexMap: { colIdx: number; field: string }[] = [];
    for (const col of this.config.columns) {
      const idx = fileHeaders.findIndex(h => h.toLowerCase() === col.field.toLowerCase());
      if (idx === -1 && col.required) {
        this.errors.push(`${this.translate.instant('IMPORT.MISSING_COLUMN')}: "${col.field}"`);
      } else if (idx !== -1) {
        colIndexMap.push({ colIdx: idx, field: col.field });
      }
    }

    if (this.errors.length > 0) {
      this.isParsed = true;
      return;
    }

    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseLine(lines[i]);
      const row: Record<string, string> = {};
      for (const m of colIndexMap) {
        row[m.field] = (values[m.colIdx] ?? '').trim();
      }
      const rowErrors: string[] = [];
      for (const col of this.config.columns.filter(c => c.required)) {
        if (!row[col.field]) {
          rowErrors.push(`${this.translate.instant('IMPORT.ROW')} ${i}: ${this.translate.instant('IMPORT.FIELD_REQUIRED')} "${col.label}"`);
        }
      }
      if (rowErrors.length > 0) {
        this.errors.push(...rowErrors);
      } else {
        rows.push(row);
      }
    }
    this.allRows = rows;
    this.previewRows = rows.slice(0, 5);
    this.isParsed = true;
  }

  private parseLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }

  downloadTemplate(): void {
    const header = this.config.columns.map(c => c.field).join(',');
    const csv = header + '\n' + this.config.exampleRow;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.config.templateFilename + '_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  doImport(): void {
    if (this.allRows.length > 0) {
      this.importRows.emit(this.allRows);
      this.close();
    }
  }
}
