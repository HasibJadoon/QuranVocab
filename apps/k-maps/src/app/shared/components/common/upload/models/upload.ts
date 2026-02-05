import { HttpResponse, HttpErrorResponse } from '@angular/common/http';

export interface Upload {
  progress: number;
  done: boolean;
  error: boolean | HttpErrorResponse;
  name: string;
  response?: HttpResponse<any>;
}

export class UploadError extends Error {
  upload: Upload;

  constructor(upload: Upload, message: string) {
    super(message);
    this.upload = upload;
  }
}
