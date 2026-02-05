import { Injectable } from '@angular/core';
import { IMultipleFilters, IMultipleFiltersModalOptions, IReferenceTypes, McitMultipleFiltersModalComponent } from './multiple-filters-modal.component';
import { McitDialog } from '../dialog/dialog.service';
import { Observable } from 'rxjs';

@Injectable()
export class McitMultipleFiltersModalService {
  constructor(private dialog: McitDialog) {}

  showMultipleFilters(referenceTypes: IReferenceTypes, filters: IMultipleFilters, options?: IMultipleFiltersModalOptions): Observable<IMultipleFilters> {
    return this.dialog
      .open(McitMultipleFiltersModalComponent, {
        dialogClass: 'modal-xl',
        data: {
          referenceTypes,
          filters,
          options
        }
      })
      .afterClosed();
  }
}
