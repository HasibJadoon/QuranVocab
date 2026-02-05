import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import PullToRefresh from 'pulltorefreshjs';
import { Observable } from 'rxjs';

export interface IPullToRefreshOptions {
  refresh?: () => void; // if not provided, default : window.location.reload();

  mainElement?: string; // default : '#appBody' (body dans le menuLayout)
  iconRefreshing?: string; // default : '<i class="fas fa-spinner fa-pulse" aria-hidden="true"></i>'
  instructionsPullToRefresh?: string; // default : this.translateService.instant('PULL_TO_REFRESH.PULL_DOWN_TO_REFRESH')
  instructionsReleaseToRefresh?: string; // default : this.translateService.instant('PULL_TO_REFRESH.RELEASE_TO_REFRESH')
  instructionsRefreshing?: string; // default : this.translateService.instant('PULL_TO_REFRESH.REFRESHING')
}

@Injectable({ providedIn: 'root' })
export class McitPullToRefreshService {
  constructor(private translateService: TranslateService) {}

  init(ptrOptions?: IPullToRefreshOptions): void {
    PullToRefresh.init({
      mainElement: ptrOptions?.mainElement ?? '#appBody',
      iconRefreshing: ptrOptions?.iconRefreshing ?? '<i class="fas fa-spinner fa-pulse" aria-hidden="true"></i>',
      instructionsPullToRefresh: ptrOptions?.instructionsPullToRefresh ?? this.translateService.instant('PULL_TO_REFRESH.PULL_DOWN_TO_REFRESH'),
      instructionsReleaseToRefresh: ptrOptions?.instructionsReleaseToRefresh ?? this.translateService.instant('PULL_TO_REFRESH.RELEASE_TO_REFRESH'),
      instructionsRefreshing: ptrOptions?.instructionsRefreshing ?? this.translateService.instant('PULL_TO_REFRESH.REFRESHING'),
      onRefresh() {
        return ptrOptions?.refresh ? ptrOptions?.refresh() : window.location.reload();
      }
    });
  }

  destroy(): void {
    PullToRefresh.destroyAll();
  }
}
