import { Pipe, PipeTransform } from '@angular/core';
import { IResource } from '@lib-shared/common/models/resource.model';
import { McitDateTranslatePipe } from '@lib-shared/common/common/pipes/date-translate.pipe';
import { TranslatePipe } from '@ngx-translate/core';

@Pipe({
  name: 'descriptionResource'
})
export class McitDescriptionResourcePipe implements PipeTransform {
  constructor(private dateTranslatePipe: McitDateTranslatePipe, private translatePipe: TranslatePipe) {}
  transform(resource: IResource): string {
    let description = '';
    if (resource?.type === 'driver') {
      description = `${resource?.driver?.first_name}, ${resource?.driver?.last_name}`;
    } else if (resource?.type === 'truck') {
      description = `${resource.truck?.license_plate}, ${resource.truck?.means_type}, ${resource.truck?.name}`;
    }
    if (resource?.disabled) {
      const dateString = this.dateTranslatePipe.transform(resource.disabled_date, 'date');
      if (dateString) {
        description += ', ' + this.translatePipe.transform('DESCRIPTION_RESOURCE_PIPE.RESOURCE_DISABLED', { date: dateString });
      }
    }
    return description;
  }
}
