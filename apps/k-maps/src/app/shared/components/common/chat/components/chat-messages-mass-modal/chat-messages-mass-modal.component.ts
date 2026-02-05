import { Component, Inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { McitDialogRef } from '../../../dialog/dialog-ref';
import { MCIT_DIALOG_DATA } from '../../../dialog/dialog.service';
import { ChatMessageType } from '@lib-shared/common/chat/business/domains/chat-message-type.domain';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';

@TraceErrorClass()
@Component({
  selector: 'mcit-chat-messages-mass-modal',
  templateUrl: './chat-messages-mass-modal.component.html',
  styleUrls: ['./chat-messages-mass-modal.component.scss']
})
export class McitChatMessagesMassModalComponent {
  isMRI: boolean;

  CHAT_MESSAGES_TYPE = ChatMessageType;
  messageForm: UntypedFormGroup;

  constructor(@Inject(MCIT_DIALOG_DATA) data: { isMRI: boolean }, private dialogRef: McitDialogRef<McitChatMessagesMassModalComponent, { text: string }>, private formBuilder: UntypedFormBuilder) {
    this.isMRI = data?.isMRI;
    this.messageForm = this.formBuilder.group({
      text: new UntypedFormControl('', Validators.required)
    });
  }

  doClose(): void {
    this.dialogRef.close();
  }

  sendMessage(): void {
    if (!this.messageForm.get('text').value?.length) {
      this.dialogRef.close();
    } else {
      this.dialogRef.close(this.messageForm.get('text').value);
    }
  }
}
