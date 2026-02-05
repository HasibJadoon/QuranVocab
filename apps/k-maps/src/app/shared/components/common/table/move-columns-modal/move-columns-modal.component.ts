import { Component, Inject, OnInit } from '@angular/core';
import { McitDialogRef } from '../../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../../dialog/dialog.service';
import { IColumnConfigExt } from '../table.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import * as lodash from 'lodash';

@Component({
  selector: 'mcit-move-columns-modal',
  templateUrl: './move-columns-modal.component.html',
  styleUrls: ['./move-columns-modal.component.scss']
})
export class McitMoveColumnsModalComponent<E> implements OnInit {
  columns: IColumnConfigExt<E>[];
  hiddenable: boolean;

  private originalColumns: IColumnConfigExt<E>[];

  constructor(private dialogRef: McitDialogRef<McitMoveColumnsModalComponent<E>, IColumnConfigExt<E>[]>, @Inject(MCIT_DIALOG_DATA) data: any) {
    this.hiddenable = data.hiddenable;
    this.columns = lodash.sortBy(data.columns, (a) => a.position);
    this.originalColumns = data.columns;
  }

  ngOnInit(): void {}

  trackByFn(index: number, column: IColumnConfigExt<E>): any {
    return column.key;
  }

  doAccept(): void {
    this.dialogRef.close(this.originalColumns);
  }

  doClose(): void {
    this.dialogRef.close();
  }

  doToggleVisibleColumn(column: IColumnConfigExt<E>): void {
    column.visible = !column.visible;
  }

  doReset(): void {
    this.originalColumns.forEach((c, i) => {
      c.visible = c.visibility == null || c.visibility === 'visible';
      c.position = i;
      c.width = null;
    });
    this.columns = lodash.sortBy(this.originalColumns, (a) => a.position);
  }

  doDrop(event: CdkDragDrop<any>): void {
    moveItemInArray(this.columns, event.previousIndex, event.currentIndex);

    this.columns.forEach((c, i) => (c.position = i));
  }
}
