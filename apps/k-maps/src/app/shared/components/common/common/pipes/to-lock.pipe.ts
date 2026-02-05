import { Pipe, PipeTransform } from '@angular/core';
import { ITransportOrder } from '@lib-shared/common/models/transport-order.model';
import { IExpense } from '@lib-shared/common/models/expense.model';

@Pipe({
  name: 'istolocked',
  pure: true
})
export class McitInvoicedLockPipe implements PipeTransform {
  transform(object: ITransportOrder | IExpense): boolean {
    return Boolean(object?.invoiced);
  }
}
