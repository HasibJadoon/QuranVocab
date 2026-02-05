import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { McitMeaningPipe } from './pipes/meaning.pipe';
import { McitListDicoPipe } from './pipes/list-dico.pipe';
import { McitEntriesPipe } from './pipes/entries.pipe';
import { McitKeysPipe } from './pipes/keys.pipe';
import { McitJoinPipe } from './pipes/join.pipe';
import { McitJoinForTranslatePipe } from './pipes/join-for-translate.pipe';
import { McitDateTranslatePipe } from './pipes/date-translate.pipe';
import { McitSecurePipe } from './pipes/secure.pipe';
import { McitDurationPipe } from './pipes/duration.pipe';
import { McitDistancePipe } from './pipes/distance.pipe';
import { McitCurrencyPipe } from './pipes/currency.pipe';
import { McitTimezonePipe } from './pipes/timezone.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { McitPlaceIconPipe } from './pipes/place-icon.pipe';
import { McitFirstNotNullPipe } from './pipes/first-not-null.pipe';
import { McitRandomColorDirective } from './directives/random-color.directive';
import { McitMarkdownPipe } from './pipes/markdown.pipe';
import { McitCurrencyIconPipe } from './pipes/currency-icon.pipe';
import { McitGroupByPipe } from './pipes/group-by.pipe';
import { McitTranslatedElementDirective } from './directives/translated-element.directive';
import { McitTranslatedContentDirective } from './directives/translated-content.directive';
import { McitAutofocusDirective } from './directives/autofocus.directive';
import { McitIncludePipe } from './pipes/include.pipe';
import { McitCompactPipe } from './pipes/compact.pipe';
import { McitTranscodingPipe } from './pipes/transcoding.pipe';
import { McitServiceTypePipe } from './pipes/service-type.pipe';
import { McitSanitizeHtmlPipe } from './pipes/sanitize-html.pipe';
import { McitNumArrayPipe } from './pipes/num-array.pipe';
import { McitMimeTypeIconPipe } from './pipes/mime-type-icon.pipe';
import { McitMemorySizePipe } from './pipes/memory-size.pipe';
import { McitDateTimeSamePipe } from './pipes/date-time-same.pipe';
import { McitLoadingFactorPipe } from './pipes/loading-factor.pipe';
import { McitFindPipe } from './pipes/find.pipe';
import { McitBooleanTranslatePipe } from './pipes/boolean-translate.pipe';
import { McitValuesPipe } from './pipes/values.pipe';
import { McitSplitPipe } from './pipes/split.pipe';
import { McitDurationDay } from './pipes/duration-day.pipe';
import { McitLimitPipe } from './pipes/limit.pipe';
import { McitSortByCountPipe } from './pipes/sort-by-count.pipe';
import { McitFormatJsonPipe } from './pipes/formatJson.pipe';
import { McitIsObjectDefinedPipe } from './pipes/is-object-defined.pipe';
import { McitLodashGetPipe } from './pipes/lodash-get.pipe';
import { McitLuxonDurationPipe } from './pipes/luxon-duration.pipe';
import { McitFloorPipe } from './pipes/floor.pipe';
import { McitMapPipe } from './pipes/map.pipe';
import { McitConcatPipe } from './pipes/concat.pipe';
import { McitHeadPipe } from './pipes/head.pipe';
import { McitLastPipe } from './pipes/last.pipe';
import { McitFilterPipe } from './pipes/filter.pipe';
import { McitToStringPipe } from './pipes/to-string.pipe';
import { McitIsMatchPipe } from './pipes/is-match.pipe';
import { McitSumPipe } from './pipes/sum.pipe';
import { McitSkipPipe } from './pipes/skip.pipe';
import { McitSortByPipe } from './pipes/sort-by.pipe';
import { McitSearchPipe } from './pipes/search.pipe';
import { DebugPipe } from './pipes/debug.pipe';
import { McitAttachmentToBase64Pipe } from './pipes/attachments-to-base64.pipe';
import { McitFileSizePipe } from './pipes/file-size.pipe';
import { McitGetIconFromExtentionPipe } from './pipes/get-icon-from-extention.pipe';
import { McitMinPipe } from './pipes/min.pipe';
import { McitMaxPipe } from './pipes/max.pipe';
import { McitUniquePipe } from './pipes/unique.pipe';
import { McitPricingLineParameterPipe } from './pipes/pricing-line-parameter.pipe';
import { McitNativeFileSystemModule } from '@lib-shared/common/file/native-file-system.module';
import { McitToObservablePipe } from '@lib-shared/common/common/pipes/to-observable.pipe';
import { McitDurationFormatPipe } from '@lib-shared/common/common/pipes/duration-format.pipe';
import { McitExistsPipe } from '@lib-shared/common/common/pipes/exists.pipe';
import { McitAttachmentMetadataPipe } from '@lib-shared/common/common/pipes/attachment-metadata.pipe';
import { McitRoundPricePipe } from '@lib-shared/common/common/pipes/round_price.pipe';
import { McitTextTruncatePipe } from '@lib-shared/common/common/pipes/text-truncate.pipe';
import { McitInvoicedLockPipe } from '@lib-shared/common/common/pipes/to-lock.pipe';
import { McitDurationDayHourMinuteSecondPipe } from './pipes/duration-day-hour-minute-second.pipe';
import { McitDurationHourMinutePipe } from './pipes/duration-hour-minute.pipe';
import { McitExecServicePipe } from './pipes/exec-service.pipe';
import { McitDescriptionResourcePipe } from '@lib-shared/common/common/pipes/description-resource.pipe';
import { ContractVersionActivePipe } from './pipes/contract-version-active.pipe';
import { CountryPipe } from './pipes/country.pipe';

