import { Pipe, PipeTransform } from '@angular/core';
import { DateTime } from 'luxon';
import { isSameDay, isPreviousDay } from '../../../helpers/date.helper';
import { McitDateTranslatePipe } from '../../../common/pipes/date-translate.pipe';
import { TranslateService } from '@ngx-translate/core';
import { ILocalDate } from '@lib-shared/common/models/types.model';

@Pipe({
  name: 'discussionsDateFormater'
})
export class McitDiscussionDateFormaterPipe implements PipeTransform {
  constructor(private dateTranslatePipe: McitDateTranslatePipe, private translateService: TranslateService) {}

  transform(date: Date): string {
    if (!date) {
      return '';
    }
    if (isSameDay(DateTime.fromISO(date.toString()))) {
      return this.dateTranslatePipe.transform(date, 'hour_minutes');
    }
    if (isPreviousDay(DateTime.fromISO(date.toString()))) {
      return this.translateService.instant('CHAT.GENERIC.YESTERDAY');
    }
    if (!isSameDay(DateTime.fromISO(date.toString())) && !isPreviousDay(DateTime.fromISO(date.toString()))) {
      return this.dateTranslatePipe.transform(date, 'date');
    }
    return 'Error';
  }
}
