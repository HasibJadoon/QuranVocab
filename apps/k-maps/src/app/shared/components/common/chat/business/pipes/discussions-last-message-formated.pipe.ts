import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ILastMessage } from '../model/chat-discussion.model';
@Pipe({
  name: 'discussionsLastMessageFormated',
  pure: true
})
export class McitDiscussionsLastMessageFormatedPipe implements PipeTransform {
  constructor(private translateService: TranslateService) {}

  transform(last: ILastMessage): string {
    let text = '';
    if (last) {
      if (last?.text) {
        text = last?.text;
      } else if (last?.event?.text_auto?.text) {
        text = this.translateService.instant(last?.event?.text_auto?.text, last?.event?.text_auto?.interpolate_params);
      }
    }

    return text?.length > 20 ? text.slice(0, 40) + '...' : text;
  }
}
