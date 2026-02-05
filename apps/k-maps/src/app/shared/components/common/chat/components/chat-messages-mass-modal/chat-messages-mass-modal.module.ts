import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { McitChatMessagesMassModalComponent } from './chat-messages-mass-modal.component';
import { McitChatMessagesMassModalService } from './chat-messages-mass-modal.service';
import { McitChatBusinessModule } from '@lib-shared/common/chat/business/business.module';

@NgModule({
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, McitChatBusinessModule],
  declarations: [McitChatMessagesMassModalComponent],
  providers: [McitChatMessagesMassModalService]
})
export class McitChatMessagesMassModalModule {}
