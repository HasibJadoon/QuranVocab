import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { McitBasicCrudGroupComponent } from './basic-crud-group.component';
import { McitTableModule } from '../../table/table.module';
import { McitPaginationModule } from '../../pagination/pagination.module';
import { FormsModule } from '@angular/forms';
import { McitSearchFieldModule } from '../../search/search.module';
import { McitFacetFieldModule } from '../../facet-field/facet-field.module';
import { McitQuestionModalModule } from '../../question-modal/question-modal.module';
import { McitAceEditorModalModule } from '../../ace-editor-modal/ace-editor-modal.module';
import { McitInfoTracableModalModule } from '../../info-tracable-modal/info-tracable-modal.module';
import { McitCommonModule } from '../../common/common.module';
import { McitDropdownModule } from '../../dropdown/dropdown.module';
import { McitGroupModule } from '@lib-shared/common/group/group.module';
import { McitTableGroupModule } from '@lib-shared/common/table-group/table-group.module';
import { McitBasicCrudModule } from '@lib-shared/common/basic-crud/basic-crud/basic-crud.module';
import { McitTooltipModule } from '@lib-shared/common/tooltip/tooltip.module';
import { McitGroupTableToolbarCustomDirective } from './directives/action-group-row-custom.directive';
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
    McitGroupModule,
    McitBasicCrudModule,
    McitTableGroupModule,
    McitTooltipModule
  ],
  declarations: [McitBasicCrudGroupComponent, McitGroupTableToolbarCustomDirective],
  exports: [McitBasicCrudGroupComponent, McitTableModule, McitTableGroupModule, McitSearchFieldModule, McitFacetFieldModule, McitGroupTableToolbarCustomDirective]
})
export class McitBasicCrudGroupModule {}
