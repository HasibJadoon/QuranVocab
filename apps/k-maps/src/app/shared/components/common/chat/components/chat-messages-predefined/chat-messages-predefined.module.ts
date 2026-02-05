import { NgModule } from '@angular/core';
import { McitChatMessagesPredefinedComponent } from '@lib-shared/common/chat/components/chat-messages-predefined/chat-messages-predefined.component';
import { McitDropdownModule } from '@lib-shared/common/dropdown/dropdown.module';
import { McitChatBusinessModule } from '@lib-shared/common/chat/business/business.module';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [McitDropdownModule, McitChatBusinessModule, TranslateModule, CommonModule],
  exports: [McitChatMessagesPredefinedComponent],
  declarations: [McitChatMessagesPredefinedComponent]
})
export class McitChatMessagesPrefefinedModule {}
