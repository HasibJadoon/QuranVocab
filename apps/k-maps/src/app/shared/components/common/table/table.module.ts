import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { McitTableComponent } from './table.component';
import { McitCommonModule } from '../common/common.module';
import { McitColumnClassPipe } from './pipes/column-class.pipe';
import { McitColumnHeaderClassPipe } from './pipes/column-header-class.pipe';
import { McitColumnTextContainerComponent } from './columns/column-text-container/column-text-container.component';
import { McitColumnMeaningContainerComponent } from './columns/column-meaning-container/column-meaning-container.component';
import { McitColumnTranslateContainerComponent } from './columns/column-translate-container/column-translate-container.component';
import { McitColumnDistanceContainerComponent } from './columns/column-distance-container/column-distance-container.component';
import { McitColumnCurrencyContainerComponent } from './columns/column-currency-container/column-currency-container.component';
import { McitColumnDateContainerComponent } from './columns/column-date-container/column-date-container.component';
import { McitColumnTagsContainerComponent } from './columns/column-tags-container/column-tags-container.component';
import { McitColumnStylePipe } from './pipes/column-style.pipe';
import { McitColumnHeaderStylePipe } from './pipes/column-header-style.pipe';
import { McitActionColumnHeaderStylePipe } from './pipes/action-column-header-style.pipe';
import { McitTooltipModule } from '../tooltip/tooltip.module';
import { PortalModule } from '@angular/cdk/portal';
import { McitColumnCustomContainerComponent } from './columns/column-custom-container/column-custom-container.component';
import { McitActionDisabledPipe } from './pipes/action-disabled.pipe';
import { McitActionHiddenPipe } from './pipes/action-hidden.pipe';
import { McitMenuDropdownModule } from '../menu-dropdown/menu-dropdown.module';
import { McitColumnCustomDirective } from './directives/column-custom.directive';
import { McitColumnListdicoContainerComponent } from './columns/column-listdico-container/column-listdico-container.component';
import { McitColumnGetOrFnPipe } from './pipes/column-get-or-fn.pipe';
import { RouterModule } from '@angular/router';
import { McitRowHeaderCustomDirective } from './directives/row-header-custom.directive';
import { McitRowHeaderClassPipe } from './pipes/row-header-class.pipe';
import { McitRowHeaderStylePipe } from './pipes/row-header-style.pipe';
import { McitRowExtensionCustomDirective } from './directives/row-extension-custom.directive';
import { McitRowExtensionClassPipe } from './pipes/row-extension-class.pipe';
import { McitFormsModule } from '../forms/forms.module';
import { FormsModule } from '@angular/forms';
import { McitColumnsVisiblePipe } from './pipes/columns-visible.pipe';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { McitDialogModule } from '../dialog/dialog.module';
import { McitMoveColumnsModalComponent } from './move-columns-modal/move-columns-modal.component';
import { McitMoveColumnsModalService } from './move-columns-modal/move-columns-modal.service';
import { McitColumnsSortPipe } from './pipes/columns-sort.pipe';
import { McitEditTextModalModule } from '../edit-text-modal/edit-text-modal.module';
import { McitDropdownModule } from '../dropdown/dropdown.module';
import { McitSaveService } from './save/save.service';
import { McitSaveDropdownComponent } from './save/save-dropdown/save-dropdown.component';
import { McitPaginationModule } from '../pagination/pagination.module';
import { McitColumnStringOrFnPipe } from './pipes/column-string-or-fn.pipe';
import { McitColumnTranslateParamsPipe } from './pipes/column-translate-params.pipe';
import { McitActionParamsPipe } from './pipes/action-params.pipe';
import { McitRowClassPipe } from './pipes/row-class.pipe';
import { McitActionColumnCustomDirective } from './directives/action-column-custom.directive';
import { McitRowHoverDirective } from './directives/row-hover.directive';
import { McitRowSelectDisabledPipe } from './pipes/row-select-disabled.pipe';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { McitSelectAlldPipe } from './pipes/select-all.pipe';
import { McitColumnsIndexPipe } from './pipes/columns-index.pipe';
import { McitTableOptionsComponent } from './options/table-options.component';
import { McitTableToolbarDirective } from './directives/table-toolbar.directive';
import { McitActionStringOrFnPipe } from './pipes/action-string-or-fn.pipe';
import { McitColumnBooleanContainerComponent } from './columns/column-boolean-container/column-boolean-container.component';
import { McitHeaderClassPipe } from './pipes/header-class.pipe';
import { IsColumnConfigPipe } from './pipes/is-column-config.pipe';
import { McitColumnIconContainerComponent } from './columns/column-icon-container/column-icon-container.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    McitCommonModule,
    McitTooltipModule,
    PortalModule,
    McitMenuDropdownModule,
    McitFormsModule,
    FormsModule,
    DragDropModule,
    McitDialogModule,
    McitEditTextModalModule,
    McitDropdownModule,
    McitPaginationModule,
    ScrollingModule
  ],
  declarations: [
    McitTableOptionsComponent,
    McitTableComponent,
    McitColumnClassPipe,
    McitColumnHeaderClassPipe,
    McitColumnTextContainerComponent,
    McitColumnIconContainerComponent,
    McitColumnMeaningContainerComponent,
    McitColumnTranslateContainerComponent,
    McitColumnDistanceContainerComponent,
    McitColumnCurrencyContainerComponent,
    McitColumnDateContainerComponent,
    McitColumnTagsContainerComponent,
    McitColumnStylePipe,
    McitColumnHeaderStylePipe,
    McitActionColumnHeaderStylePipe,
    McitColumnCustomContainerComponent,
    McitActionDisabledPipe,
    McitActionHiddenPipe,
    McitColumnCustomDirective,
    McitColumnListdicoContainerComponent,
    McitColumnGetOrFnPipe,
    McitRowHeaderCustomDirective,
    McitRowHeaderClassPipe,
    McitRowHeaderStylePipe,
    McitRowExtensionCustomDirective,
    McitRowExtensionClassPipe,
    McitColumnsVisiblePipe,
    McitMoveColumnsModalComponent,
    McitColumnsSortPipe,
    McitSaveDropdownComponent,
    McitColumnStringOrFnPipe,
    McitColumnTranslateParamsPipe,
    McitActionParamsPipe,
    McitRowClassPipe,
    McitActionColumnCustomDirective,
    McitRowHoverDirective,
    McitRowSelectDisabledPipe,
    McitSelectAlldPipe,
    McitColumnsIndexPipe,
    McitTableToolbarDirective,
    McitActionStringOrFnPipe,
    McitColumnBooleanContainerComponent,
    McitHeaderClassPipe,
    IsColumnConfigPipe
  ],
  exports: [
    McitTableOptionsComponent,
    McitTableComponent,
    McitColumnCustomDirective,
    McitRowHeaderCustomDirective,
    McitRowExtensionCustomDirective,
    McitActionColumnCustomDirective,
    McitTableToolbarDirective,
    McitColumnsSortPipe,
    McitRowHoverDirective,
    McitRowClassPipe,
    McitRowSelectDisabledPipe,
    McitRowHeaderClassPipe,
    McitColumnClassPipe,
    McitColumnStylePipe,
    McitColumnsVisiblePipe,
    McitRowExtensionClassPipe,
    McitColumnsIndexPipe,
    McitColumnTextContainerComponent,
    McitColumnIconContainerComponent,
    McitColumnDateContainerComponent,
    McitColumnCurrencyContainerComponent,
    McitColumnDistanceContainerComponent,
    McitColumnTagsContainerComponent,
    McitColumnCustomContainerComponent,
    McitColumnMeaningContainerComponent,
    McitColumnTranslateContainerComponent,
    McitColumnListdicoContainerComponent,
    McitColumnBooleanContainerComponent,
    McitSelectAlldPipe,
    McitRowHeaderStylePipe,
    McitColumnHeaderClassPipe,
    McitColumnHeaderStylePipe,
    McitActionColumnHeaderStylePipe,
    McitActionColumnHeaderStylePipe,
    McitHeaderClassPipe,
    McitActionStringOrFnPipe,
    McitActionParamsPipe,
    McitActionDisabledPipe,
    McitActionHiddenPipe
  ],
  providers: [McitMoveColumnsModalService, McitSaveService]
})
export class McitTableModule {}
