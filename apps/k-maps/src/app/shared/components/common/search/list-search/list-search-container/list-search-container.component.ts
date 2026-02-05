import { Component, EventEmitter, forwardRef, Input, OnInit, Output } from '@angular/core';
import { ISearchOptions } from '../../search-options';
import * as lodash from 'lodash';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

const OPERATEUR_OU = ' || ';
const SAUT_DE_LIGNE = '\n';

const MAX_LINES = 20;

@Component({
  selector: 'mcit-list-search-container',
  templateUrl: './list-search-container.component.html',
  styleUrls: ['./list-search-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitListSearchContainerComponent),
      multi: true
    }
  ]
})
export class McitListSearchContainerComponent implements OnInit, ControlValueAccessor {
  @Input()
  searchOptions: ISearchOptions;
  @Input()
  removeDuplicates: boolean;

  @Output()
  // eslint-disable-next-line @angular-eslint/no-output-native
  result = new EventEmitter<void>();

  searchBox: string;

  private propagateChange: (_: any) => any;

  constructor() {}

  ngOnInit(): void {}

  doClose(): void {
    this.result.emit();
    this.onChange();
  }

  doPaste(): void {
    navigator.clipboard.readText().then((clipboard) => {
      this.searchBox = lodash
        .uniq(
          lodash
            .trim(clipboard)
            .split(SAUT_DE_LIGNE)
            .map((t) => lodash.trim(t))
            .filter((str) => str)
        )
        .join('\n');
      this.onChange();

      this.result.emit();
    });
  }

  getNbMaxLines(): number {
    return this.searchOptions?.listSearch?.maxLines ?? MAX_LINES;
  }

  getNbLines(): number {
    return this.searchBox.split(SAUT_DE_LIGNE).length;
  }

  isMaxLineReached(): boolean {
    return this.searchBox ? this.getNbLines() >= this.getNbMaxLines() : false;
  }

  onChange(): void {
    if (this.propagateChange) {
      let processedValues = lodash
        .trim(this.searchBox)
        .split(SAUT_DE_LIGNE)
        .map((s) => lodash.trim(s))
        .filter((s) => s);

      if (this.removeDuplicates) {
        processedValues = lodash.uniq(processedValues);
      }

      this.propagateChange(processedValues.join(this.searchOptions?.listSearch?.delimiter ?? OPERATEUR_OU));
    }
    this.setLimitsToText();
  }

  private setLimitsToText(): void {
    let text_brut = this.searchBox ? this.searchBox : '';
    if (text_brut.length > 60000) {
      text_brut = text_brut.substring(0, 60000);
    }
    let lines = text_brut.split(SAUT_DE_LIGNE);
    if (lines.length > this.getNbMaxLines()) {
      lines = lines.slice(0, this.getNbMaxLines());
    }
    this.searchBox = lines.join(SAUT_DE_LIGNE);
  }

  writeValue(value: any): void {
    this.searchBox = value ? value.split(this.searchOptions?.listSearch?.delimiter ?? OPERATEUR_OU).join(SAUT_DE_LIGNE) : '';
    this.setLimitsToText();
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState(isDisabled: boolean): void {}
}
