import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { Subscription } from 'rxjs';
import { McitDistanceLoadingFactorChangeEvent, McitLoadingFactorEnum, McitLoadingFactorService } from '../../services/loading-factor.service';
import * as lodash from 'lodash';

@Pipe({
  name: 'loadingFactor',
  pure: false
})
export class McitLoadingFactorPipe implements PipeTransform, OnDestroy {
  private value: number;
  private lastValue: any;
  private onLoadingFactorFormatChange: Subscription;

  constructor(private loadingFactorService: McitLoadingFactorService, private changeDectectorRef: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this._dispose();
  }

  transform(value: any, ...args: any[]): any {
    if (value == null) {
      return value;
    }

    if (value === this.lastValue) {
      return this.separateValue(this.value);
    }

    this.lastValue = value;

    this.updateValue(value, this.loadingFactorService.currentLoadingFactorFormat);

    this._dispose();

    if (!this.onLoadingFactorFormatChange) {
      this.onLoadingFactorFormatChange = this.loadingFactorService.onLoadingFactorFormatChangeEvent.subscribe((event: McitDistanceLoadingFactorChangeEvent) => {
        this.updateValue(value, event.loadingFactorFormat);
      });
    }

    return this.separateValue(this.value);
  }

  private updateValue(value: any, format: string): void {
    if (format === McitLoadingFactorEnum.VINS) {
      const vehiclesNb = value.manifests
        ?.filter((manifest) => manifest.vehicles && manifest.vehicles.length > 0)
        .map((manifest) => manifest.vehicles.length)
        .reduce((total, num) => total + num, 0) as number;
      this.value = vehiclesNb || 0;
    } else if (format === McitLoadingFactorEnum.LF) {
      const lfRto = lodash
        .flatMap(value.manifests.filter((manifest) => manifest.vehicles && manifest.vehicles.length > 0).map((manifest) => manifest.vehicles.map((v) => (v.loading_factor as number) || 1)))
        .reduce((total: number, num: number) => total + num, 0) as number;
      this.value = Number.parseFloat(lfRto.toFixed(1));
    }

    this.changeDectectorRef.markForCheck();
  }

  private separateValue(value: number): string[] {
    return value.toString().split('.');
  }

  private _dispose(): void {
    if (typeof this.onLoadingFactorFormatChange !== 'undefined') {
      this.onLoadingFactorFormatChange.unsubscribe();
      this.onLoadingFactorFormatChange = undefined;
    }
  }
}
