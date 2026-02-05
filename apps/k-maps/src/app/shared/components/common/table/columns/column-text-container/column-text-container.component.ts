import { Component, Input, OnInit } from '@angular/core';
import { IColumnConfigExt } from '../../table.component';

@Component({
  selector: 'mcit-column-text-container',
  templateUrl: './column-text-container.component.html',
  styleUrls: ['./column-text-container.component.scss']
})
export class McitColumnTextContainerComponent<E> implements OnInit {
  @Input()
  columnConfig: IColumnConfigExt<E>;
  @Input()
  item: E;
  @Input()
  index: number;

  constructor() {}

  ngOnInit(): void {}
}
