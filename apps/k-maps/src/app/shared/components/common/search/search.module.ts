import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { McitSearchFieldComponent } from './search-field.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitCommonModule } from '../common/common.module';
import { McitFilterValuePipe } from './pipes/filter-value.pipe';
import { McitFiltersEmptyPipe } from './pipes/filters-empty';
import { McitFiltersContainerComponent } from './filters/filters-container/filters-container.component';
import { McitDialogModule } from '../dialog/dialog.module';
import { McitFormsModule } from '../forms/forms.module';
import { McitFiltersModalComponent } from './filters/filters-modal/filters-modal.component';
import { McitSimpleAccordionModule } from '../simple-accordion/simple-accordion.module';
import { McitFiltersNbPipe } from './pipes/filters-nb';
import { McitDropdownModule } from '../dropdown/dropdown.module';
import { McitFiltersDropdownComponent } from './filters/filters-dropdown/filters-dropdown.component';
import { McitFiltersEqualsPipe } from './pipes/filters-equals';
import { McitFiltersService } from './filters/filters.service';
import { McitSaveService } from './save/save.service';
import { McitSaveModalComponent } from './save/save-modal/save-modal.component';
import { McitSaveContainerComponent } from './save/save-container/save-container.component';
import { McitSaveDropdownComponent } from './save/save-dropdown/save-dropdown.component';
import { McitPaginationModule } from '../pagination/pagination.module';
import { McitEditTextModalModule } from '../edit-text-modal/edit-text-modal.module';
import { McitFilterRadioListContainerComponent } from './filters/filter-radio-list-container/filter-radio-list-container.component';
import { McitFilterCheckListContainerComponent } from './filters/filter-check-list-container/filter-check-list-container.component';
import { McitFilterTextContainerComponent } from './filters/filter-text-container/filter-text-container.component';
import { McitFilterNumberContainerComponent } from './filters/filter-number-container/filter-number-container.component';
import { McitFilterSelectListContainerComponent } from './filters/filter-select-list-container/filter-select-list-container.component';
import { McitMenuDropdownModule } from '../menu-dropdown/menu-dropdown.module';
import { McitFilterDateContainerComponent } from './filters/filter-date-container/filter-date-container.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { McitFilterAsyncSelectListContainerComponent } from './filters/filter-async-select-list-container/filter-async-select-list-container.component';
import { McitFilterAutocompleteContainerComponent } from './filters/filter-autocomplete-container/filter-autocomplete-container.component';
import { McitFilterCustomContainerComponent } from './filters/filter-custom-container/filter-custom-container.component';
import { PortalModule } from '@angular/cdk/portal';
import { McitSearchService } from './search.service';
import { McitSettingsModalComponent } from './save/settings-modal/settings-modal.component';
import { McitSearchSettingsService } from './search-settings.service';
import { McitFiltersHiddenPipe } from './pipes/filters-hidden';
import { McitFilterTagsContainerComponent } from './filters/filter-tags-container/filter-tags-container.component';
import { McitListSearchDropdownComponent } from './list-search/list-search-dropdown/list-search-dropdown.component';
import { McitListSearchService } from './list-search/list-search.service';
import { McitListSearchContainerComponent } from './list-search/list-search-container/list-search-container.component';
import { McitFilterReducedDateContainerComponent } from './filters/filter-reduced-date-container/filter-reduced-date-container.component';
import { McitFilterSimpleDateContainerComponent } from './filters/filter-simple-date-container/filter-simple-date-container.component';
import { McitFilterStringlistContainerComponent } from './filters/filter-stringlist-container/filter-stringlist-container.component';
import { McitFilterStringlistEditModalComponent } from './filters/filter-stringlist-container/filter-stringlist-edit-modal/filter-stringlist-edit-modal.component';
import { McitFilterTpzcContainerService } from './filters/filter-tpzc-container/filter-tpzc-container.service';
import { McitFilterPositionContainerService } from './filters/filter-position-container/filter-position-container.service';
import { McitFilterTpzcContainerComponent } from './filters/filter-tpzc-container/filter-tpzc-container.component';
import { McitFilterPositionContainerComponent } from './filters/filter-position-container/filter-position-container.component';
import { McitFilterColorContainerComponent } from './filters/filter-color-container/filter-color-container.component';
import { McitFilterColorContainerService } from './filters/filter-color-container/filter-color-container.service';
import { McitFilterMultiAutocompleteContainerComponent } from './filters/filter-multi-autocomplete-container/filter-multi-autocomplete-container.component';
import { McitTooltipModule } from '../tooltip/tooltip.module';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { McitTagSecondaryCountPipe } from './pipes/tag-secondary-count.pipe';
import { McitTagSecondaryEditablePipe } from './pipes/tag-secondary-editable.pipe';
import { McitFilterSimpleNumberContainerComponent } from './filters/filter-simple-number-container/filter-simple-number-container.component';
import { McitFiltersOnlyPipe } from './pipes/filters-only';
import { McitFilterAsyncCheckListContainerComponent } from './filters/filter-async-check-list-container/filter-async-check-list-container.component';
import { ReplaceFilterValuePipe } from './pipes/replace-filter-value.pipe';
import { FiltersDisablePipe } from './pipes/filters-disable.pipe';
import { UiSwitchModule } from 'ngx-ui-switch';
import { TagInputModule } from '@lib-shared/ngx-chips';
import { McitFilterGeoWithinContainerComponent } from '@lib-shared/common/search/filters/filter-geo-within-container/filter-geo-within-container.component';
import { McitFilterGeoWithinContainerService } from '@lib-shared/common/search/filters/filter-geo-within-container/filter-geo-within-container.service';
import { MatGridListModule } from '@angular/material/grid-list';
import { McitFilterGeoWithinModalComponent } from '@lib-shared/common/search/filters/filter-geo-within-container/filter-geo-within-modal/filter-geo-within-modal.component';
import { McitMapModule } from '@lib-shared/common/map/map.module';
import { McitFiltersCustomNamePipe } from './pipes/filters-custom-name';
import { McitFilterReferentialContainerService } from './filters/filter-referential-container/filter-referential-container.service';
import { McitFilterReferentialContainerComponent } from './filters/filter-referential-container/filter-referential-container.component';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    McitFormsModule,
    McitCommonModule,
    McitDialogModule,
    McitSimpleAccordionModule,
    McitDropdownModule,
    McitPaginationModule,
    McitEditTextModalModule,
    McitMenuDropdownModule,
    MatDatepickerModule,
    PortalModule,
    TagInputModule,
    McitTooltipModule,
    TypeaheadModule,
    UiSwitchModule,
    MatGridListModule,
    McitMapModule
  ],
  declarations: [
    McitSearchFieldComponent,
    McitFilterValuePipe,
    McitFiltersEmptyPipe,
    McitFiltersContainerComponent,
    McitFiltersModalComponent,
    McitFiltersNbPipe,
    McitFiltersDropdownComponent,
    McitFiltersEqualsPipe,
    McitSaveModalComponent,
    McitSaveContainerComponent,
    McitSaveDropdownComponent,
    McitListSearchContainerComponent,
    McitListSearchDropdownComponent,
    McitFilterRadioListContainerComponent,
    McitFilterCheckListContainerComponent,
    McitFilterAsyncCheckListContainerComponent,
    McitFilterTextContainerComponent,
    McitFilterNumberContainerComponent,
    McitFilterSimpleNumberContainerComponent,
    McitFilterSelectListContainerComponent,
    McitFilterDateContainerComponent,
    McitFilterReducedDateContainerComponent,
    McitFilterSimpleDateContainerComponent,
    McitFilterAsyncSelectListContainerComponent,
    McitFilterAutocompleteContainerComponent,
    McitFilterCustomContainerComponent,
    McitSettingsModalComponent,
    McitFiltersHiddenPipe,
    McitFilterTagsContainerComponent,
    McitFilterStringlistContainerComponent,
    McitFilterStringlistEditModalComponent,
    McitFilterTpzcContainerComponent,
    McitFilterPositionContainerComponent,
    McitFilterColorContainerComponent,
    McitFilterMultiAutocompleteContainerComponent,
    McitTagSecondaryCountPipe,
    McitTagSecondaryEditablePipe,
    McitFiltersOnlyPipe,
    McitFilterGeoWithinContainerComponent,
    McitFilterGeoWithinModalComponent,
    ReplaceFilterValuePipe,
    FiltersDisablePipe,
    McitFiltersCustomNamePipe,
    McitFilterReferentialContainerComponent
  ],
  exports: [
    McitSearchFieldComponent,
    McitFilterAutocompleteContainerComponent,
    McitFiltersContainerComponent,
    McitFilterValuePipe,
    McitFiltersEmptyPipe,
    McitFiltersNbPipe,
    McitFiltersEqualsPipe,
    McitFiltersHiddenPipe,
    McitTagSecondaryCountPipe,
    McitTagSecondaryEditablePipe,
    McitFiltersOnlyPipe,
    ReplaceFilterValuePipe,
    FiltersDisablePipe,
    McitFiltersCustomNamePipe
  ],
  providers: [
    McitFiltersService,
    McitSaveService,
    McitListSearchService,
    McitSearchService,
    McitSearchSettingsService,
    McitFilterTpzcContainerService,
    McitFilterPositionContainerService,
    McitFilterColorContainerService,
    McitFilterGeoWithinContainerService,
    McitFilterReferentialContainerService
  ]
})
export class McitSearchFieldModule {}
