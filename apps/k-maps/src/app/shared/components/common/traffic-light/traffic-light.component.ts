import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'mcit-traffic-light',
  templateUrl: './traffic-light.component.html',
  styleUrls: ['./traffic-light.component.scss']
})
export class McitTrafficLightComponent implements OnInit {
  @Input()
  mode: 'ONE' | 'TWO' | 'THREE' = 'THREE';
  @Input()
  size: 'normal' | 'sm' | 'lg' = 'normal';
  @Input()
  orientation: 'horizontal' | 'vertical' = 'vertical';
  @Input()
  red = false;
  @Input()
  green = false;
  @Input()
  yellow = false;

  constructor() {}

  ngOnInit(): void {}
}
