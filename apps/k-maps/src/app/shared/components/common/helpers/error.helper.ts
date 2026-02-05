import { HttpErrorResponse } from '@angular/common/http';
import { McitPopupService } from '@lib-shared/common/services/popup.service';
import { McitWaitingService } from '@lib-shared/common/services/waiting.service';
import * as lodash from 'lodash';
import { Observable, of } from 'rxjs';

export interface ICustomError {
  name?: string;
  message?: string;

  stack?: string[];

  url?: string;
  status?: string;
  statusText?: string;
}

export interface IConsoleArgs {
  message: string;
  others: {
    error?: ICustomError;
    infos?: any;
    pipeline_stack?: IConsoleArgs[];
  };
}

export function doCatch(label: string, error: any, returnValue?: any, popupService?: McitPopupService, waitingService?: McitWaitingService): Observable<any> {
  if (popupService) {
    popupService.showError();
  }
  if (waitingService) {
    waitingService.hideWaiting();
  }
  logError(label, { error });
  if (returnValue !== undefined) {
    return of(returnValue);
  } else {
    throw error;
  }
}

export function formatError(
  message: string,
  extras?: {
    error?: any;
    infos?: any;
  }
): { msg: string; others?: any } {
  if (extras?.error || extras?.infos) {
    let formattedExtras: any = {
      infos: extras?.infos ? lodash.omitBy(extras?.infos, lodash.isNil) : undefined
    };
    if (extras?.error) {
      if (extras.error instanceof HttpErrorResponse) {
        formattedExtras = {
          ...formattedExtras,
          error: lodash.omitBy(
            {
              name: extras.error.name,
              message: extras.error.message,
              url: extras.error.url,
              status: extras.error.status,
              statusText: extras.error.statusText,
              error: extras.error.error
            },
            lodash.isNil
          )
        };
      } else if (extras.error instanceof Error) {
        formattedExtras = {
          ...formattedExtras,
          error: lodash.omitBy(
            {
              name: extras.error.name,
              message: extras.error.message,
              stack: extras.error.stack?.split?.('\n')
            },
            lodash.isNil
          )
        };
      } else {
        let errorString;
        try {
          errorString = extras.error ? JSON.stringify(extras.error) : 'No specific error';
        } catch (err) {
          errorString = extras.error?.toString();
        }
        formattedExtras = {
          ...formattedExtras,
          error: errorString
        };
      }
    }
    return { msg: message, others: lodash.omitBy(formattedExtras, lodash.isNil) };
  } else {
    return { msg: message };
  }
}

export function logError(
  message: string,
  extras?: {
    error?: any;
    infos?: any;
  }
) {
  const formated = formatError(message, extras);
  console.error(formated?.msg, formated?.others);
}
