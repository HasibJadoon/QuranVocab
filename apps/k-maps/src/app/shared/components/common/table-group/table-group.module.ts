import { NgModule } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { McitCommonModule } from '@lib-shared/common/common/common.module';
import { McitTooltipModule } from '@lib-shared/common/tooltip/tooltip.module';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { McitTableModule } from '@lib-shared/common/table/table.module';
import { McitMoveColumnsModalService } from '@lib-shared/common/table/move-columns-modal/move-columns-modal.service';
import { McitSaveService } from '@lib-shared/common/table/save/save.service';
import { McitTableOptionsComponent } from '@lib-shared/common/table/options/table-options.component';
import { McitTableGroupComponent } from '@lib-shared/common/table-group/table-group.component';
import { McitActionGroupRowCustomDirective } from './directives/action-group-row-custom.directive';
import { SelectAllPipeGroup } from './pipes/select-all-group.pipe';
import { McitPaginationModule } from '../pagination/pagination.module';

@NgModule({
  imports: [AsyncPipe, McitCommonModule, McitPaginationModule, McitTooltipModule, RouterModule, TranslateModule, CommonModule, McitTableModule],
  exports: [McitTableGroupComponent, McitTableOptionsComponent, McitActionGroupRowCustomDirective, SelectAllPipeGroup],
  declarations: [McitTableGroupComponent, McitActionGroupRowCustomDirective, SelectAllPipeGroup],
  providers: [McitMoveColumnsModalService, McitSaveService]
})
export class McitTableGroupModule {}
