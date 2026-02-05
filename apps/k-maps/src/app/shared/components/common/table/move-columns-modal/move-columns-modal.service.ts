import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../../dialog/dialog.service';
import { McitMoveColumnsModalComponent } from './move-columns-modal.component';
import { IColumnConfigExt } from '../table.component';

@Injectable()
export class McitMoveColumnsModalService {
  constructor(private dialog: McitDialog) {}

  showMoveColumns<E>(columns: IColumnConfigExt<E>[], hiddenable: boolean): Observable<IColumnConfigExt<E>[]> {
    const ref = this.dialog.open<McitMoveColumnsModalComponent<E>, any, IColumnConfigExt<E>[]>(McitMoveColumnsModalComponent, {
      dialogClass: 'modal-md',
      data: {
        columns,
        hiddenable
      }
    });
    return ref.afterClosed();
  }
}
