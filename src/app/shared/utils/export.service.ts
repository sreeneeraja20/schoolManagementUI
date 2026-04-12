import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ExportService {

  downloadCsv(rows: any[], headers: { field: string; label: string }[], filename: string): void {
    const headerRow = headers.map(h => this.escapeCsv(h.label)).join(',');
    const dataRows = rows.map(row =>
      headers.map(h => {
        const val = row[h.field] ?? '';
        const str = Array.isArray(val) ? val.join('; ') : String(val);
        return this.escapeCsv(str);
      }).join(',')
    );
    const csv = [headerRow, ...dataRows].join('\n');
    this.triggerDownload('\ufeff' + csv, filename + '.csv', 'text/csv;charset=utf-8;');
  }

  printTable(title: string, headers: string[], rows: string[][]): void {
    const theadHtml = headers.map(h => `<th>${this.escapeHtml(h)}</th>`).join('');
    const tbodyHtml = rows.map(row =>
      `<tr>${row.map(cell => `<td>${this.escapeHtml(cell ?? '')}</td>`).join('')}</tr>`
    ).join('');
    const html = `<!DOCTYPE html>
<html><head>
  <meta charset="UTF-8">
  <title>${this.escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
    h2 { font-size: 14px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; }
    th { background: #f0f0f0; font-weight: bold; }
    tr:nth-child(even) { background: #fafafa; }
    @media print { body { margin: 0; } }
  </style>
</head><body>
  <h2>${this.escapeHtml(title)}</h2>
  <table>
    <thead><tr>${theadHtml}</tr></thead>
    <tbody>${tbodyHtml}</tbody>
  </table>
</body></html>`;
    const pw = window.open('', '_blank', 'width=900,height=700');
    if (pw) {
      pw.document.write(html);
      pw.document.close();
      pw.focus();
      setTimeout(() => { pw.print(); pw.close(); }, 500);
    }
  }

  private escapeCsv(val: string): string {
    const s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private triggerDownload(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
