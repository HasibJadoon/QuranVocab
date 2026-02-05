import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';

@Component({
  selector: 'mcit-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss']
})
export class ColorPickerComponent implements OnInit {
  @Input() heading: string;
  @Input() color: string = null;
  @Output() colorEvent: EventEmitter<string> = new EventEmitter<string>();

  defaultColors: string[] = ['#50E3C2', '#88176A', '#057BB5', '#B54C05', '#4B4B4B', '#417505', '#FFCC00', '#E01091', '#00397F', '#C3D609', '#FFA203', '#FF0303'];

  constructor() {}

  ngOnInit() {}

  changeColor(color: string): void {
    this.color = color;
    this.colorEvent.emit(this.color);
  }

  deleteColor() {
    this.color = null;
    this.colorEvent.emit(this.color);
  }
}
