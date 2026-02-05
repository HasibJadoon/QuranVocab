import { NgModule } from '@angular/core';
import { McitChatBarComponent } from '@lib-shared/common/chat/components/chat-bar/chat-bar.component';
import { BusinessModule } from '../../../../../../../dispatcher/src/app/business/business.module';
import { CommonModule } from '@angular/common';
import { McitOffcanvasModule } from '@lib-shared/common/offcanvas/offcanvas.module';
import { McitChatBusinessModule } from '@lib-shared/common/chat/business/business.module';

@NgModule({
  imports: [BusinessModule, CommonModule, McitOffcanvasModule, McitChatBusinessModule],
  exports: [McitChatBarComponent],
  declarations: [McitChatBarComponent]
})
export class McitChatBarModule {}
