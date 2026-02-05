import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'getIconFromExtention'
})
export class McitGetIconFromExtentionPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) {
      return 'fad fa-file';
    }
    const pos = value.lastIndexOf('.');
    if (pos === -1) {
      return 'fad fa-file';
    }
    const ext = value.slice(pos + 1);
    switch (ext) {
      case 'pdf':
        return 'fad fa-file-pdf';
      case 'csv':
        return 'fad fa-file-csv';
      case 'xls':
      case 'xlsx':
        return 'fad fa-file-excel';
      case 'doc':
      case 'docx':
        return 'fad fa-file-word';
      case 'ppt':
      case 'pptx':
        return 'fad fa-file-powerpoint';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'fad fa-file-image';
      case 'zip':
      case 'tar':
      case 'gz':
      case '7zip':
        return 'fad fa-file-archive';
      case 'json':
      case 'ts':
      case 'java':
      case 'dart':
      case 'js':
      case 'py':
        return 'fad fa-file-code';
    }
    return 'fad fa-file-alt';
  }
}
