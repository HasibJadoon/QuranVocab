import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { McitNotificationPopupComponent } from './notification-popup.component';
import { McitCommonModule } from '../common/common.module';
import { McitDialogModule } from '../dialog/dialog.module';
import { McitNotificationModalComponent } from './notification-modal/notification-modal.component';
import { McitNotificationViewComponent } from './notification-view/notification-view.component';
import { McitNotificationRoutingModule } from './notification-routing';
import { McitLayoutsModule } from '../layouts/layouts.module';
import { McitPaginationModule } from '../pagination/pagination.module';
import { McitQuestionModalModule } from '../question-modal/question-modal.module';

@NgModule({
  imports: [CommonModule, TranslateModule, McitCommonModule, McitDialogModule, McitLayoutsModule, McitNotificationRoutingModule, McitPaginationModule, McitQuestionModalModule],
  declarations: [McitNotificationPopupComponent, McitNotificationModalComponent, McitNotificationViewComponent],
  exports: [McitNotificationPopupComponent]
})
export class McitNotificationModule {}
