import { Input, Component, OnInit } from '@angular/core';
import { ICmrByVehicle } from '../cmr.model';

@Component({
  selector: 'mcit-cmr-by-vehicle',
  templateUrl: './cmr-by-vehicle.component.html',
  styleUrls: ['./cmr-by-vehicle.component.scss']
})
export class McitCmrByVehicleComponent implements OnInit {
  @Input() cmrByVehicle: ICmrByVehicle;
  @Input() environment;
  @Input() baseUrl;

  constructor() {}
  ngOnInit(): void {
    this.baseUrl = this.baseUrl ? this.baseUrl : `${this.environment.apiUrl}/v2/common/private/tmp-documents/`;
  }
}
