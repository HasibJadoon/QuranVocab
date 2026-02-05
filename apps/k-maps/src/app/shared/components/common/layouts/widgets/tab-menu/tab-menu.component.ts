import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { McitTabMenuItem, McitTabMenuService } from '../../tab-menu.service';
import { animate, query, sequence, style, transition, trigger } from '@angular/animations';
import { IApplication, McitApplicationsService } from '../../../services/applications-service';
import { McitCoreEnv } from '../../../helpers/provider.helper';

enum TMPlacementEnum {
  Top = 'top',
  Bottom = 'bottom'
}

@Component({
  selector: 'mcit-tab-menu',
  templateUrl: './tab-menu.component.html',
  styleUrls: ['./tab-menu.component.scss'],
  animations: [
    trigger('badge-anim', [
      transition(':increment', [
        query(':self', [style({ overflow: 'visible' })]),
        query('.my-badge', [style({ transform: 'scale(1,1)' }), sequence([animate('.4s ease', style({ transform: 'scale(2,2)' })), animate('.2s ease', style({ transform: 'scale(1,1)' }))])], { optional: true })
      ])
    ])
  ]
})
export class McitTabMenuComponent implements OnInit {
  @Input()
  placement: TMPlacementEnum;

  items$: Observable<McitTabMenuItem[]>;
  applications$: Observable<IApplication[]>;

  cordova = false;

  constructor(private coreEnv: McitCoreEnv, private tabMenuService: McitTabMenuService, private applicationsService: McitApplicationsService) {}

  ngOnInit(): void {
    this.cordova = this.coreEnv.cordova;
    this.items$ = this.tabMenuService.items$();
    this.applications$ = this.applicationsService.applications$();
  }

  trackByApplication(index: number, application: IApplication): string {
    return application.key;
  }
}
