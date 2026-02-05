import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { McitDistanceFormatChangeEvent, McitDistanceService } from '../../services/distance.service';
import { Subscription } from 'rxjs';

@Pipe({
  name: 'distance',
  pure: false
})
export class McitDistancePipe implements PipeTransform, OnDestroy {
  private value: string;
  private lastValue: any;
  private onDistanceFormatChange: Subscription;

  constructor(private distanceService: McitDistanceService, private changeDectectorRef: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this._dispose();
  }

  transform(value: number): string {
    if (value == null) {
      return null;
    }

    if (value === this.lastValue) {
      return this.value;
    }

    this.lastValue = value;

    this.updateValue(value, this.distanceService.currentDistanceFormat);

    this._dispose();

    if (!this.onDistanceFormatChange) {
      this.onDistanceFormatChange = this.distanceService.onDistanceFormatChangeEvent.subscribe((event: McitDistanceFormatChangeEvent) => {
        this.updateValue(value, event.distanceFormat);
      });
    }

    return this.value;
  }

  private updateValue(value: number, format: string): void {
    this.value = this.distanceService.getDistance(value);

    this.changeDectectorRef.markForCheck();
  }

  private _dispose(): void {
    if (typeof this.onDistanceFormatChange !== 'undefined') {
      this.onDistanceFormatChange.unsubscribe();
      this.onDistanceFormatChange = undefined;
    }
  }
}
