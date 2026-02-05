import { Component, ComponentRef, forwardRef, InjectionToken, Injector, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FilterShowMode, IFilterCustom } from '../../search-options';
import { CdkPortalOutlet, ComponentPortal } from '@angular/cdk/portal';
import * as lodash from 'lodash';

export const MCIT_FILTER_CUSTOM_KEY = new InjectionToken<any>('MCIT_FILTER_CUSTOM_KEY');
export const MCIT_FILTER_CUSTOM_FILTER_CONFIG = new InjectionToken<any>('MCIT_FILTER_CUSTOM_FILTER_CONFIG');
export const MCIT_FILTER_CUSTOM_INITIAL_FILTER = new InjectionToken<any>('MCIT_FILTER_CUSTOM_INITIAL_FILTER');
export const MCIT_FILTER_CUSTOM_MODE = new InjectionToken<any>('MCIT_FILTER_CUSTOM_MODE');

@Component({
  selector: 'mcit-filter-custom-search-container',
  templateUrl: './filter-custom-container.component.html',
  styleUrls: ['./filter-custom-container.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => McitFilterCustomContainerComponent),
      multi: true
    }
  ]
})
export class McitFilterCustomContainerComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @ViewChild(CdkPortalOutlet, { static: true }) _portalOutlet: CdkPortalOutlet;

  @Input()
  key: string;
  @Input()
  filterConfig: IFilterCustom;
  @Input()
  initialFilter: any;
  @Input()
  mode: FilterShowMode;

  private containerRef: ComponentRef<ControlValueAccessor>;

  constructor(private injector: Injector) {}

  ngOnInit(): void {
    const injector = Injector.create({
      providers: [
        { provide: MCIT_FILTER_CUSTOM_KEY, useValue: this.key },
        { provide: MCIT_FILTER_CUSTOM_FILTER_CONFIG, useValue: this.filterConfig },
        { provide: MCIT_FILTER_CUSTOM_INITIAL_FILTER, useValue: this.initialFilter },
        { provide: MCIT_FILTER_CUSTOM_MODE, useValue: this.mode }
      ],
      parent: this.injector
    });
    const containerPortal = new ComponentPortal<ControlValueAccessor>(this.filterConfig.custom.componentType, undefined, injector);

    this.containerRef = this._portalOutlet.attachComponentPortal(containerPortal);
  }

  ngOnDestroy(): void {
    this._portalOutlet.dispose();
  }

  writeValue(value: any) {
    this.containerRef.instance.writeValue(value ? lodash.cloneDeep(value) : value);
  }

  registerOnChange(fn: any): void {
    this.containerRef.instance.registerOnChange(fn);
  }

  registerOnTouched(fn: any): void {
    this.containerRef.instance.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.containerRef.instance.setDisabledState(isDisabled);
  }
}
