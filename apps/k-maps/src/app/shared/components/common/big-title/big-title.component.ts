import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'mcit-big-title',
  templateUrl: './big-title.component.html',
  styleUrls: ['./big-title.component.scss']
})
export class McitBigTitleComponent implements OnInit {
  @Input()
  before: string;
  @Input()
  beforeImportant = false;
  @Input()
  after: string;
  @Input()
  afterImportant = true;

  constructor() {}

  ngOnInit(): void {}
}