@NgModule({
  imports: [CommonModule, TranslateModule, McitNativeFileSystemModule],
  providers: [DecimalPipe],
  declarations: [
    McitMeaningPipe,
    McitListDicoPipe,
    McitEntriesPipe,
    McitKeysPipe,
    McitJoinPipe,
    McitJoinForTranslatePipe,
    McitDateTranslatePipe,
    McitSecurePipe,
    McitDurationPipe,
    McitDistancePipe,
    McitCurrencyPipe,
    McitTimezonePipe,
    McitPlaceIconPipe,
    McitFirstNotNullPipe,
    McitRandomColorDirective,
    McitMarkdownPipe,
    McitRandomColorDirective,
    McitCurrencyIconPipe,
    McitGroupByPipe,
    McitTranslatedElementDirective,
    McitTranslatedContentDirective,
    McitAutofocusDirective,
    McitIncludePipe,
    McitCompactPipe,
    McitTranscodingPipe,
    McitServiceTypePipe,
    McitSanitizeHtmlPipe,
    McitNumArrayPipe,
    McitMimeTypeIconPipe,
    McitMemorySizePipe,
    McitDateTimeSamePipe,
    McitLoadingFactorPipe,
    McitFindPipe,
    McitBooleanTranslatePipe,
    McitValuesPipe,
    McitSplitPipe,
    McitDurationDay,
    McitLimitPipe,
    McitSortByCountPipe,
    McitFormatJsonPipe,
    McitIsObjectDefinedPipe,
    McitLodashGetPipe,
    McitLuxonDurationPipe,
    McitFloorPipe,
    McitMapPipe,
    McitConcatPipe,
    McitHeadPipe,
    McitLastPipe,
    McitFilterPipe,
    McitToStringPipe,
    McitToObservablePipe,
    McitIsMatchPipe,
    McitSumPipe,
    McitSkipPipe,
    McitSortByPipe,
    McitSearchPipe,
    DebugPipe,
    McitAttachmentToBase64Pipe,
    McitFileSizePipe,
    McitGetIconFromExtentionPipe,
    McitMinPipe,
    McitMaxPipe,
    McitUniquePipe,
    McitPricingLineParameterPipe,
    McitRoundPricePipe,
    McitDurationFormatPipe,
    McitExistsPipe,
    McitAttachmentMetadataPipe,
    McitTextTruncatePipe,
    McitInvoicedLockPipe,
    McitDurationDayHourMinuteSecondPipe,
    McitDurationHourMinutePipe,
    McitExecServicePipe,
    McitDescriptionResourcePipe,
    ContractVersionActivePipe,
    CountryPipe
  ],
  exports: [
    McitMeaningPipe,
    McitListDicoPipe,
    McitEntriesPipe,
    McitKeysPipe,
    McitJoinPipe,
    McitJoinForTranslatePipe,
    McitDateTranslatePipe,
    McitSecurePipe,
    McitDurationPipe,
    McitDistancePipe,
    McitCurrencyPipe,
    McitTimezonePipe,
    McitPlaceIconPipe,
    McitFirstNotNullPipe,
    McitRandomColorDirective,
    McitMarkdownPipe,
    McitRandomColorDirective,
    McitCurrencyIconPipe,
    McitGroupByPipe,
    McitTranslatedElementDirective,
    McitTranslatedContentDirective,
    McitAutofocusDirective,
    McitIncludePipe,
    McitCompactPipe,
    McitTranscodingPipe,
    McitServiceTypePipe,
    McitSanitizeHtmlPipe,
    McitNumArrayPipe,
    McitMimeTypeIconPipe,
    McitMemorySizePipe,
    McitDateTimeSamePipe,
    McitLoadingFactorPipe,
    McitFindPipe,
    McitBooleanTranslatePipe,
    McitValuesPipe,
    McitSplitPipe,
    McitDurationDay,
    McitLimitPipe,
    McitSortByCountPipe,
    McitFormatJsonPipe,
    McitIsObjectDefinedPipe,
    McitLodashGetPipe,
    McitLuxonDurationPipe,
    McitFloorPipe,
    McitMapPipe,
    McitConcatPipe,
    McitHeadPipe,
    McitLastPipe,
    McitFilterPipe,
    McitIsMatchPipe,
    McitSumPipe,
    McitSkipPipe,
    McitSortByPipe,
    McitSearchPipe,
    McitAttachmentToBase64Pipe,
    McitFileSizePipe,
    McitGetIconFromExtentionPipe,
    McitMinPipe,
    McitMaxPipe,
    McitUniquePipe,
    McitPricingLineParameterPipe,
    McitToObservablePipe,
    McitDurationFormatPipe,
    McitExistsPipe,
    McitAttachmentMetadataPipe,
    McitRoundPricePipe,
    McitToStringPipe,
    McitTextTruncatePipe,
    McitInvoicedLockPipe,
    McitDurationDayHourMinuteSecondPipe,
    McitDurationHourMinutePipe,
    McitExecServicePipe,
    McitDescriptionResourcePipe,
    ContractVersionActivePipe,
    CountryPipe
  ]
})
export class McitCommonModule {}
