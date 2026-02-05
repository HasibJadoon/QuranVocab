import { Injectable } from '@angular/core';
import { McitDropdown } from '../../dropdown/dropdown.service';
import { McitDialog } from '../../dialog/dialog.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { McitSaveModalComponent } from './save-modal/save-modal.component';
import { McitSaveDropdownComponent } from './save-dropdown/save-dropdown.component';
import { ISaveOptions, ISearchOptions } from '../search-options';
import { ISettingsModel } from '../search-model';
import * as lodash from 'lodash';

@Injectable()
export class McitSaveService {
  constructor(private dropdown: McitDropdown, private dialog: McitDialog, private breakpointObserver: BreakpointObserver) {}

  showSave(saveButton: any, searchOptions: ISearchOptions, settings: ISettingsModel): Observable<any> {
    const s = lodash.get(settings, 'saveDisplayMode', 'auto');
    const modal = s === 'auto' ? this.breakpointObserver.isMatched('(max-width: 767px)') : s === 'modal';

    if (modal) {
      return this.dialog
        .open(McitSaveModalComponent, {
          dialogClass: 'modal-full',
          data: {
            searchOptions
          },
          disableDrag: true
        })
        .afterClosed();
    } else {
      return this.dropdown
        .open(McitSaveDropdownComponent, saveButton, {
          positions: [
            {
              originX: 'start',
              originY: 'bottom',
              overlayX: 'start',
              overlayY: 'top'
            }
          ],
          lockedPosition: false,
          data: {
            searchOptions
          }
        })
        .afterClosed();
    }
  }
}
