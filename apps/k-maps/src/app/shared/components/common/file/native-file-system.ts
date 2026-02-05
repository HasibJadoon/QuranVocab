import { Injectable } from '@angular/core';
import { Entry, File as FileIonicNative, FileEntry, FileError, IFile } from '@awesome-cordova-plugins/file/ngx';
import { McitCoreEnv } from '@lib-shared/common/helpers/provider.helper';
import { v4 as uuid } from 'uuid';
import { EMPTY, from, Observable, of } from 'rxjs';
import { IAttachment } from '@lib-shared/common/models/attachments.model';
import { catchError, concatMap, defaultIfEmpty, filter, map, tap, toArray } from 'rxjs/operators';
import { doCatch, logError } from '../helpers/error.helper';
import * as lodash from 'lodash';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';

export const mimeTypesRef = [
  { ext: 'csv', mimeType: 'text/csv' },
  { ext: 'doc', mimeType: 'application/msword' },
  { ext: 'docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { ext: 'jpeg', mimeType: 'image/jpeg' },
  { ext: 'jpg', mimeType: 'image/jpeg' },
  { ext: 'odp', mimeType: 'application/vnd.oasis.opendocument.presentation' },
  { ext: 'ods', mimeType: 'application/vnd.oasis.opendocument.spreadsheet' },
  { ext: 'odt', mimeType: 'application/vnd.oasis.opendocument.text' },
  { ext: 'png', mimeType: 'image/png' },
  { ext: 'pdf', mimeType: 'application/pdf' },
  { ext: 'ppt', mimeType: 'application/vnd.ms-powerpoint' },
  { ext: 'pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
  { ext: 'tif', mimeType: 'image/tiff' },
  { ext: 'tiff', mimeType: 'image/tiff' },
  { ext: 'txt', mimeType: 'text/*' },
  { ext: 'xls', mimeType: 'application/vnd.ms-excel' },
  { ext: 'xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
];

export interface IFileInfos {
  [fileName: string]: Partial<IFile>;
}

export interface IRepositoryInfos {
  [dirOrFileName: string]: IRepositoryInfos | IFileInfos;
}
declare let cordova;

@TraceErrorClass()
@Injectable()
export class McitNativeFileSystem {
  constructor(private fileIonicNative: FileIonicNative, private env: McitCoreEnv) {}

  b64ToFile(b64: string, filename?: string): File {
    if (!b64?.length) {
      throw new Error(`No b64 provided in b64ToFile`);
    }
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    const byteString = atob(b64.split(',')[1]);
    // separate out the mime component
    const mimeString = b64.split(',')[0].split(':')[1].split(';')[0];
    // write the bytes of the string to an ArrayBuffer
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    const blob: any = new Blob([ab], { type: mimeString });
    blob.lastModifiedDate = new Date();
    blob.name = filename || `file_${uuid()}` + blob.type.replace('/', '.');

    return blob as File;
  }

  bufferToFile(buffer: ArrayBuffer, mimeType: string, filename?: string): File {
    if (!buffer) {
      throw new Error(`No buffer provided in bufferToFile`);
    }
    if (!mimeType?.length) {
      throw new Error(`No mimeType provided in bufferToFile`);
    }
    const blob: any = new Blob([buffer], { type: mimeType });
    blob.lastModifiedDate = new Date();
    blob.name = filename || `file_${uuid()}` + blob.type.replace('/', '.');
    return blob as File;
  }

  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  getBase64(file: Blob): Observable<string> {
    if (!file) {
      throw new Error(`No file provided in getBase64`);
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    return new Observable((observer) => {
      reader.onloadend = () => {
        observer.next(reader.result as string);
        observer.complete();
      };
      reader.onerror = (error) => observer.error(error);
    });
  }

  convertToFormData(file: File | Blob, name: string): FormData {
    if (!file) {
      throw new Error(`No file provided in convertToFormData`);
    }
    if (!name?.length) {
      logError(`No name provided in convertToFormData`, { infos: { name: name ?? 'null or undefined' } });
    }
    const formData: FormData = new FormData();
    formData.append('file', file, name);
    return formData;
  }

  localUrlToAttach64(localUrl: string): Observable<IAttachment> {
    if (!localUrl?.length) {
      throw new Error(`No localUrl provided in localUrlToAttach64`);
    }

    const localUrlSplitted = localUrl?.split('/');
    const fileName = decodeURI(localUrlSplitted?.pop());
    const directoryUrl = localUrlSplitted?.join('/');

    if (!directoryUrl?.length) {
      throw new Error(`No directoryUrl found in localUrlToAttach64`);
    }
    if (!fileName?.length) {
      throw new Error(`No fileName found in localUrlToAttach64`);
    }

    return this.env.cordova
      ? from(this.fileIonicNative.readAsDataURL(directoryUrl, fileName)).pipe(
          map((b64: string) => ({
            base64: b64,
            name: fileName
          })),
          catchError((err) => doCatch('_localUrlToAttach64', err))
        )
      : EMPTY;
  }

  upsertDirectory(pathToDirectory: string, directoryName: string): Observable<boolean> {
    if (!pathToDirectory?.length) {
      throw new Error(`No pathToDirectory provided in upsertDirectory`);
    }
    if (!directoryName?.length) {
      throw new Error(`No directoryName provided in upsertDirectory`);
    }
    return this.env.cordova ? from(this.fileIonicNative.checkDir(pathToDirectory, directoryName)).pipe(catchError(() => from(this.fileIonicNative.createDir(pathToDirectory, directoryName, true)).pipe(map(() => true)))) : EMPTY;
  }

  writeToLocalAttachment(att: IAttachment | null, directoryName: string, filename: string, buffer: ArrayBuffer | Blob, type: string): Observable<IAttachment> {
    const dataDirectoryName = this.fileIonicNative.externalDataDirectory ?? this.fileIonicNative.dataDirectory;
    if (!dataDirectoryName) {
      throw new Error(`No this.fileIonicNative.externalDataDirectory ?? this.fileIonicNative.dataDirectory provided in writeToLocalAttachment`);
    }
    if (!directoryName?.length) {
      throw new Error(`No directoryName provided in writeToLocalAttachment`);
    }
    if (!filename?.length) {
      throw new Error(`No filename provided in writeToLocalAttachment`);
    }
    if (!buffer) {
      throw new Error(`No buffer provided in writeToLocalAttachment`);
    }
    if (!type?.length) {
      throw new Error(`No type provided in writeToLocalAttachment`);
    }
    return this.env.cordova
      ? this.upsertDirectory(dataDirectoryName, directoryName).pipe(
          concatMap(() => this.fileIonicNative.writeFile(`${dataDirectoryName}/${directoryName}`, filename, buffer, { replace: true })),
          tap((fileEntry) => {
            if (!fileEntry) {
              throw new Error(`Null fileEntry in writeToLocalAttachment`);
            }
          }),
          map((fileEntry) => ({
            ...(att ?? {}),
            name: att?.name ?? fileEntry.name,
            local_url: fileEntry.toInternalURL(),
            type: att?.type ?? type,
            sync_id: att?.sync_id ?? uuid(),
            is_loaded: att?.is_loaded ?? true
          })),
          catchError((err) => doCatch('_writeToLocalAttachment', err))
        )
      : EMPTY;
  }

  moveFileToDataDirectory(localUrl: string, directoryName: string, withScanPdf?: boolean): Observable<Entry> {
    if (this.env.cordova) {
      const dataDirectoryName = this.fileIonicNative.externalDataDirectory ?? this.fileIonicNative.dataDirectory;
      if (!dataDirectoryName) {
        throw new Error(`No this.fileIonicNative.externalDataDirectory ?? this.fileIonicNative.dataDirectory provided in moveFileToDataDirectory`);
      }
      if (!localUrl?.length) {
        throw new Error(`No localUrl provided in moveFileToDataDirectory`);
      }
      if (!directoryName?.length) {
        throw new Error(`No directoryName provided in moveFileToDataDirectory`);
      }
      const localUrlSplitted = localUrl?.split('/');
      const fileName = localUrlSplitted?.pop();
      const directoryUrl = localUrlSplitted?.join('/');

      if (!directoryUrl?.length) {
        throw new Error(`No directoryUrl found in moveFileToDataDirectory`);
      }
      if (!fileName?.length) {
        throw new Error(`No fileName found in moveFileToDataDirectory`);
      }
      const dataDirectory = dataDirectoryName;
      return from(directoryName ? this.upsertDirectory(dataDirectory, directoryName) : of(true)).pipe(
        concatMap(() => from(this.fileIonicNative.moveFile(directoryUrl, fileName, directoryName ? `${dataDirectory}/${directoryName}` : dataDirectory, ''))),
        catchError((err) => doCatch('_moveFileToDataDirectory', err))
      );
    } else {
      return EMPTY;
    }
  }

  deleteFileFromLocalUrl(localUrl: string): Observable<any> {
    if (!localUrl?.length) {
      throw new Error(`No localUrl provided in deleteFileFromLocalUrl`);
    }
    const localUrlSplitted = localUrl?.split('/');
    const directoryName = localUrlSplitted?.pop();
    const directoryUrl = localUrlSplitted?.join('/');

    if (!directoryUrl?.length) {
      throw new Error(`No directoryUrl found in deleteFileFromLocalUrl`);
    }
    if (!directoryName?.length) {
      throw new Error(`No directoryName found in deleteFileFromLocalUrl`);
    }

    return this.env.cordova ? from(this.fileIonicNative.removeFile(directoryUrl, directoryName)) : EMPTY;
  }

  deleteDirectory(directoryName: string): Observable<any> {
    if (!directoryName?.length) {
      throw new Error(`No directoryName found in deleteDirectory`);
    }
    if (this.env.cordova) {
      const dataDirectoryName = this.fileIonicNative.externalDataDirectory ?? this.fileIonicNative.dataDirectory;
      if (!dataDirectoryName) {
        throw new Error(`No this.fileIonicNative.externalDataDirectory ?? this.fileIonicNative.dataDirectory provided in deleteDirectory`);
      }
      return from(this.fileIonicNative.removeRecursively(dataDirectoryName, directoryName)).pipe(
        catchError((err: FileError) => {
          // { code: 1; message: "NOT_FOUND_ERR" }
          if (err?.code === 1) {
            return of(true);
          }
          return doCatch('_deleteDirectory', err);
        })
      );
    } else {
      return EMPTY;
    }
  }

  clearDirectories(): Observable<any> {
    if (!this.env.cordova) {
      return of(null);
    } else {
      let dataDirectory;
      let cacheDirectory;
      const dataDirectoryName = this.fileIonicNative.externalDataDirectory ?? this.fileIonicNative.dataDirectory;
      if (!dataDirectoryName) {
        throw new Error(`No this.fileIonicNative.externalDataDirectory ?? this.fileIonicNative.dataDirectory provided in clearDirectories`);
      } else {
        dataDirectory = this._buildUrlNameDirectoryFromURL(dataDirectoryName);
      }
      const cacheDirectoryName = this.fileIonicNative.externalCacheDirectory ?? this.fileIonicNative.cacheDirectory;
      if (!cacheDirectoryName) {
        logError(`No this.fileIonicNative.externalCacheDirectory ?? this.fileIonicNative.cacheDirectory provided in clearDirectories`, { infos: { fileIonicNativeCacheDirectory: cacheDirectoryName } });
      } else {
        cacheDirectory = this._buildUrlNameDirectoryFromURL(cacheDirectoryName);
      }
      return from(lodash.compact([dataDirectory, cacheDirectory])).pipe(
        concatMap((directory) =>
          from(this.fileIonicNative.listDir(directory?.dirUrl, directory?.dirName)).pipe(
            concatMap((filesAndDirectories) => (filesAndDirectories?.length ? from(filesAndDirectories) : of(null))),
            filter((b) => !!b),
            concatMap((fileOrDirectory) =>
              fileOrDirectory.isDirectory
                ? this.fileIonicNative.removeRecursively(`${directory?.dirUrl}/${directory?.dirName}`, fileOrDirectory.name)
                : this.fileIonicNative.removeFile(`${directory?.dirUrl}/${directory?.dirName}`, fileOrDirectory.name)
            ),
            defaultIfEmpty(null)
          )
        ),
        catchError((err) => doCatch('_clearDirectories', err))
      );
    }
  }

  findMimeType(filenameWithExt: string): string {
    if (!filenameWithExt?.length) {
      throw new Error(`No filenameWithExt provided in findMimeType`);
    }
    const mimeTypeElt = mimeTypesRef.find((mt) => mt.ext === filenameWithExt.split('.').pop().toLowerCase());
    return mimeTypeElt !== undefined ? mimeTypeElt.mimeType : 'application/octet-stream';
  }

  openFile(localUrl: string, mimeType: string): Observable<any> {
    if (!this.env.cordova) {
      return of(null);
    }
    if (!localUrl?.length) {
      throw new Error(`No localUrl provided in openFile`);
    }
    if (!mimeType?.length) {
      throw new Error(`No mimeType provided in openFile`);
    }
    return from(this.fileIonicNative.resolveLocalFilesystemUrl(localUrl)).pipe(
      tap((fileEntry) => cordova.plugins.fileOpener2.open(fileEntry.nativeURL, mimeType)),
      catchError((err) => doCatch(`Error opening file ${localUrl}`, err))
    );
  }

  openFileMultiPlatforms(blob: Blob, directoryName: string, filename: string): Observable<any> {
    if (!blob) {
      throw new Error(`No blob provided in openFileMultiPlatforms`);
    }
    if (!directoryName?.length) {
      throw new Error(`No directoryName provided in openFileMultiPlatforms`);
    }
    if (!filename?.length) {
      throw new Error(`No filename provided in openFileMultiPlatforms`);
    }
    return this.env.cordova ? this._openFileFromBlob(blob, directoryName, filename) : this._openFileBrowser(blob, filename);
  }

  fileEntryFileToPromise(fileEntry: FileEntry): Promise<IFile> {
    if (!fileEntry) {
      throw new Error(`No fileEntry provided in fileEntryFileToPromise`);
    }
    return new Promise<IFile>((resolve, reject) =>
      fileEntry.file(
        (result) => resolve(result),
        (error) => reject(error)
      )
    );
  }

  getInfosDataDirectory(): Observable<{
    data: IRepositoryInfos;
    sizeTotal: number;
    totalItems: number;
  }> {
    if (!this.env.cordova) {
      return of(null);
    } else {
      let dataDirectory;
      const dataDirectoryName = this.fileIonicNative.externalDataDirectory ?? this.fileIonicNative.dataDirectory;
      if (!dataDirectoryName) {
        throw new Error(`No this.fileIonicNative.externalDataDirectory ?? this.fileIonicNative.dataDirectory provided in getInfosDataDirectory`);
      } else {
        dataDirectory = this._buildUrlNameDirectoryFromURL(dataDirectoryName);
      }
      return this._getMetadataFromRepository(dataDirectory?.dirUrl, dataDirectory?.dirName).pipe(
        map((dataInfos) => ({
          data: dataInfos?.data,
          sizeTotal: dataInfos?.sizeTotal.toFixed(2) + ' Mo',
          totalItems: dataInfos?.totalItems
        })),
        catchError((err) => doCatch('_getInfosDataDirectory', err))
      );
    }
  }

  private _openFileBrowser(blob: Blob, name: string): Observable<any> {
    if (!blob) {
      throw new Error(`No blob provided in _openFileBrowser`);
    }
    if (!name?.length) {
      throw new Error(`No name provided in _openFileBrowser`);
    }
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(function () {
      // For Firefox it is necessary to delay revoking the ObjectURL
      window.URL.revokeObjectURL(url);
    }, 100);
    return of(true);
  }

  private _openFileFromBlob(blob: Blob, directoryName: string, filename: string): Observable<any> {
    if (!this.env.cordova) {
      return of(null);
    } else {
      if (!blob) {
        throw new Error(`No blob provided in _openFileFromBlob`);
      }
      if (!directoryName?.length) {
        throw new Error(`No directoryName provided in _openFileFromBlob`);
      }
      if (!filename?.length) {
        throw new Error(`No filename provided in _openFileFromBlob`);
      }
      return this.writeToLocalAttachment(null, directoryName, filename, blob, this.findMimeType(filename)).pipe(
        concatMap((att: IAttachment) => this.openFile(att?.local_url, att?.type)),
        catchError((err) => doCatch(`Error opening file from blob ${directoryName + '/' + filename}`, err))
      );
    }
  }

  private _getMetadataFromRepository(
    parentUrl: string,
    repositoryName: string
  ): Observable<{
    data: IRepositoryInfos;
    sizeTotal: number;
    totalItems: number;
  }> {
    if (!parentUrl?.length) {
      throw new Error(`No parentUrl provided in _getMetadataFromRepository`);
    }
    if (!repositoryName?.length) {
      throw new Error(`No repositoryName provided in _getMetadataFromRepository`);
    }
    return from(this.fileIonicNative.listDir(parentUrl, repositoryName)).pipe(
      filter((filesAndDirectories) => !!filesAndDirectories?.length),
      concatMap((filesAndDirectories) => from(filesAndDirectories)),
      concatMap((fileOrDirectory) => (fileOrDirectory.isDirectory ? this._getMetadataFromRepository(`${parentUrl}/${repositoryName}`, fileOrDirectory?.name) : this._getMetadataFromFile(fileOrDirectory as FileEntry))),
      toArray(),
      map((res) => {
        let repositoryInfos: IRepositoryInfos;
        res.forEach((objWithMetadata) => (repositoryInfos = lodash.merge(objWithMetadata?.data ?? objWithMetadata, repositoryInfos)));
        return {
          data: {
            [repositoryName]: repositoryInfos
          },
          sizeTotal: res?.reduce((acc, value) => value.sizeTotal ?? Object.values(value)?.[0].size + acc, 0),
          totalItems: res?.reduce((acc, value) => (value?.totalItems as number) ?? (!!Object.values(value)?.[0]?.size ? 1 : 0) + acc, 0)
        };
      })
    );
  }

  private _getMetadataFromFile(file: FileEntry): Observable<IFileInfos> {
    if (!file) {
      throw new Error(`No file provided in _getMetadataFromFile`);
    }
    return from(this.fileEntryFileToPromise(file)).pipe(
      filter((b) => !!b),
      map((iFile) => ({
        [iFile.name.replace(/[.]/gm, '_')]: {
          name: iFile.name,
          size: Number((iFile.size / (1024 * 1024)).toFixed(2)),
          localUrl: iFile.localURL,
          type: iFile.type
        }
      }))
    );
  }

  private _buildUrlNameDirectoryFromURL(url: string): {
    dirUrl: string;
    dirName: string;
  } {
    if (!url?.length) {
      throw new Error(`No url provided in _buildUrlNameDirectoryFromURL`);
    }
    const urlCacheSplitted = url.slice(0, -1).split('/');
    const result = {
      dirName: urlCacheSplitted.pop(),
      dirUrl: urlCacheSplitted.join('/')
    };
    if (!result?.dirName?.length) {
      throw new Error(`No dirName found in _buildUrlNameDirectoryFromURL`);
    }
    if (!result?.dirUrl?.length) {
      throw new Error(`No dirUrl found in _buildUrlNameDirectoryFromURL`);
    }
    return result;
  }
}
