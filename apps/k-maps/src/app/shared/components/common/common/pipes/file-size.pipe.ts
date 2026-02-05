import { Pipe, PipeTransform } from '@angular/core';

const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

@Pipe({
  name: 'fileSize'
})
export class McitFileSizePipe implements PipeTransform {
  transform(bytes: number = 0): string {
    if (isNaN(parseFloat(String(bytes))) || !isFinite(bytes)) {
      return '?';
    }

    let power = Math.round(Math.log(bytes) / Math.log(1024));
    power = Math.min(power, FILE_SIZE_UNITS.length - 1);

    const size = bytes / Math.pow(1024, power); // size in new units
    const formattedSize = Math.round(size * 100) / 100; // keep up to 2 decimals
    const unit = FILE_SIZE_UNITS[power];

    return `${formattedSize} ${unit}`;
  }
}
