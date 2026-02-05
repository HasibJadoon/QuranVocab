import { Component, Input, OnInit } from '@angular/core';
import { IColumnConfigExt } from '../../table.component';

@Component({
  selector: 'mcit-column-date-container',
  templateUrl: './column-date-container.component.html',
  styleUrls: ['./column-date-container.component.scss']
})
export class McitColumnDateContainerComponent<E> implements OnInit {
  @Input()
  columnConfig: IColumnConfigExt<E>;
  @Input()
  item: E;
  @Input()
  index: number;

  constructor() {}

  ngOnInit(): void {}
}
