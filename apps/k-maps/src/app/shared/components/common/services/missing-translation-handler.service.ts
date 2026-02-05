import { MissingTranslationHandler, MissingTranslationHandlerParams } from '@ngx-translate/core';

export class McitMissingTranslationHandler implements MissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams) {
    if (params.interpolateParams && params.interpolateParams['default']) {
      return params.translateService.instant(params.interpolateParams['default']);
    }
    return '!' + params.key + '!';
  }
}
