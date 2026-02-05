import { Component, Input } from '@angular/core';
import { ICmrRecap } from '../cmr.model';

@Component({
  selector: 'mcit-cmr-recap',
  templateUrl: './cmr-recap.component.html',
  styleUrls: ['./cmr-recap.component.scss']
})
export class McitCmrRecapComponent {
  @Input() cmrRecap: ICmrRecap;
  @Input() environment;
  constructor() {}
}
