import { Component, OnInit, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface IColorFilterModel {
  colors: string[];
}

@Component({
  selector: 'mcit-filter-color-search-container',
  templateUrl: './filter-color-container.component.html',
  styleUrls: ['./filter-color-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitFilterColorContainerComponent),
      multi: true
    }
  ]
})
export class McitFilterColorContainerComponent implements OnInit, ControlValueAccessor {
  @Input() heading: string;
  @Input() colors: string[] = [];

  defaultColors: string[] = ['#50E3C2', '#88176A', '#057BB5', '#B54C05', '#4B4B4B', '#417505', '#FFCC00', '#E01091', '#00397F', '#C3D609', '#FFA203', '#FF0303'];

  private propagateChange: (_: any) => any;

  constructor() {}

  ngOnInit() {}

  changeColor(color: string): void {
    if (this.colors.length === 0 || !this.colors.find((c) => c === color)) {
      this.colors.push(color);
    } else {
      this.colors = this.colors.filter((c) => !(c === color));
    }
    this.propagateChange({
      colors: this.colors
    });
  }

  deleteColor() {
    if (this.colors.length === 0 || !this.colors.find((c) => c === 'nocolor')) {
      this.colors.push('nocolor');
    } else {
      this.colors = this.colors.filter((c) => !(c === 'nocolor'));
    }
    this.propagateChange({
      colors: this.colors
    });
  }

  writeValue(value: { colors: string[] }): void {
    if (value) {
      this.colors = value.colors;
    }
  }
  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }
  registerOnTouched(fn: any): void {}
  setDisabledState?(isDisabled: boolean): void {}

  checkIfInColors(color: string) {
    if (this.colors.length > 0 && this.colors.find((c) => c === color)) {
      return true;
    } else {
      return false;
    }
  }
}
