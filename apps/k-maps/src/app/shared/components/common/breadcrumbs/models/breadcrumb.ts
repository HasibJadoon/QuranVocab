import { Params } from '@angular/router';

export interface IBreadCrumb {
  label: string;
  action: {
    url: string;
    queryParams: Params;
  };
  depth: number;
}
