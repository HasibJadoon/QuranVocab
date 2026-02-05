import { Injectable } from '@angular/core';
import { McitDropdown } from '../../dropdown/dropdown.service';
import { McitDialog } from '../../dialog/dialog.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { McitFiltersModalComponent } from './filters-modal/filters-modal.component';
import { McitFiltersDropdownComponent } from './filters-dropdown/filters-dropdown.component';
import { Observable } from 'rxjs';
import { IFiltersModel, ISettingsModel } from '../search-model';
import { ISearchOptions } from '../search-options';
import * as lodash from 'lodash';

@Injectable()
export class McitFiltersService {
  constructor(private dropdown: McitDropdown, private dialog: McitDialog, private breakpointObserver: BreakpointObserver) {}

  showFilters(filtersButton: any, searchOptions: ISearchOptions, searchBox: string, filters: IFiltersModel, settings: ISettingsModel): Observable<any> {
    const s = lodash.get(settings, 'filtersDisplayMode', 'auto');
    const modal = s === 'auto' ? this.breakpointObserver.isMatched('(max-width: 767px)') : s === 'modal';
    if (modal) {
      return this.dialog
        .open(McitFiltersModalComponent, {
          dialogClass: 'modal-full',
          data: {
            id: lodash.get(searchOptions.save, 'id'),
            filtersConfig: searchOptions.filters.filtersConfig,
            searchBox,
            filters
          },
          disableDrag: true
        })
        .afterClosed();
    } else {
      return this.dropdown
        .open(McitFiltersDropdownComponent, filtersButton, {
          positions: [
            {
              originX: 'end',
              originY: 'bottom',
              overlayX: 'end',
              overlayY: 'top'
            }
          ],
          flexibleDimensions: true,
          lockedPosition: false,
          data: {
            id: lodash.get(searchOptions.save, 'id'),
            filtersConfig: searchOptions.filters.filtersConfig,
            searchBox,
            filters,
            minWidth: searchOptions.filters.dropdownMinWidth
          }
        })
        .afterClosed();
    }
  }

  showFilter(filterButton: any, searchOptions: ISearchOptions, filters: IFiltersModel, key: string): Observable<any> {
    return this.dropdown
      .open(McitFiltersDropdownComponent, filterButton, {
        positions: [
          {
            originX: 'start',
            originY: 'bottom',
            overlayX: 'start',
            overlayY: 'top'
          },
          {
            originX: 'end',
            originY: 'bottom',
            overlayX: 'end',
            overlayY: 'top'
          }
        ],
        flexibleDimensions: true,
        lockedPosition: false,
        data: {
          id: lodash.get(searchOptions.save, 'id'),
          filtersConfig: searchOptions.filters.filtersConfig,
          filters,
          key
        }
      })
      .afterClosed();
  }
}
