import { Action } from '@ngrx/store';
import { IBreadCrumb } from '../models/breadcrumb';

export enum EBreadCrumbAction {
  Add = '[breadcrumbs] Adds a breadcrumb',
  Delete = '[breadcrumbs] Deletes breadcrumb',
  Reset = '[breadcumbs] clear existing breadcrumbs',
  Update = '[breadcrumbs] updates a breadcrumb'
}

export class BreadcrumbDeletion implements Action {
  public readonly type = EBreadCrumbAction.Delete;
  constructor(public depth: number) {}
}

export class BreadcrumbAddition implements Action {
  public readonly type = EBreadCrumbAction.Add;
  constructor(public breadcrumb: IBreadCrumb) {}
}

export class BreadcrumbReset implements Action {
  public readonly type = EBreadCrumbAction.Reset;
}

export class BreadcrumbUpdate implements Action {
  public readonly type = EBreadCrumbAction.Update;
  constructor(public breadcrumb: IBreadCrumb) {}
}

export type BreadCrumbActions = BreadcrumbDeletion | BreadcrumbAddition | BreadcrumbReset | BreadcrumbUpdate;
