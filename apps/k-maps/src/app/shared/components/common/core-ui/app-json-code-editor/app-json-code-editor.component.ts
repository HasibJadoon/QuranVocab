import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';

@Component({
  selector: 'app-json-code-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MonacoEditorModule],
  templateUrl: './app-json-code-editor.component.html',
  styleUrls: ['./app-json-code-editor.component.scss'],
})
export class AppJsonCodeEditorComponent implements OnChanges {
  @Input() value = '';
  @Input() height = '360px';
  @Input() readonly = false;
  @Input() language = 'json';
  @Input() theme: 'vs' | 'vs-dark' | 'hc-black' = 'vs-dark';
  @Input() enableFolding = true;
  @Input() showFoldingControls: 'always' | 'mouseover' = 'always';
  @Input() options: Record<string, unknown> = {};

  @Output() valueChange = new EventEmitter<string>();

  model = '';
  editorReady = false;

  get editorOptions(): Record<string, unknown> {
    return {
      theme: this.theme,
      language: this.language,
      automaticLayout: true,
      minimap: { enabled: false },
      tabSize: 2,
      wordWrap: 'on',
      scrollBeyondLastLine: false,
      formatOnPaste: true,
      formatOnType: true,
      folding: this.enableFolding,
      showFoldingControls: this.showFoldingControls,
      foldingStrategy: 'auto',
      glyphMargin: true,
      lineNumbers: 'on',
      renderLineHighlight: 'all',
      guides: { indentation: true },
      readOnly: this.readonly,
      ...this.options,
    };
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['value']) {
      this.model = this.value ?? '';
    }
  }

  onEditorInit() {
    this.editorReady = true;
  }

  onModelChange(next: string) {
    this.model = next;
    this.valueChange.emit(next);
  }
}
