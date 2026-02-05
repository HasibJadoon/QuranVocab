import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { McitUrlHelperService } from '../../services/url-helper.service';
import { McitCoreEnv } from '../../helpers/provider.helper';

// Using similarity from AsyncPipe to avoid having to pipe |secure|async in HTML.
@Pipe({
  name: 'secure',
  pure: false
})
export class McitSecurePipe implements PipeTransform, OnDestroy {
  private _latestValue: any = null;
  private _latestReturnedValue: any = null;
  private _subscription: Subscription = null;
  private _obj: Observable<SafeUrl> = null;

  private previousUrl: string;
  private _result: BehaviorSubject<SafeUrl> = new BehaviorSubject(null);
  private result: Observable<SafeUrl> = this._result.asObservable();
  private _internalSubscription: Subscription = null;

  constructor(private _ref: ChangeDetectorRef, private urlHelperService: McitUrlHelperService, private sanitizer: DomSanitizer, private env: McitCoreEnv) {}

  ngOnDestroy(): void {
    if (this._subscription) {
      this._dispose();
    }
  }

  transform(url: string): any {
    if (url && url.startsWith('data')) {
      return url;
    }

    if (this.env.useCookie) {
      return url;
    }

    const obj = this.internalTransform(url);
    return this.asyncTransform(obj);
  }

  private internalTransform(url: string): Observable<SafeUrl> {
    if (!url) {
      return this.result;
    }

    if (this.previousUrl !== url) {
      this.previousUrl = url;
      this._internalSubscription = this.urlHelperService.get(url).subscribe((m) => {
        const sanitized = this.sanitizer.bypassSecurityTrustUrl(m);
        this._result.next(sanitized);
      });
    }

    return this.result;
  }

  private asyncTransform(obj: Observable<SafeUrl | string>): any {
    if (!this._obj) {
      if (obj) {
        this._subscribe(obj);
      }
      this._latestReturnedValue = this._latestValue;
      return this._latestValue;
    }
    if (obj !== this._obj) {
      this._dispose();
      return this.asyncTransform(obj);
    }
    if (this._latestValue === this._latestReturnedValue) {
      return this._latestReturnedValue;
    }
    this._latestReturnedValue = this._latestValue;
    return this._latestValue;
  }

  private _subscribe(obj: Observable<SafeUrl | string>) {
    this._obj = obj;

    this._subscription = obj.subscribe({
      next: (value) => this._updateLatestValue(obj, value),
      error: (e: any) => {
        throw e;
      }
    });
  }

  private _dispose() {
    this._subscription.unsubscribe();
    this._internalSubscription.unsubscribe();
    this._internalSubscription = null;
    this._latestValue = null;
    this._latestReturnedValue = null;
    this._subscription = null;
    this._obj = null;
  }

  private _updateLatestValue(async: any, value: SafeUrl | string) {
    if (async === this._obj) {
      this._latestValue = value;
      this._ref.markForCheck();
    }
  }
}
