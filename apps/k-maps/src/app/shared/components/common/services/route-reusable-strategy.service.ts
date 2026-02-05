import { ActivatedRouteSnapshot, BaseRouteReuseStrategy, DetachedRouteHandle } from '@angular/router';

export class McitRouteReusableStrategy extends BaseRouteReuseStrategy {
  private map: Map<string, DetachedRouteHandle> = new Map<string, DetachedRouteHandle>();

  private static getUrl(route: ActivatedRouteSnapshot): string {
    const r = [];
    let c = route;
    do {
      const p = c.url.join('/');
      if (p && p.length > 0) {
        r.push(p);
      }
      c = c.parent;
    } while (c != null);

    return r.reverse().join('/');
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    if (route.data.storeRoute == null) {
      return super.retrieve(route);
    }
    const url = McitRouteReusableStrategy.getUrl(route);
    return this.map.get(url);
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    if (route.data.storeRoute == null) {
      return super.shouldAttach(route);
    }
    const url = McitRouteReusableStrategy.getUrl(route);
    return this.map.has(url);
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    if (route.data.storeRoute == null) {
      return super.shouldDetach(route);
    }
    return route.data.storeRoute ?? false;
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    if (route.data.storeRoute == null) {
      return super.store(route, handle);
    }
    const url = McitRouteReusableStrategy.getUrl(route);
    this.map.set(url, handle);
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    if (future.data.shouldReuse == null) {
      return super.shouldReuseRoute(future, curr);
    }
    return future.data.shouldReuse;
  }
}
