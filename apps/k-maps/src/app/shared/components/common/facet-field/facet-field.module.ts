import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitFacetFieldComponent } from './facet-field.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { McitFacetService } from './facet.service';
import { McitSimpleAccordionModule } from '../simple-accordion/simple-accordion.module';
import { McitCommonModule } from '../common/common.module';
import { NgxLoadingModule } from 'ngx-loading';
import { McitCategoryStandardContainerComponent } from './categories/category-standard-container/category-standard-container.component';
import { McitDataFilterPipe } from './pipes/data-filter.pipe';
import { McitCategoriesContainerComponent } from './categories/categories-container/categories-container.component';
import { McitTooltipModule } from '../tooltip/tooltip.module';
import { McitCategoriesModalComponent } from './categories/categories-modal/categories-modal.component';
import { McitDialogModule } from '../dialog/dialog.module';
import { McitCategoriesService } from './categories/categories.service';
import { McitCategoriesCountNotEmptyPipe } from './pipes/categories-count-not-empty';
import { McitCategoriesEmptyPipe } from './pipes/categories-empty';
import { McitSortByDataPipe } from './pipes/sort-by-data.pipe';
import { McitLineAsyncPipe } from './pipes/line-async.pipe';
import { McitLineActionDisabledPipe } from './pipes/line-action-disabled.pipe';
import { McitLineActionHiddenPipe } from './pipes/line-action-hidden.pipe';
import { McitLineActionParamsPipe } from './pipes/line-action-params.pipe';
import { McitLineActionStringOrFnPipe } from './pipes/line-action-string-or-fn.pipe';
import { RouterModule } from '@angular/router';
import { McitLineTextPipe } from './pipes/line-text.pipe';
import { McitCategoryBucketContainerComponent } from './categories/category-bucket-container/category-bucket-container.component';
import { McitCategoryBucketAutoContainerComponent } from './categories/category-bucket-auto-container/category-bucket-auto-container.component';
import { McitCategoryGeoDistanceContainerComponent } from './categories/category-geo-distance-container/category-geo-distance-container.component';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { McitCategoryGeoDistanceModalComponent } from './categories/category-geo-distance-container/category-geo-distance-modal/category-geo-distance-modal.component';
import { McitMapModule } from '../map/map.module';
import { MatGridListModule } from '@angular/material/grid-list';
import { McitCategoryDaysSinceContainerComponent } from './categories/category-days-since-container/category-days-since-container.component';
import { McitDateLocalFieldModule } from '../date-local-field/date-local-field.module';
import { McitSaveModalComponent } from './save/save-modal/save-modal.component';
import { McitSaveContainerComponent } from './save/save-container/save-container.component';
import { McitSaveDropdownComponent } from './save/save-dropdown/save-dropdown.component';
import { McitDropdownModule } from '../dropdown/dropdown.module';
import { McitSettingsModalComponent } from './save/settings-modal/settings-modal.component';
import { McitFacetSettingsService } from './facet-settings.service';
import { McitSaveService } from './save/save.service';
import { McitPaginationModule } from '../pagination/pagination.module';
import { McitEditTextModalModule } from '../edit-text-modal/edit-text-modal.module';
import { McitCategoryValuePipe } from './pipes/category-value.pipe';
import { McitIsOpenCategoryPipe } from './pipes/is-open-category.pipe';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { McitSortBySettingsPipe } from './pipes/sort-by-settings.pipe';
import { McitCategoriesDisablePipe } from './pipes/categories-disable.pipe';
import { McitAsCategoryStandardConfigPipe } from './pipes/as-category-standard-config.pipe';
import { McitAsCategoryBucketConfigPipe } from '@lib-shared/common/facet-field/pipes/as-category-bucket-config.pipe';
import { McitAsCategoryBucketAutoConfigPipe } from '@lib-shared/common/facet-field/pipes/as-category-bucket-auto-config.pipe';
import { McitAsCategoryGeoDistanceConfigPipe } from '@lib-shared/common/facet-field/pipes/as-category-geo-distance-config.pipe';
import { McitAsCategoryDaysSinceConfigPipe } from '@lib-shared/common/facet-field/pipes/as-category-days-since-config.pipe';
import { McitIsSelectedFacetValuePipe } from '@lib-shared/common/facet-field/pipes/is-selected-facet-value.pipe';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    McitSimpleAccordionModule,
    McitCommonModule,
    NgxLoadingModule,
    McitTooltipModule,
    McitDialogModule,
    RouterModule,
    TypeaheadModule,
    McitMapModule,
    MatGridListModule,
    McitDateLocalFieldModule,
    McitDropdownModule,
    McitPaginationModule,
    McitEditTextModalModule,
    DragDropModule
  ],
  declarations: [
    McitFacetFieldComponent,
    McitCategoryStandardContainerComponent,
    McitDataFilterPipe,
    McitCategoriesContainerComponent,
    McitCategoriesModalComponent,
    McitCategoriesCountNotEmptyPipe,
    McitCategoriesEmptyPipe,
    McitSortByDataPipe,
    McitLineAsyncPipe,
    McitLineActionDisabledPipe,
    McitLineActionHiddenPipe,
    McitLineActionParamsPipe,
    McitLineActionStringOrFnPipe,
    McitLineTextPipe,
    McitCategoryBucketContainerComponent,
    McitCategoryBucketAutoContainerComponent,
    McitCategoryGeoDistanceContainerComponent,
    McitCategoryGeoDistanceModalComponent,
    McitCategoryDaysSinceContainerComponent,
    McitSaveModalComponent,
    McitSaveContainerComponent,
    McitSaveDropdownComponent,
    McitSettingsModalComponent,
    McitCategoryValuePipe,
    McitIsOpenCategoryPipe,
    McitSortBySettingsPipe,
    McitCategoriesDisablePipe,
    McitAsCategoryStandardConfigPipe,
    McitAsCategoryBucketConfigPipe,
    McitAsCategoryGeoDistanceConfigPipe,
    McitAsCategoryBucketAutoConfigPipe,
    McitAsCategoryDaysSinceConfigPipe,
    McitIsSelectedFacetValuePipe
  ],
  exports: [McitFacetFieldComponent],
  providers: [McitFacetService, McitCategoriesService, McitSaveService, McitFacetSettingsService]
})
export class McitFacetFieldModule {}
