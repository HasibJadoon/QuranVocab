import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'mcit-simple-progress',
  templateUrl: './simple-progress.component.html',
  styleUrls: ['./simple-progress.component.scss']
})
export class McitSimpleProgressComponent implements OnInit {
  @Input()
  max: number;
  @Input()
  value: number;

  constructor() {}

  ngOnInit(): void {}
}
