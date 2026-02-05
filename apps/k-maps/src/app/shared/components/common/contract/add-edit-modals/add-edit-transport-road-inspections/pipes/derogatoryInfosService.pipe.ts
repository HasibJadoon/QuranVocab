import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'derogatoryInfosService' })
export class DerogatoryInfosServicePipe implements PipeTransform {
  transform(service: any, key: string, value: any): boolean {
    return service?.derogatory?.[key] === value;
  }
}
