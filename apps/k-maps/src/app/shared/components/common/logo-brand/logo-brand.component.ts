import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { LogoBrandService } from './logo-brand.service';
import * as lodash from 'lodash';

export type NotFoundType = 'none' | 'icon' | 'image';

export interface IOptions {
  notFound?: {
    type: NotFoundType;
    icon?: {
      icon: string;
    };
    image?: {
      src: string;
    };
  };
}

const DEFAULT_OPTIONS: IOptions = {
  notFound: {
    type: 'icon',
    icon: {
      icon: 'fal fa-exclamation'
    },
    image: {
      src: './assets/shared/unavailable.png'
    }
  }
};

@Component({
  selector: 'mcit-logo-brand',
  templateUrl: './logo-brand.component.html',
  styleUrls: ['./logo-brand.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class McitLogoBrandComponent {
  private _code: string;

  @Input()
  set code(code: string) {
    this.notFoundBrand = this.logoBrandService.isNotFoundBrand(code);
    this._code = code;
  }

  get code(): string {
    return this._code;
  }

  @Input()
  width: string;
  @Input()
  height: string;

  private _options: IOptions = DEFAULT_OPTIONS;

  @Input()
  set options(options: IOptions) {
    this._options = lodash.defaultsDeep(options, DEFAULT_OPTIONS);
  }

  get options(): IOptions {
    return this._options;
  }

  notFoundBrand = false;

  constructor(private logoBrandService: LogoBrandService, private changeDetectorRef: ChangeDetectorRef) {}

  doNotFoundBrand(code: string): void {
    this.notFoundBrand = true;
    this.logoBrandService.notFoundBrand(code);

    this.changeDetectorRef.detectChanges();
  }
}
