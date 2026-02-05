import { NgModule } from '@angular/core';
import { McitChatMessagesComponent } from './chat-messages.component';
import { McitChatMessagesService } from '@lib-shared/common/chat/components/chat-messages/chat-messages.service';
import { McitChatBusinessModule } from '@lib-shared/common/chat/business/business.module';
import { CommonModule } from '@angular/common';
import { McitCommonModule } from '@lib-shared/common/common/common.module';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { McitChatMessagesPrefefinedModule } from '@lib-shared/common/chat/components/chat-messages-predefined/chat-messages-predefined.module';
import { McitDropdownModule } from '@lib-shared/common/dropdown/dropdown.module';
import { NgxLoadingModule } from 'ngx-loading';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [CommonModule, TranslateModule, RouterModule, McitCommonModule, McitDropdownModule, McitChatBusinessModule, McitChatMessagesPrefefinedModule, NgxLoadingModule, ReactiveFormsModule],
  exports: [McitChatMessagesComponent],
  declarations: [McitChatMessagesComponent],
  providers: [McitChatMessagesService]
})
export class McitChatMessagesModule {}
