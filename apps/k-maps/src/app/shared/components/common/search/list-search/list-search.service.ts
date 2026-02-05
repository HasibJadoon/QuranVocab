import { Injectable } from '@angular/core';
import { McitDropdown } from '../../dropdown/dropdown.service';
import { Observable } from 'rxjs';
import { McitListSearchDropdownComponent } from './list-search-dropdown/list-search-dropdown.component';
import { ISearchOptions } from '../search-options';

@Injectable()
export class McitListSearchService {
  constructor(private dropdown: McitDropdown) {}

  showList(listButton: any, searchOptions: ISearchOptions, initialText: string, removeDuplicates = true): Observable<{ text: string }> {
    return this.dropdown
      .open(McitListSearchDropdownComponent, listButton, {
        positions: [
          {
            originX: 'end',
            originY: 'top',
            overlayX: 'start',
            overlayY: 'top'
          }
        ],
        lockedPosition: false,
        data: {
          searchOptions,
          text: initialText,
          removeDuplicates
        }
      })
      .afterClosed();
  }
}
