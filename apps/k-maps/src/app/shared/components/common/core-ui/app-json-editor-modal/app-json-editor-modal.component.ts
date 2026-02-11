import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-json-editor-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app-json-editor-modal.component.html',
  styleUrls: ['./app-json-editor-modal.component.scss'],
})
export class AppJsonEditorModalComponent implements OnChanges {
  @Input() open = false;
  @Input() title = 'JSON Editor';
  @Input() value: unknown;
  @Input() placeholder = '';
  @Input() error = '';

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<string>();

  draft = '';
  formatError = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['open'] || changes['value']) {
      this.draft = this.stringify(this.value);
    }
  }

  onBackdropClick() {
    this.close.emit();
  }

  onSave() {
    this.formatError = '';
    const trimmed = this.draft.trim();
    if (!trimmed) {
      this.save.emit(this.draft);
      return;
    }
    try {
      const parsed = JSON.parse(trimmed);
      this.draft = JSON.stringify(parsed, null, 2);
      this.save.emit(this.draft);
    } catch (err: any) {
      this.formatError = err?.message ?? 'Invalid JSON.';
    }
  }

  onFormat() {
    this.formatError = '';
    const trimmed = this.draft.trim();
    if (!trimmed) return;
    try {
      const parsed = JSON.parse(trimmed);
      this.draft = JSON.stringify(parsed, null, 2);
    } catch (err: any) {
      this.formatError = err?.message ?? 'Invalid JSON.';
    }
  }

  onKeydown(event: KeyboardEvent) {
    const isMac = navigator.platform.toLowerCase().includes('mac');
    const modifier = isMac ? event.metaKey : event.ctrlKey;
    if (modifier && event.shiftKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      this.onFormat();
    }
  }

  get displayError() {
    return this.error || this.formatError;
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
