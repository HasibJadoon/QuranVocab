import { AfterContentInit, Component, forwardRef, Input, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CodemirrorComponent } from '@ctrl/ngx-codemirror';

@Component({
  selector: 'mcit-codemirror',
  templateUrl: './codemirror.component.html',
  styleUrls: ['./codemirror.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitCodemirrorComponent),
      multi: true
    }
  ]
})
export class McitCodemirrorComponent implements AfterContentInit, ControlValueAccessor {
  @ViewChild('codemirror', { static: true })
  private codemirror: CodemirrorComponent;

  @Input()
  options: {
    [key: string]: any;
  };
  @Input()
  smallHeight = 300;
  @Input()
  bigHeight = 600;

  big = false;

  ngAfterContentInit(): void {
    setTimeout(() => {
      this.codemirror.codeMirror.setSize('100%', this.big ? this.bigHeight : this.smallHeight);
    }, 0);
  }

  registerOnChange(fn: any): void {
    this.codemirror.registerOnChange(fn);
  }

  registerOnTouched(fn: any): void {
    this.codemirror.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.codemirror.setDisabledState(isDisabled);
  }

  writeValue(obj: any): void {
    this.codemirror.writeValue(obj);
  }

  doToggleSize(): void {
    this.big = !this.big;

    this.codemirror.codeMirror.setSize('100%', this.big ? this.bigHeight : this.smallHeight);
  }
}
