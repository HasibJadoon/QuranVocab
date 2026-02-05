import { NgModule } from '@angular/core';
import { McitChatDiscussionComponent } from './chat-discussion.component';
import { McitChatDiscussionService } from '@lib-shared/common/chat/components/chat-discussion/chat-discussion.service';
import { McitChatMessagesModule } from '@lib-shared/common/chat/components/chat-messages/chat-messages.module';
import { McitTooltipModule } from '@lib-shared/common/tooltip/tooltip.module';
import { McitSearchFieldModule } from '@lib-shared/common/search/search.module';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { McitChatBusinessModule } from '@lib-shared/common/chat/business/business.module';
import { NgxLoadingModule } from 'ngx-loading';

@NgModule({
  imports: [TranslateModule, CommonModule, FormsModule, McitTooltipModule, McitSearchFieldModule, McitChatBusinessModule, McitChatMessagesModule, NgxLoadingModule, ReactiveFormsModule],
  exports: [McitChatDiscussionComponent],
  declarations: [McitChatDiscussionComponent],
  providers: [McitChatDiscussionService]
})
export class McitChatDiscussionModule {}
