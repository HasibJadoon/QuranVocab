import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { compact, omit, uniqBy } from 'lodash';
import { concat, EMPTY, of, Subject } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { catchError, filter, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';

import { McitAuthProviderService } from '../../auth';
import { User } from '../../auth/models/user.model';
import { McitCoreConfig } from '../../helpers/provider.helper';
import { IContainerContext } from '../context-header.component';
import { Applications, ContextType } from '../domains/context-type.domain';
import { AppContext } from '../models/context-header.model';
import { McitStorage } from '@lib-shared/common/storage/mcit-storage';

@Injectable({
  providedIn: 'root'
})
export class McitContextHeaderService {
  auth = true;
  readonly currentContainerContext$: Observable<IContainerContext>;
  readonly forceGetCurrentContextForDispatcher$: Observable<AppContext[]>;
  readonly forceGetCurrentContextForCompound$: Observable<AppContext[]>;
  readonly forceGetCurrentContextForSupervision$: Observable<AppContext[]>;
  private storeKey: string;
  private currentContainerContextSubject = new Subject<IContainerContext>();

  private availablesCache$ = this.authProviderService.authorization$.pipe(
    switchMap((auth) => {
      if (!auth) {
        this.auth = false;
        return of(null);
      }
      return this.authProviderService.whoIAm(true).pipe(
        tap(() => (this.auth = true)),
        catchError((err) => {
          this.auth = false;
          return of(null);
        })
      );
    }),
    shareReplay(1)
  );

  constructor(private storage: McitStorage, private router: Router, private authProviderService: McitAuthProviderService, private config: McitCoreConfig) {
    this.storeKey = `${this.config.app}_context`;

    this.currentContainerContext$ = concat(this.storage.get(this.storeKey), this.currentContainerContextSubject).pipe(
      filter(() => this.auth),
      shareReplay(1)
    );

    this.forceGetCurrentContextForDispatcher$ = this.authProviderService.authorization$.pipe(
      switchMap((auth) => {
        if (!auth) {
          return of(null);
        }
        return this.authProviderService.whoIAm(true).pipe(catchError((err) => of(null)));
      }),
      map((user) => this.getAvailablesContextsForDispatcher(user))
    );

    this.forceGetCurrentContextForCompound$ = this.authProviderService.authorization$.pipe(
      switchMap((auth) => {
        if (!auth) {
          return of(null);
        }
        return this.authProviderService.whoIAm(true).pipe(catchError((err) => of(null)));
      }),
      map((user) => this.getAvailablesContextsForCompound(user))
    );

    this.forceGetCurrentContextForSupervision$ = this.authProviderService.authorization$.pipe(
      switchMap((auth) => {
        if (!auth) {
          return of(null);
        }
        return this.authProviderService.whoIAm(true).pipe(catchError((err) => of(null)));
      }),
      map((user) => this.getAvailablesContextsForSupervision(user))
    );
  }

  currentContainerContextFromType(appName: Applications, contextType: ContextType): Observable<IContainerContext> {
    return concat(this.storage.get(this.storeKey), this.currentContainerContextSubject).pipe(
      take(1),
      filter(() => this.auth),
      switchMap((cont) => {
        if (contextType === cont?.current?.type) {
          return of(cont);
        } else {
          const availables = cont?.allAvailables?.filter((c) => c?.type && c?.type === contextType);
          const current = availables?.find((c) => c?._id === cont?.current?._id) ?? availables?.[0];
          if (!current) {
            return of(null);
          }
          const currentContainer = {
            allAvailables: cont?.allAvailables,
            availables,
            current
          };
          return this.storage.set(this.storeKey, currentContainer).pipe(map(() => currentContainer));
        }
      }),
      shareReplay(1)
    );
  }

  allAvailablesContexts$(app: Applications): Observable<AppContext[]> {
    return this.availablesCache$.pipe(
      map((user) => {
        if (!!user && app === Applications.dispatcher) {
          return this.getAvailablesContextsForDispatcher(user);
        } else if (!!user && app === Applications.compound) {
          return this.getAvailablesContextsForCompound(user);
        } else if (!!user && app === Applications.supervision) {
          return this.getAvailablesContextsForSupervision(user);
        }
        return [];
      })
    );
  }

  setContext(appName: Applications, context: AppContext): Observable<IContainerContext> {
    return this.allAvailablesContexts$(appName).pipe(
      take(1),
      switchMap((allAvailables) => {
        const availables = allAvailables.filter((c) => c?.type && c?.type === context?.type);
        if (allAvailables) {
          if (!allAvailables?.length || !availables?.length) {
            this.router.navigateByUrl('/403', { replaceUrl: true });
            return EMPTY;
          } else {
            const current = availables?.find((c) => c?._id === context?._id) ?? availables[0];
            const currentContainer = {
              allAvailables,
              availables,
              current
            };
            return this.storage.set(this.storeKey, currentContainer).pipe(
              tap((newContainer) => this.currentContainerContextSubject.next(newContainer)),
              map(() => currentContainer)
            );
          }
        } else {
          return this.removeContext();
        }
      }),
      catchError((err) => {
        console.error('Problem when setting container context', err);
        return of({
          allAvailables: [],
          availables: [],
          current: null
        });
      })
    );
  }

  removeContext(): Observable<IContainerContext> {
    return this.storage.remove(this.storeKey).pipe(
      tap(() =>
        this.currentContainerContextSubject.next({
          allAvailables: [],
          availables: [],
          current: null
        })
      )
    );
  }

  private getAvailablesContextsForDispatcher(user: User): AppContext[] {
    const charters = compact(uniqBy([...(user?.apps?.dispatcher?.context?.charters ?? []), user?.apps?.dispatcher?.context?.charter], 'id')).map((c) => ({
      ...omit(c, 'id'),
      _id: c?.id,
      type: ContextType.CHARTER
    })) as AppContext[];
    const carriers = compact(uniqBy([...(user?.apps?.dispatcher?.context?.carriers ?? []), user?.apps?.dispatcher?.context?.carrier], 'id')).map((c) => ({
      ...omit(c, 'id'),
      _id: c?.id,
      type: ContextType.CARRIER
    })) as AppContext[];
    const principals = compact(uniqBy([...(user?.apps?.dispatcher?.context?.principals ?? [])], 'id')).map((c) => ({
      ...omit(c, 'id'),
      _id: c?.id,
      type: ContextType.PRINCIPAL
    })) as AppContext[];
    const fleetOwners = compact(uniqBy([user?.apps?.dispatcher?.context?.fleet_owner], 'id')).map((c) => ({
      ...omit(c, 'id'),
      _id: c?.id,
      type: ContextType.FLEET_OWNER
    })) as AppContext[];
    const manageCenters = compact(uniqBy([user?.apps?.dispatcher?.context?.manage_center], 'id')).map((c) => ({
      ...omit(c, 'id'),
      _id: c?.id,
      type: ContextType.MANAGE_CENTER
    })) as AppContext[];
    return [...charters, ...carriers, ...principals, ...fleetOwners, ...manageCenters];
  }

  private getAvailablesContextsForCompound(user: User): AppContext[] {
    const compounds = compact(uniqBy([...(user?.apps?.compound?.context?.compounds ?? []), user?.apps?.compound?.context?.compound], 'id')).map((c) => ({
      ...omit(c, 'id'),
      _id: c?.id,
      type: ContextType.COMPOUND
    })) as AppContext[];
    return [...compounds];
  }

  private getAvailablesContextsForSupervision(user: User): AppContext[] {
    const supervision = compact(uniqBy([...(user?.apps?.supervision?.context?.operational_third_parties ?? [])], '_id')).map((c) => ({
      ...omit(c, '_id'),
      _id: c?._id,
      type: ContextType.SUPERVISION
    })) as AppContext[];
    return [...supervision];
  }
}
