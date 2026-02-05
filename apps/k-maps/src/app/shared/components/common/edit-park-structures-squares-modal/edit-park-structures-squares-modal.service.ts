import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McitDialog } from '../dialog/dialog.service';
import * as lodash from 'lodash';
import { McitEditParkStructureSquaresModalComponent } from './edit-park-structures-squares-modal.component';
import { ParkStructureSquare } from 'projects/compound/src/app/business/models/park-structure.model';

export interface IOptions {
  disableClose?: boolean;
  dialogClass?: string;
  titleKey?: string;
}

@Injectable()
export class McitEditParkStructureSquaresModalService {
  constructor(private dialog: McitDialog) {}

  editParkDescriptionSquares(squares: ParkStructureSquare[], options?: IOptions, displayRefs?: boolean, isDisabled?: boolean): Observable<ParkStructureSquare[]> {
    const ref = this.dialog.open<McitEditParkStructureSquaresModalComponent, any, ParkStructureSquare[]>(McitEditParkStructureSquaresModalComponent, {
      dialogClass: lodash.get(options, 'dialogClass', 'modal-xl'),
      disableClose: lodash.get(options, 'disableClose', true),
      data: {
        squares,
        options,
        displayRefs,
        isDisabled
      }
    });
    return ref.afterClosed();
  }
}
