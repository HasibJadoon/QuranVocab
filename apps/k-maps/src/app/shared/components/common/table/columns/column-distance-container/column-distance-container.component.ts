import { Component, Input, OnInit } from '@angular/core';
import { IColumnConfigExt } from '../../table.component';

@Component({
  selector: 'mcit-column-distance-container',
  templateUrl: './column-distance-container.component.html',
  styleUrls: ['./column-distance-container.component.scss']
})
export class McitColumnDistanceContainerComponent<E> implements OnInit {
  @Input()
  columnConfig: IColumnConfigExt<E>;
  @Input()
  item: E;
  @Input()
  index: number;

  constructor() {}

  ngOnInit(): void {}
}
