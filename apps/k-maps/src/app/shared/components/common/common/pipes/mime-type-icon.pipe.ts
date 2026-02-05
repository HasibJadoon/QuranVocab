import { Pipe, PipeTransform } from '@angular/core';

const TYPE_ICONS: {
  [key: string]: string;
} = {
  // Pdf
  'application/pdf': 'far fa-file-pdf',
  // Image
  'image/*': 'far fa-file-image',
  // Excel
  'application/msexcel': 'far fa-file-excel',
  'application/vnd.ms-excel': 'far fa-file-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'far fa-file-excel',
  'application/vnd.oasis.opendocument.spreadsheet': 'far fa-file-excel',
  // Powerpoint
  'application/vnd.oasis.opendocument.presentation': 'far fa-file-powerpoint',
  'application/vnd.ms-powerpoint': 'far fa-file-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'far fa-file-powerpoint',
  // Word
  'application/msword': 'far fa-file-word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'far fa-file-word',
  'application/vnd.oasis.opendocument.text': 'far fa-file-word',
  // Code
  'application/xml': 'far fa-file-code',
  // Video
  'video/*': 'far fa-file-video',
  // Audio
  'audio/*': 'far fa-file-audio',
  // Archive
  'application/x-7z-compressed': 'far fa-file-archive',
  'application/zip': 'far fa-file-archive',
  'application/x-rar-compressed': 'far fa-file-archive',
  'application/x-tar': 'far fa-file-archive'
};

@Pipe({
  name: 'mimetypeicon',
  pure: true
})
export class McitMimeTypeIconPipe implements PipeTransform {
  transform(value: string): any {
    if (value) {
      const ti = TYPE_ICONS[value];
      if (ti) {
        return ti;
      }

      const key = Object.keys(TYPE_ICONS).find((k) => {
        if (!k.endsWith('*')) {
          return false;
        }
        return value.startsWith(k.substring(0, k.length - 1));
      });
      if (key) {
        return TYPE_ICONS[key];
      }
    }
    return 'far fa-file';
  }
}
