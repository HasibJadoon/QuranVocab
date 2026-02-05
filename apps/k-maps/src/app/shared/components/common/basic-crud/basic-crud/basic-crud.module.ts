import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitTooltipModule } from '@lib-shared/common/tooltip/tooltip.module';
import { TranslateModule } from '@ngx-translate/core';
import { McitBasicCrudComponent } from './basic-crud.component';
import { McitTableModule } from '../../table/table.module';
import { McitPaginationModule } from '../../pagination/pagination.module';
import { FormsModule } from '@angular/forms';
import { McitSearchFieldModule } from '../../search/search.module';
import { McitFacetFieldModule } from '../../facet-field/facet-field.module';
import { McitQuestionModalModule } from '../../question-modal/question-modal.module';
import { McitAceEditorModalModule } from '../../ace-editor-modal/ace-editor-modal.module';
import { McitInfoTracableModalModule } from '../../info-tracable-modal/info-tracable-modal.module';
import { McitItemCustomDirective } from './basic-crud-item-custom.directive';
import { McitCommonModule } from '../../common/common.module';
import { McitDropdownModule } from '../../dropdown/dropdown.module';
import { BasicCrudHiddenActionPipe } from './pipes/basic-crud-hidden-action.pipe';
import { BasicCrudSelectAllPipeGroup } from './pipes/basic-crud-select-all-group.pipe';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    McitTableModule,
    McitPaginationModule,
    McitSearchFieldModule,
    McitFacetFieldModule,
    McitQuestionModalModule,
    McitAceEditorModalModule,
    McitInfoTracableModalModule,
    McitCommonModule,
    McitDropdownModule,
    McitTooltipModule
  ],
  declarations: [McitBasicCrudComponent, McitItemCustomDirective, BasicCrudHiddenActionPipe, BasicCrudSelectAllPipeGroup],
  exports: [McitBasicCrudComponent, McitTableModule, McitSearchFieldModule, McitFacetFieldModule, McitItemCustomDirective, BasicCrudHiddenActionPipe, BasicCrudSelectAllPipeGroup]
})
export class McitBasicCrudModule {}
