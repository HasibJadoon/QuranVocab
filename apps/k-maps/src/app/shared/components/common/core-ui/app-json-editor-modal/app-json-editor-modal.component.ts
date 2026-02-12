import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CodemirrorComponent, CodemirrorModule } from '@ctrl/ngx-codemirror';

import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/display/placeholder';

@Component({
  selector: 'app-json-editor-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, CodemirrorModule],
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

  @ViewChild('jsonEditor')
  private jsonEditor?: CodemirrorComponent;

  draft = '';
  formatError = '';
  private focusTimeout: number | null = null;

  get editorOptions(): Record<string, unknown> {
    return {
      lineNumbers: true,
      mode: { name: 'javascript', json: true },
      theme: 'material-darker',
      readOnly: false,
      lineWrapping: true,
      tabSize: 2,
      indentUnit: 2,
      autofocus: true,
      placeholder: this.placeholder,
    };
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['open'] || changes['value']) {
      this.draft = this.stringify(this.value);
    }
    if (changes['open']?.currentValue) {
      this.queueFocus();
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

  private queueFocus() {
    if (this.focusTimeout != null) {
      clearTimeout(this.focusTimeout);
    }
    this.focusTimeout = window.setTimeout(() => {
      this.focusTimeout = null;
      const editor = this.jsonEditor?.codeMirror;
      if (editor) {
        editor.focus();
        editor.refresh?.();
      }
    }, 0);
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
