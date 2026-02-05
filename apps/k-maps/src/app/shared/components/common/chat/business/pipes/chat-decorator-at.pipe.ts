import { Pipe, PipeTransform } from '@angular/core';
import { IChatMessage } from '../model/chat-message.model';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

// l'ajout de ce style dans le css n'est pas pris en compte, du coup pas le choix que de le mettre ici.
export const ATDECORATE = 'color: rgb(24 74 199 / 93%);display: inline-block;padding: 0.15em 0.2em;  font-size: 85%;  font-weight: 400;  line-height: 1;  white-space: nowrap;  border-radius: 2.25rem;  background-color: #e9ecef;';

@Pipe({
  name: 'chatDecoratorAt'
})
export class McitChatDecoratorAtPipe implements PipeTransform {
  constructor(private _sanitizer: DomSanitizer, private translateService: TranslateService) {}

  transform(chatMessage: IChatMessage): SafeHtml {
    if (!chatMessage?.text_splitted_with_contacts?.length) {
      let text: string;
      if (chatMessage?.text) {
        text = chatMessage?.text;
      } else if (chatMessage?.event?.text_auto?.text) {
        const textAuto = chatMessage?.event?.text_auto;
        text = this.translateService.instant(textAuto?.text, textAuto?.interpolate_params);
      }
      return this._sanitizer.bypassSecurityTrustHtml(text);
    }
    const element = chatMessage?.text_splitted_with_contacts.map((msg) => (msg?.contact ? `<span style="${ATDECORATE}"> ${msg.word.substring(1, msg.word.length - 1)} </span>` : msg.word?.length ? msg.word : '&nbsp'));
    return this._sanitizer.bypassSecurityTrustHtml(element.join(' '));
  }
}
