import { IBreadCrumb } from '../models/breadcrumb';

export interface BreadCrumbState {
  breadcrumbs: Array<IBreadCrumb>;
}

export const initialBreadCrumbState = {
  breadcrumbs: []
};
