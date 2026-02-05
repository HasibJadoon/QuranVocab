import { BreadCrumbActions, EBreadCrumbAction } from '../actions/breadcrumb.actions';
import { initialBreadCrumbState, BreadCrumbState } from '../states/breadcrumb.state';
import { IBreadCrumb } from '../models/breadcrumb';
import * as lodash from 'lodash';

export function BreadCrumbsReducer(state: BreadCrumbState = initialBreadCrumbState, action: BreadCrumbActions): BreadCrumbState {
  switch (action.type) {
    case EBreadCrumbAction.Delete: {
      return {
        ...state,
        breadcrumbs: lodash.sortBy(state.breadcrumbs.slice(0, action.depth), (b) => b.depth)
      };
    }
    case EBreadCrumbAction.Add: {
      return {
        ...state,
        breadcrumbs: lodash.sortBy(state.breadcrumbs.concat(action.breadcrumb), (b) => b.depth)
      };
    }
    case EBreadCrumbAction.Reset: {
      return initialBreadCrumbState;
    }
    case EBreadCrumbAction.Update: {
      return {
        ...state,
        breadcrumbs: lodash.sortBy(
          state.breadcrumbs.map((bc: IBreadCrumb): IBreadCrumb => (bc.depth === action.breadcrumb.depth ? action.breadcrumb : bc)),
          (b) => b.depth
        )
      };
    }
    default: {
      return state;
    }
  }
}
