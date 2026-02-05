import { Pipe, PipeTransform } from '@angular/core';
import { IDerogatory } from '../../models/derogatory.model';

@Pipe({
  name: 'derogatoryInformationTooltip'
})
export class McitDerogatoryInformationTooltipPipe implements PipeTransform {
  transform(derogatoryInformation: IDerogatory): string {
    if (!derogatoryInformation) {
      return null;
    }

    const values = [derogatoryInformation.activity_code, derogatoryInformation.article_code, derogatoryInformation.billed_customer?.code, derogatoryInformation.supplier?.code].filter(Boolean);

    return values.length > 0 ? values.join(', ') : null;
  }
}
