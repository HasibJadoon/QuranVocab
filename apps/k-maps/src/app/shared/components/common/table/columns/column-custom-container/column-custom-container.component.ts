import { Component, Input, OnChanges, QueryList, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { IColumnConfigExt } from '../../table.component';
import { McitColumnCustomDirective } from '../../directives/column-custom.directive';
import { isCustomColumnConfig } from '../../table-options';

@Component({
  selector: 'mcit-column-custom-container',
  templateUrl: './column-custom-container.component.html',
  styleUrls: ['./column-custom-container.component.scss']
})
export class McitColumnCustomContainerComponent<E> implements OnChanges {
  @ViewChild('notFoundElement', { static: true })
  notFoundElement: TemplateRef<any>;

  @Input()
  columnConfig: IColumnConfigExt<E>;
  @Input()
  item: E;
  @Input()
  index: number;
  @Input()
  elements: QueryList<McitColumnCustomDirective>;

  templateRef: TemplateRef<any> = null;

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    // Do not implement this in ngOnInit since it does not support *ngIf on the McitTable and late display
    if (changes.elements?.currentValue && !this.templateRef) {
      const value = isCustomColumnConfig(this.columnConfig) ? this.columnConfig.custom.value : null;
      if (!value) {
        this.templateRef = this.notFoundElement;
      } else {
        const element = this.elements?.find((t) => t.elementKey === value);
        if (element) {
          this.templateRef = element.templateRef;
        } else {
          this.templateRef = this.notFoundElement;
        }
      }
    }
  }
}
