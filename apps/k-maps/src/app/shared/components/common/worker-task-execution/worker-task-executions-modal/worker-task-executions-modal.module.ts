import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McitWorkerTaskExecutionsModalComponent } from './worker-task-executions-modal.component';
import { McitWorkerTaskExecutionsModalService } from './worker-task-executions-modal.service';
import { McitDialogModule } from '@lib-shared/common/dialog/dialog.module';
import { TranslateModule } from '@ngx-translate/core';
import { McitPaginationModule } from '@lib-shared/common/pagination/pagination.module';
import { McitCommonModule } from '@lib-shared/common/common/common.module';
import { McitSearchFieldModule } from '@lib-shared/common/search/search.module';
import { FormsModule } from '@angular/forms';
import { McitQuestionModalModule } from '@lib-shared/common/question-modal/question-modal.module';
import { McitTooltipModule } from '@lib-shared/common/tooltip/tooltip.module';
import { McitDropdownModule } from '@lib-shared/common/dropdown/dropdown.module';

@NgModule({
  imports: [CommonModule, McitDialogModule, TranslateModule, McitPaginationModule, McitCommonModule, McitSearchFieldModule, FormsModule, McitQuestionModalModule, McitTooltipModule, McitDropdownModule],
  declarations: [McitWorkerTaskExecutionsModalComponent],
  providers: [McitWorkerTaskExecutionsModalService]
})
export class McitWorkerTaskExecutionsModalModule {}
