import { Pipe, PipeTransform } from '@angular/core';
import { CalendarTypes } from '../../models/calendar.model';

@Pipe({
  name: 'viewModeType'
})
export class ViewModeTypePipe implements PipeTransform {
  transform(viewMode: string): CalendarTypes {
    if (viewMode === 'invoicing') {
      return CalendarTypes.INVOICING;
    } else if (viewMode === 'periods') {
      return CalendarTypes.PERIODS;
    }
    return CalendarTypes.PUBLIC_HOLIDAYS;
  }
}
