import { Component, Input, OnInit } from '@angular/core';
import { IColumnConfigExt } from '../../table.component';

@Component({
  selector: 'mcit-column-meaning-container',
  templateUrl: './column-meaning-container.component.html',
  styleUrls: ['./column-meaning-container.component.scss']
})
export class McitColumnMeaningContainerComponent<E> implements OnInit {
  @Input()
  columnConfig: IColumnConfigExt<E>;
  @Input()
  item: E;
  @Input()
  index: number;

  constructor() {}

  ngOnInit(): void {}
}
