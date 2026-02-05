import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-view-json-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-view-json-modal.component.html',
  styleUrls: ['./app-view-json-modal.component.scss'],
})
export class AppViewJsonModalComponent implements OnChanges {
  @Input() open = false;
  @Input() title = 'JSON Viewer';
  @Input() value: unknown;

  @Output() close = new EventEmitter<void>();

  pretty = '';

  ngOnChanges(_changes: SimpleChanges) {
    this.pretty = this.stringify(this.value);
  }

  onBackdropClick() {
    this.close.emit();
  }

  private stringify(value: unknown) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return '';
      try {
        return JSON.stringify(JSON.parse(trimmed), null, 2);
      } catch {
        return value;
      }
    }
    try {
      return JSON.stringify(value ?? null, null, 2);
    } catch {
      return String(value ?? '');
    }
  }
}
