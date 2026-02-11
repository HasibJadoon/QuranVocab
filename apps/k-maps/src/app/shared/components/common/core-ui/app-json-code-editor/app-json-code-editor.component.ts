import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';

import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/brace-fold';

@Component({
  selector: 'app-json-code-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, CodemirrorModule],
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

  get editorOptions(): Record<string, unknown> {
    const resolvedTheme = this.theme === 'vs' ? 'default' : 'material-darker';
    const resolvedMode = this.language === 'json' ? { name: 'javascript', json: true } : this.language;
    const gutters = this.enableFolding ? ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'] : ['CodeMirror-linenumbers'];

    return {
      lineNumbers: true,
      mode: resolvedMode,
      theme: resolvedTheme,
      readOnly: this.readonly,
      lineWrapping: true,
      foldGutter: this.enableFolding,
      gutters,
      tabSize: 2,
      indentUnit: 2,
      ...this.options,
    };
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['value']) {
      this.model = this.value ?? '';
    }
  }

  onModelChange(next: string) {
    this.model = next;
    this.valueChange.emit(next);
  }
}
