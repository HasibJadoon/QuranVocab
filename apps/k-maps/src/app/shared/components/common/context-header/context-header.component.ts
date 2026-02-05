import { Component, Inject, OnInit } from '@angular/core';
import { combineLatest, EMPTY, Observable, of } from 'rxjs';
import { McitContextHeaderService } from './services/context-header.service';
import { Applications, ContextType } from './domains/context-type.domain';
import { AppContext } from './models/context-header.model';
import { distinctUntilChanged, switchMap } from 'rxjs/operators';
import { McitCoreConfig } from '../helpers/provider.helper';
import { MCIT_MENU_LAYOUT_CONTEXT_DATA } from '../layouts/menu-layout/menu-layout.component';
import * as lodash from 'lodash';

export interface IContainerContext {
  allAvailables: AppContext[];
  availables: AppContext[];
  current: AppContext;
}

@Component({
  selector: 'mcit-context-header',
  templateUrl: './context-header.component.html'
})
export class McitContextHeaderComponent implements OnInit {
  contextContainer$: Observable<IContainerContext>;

  constructor(
    private contextHeaderService: McitContextHeaderService,
    private config: McitCoreConfig,
    @Inject(MCIT_MENU_LAYOUT_CONTEXT_DATA)
    public contextData: {
      contextType: ContextType;
      appName: Applications;
      hidden: boolean;
    }
  ) {}

  ngOnInit(): void {
    this.contextContainer$ =
      this.config.app === this.contextData.appName
        ? combineLatest([this.contextHeaderService.allAvailablesContexts$(this.contextData.appName), this.contextHeaderService.currentContainerContext$.pipe(distinctUntilChanged((a, b) => a?.current?._id === b?.current?._id))]).pipe(
            switchMap(([allAvailables, currentContainerContext]) => {
              const availables = allAvailables?.filter((c) => c?.type === this.contextData.contextType);
              if (!allAvailables?.length || !availables?.length) {
                return this.contextHeaderService.removeContext();
              }
              const find = availables.find((a) => a._id === currentContainerContext?.current?._id);
              if (find != null) {
                if (find.type !== currentContainerContext?.current.type) {
                  return this.contextHeaderService.setContext(this.contextData.appName, find);
                }
                return of({
                  allAvailables,
                  availables,
                  current: find
                });
              }
              return this.contextHeaderService.setContext(this.contextData.appName, lodash.head(availables));
            })
          )
        : EMPTY;
  }

  onChangeContext(newContext: AppContext): void {
    this.contextHeaderService.setContext(this.contextData.appName, newContext).subscribe();
  }

  compareContexts(firstContext: AppContext, secondContext: AppContext): boolean {
    return firstContext?._id === secondContext?._id;
  }
}
