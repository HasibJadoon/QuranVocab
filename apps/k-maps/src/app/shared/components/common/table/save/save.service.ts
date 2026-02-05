import { Injectable } from '@angular/core';
import { McitDropdown } from '../../dropdown/dropdown.service';
import { Observable } from 'rxjs';
import { McitSaveDropdownComponent } from './save-dropdown/save-dropdown.component';
import { ITableOptions } from '../table-options';

@Injectable()
export class McitSaveService {
  constructor(private dropdown: McitDropdown) {}

  showSave<E>(button: HTMLElement, tableOptions: ITableOptions<E>): Observable<any> {
    return this.dropdown
      .open(McitSaveDropdownComponent, button, {
        positions: [
          {
            originX: 'end',
            originY: 'bottom',
            overlayX: 'end',
            overlayY: 'top'
          }
        ],
        lockedPosition: false,
        data: {
          tableOptions
        }
      })
      .afterClosed();
  }
}
