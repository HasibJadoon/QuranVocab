import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';

import { IVehicleInspectionElement } from '../../../inspection.model';
import { TraceErrorClass } from '@lib-shared/common/decorators/trace-error.decorator';

@TraceErrorClass()
@Component({
  selector: 'mcit-damage-details-show',
  templateUrl: './damage-details-show.component.html',
  styleUrls: ['./damage-details-show.component.scss'],
  animations: [trigger('pictures-anim', [transition('* => *', [query(':enter', [style({ opacity: 0, transform: 'scale(0,0)' }), stagger(100, [animate('.4s ease', style({ opacity: 1, transform: 'scale(1,1)' }))])], { optional: true })])])]
})
export class McitDamageDetailsShowComponent implements OnInit, OnDestroy {
  @Input() damageType: 'INT' | 'EXT';
  @Input() damageList: Array<IVehicleInspectionElement>;
  @Input() attachmentUrls: Array<string> = [];
  @Input() environment;
  @Input() baseUrl;
  private destroy$: Subject<boolean> = new Subject<boolean>();

  public gridCols = 2;
  public upload: boolean;

  constructor() {}

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  ngOnInit() {
    this.baseUrl = this.baseUrl ? this.baseUrl : `${this.environment.apiUrl}/v2/common/private/tmp-documents/`;
  }

  stopLoading() {
    this.upload = false;
  }
}
