import { NgModule } from '@angular/core';
import { McitChatBarModule } from '@lib-shared/common/chat/components/chat-bar/chat-bar.module';
import { McitChatDiscussionModule } from '@lib-shared/common/chat/components/chat-discussion/chat-discussion.module';
import { McitChatMessagesModule } from '@lib-shared/common/chat/components/chat-messages/chat-messages.module';
import { McitChatMessagesMassModalModule } from '@lib-shared/common/chat/components/chat-messages-mass-modal/chat-messages-mass-modal.module';
import { McitChatBusinessModule } from '@lib-shared/common/chat/business/business.module';
import { McitDateTranslatePipe } from '@lib-shared/common/common/pipes/date-translate.pipe';

@NgModule({
  imports: [McitChatBusinessModule, McitChatBarModule, McitChatDiscussionModule, McitChatMessagesModule, McitChatMessagesMassModalModule],
  providers: [McitDateTranslatePipe]
})
export class McitChatModule {}
