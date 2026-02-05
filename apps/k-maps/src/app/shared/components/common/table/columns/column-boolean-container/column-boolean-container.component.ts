import { Component, Input, OnInit } from '@angular/core';
import { IColumnConfigExt } from '../../table.component';

@Component({
  selector: 'mcit-column-boolean-container',
  templateUrl: './column-boolean-container.component.html',
  styleUrls: ['./column-boolean-container.component.scss']
})
export class McitColumnBooleanContainerComponent<E> implements OnInit {
  @Input()
  columnConfig: IColumnConfigExt<E>;
  @Input()
  item: E;
  @Input()
  index: number;

  constructor() {}

  ngOnInit(): void {}
}
