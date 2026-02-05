import { Pipe, PipeTransform } from '@angular/core';
import { IContractVersionRef } from '@lib-shared/common/contract/contract.model';
import { DateTime } from 'luxon';

@Pipe({
  name: 'isContractVersionActive'
})
export class ContractVersionActivePipe implements PipeTransform {
  transform(version: IContractVersionRef): boolean {
    if (!version.date_start) {
      return false;
    }
    const currentLocalDate = DateTime.local();
    return DateTime.fromISO(version.date_start) <= currentLocalDate && (!version.date_end || currentLocalDate <= DateTime.fromISO(version.date_end));
  }
}
