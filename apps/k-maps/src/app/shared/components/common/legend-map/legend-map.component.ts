import { Component, Input, OnInit } from '@angular/core';

export interface ILegend {
  class: string;
  color: string;
  description: string;
  lastGroup: boolean;
}

@Component({
  selector: 'mcit-legend-map',
  templateUrl: './legend-map.component.html',
  styleUrls: ['./legend-map.component.scss']
})
export class McitLegendMapComponent implements OnInit {
  @Input()
  legends: ILegend[];

  display = false;

  constructor() {}

  ngOnInit(): void {}
}
