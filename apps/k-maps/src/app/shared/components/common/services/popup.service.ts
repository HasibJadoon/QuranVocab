import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { ActiveToast } from 'ngx-toastr/toastr/toastr.service';
import { IndividualConfig } from 'ngx-toastr/toastr/toastr-config';

export interface McitPopupConfig {
  messageParams?: object;
  titleKey?: string;
  titleParams?: object;
  messageTranslate?: boolean;
  override?: Partial<IndividualConfig>;
}

export interface McitPopupCustomVariables {
  contract_code?: string;
  owner_code?: string;
  owner_name?: string;
  billed_customer_code?: string;
  billed_customer_name?: string;
}

const DEFAULT_ERROR_CONFIG: McitPopupConfig = {
  messageParams: {},
  titleKey: 'COMMON.ERROR',
  titleParams: {},
  messageTranslate: true,
  override: {
    timeOut: 4000,
    positionClass: 'mcit-toast-top-right'
  }
};

const DEFAULT_SUCCESS_CONFIG: McitPopupConfig = {
  messageParams: {},
  titleKey: 'COMMON.SUCCESS',
  titleParams: {},
  messageTranslate: true,
  override: {
    timeOut: 2000,
    positionClass: 'mcit-toast-top-right'
  }
};

const DEFAULT_CONFIG: McitPopupConfig = {
  messageParams: {},
  titleKey: null,
  titleParams: {},
  messageTranslate: true,
  override: {
    timeOut: 2000,
    positionClass: 'mcit-toast-top-right'
  }
};

const DEFAULT_TITLES = {
  success: 'COMMON.SUCCESS',
  error: 'COMMON.ERROR',
  warning: 'COMMON.WARNING',
  info: 'COMMON.INFO'
};

const DEFAULT_CLASSES = {
  error: 'toast-error',
  info: 'toast-info',
  success: 'toast-success',
  warning: 'toast-warning'
};

@Injectable({
  providedIn: 'root'
})
export class McitPopupService {
  constructor(private translateService: TranslateService, private toastrService: ToastrService) {}

  showError(messageKey: string | any = 'COMMON.SERVER_ERROR', config: McitPopupConfig = {}): ActiveToast<any> {
    const newMessage = this.getErrorMessage(messageKey);
    const o = Object.assign({}, DEFAULT_ERROR_CONFIG.override, config.override);
    const c = Object.assign({}, DEFAULT_ERROR_CONFIG, config, { override: o });

    return this.toastrService.error(c.messageTranslate ? this.translateService.instant(newMessage, c.messageParams) : newMessage, this.translateService.instant(c.titleKey, c.titleParams), c.override);
  }

  showSuccess(messageKey: string, config: McitPopupConfig = {}): ActiveToast<any> {
    const o = Object.assign({}, DEFAULT_SUCCESS_CONFIG.override, config.override);
    const c = Object.assign({}, DEFAULT_SUCCESS_CONFIG, config, { override: o });
    return this.toastrService.success(c.messageTranslate ? this.translateService.instant(messageKey, c.messageParams) : messageKey, this.translateService.instant(c.titleKey, c.titleParams), c.override);
  }

  show(type: 'success' | 'error' | 'warning' | 'info', messageKey: string, config: McitPopupConfig = {}): ActiveToast<any> {
    const o = Object.assign({}, DEFAULT_CONFIG.override, config.override);
    const c = Object.assign({}, DEFAULT_CONFIG, { titleKey: DEFAULT_TITLES[type] }, config, { override: o });
    return this.toastrService.show(c.messageTranslate ? this.translateService.instant(messageKey, c.messageParams) : messageKey, this.translateService.instant(c.titleKey, c.titleParams), c.override, DEFAULT_CLASSES[type]);
  }

  showErrorWithCustomVariables(messageKey: string, config: McitPopupConfig = {}, customVars: McitPopupCustomVariables = {}): ActiveToast<any> {
    const o = Object.assign({}, DEFAULT_ERROR_CONFIG.override, config.override);
    const c = Object.assign({}, DEFAULT_ERROR_CONFIG, config, { override: o });

    return this.toastrService.error(
      c.messageTranslate ? this.translateService.instant(messageKey, c.messageParams).replace(/{\w+}/g, (placeholder: string) => customVars[placeholder.substring(1, placeholder.length - 1)] || placeholder) : messageKey,
      this.translateService.instant(c.titleKey, c.titleParams),
      c.override
    );
  }

  getErrorMessage(error: any): string | undefined {
    if (typeof error === 'string') {
      return error;
    }
    const { error: internal } = error ?? {};
    const { error: err, statusCode, error_details, message } = internal ?? {};
    const mmf = `${err ?? ''} ${statusCode ?? ''} ${message ?? ''} ${error_details ?? ''}`.trim() || 'COMMON.SERVER_ERROR';
    return mmf;
  }
}
