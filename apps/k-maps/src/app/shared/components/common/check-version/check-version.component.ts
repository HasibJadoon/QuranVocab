import { Component, OnInit } from '@angular/core';
import { McitCheckVersionService } from './check-version.service';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { McitSettingsService } from '../services/settings.service';

@Component({
  selector: 'mcit-check-version',
  templateUrl: './check-version.component.html',
  styleUrls: ['./check-version.component.scss']
})
export class McitCheckVersionComponent implements OnInit {
  showNewVersion$: Observable<boolean>;
  env$: Observable<string>;

  constructor(private checkVersionService: McitCheckVersionService, private settingsService: McitSettingsService) {}

  ngOnInit(): void {
    this.showNewVersion$ = this.checkVersionService.checkNewVersion$();
    this.env$ = this.checkVersionService.version$().pipe(switchMap((v) => this.settingsService.getSettingsForKey$('hideEnvRibbon').pipe(map((h) => (v != null && v.env !== 'prod' && !h ? v.env : null)))));
  }
}
