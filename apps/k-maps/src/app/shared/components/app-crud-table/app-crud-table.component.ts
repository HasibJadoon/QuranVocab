import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CrudTableColumn {
  key: string;
  label?: string;
  type?: 'text' | 'badge';
  className?: string;
  value?: (row: any) => unknown;
  cellClass?: (row: any) => string;
  badgeClass?: (row: any) => string;
}

@Component({
  selector: 'app-crud-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-crud-table.component.html',
  styleUrls: ['./app-crud-table.component.scss'],
})
export class AppCrudTableComponent {
  @Input() columns: Array<string | CrudTableColumn> = [];
  @Input() rows: any[] = [];
  @Input() emptyMessage = 'No results.';
  @Input() showActions = true;
  @Input() showViewAction = true;
  @Input() showEditAction = true;
  @Input() actionsLabel = 'Actions';

  @Output() view = new EventEmitter<any>();
  @Output() edit = new EventEmitter<any>();

  get normalizedColumns(): CrudTableColumn[] {
    return this.columns.map((column) => {
      if (typeof column === 'string') {
        return {
          key: column,
          label: this.humanize(column),
          type: 'text',
        };
      }
      return {
        ...column,
        label: column.label || this.humanize(column.key),
        type: column.type ?? 'text',
      };
    });
  }

  get colSpan() {
    return this.normalizedColumns.length + (this.showActions ? 1 : 0);
  }

  trackByRow = (index: number, row: any) => row?.['id'] ?? index;

  resolveCellValue(column: CrudTableColumn, row: any) {
    const value = column.value ? column.value(row) : row[column.key];
    return value ?? '';
  }

  resolveCellClass(column: CrudTableColumn, row: any) {
    const extraClass = column.cellClass ? column.cellClass(row) : '';
    return [column.className, extraClass].filter(Boolean).join(' ');
  }

  resolveBadgeClass(column: CrudTableColumn, row: any) {
    return column.badgeClass ? column.badgeClass(row) : '';
  }

  onView(row: any) {
    this.view.emit(row);
  }

  onEdit(row: any) {
    this.edit.emit(row);
  }

  private humanize(key: string) {
    return key
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  }
}
