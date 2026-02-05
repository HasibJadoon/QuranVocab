import { NgModule } from '@angular/core';
import { McitChatConvCornerPipe } from '@lib-shared/common/chat/business/pipes/chat-conv-corner.pipe';
import { McitChatDatePipe } from '@lib-shared/common/chat/business/pipes/chat-date.pipe';
import { McitChatFirstUpercasePipe } from '@lib-shared/common/chat/business/pipes/chat-first-upercase.pipe';
import { McitChatInfoPipe } from '@lib-shared/common/chat/business/pipes/chat-info.pipe';
import { McitChatIsCurrentDayPipe } from '@lib-shared/common/chat/business/pipes/chat-is-current-day.pipe';
import { McitChatIsDayBeforePipe } from '@lib-shared/common/chat/business/pipes/chat-is-day-before.pipe';
import { McitChatMessageAutoPipe } from '@lib-shared/common/chat/business/pipes/chat-message-auto.pipe';
import { McitChatUserTypingPipe } from '@lib-shared/common/chat/business/pipes/chat-user-typing.pipe';
import { McitClassForTypePipe } from '@lib-shared/common/chat/business/pipes/class-for-type.pipe';
import { McitChatDecoratorAtPipe } from '@lib-shared/common/chat/business/pipes/chat-decorator-at.pipe';
import { McitChatConvPipe } from '@lib-shared/common/chat/business/pipes/chat-conv.pipe';
import { McitRulesUserChatDispatcherCarrierPipe } from '@lib-shared/common/chat/business/pipes/rules-user-chat-dispatcher-carrier.pipe';
import { McitDiscussionsCountUnreadPipe } from '@lib-shared/common/chat/business/pipes/discussions-count-unread.pipe';
import { McitDiscussionsLastMessagePipe } from '@lib-shared/common/chat/business/pipes/discussions-last-message.pipe';
import { McitDiscussionDateFormaterPipe } from '@lib-shared/common/chat/business/pipes/discussion-date-formater.pipe';
import { McitDiscussionsLastMessageFormatedPipe } from '@lib-shared/common/chat/business/pipes/discussions-last-message-formated.pipe';
import { McitMessagesPredefinedFilterPipe } from '@lib-shared/common/chat/business/pipes/messages-predefined-filter.pipe';
import { McitChatFindDriverActorPipe } from '@lib-shared/common/chat/business/pipes/chat-find-driver-actor.pipe';
import { McitChatFindCarrierActorPipe } from '@lib-shared/common/chat/business/pipes/chat-find-carrier-actor.pipe';
import { McitDiscussionsLastMessageEventPipe } from '@lib-shared/common/chat/business/pipes/discussions-last-message-event.pipe';
import { McitDiscussionsCountTotalUnreadPipe } from '@lib-shared/common/chat/business/pipes/discussions-count-total-unread.pipe';
import { McitChatMessagesFilterMsgAutoPipe } from '@lib-shared/common/chat/business/pipes/chat-messages-filter-msg-auto.pipe';
import { McitDiscussionsMessagesTypesPipe } from '@lib-shared/common/chat/business/pipes/discussions-messages-types.pipe';
import { McitFilterMsgTypePipe } from '@lib-shared/common/chat/business/pipes/filter-msg-type.pipe';
import { McitCountUnreadMessagesTotalPipe } from '@lib-shared/common/chat/business/pipes/messages-count-unread.pipe';
import { McitColorTypeTabPipe } from '@lib-shared/common/chat/business/pipes/color-type-tab.pipe';
import { McitSortUnreadPipe } from '@lib-shared/common/chat/business/pipes/checking-sort-unread.pipe';

@NgModule({
  imports: [],
  exports: [
    McitChatConvCornerPipe,
    McitChatDatePipe,
    McitChatDecoratorAtPipe,
    McitChatFirstUpercasePipe,
    McitChatInfoPipe,
    McitChatIsCurrentDayPipe,
    McitChatIsDayBeforePipe,
    McitChatMessageAutoPipe,
    McitChatConvPipe,
    McitChatUserTypingPipe,
    McitClassForTypePipe,
    McitColorTypeTabPipe,
    McitRulesUserChatDispatcherCarrierPipe,
    McitDiscussionsCountUnreadPipe,
    McitDiscussionsCountTotalUnreadPipe,
    McitDiscussionsLastMessagePipe,
    McitDiscussionsLastMessageFormatedPipe,
    McitDiscussionDateFormaterPipe,
    McitDiscussionsLastMessageFormatedPipe,
    McitMessagesPredefinedFilterPipe,
    McitChatFindDriverActorPipe,
    McitChatFindCarrierActorPipe,
    McitDiscussionsLastMessageEventPipe,
    McitChatMessagesFilterMsgAutoPipe,
    McitCountUnreadMessagesTotalPipe,
    McitFilterMsgTypePipe,
    McitDiscussionsMessagesTypesPipe,
    McitSortUnreadPipe
  ],
  declarations: [
    McitChatConvCornerPipe,
    McitChatDatePipe,
    McitChatDecoratorAtPipe,
    McitChatFirstUpercasePipe,
    McitChatInfoPipe,
    McitChatIsCurrentDayPipe,
    McitChatIsDayBeforePipe,
    McitChatMessageAutoPipe,
    McitChatConvPipe,
    McitChatUserTypingPipe,
    McitClassForTypePipe,
    McitColorTypeTabPipe,
    McitRulesUserChatDispatcherCarrierPipe,
    McitDiscussionsCountUnreadPipe,
    McitDiscussionsCountTotalUnreadPipe,
    McitDiscussionsLastMessagePipe,
    McitDiscussionsLastMessageFormatedPipe,
    McitDiscussionDateFormaterPipe,
    McitDiscussionsLastMessageFormatedPipe,
    McitMessagesPredefinedFilterPipe,
    McitChatFindDriverActorPipe,
    McitChatFindCarrierActorPipe,
    McitDiscussionsLastMessageEventPipe,
    McitChatMessagesFilterMsgAutoPipe,
    McitCountUnreadMessagesTotalPipe,
    McitFilterMsgTypePipe,
    McitDiscussionsMessagesTypesPipe,
    McitSortUnreadPipe
  ],
  providers: [McitDiscussionsCountUnreadPipe, McitDiscussionsCountTotalUnreadPipe, McitCountUnreadMessagesTotalPipe, McitFilterMsgTypePipe, McitSortUnreadPipe]
})
export class McitChatBusinessModule {}
