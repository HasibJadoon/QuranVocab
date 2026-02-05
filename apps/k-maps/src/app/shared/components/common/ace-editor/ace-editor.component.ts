import { Component, ElementRef, forwardRef, Input, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription, timer } from 'rxjs';
import { distinctUntilChanged, map, tap } from 'rxjs/operators';

declare let ace: any;

@Component({
  selector: 'mcit-ace-editor',
  template: '<div></div>',
  styles: [':host { display:block;width:100%; }'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitAceEditorComponent),
      multi: true
    }
  ]
})
export class McitAceEditorComponent implements ControlValueAccessor, OnInit, OnDestroy {
  private _options: any = {
    enableBasicAutocompletion: true
  };
  private _readOnly = false;
  private _theme = 'textmate';
  private _mode: any = 'ejs';
  private _autoUpdateContent = true;
  private _editor: any;
  private _durationBeforeCallback = 500;
  private _text = '';

  oldText: any;
  timeoutSaving: any;

  private fromSetValue = false;

  private propagateChange: (_: any) => any;

  private subscriptions: Subscription[] = [];

  constructor(private elementRef: ElementRef, private zone: NgZone) {
    const el = elementRef.nativeElement;
    this.zone.runOutsideAngular(() => {
      this._editor = ace['edit'](el);
    });
    this._editor.$blockScrolling = Infinity;
  }

  ngOnInit(): void {
    this.init();
    this.initEvents();

    this.subscriptions.push(
      timer(0, 100)
        .pipe(
          map(() => this.elementRef.nativeElement.clientHeight),
          distinctUntilChanged(),
          tap(() => this._editor.resize())
        )
        .subscribe()
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());

    this._editor.destroy();
  }

  private init(): void {
    this.setOptions(this._options || {});
    this.setTheme(this._theme);
    this.setMode(this._mode);
    this.setReadOnly(this._readOnly);
  }

  private initEvents(): void {
    this._editor.on('change', () => this.updateText());
  }

  private updateText(): void {
    if (this.fromSetValue) {
      return;
    }

    const newVal = this._editor.getValue();
    if (newVal === this.oldText) {
      return;
    }
    if (!this._durationBeforeCallback) {
      this._text = newVal;
      this.zone.run(() => {
        if (this.propagateChange) {
          this.propagateChange(newVal);
        }
      });
    } else {
      if (this.timeoutSaving) {
        clearTimeout(this.timeoutSaving);
      }

      this.timeoutSaving = setTimeout(() => {
        this._text = newVal;
        this.zone.run(() => {
          if (this.propagateChange) {
            this.propagateChange(newVal);
          }
        });
        this.timeoutSaving = null;
      }, this._durationBeforeCallback);
    }
    this.oldText = newVal;
  }

  @Input() set options(options: any) {
    this.setOptions(options);
  }

  private setOptions(options: any): void {
    this._options = options;
    this._editor.setOptions(options || {});
  }

  @Input() set readOnly(readOnly: any) {
    this.setReadOnly(readOnly);
  }

  private setReadOnly(readOnly: any): void {
    this._readOnly = readOnly;
    this._editor.setReadOnly(readOnly);
  }

  @Input() set theme(theme: any) {
    this.setTheme(theme);
  }

  private setTheme(theme: any): void {
    this._theme = theme;
    this._editor.setTheme(`ace/theme/${theme}`);
  }

  @Input() set mode(mode: any) {
    this.setMode(mode);
  }

  private setMode(mode: any): void {
    this._mode = mode;
    if (typeof this._mode === 'object') {
      this._editor.getSession().setMode(this._mode);
    } else {
      this._editor.getSession().setMode(`ace/mode/${this._mode}`);
    }
  }

  get value(): string {
    return this.text;
  }

  @Input()
  set value(value: string) {
    this.setText(value);
  }

  writeValue(value: any): void {
    this.setText(value);
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}

  get text(): string {
    return this._text;
  }

  @Input()
  set text(text: string) {
    this.setText(text);
  }

  private setText(text: any): void {
    if (text === null || text === undefined) {
      text = '';
    }
    if (this._text !== text && this._autoUpdateContent === true) {
      this._text = text;

      this.fromSetValue = true;
      this._editor.setValue(text);
      this.fromSetValue = false;

      if (this.propagateChange) {
        this.propagateChange(text);
      }
      this._editor.clearSelection();
    }
  }

  @Input() set autoUpdateContent(status: any) {
    this.setAutoUpdateContent(status);
  }

  private setAutoUpdateContent(status: any): void {
    this._autoUpdateContent = status;
  }

  @Input() set durationBeforeCallback(num: number) {
    this.setDurationBeforeCallback(num);
  }

  private setDurationBeforeCallback(num: number): void {
    this._durationBeforeCallback = num;
  }

  getEditor(): any {
    return this._editor;
  }
}
