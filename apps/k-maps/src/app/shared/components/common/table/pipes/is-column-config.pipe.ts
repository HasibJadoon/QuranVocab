import { Pipe, PipeTransform } from '@angular/core';
import { IColumnConfigExt } from '../table.component';
import {
  ColumnType,
  isBooleanColumnConfig,
  isListdicoColumnConfig,
  isCustomColumnConfig,
  isTextColumnConfig,
  isTranslateColumnConfig,
  isTagsColumnConfig,
  isMeaningColumnConfig,
  isCurrencyColumnConfig,
  isDistanceColumnConfig,
  isDateColumnConfig
} from '../table-options';

@Pipe({
  name: 'isColumnConfig'
})
export class IsColumnConfigPipe<E> implements PipeTransform {
  transform(value: IColumnConfigExt<E>, type: ColumnType): boolean {
    switch (type) {
      case ColumnType.boolean:
        return isBooleanColumnConfig(value);
      case ColumnType.listdico:
        return isListdicoColumnConfig(value);
      case ColumnType.custom:
        return isCustomColumnConfig(value);
      case ColumnType.text:
        return isTextColumnConfig(value);
      case ColumnType.translate:
        return isTranslateColumnConfig(value);
      case ColumnType.tags:
        return isTagsColumnConfig(value);
      case ColumnType.meaning:
        return isMeaningColumnConfig(value);
      case ColumnType.currency:
        return isCurrencyColumnConfig(value);
      case ColumnType.distance:
        return isDistanceColumnConfig(value);
      case ColumnType.date:
        return isDateColumnConfig(value);
    }
    return false;
  }
}
