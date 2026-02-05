import { Component, Input, OnInit } from '@angular/core';

const MAX_COUNT = 999;

@Component({
  selector: 'mcit-ace-editor-find-replace',
  templateUrl: './ace-editor-find-replace.component.html',
  styleUrls: ['./ace-editor-find-replace.component.scss']
})
export class McitAceEditorFindReplaceComponent implements OnInit {
  @Input()
  editor: any;

  search: string;
  caseSensitive = false;
  wholeWord = false;
  regExp = false;

  replace: string;

  beforeFind: number = null;
  allFind: number = null;
  noMatch: boolean = null;

  maxCount = MAX_COUNT;

  constructor() {}

  ngOnInit(): void {}

  doToggleCaseSensitive(): void {
    this.caseSensitive = !this.caseSensitive;

    this.doSearchChange();
  }

  doToggleWholeWord(): void {
    this.wholeWord = !this.wholeWord;

    this.doSearchChange();
  }

  doToggleRegExp(): void {
    this.regExp = !this.regExp;

    this.doSearchChange();
  }

  doSearchChange(): void {
    this.find(false, false);
  }

  private find(skipCurrent?: boolean, backwards?: boolean, preventScroll?: boolean): void {
    const range = this.editor.find(this.search, {
      skipCurrent,
      backwards,
      wrap: true,
      regExp: false,
      caseSensitive: this.caseSensitive,
      wholeWord: this.wholeWord,
      preventScroll
    });

    this.noMatch = !range && !!this.search;

    this.highlight();
    this.updateCounter();
  }

  private highlight(re?: any): void {
    this.editor.session.highlight(re || this.editor.$search.$options.re);
    this.editor.renderer.updateBackMarkers();
  }

  private updateCounter(): void {
    const editor = this.editor;
    const regex = editor.$search.$options.re;
    if (!regex) {
      this.beforeFind = null;
      this.allFind = null;
      return;
    }
    let all = 0;
    let before = 0;

    const value = editor.getValue();
    const offset = editor.session.doc.positionToIndex(editor.selection.anchor);

    let last = (regex.lastIndex = 0);
    let m;
    while ((m = regex.exec(value))) {
      all++;
      last = m.index;
      if (last <= offset) {
        before++;
      }
      if (all > this.maxCount) {
        break;
      }
      if (!m[0]) {
        regex.lastIndex = last += 1;
        if (last >= value.length) {
          break;
        }
      }
    }

    this.beforeFind = before;
    this.allFind = all;
  }

  doReplace(): void {
    if (!this.editor.getReadOnly()) {
      this.editor.replace(this.replace);

      this.doFindNext();
    }
  }

  doReplaceAll(): void {
    if (!this.editor.getReadOnly()) {
      this.editor.replaceAll(this.replace);

      this.find(false, false);
    }
  }

  doFindPrevious(): void {
    this.find(true, true);
  }

  doFindNext(): void {
    this.find(true, false);
  }

  doFindAll(): void {
    const range = this.editor.findAll(this.search, {
      regExp: false,
      caseSensitive: this.caseSensitive,
      wholeWord: this.wholeWord
    });
    this.noMatch = !range && !!this.search;

    this.highlight();
    this.editor.focus();
  }

  doSearchFocus(): void {
    if (this.search) {
      this.highlight();
    }
  }

  doReplaceFocus(): void {
    if (this.search) {
      this.highlight();
    }
  }

  doClearSearch(): void {
    this.search = '';
    this.find(false, false);
  }

  doClearReplace(): void {
    this.replace = '';
  }
}
