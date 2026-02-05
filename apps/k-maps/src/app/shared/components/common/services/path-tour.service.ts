import { Injectable } from '@angular/core';
import * as lodash from 'lodash';
import { computeDistanceBetween } from '../helpers/map.helper';
import { Observable } from 'rxjs/internal/Observable';
import { from, of, timer } from 'rxjs';
import { catchError, concatMap, map, mergeMap, reduce } from 'rxjs/operators';
import { PlacesHttpService } from './places-http.service';
import { IMemberRole } from '../models/member-role.model';

export interface IPathPoint {
  memberRole: IMemberRole;
  pickups: string[];
  deliveries: string[];
  data: any;
}

interface IDistancePath {
  distance: number;
  path: IPathPoint[];
}

export interface IOptions {
  // Force le départ en ce point, recherche si le point n'est pas dans la liste
  forceDeparture?: IPathPoint;
  // Force l'arrivée en ce point, recherche si le point n'est pas dans la liste
  forceArrival?: IPathPoint;
  // Utilise le vol d'oiseau pour le calcul de la distance
  directLine?: boolean;
  // Profile de camion utilisé par le distancier
  truckProfile?: string;
  // Favorise les points qui ne font que de l'enlèvement
  favorsPickupsAlone?: boolean;
  // Mode utiliser pour faire le calcul
  mode?: 'parent' | 'children';
}

@Injectable({
  providedIn: 'root'
})
export class PathTourService {
  constructor(private placesHttpService: PlacesHttpService) {}

  /**
   *
   * @param pdps
   * @param options
   */
  findMoreShortPath(pdps: IPathPoint[], options?: IOptions): Observable<IDistancePath> {
    // On cherche le départ s'il y en a un
    const forceDeparture: IPathPoint = options?.forceDeparture != null ? pdps?.find((p) => this.isSameMemberRole(p.memberRole, options.forceDeparture.memberRole)) ?? options.forceDeparture : null;

    // On cherche l'arrivée s'il y en a un
    const forceArrival: IPathPoint = options?.forceArrival != null ? pdps?.find((p) => this.isSameMemberRole(p.memberRole, options.forceArrival.memberRole)) ?? options.forceArrival : null;

    // On filtre la liste en enlevant le départ et l'arrivée s'il n'a pas d'enlèvement
    const list = pdps?.filter((p) => p !== forceDeparture && (forceArrival?.pickups?.length > 0 || p !== forceArrival)) ?? [];

    // Pas de points, on arrête
    if (forceDeparture == null && forceArrival == null && list.length === 0) {
      return of(null);
    }

    // Si un point alors lui-même
    if (forceDeparture == null && forceArrival == null && list.length === 1) {
      return of({
        distance: 0,
        path: [list[0], list[0]]
      });
    }

    // Si que le start
    if (forceDeparture != null && forceArrival == null && list.length === 0) {
      return of({
        distance: 0,
        path: [forceDeparture, forceDeparture]
      });
    }

    // Si que l'arrivée
    if (forceDeparture == null && forceArrival != null && list.length === 0) {
      return of({
        distance: 0,
        path: [forceArrival, forceArrival]
      });
    }

    let firstPickups: IPathPoint[];

    // Si on a un départ en entrée, alors on l'utilise obligatoirement
    if (forceDeparture != null) {
      firstPickups = [forceDeparture];
    } else {
      // On cherche les points qui ont que l'enlèvement si on a favorisé
      firstPickups = options?.favorsPickupsAlone ? list.filter((pdp) => pdp.pickups?.length > 0 && (pdp.deliveries?.length ?? 0) === 0) : [];

      // Si on n'a pas trouvé de point qui font seulement l'enlèvement
      if (firstPickups.length === 0) {
        // On prend dans ce cas ceux qui ont au moins un enlèvement
        firstPickups = list.filter((pdp) => pdp.pickups?.length > 0);
      }
    }

    // Si aucun premier enlèvement, on arrête
    if (firstPickups.length === 0) {
      console.log('No first pickup found');
      return of(null);
    }

    // On cherche le parcours le plus court qui commence par un pickup
    return from(firstPickups).pipe(
      mergeMap((f) => {
        const nexts: IPathPoint[] = list.filter((p) => p !== f);
        // Si le premier point à une livraison et ce n'est pas l'arrivée, alors on permet de revenir dessus
        if (f.deliveries?.length > 0 && f !== forceArrival) {
          nexts.push(f);
        }

        // S'il y a des suivants alors on calcule le plus court entre eux
        return (
          nexts.length > 0
            ? this.findMinDistancePath(f, nexts, [], options)
            : of({
                distance: 0,
                path: [f]
              })
        ).pipe(
          // Si un point d'arrivée était défini
          concatMap((d) =>
            forceArrival == null
              ? of(d)
              : this.computeDistance(lodash.last(d.path), forceArrival, options).pipe(
                  map((distance) => ({
                    distance: d.distance + distance,
                    path: [...d.path, forceArrival]
                  }))
                )
          )
        );
      }, 2),
      reduce((acc, x) => (x == null ? acc : acc == null || acc.distance > x.distance ? x : acc), null as IDistancePath)
    );
  }

  private isSameMemberRole(a: IMemberRole, b: IMemberRole): boolean {
    if (!a?.geoposition || !b?.geoposition) {
      return false;
    }
    return a.geoposition.longitude === b.geoposition.longitude && a.geoposition.latitude === b.geoposition.latitude;
  }

  // Renvoi les points du reste qui sont disponibles et indisponibles
  private buildAvailableUnavailablesPoints(dejaVus: IPathPoint[], rests: IPathPoint[]): { availables: IPathPoint[]; unavailables: IPathPoint[] } {
    // Si il y a plus de rests alors vide
    if (rests.length === 0) {
      return { availables: [] as IPathPoint[], unavailables: [] as IPathPoint[] };
    }

    // Pour chaque point restant on vérifie si il devient disponible
    return rests.reduce(
      (acc, x) => {
        // Si pas de livraison
        if (!x.deliveries?.length) {
          acc.availables.push(x);
        } else if (x.deliveries.some((d) => !dejaVus.some((dv) => dv.pickups.indexOf(d) !== -1))) {
          // Est ce qu'il y a une livraison qui n'a pas été enlevé
          acc.unavailables.push(x);
        } else {
          acc.availables.push(x);
        }
        return acc;
      },
      { availables: [] as IPathPoint[], unavailables: [] as IPathPoint[] }
    );
  }

  // À partir d'un point de départ, renvoi le chemin le plus court sur le restant
  private findMinDistancePath(start: IPathPoint, rests: IPathPoint[], precs: IPathPoint[], options?: IOptions): Observable<IDistancePath> {
    // Il reste qu'un point, on calcule la distance et on renvoie le trajet
    if (rests.length === 1) {
      const next = lodash.head(rests);
      return this.computeDistance(start, next, options).pipe(
        map((distance) => ({
          distance,
          path: [start, next]
        }))
      );
    }

    // On cherche les points disponibles pour la suite
    const { availables, unavailables } = this.buildAvailableUnavailablesPoints([...precs, start], rests);

    let seconds = availables;

    // On a plus de points disponibles, alors on cherche des points dans les indisponibles s'il y a des enlèvements à faire, ou si on n'a pas favorisé les enlèvements
    if (!options?.favorsPickupsAlone || seconds.length === 0) {
      // On cherche des points indisponibles, mais ils ont des enlèvements qu'on n'a pas encore faits
      seconds = [...seconds, ...unavailables.filter((u) => u.pickups.length > 0 && !precs.some((p) => p === u))];

      if (seconds.length === 0) {
        console.log('Not found points');
        return of(null);
      }
    }

    return options?.mode === 'children' ? this.findChildrenMinDistancePath(start, seconds, availables, unavailables, precs, options) : this.findParentMinDistancePath(start, seconds, availables, unavailables, precs, options);
  }

  private findParentMinDistancePath(start: IPathPoint, seconds: IPathPoint[], availables: IPathPoint[], unavailables: IPathPoint[], precs: IPathPoint[], options?: IOptions): Observable<IDistancePath> {
    // Pour chaque disponible, on calcule la distance pour aller au suivant, on prend la plus courte et on essaie ensuite le reste
    return from(seconds).pipe(
      mergeMap(
        (second) =>
          // On calcule la distance entre le début et le point disponible
          this.computeDistance(start, second, options).pipe(
            map((distance) => ({
              second,
              distance
            }))
          ),
        5
      ),
      reduce((acc, x) => (x == null ? acc : acc == null || acc?.distance > x.distance ? x : acc), null as { second: IPathPoint; distance: number }),
      concatMap((res) => {
        const { second, distance } = res;

        if (distance == null) {
          return of(null as IDistancePath);
        }

        const nexts: IPathPoint[] = [...availables.filter((a) => a !== second), ...unavailables];

        // On cherche la distance minimum depuis le point disponible et les points restants
        return this.findMinDistancePath(second, nexts, [...precs, start], options).pipe(
          map((d) => {
            if (d == null) {
              return null;
            }
            return {
              distance: d.distance + distance,
              path: [start, ...d.path]
            };
          })
        );
      })
    );
  }

  private findChildrenMinDistancePath(start: IPathPoint, seconds: IPathPoint[], availables: IPathPoint[], unavailables: IPathPoint[], precs: IPathPoint[], options?: IOptions): Observable<IDistancePath> {
    // Pour chaque disponible, on calcule la distance pour aller au restant et ensuite on prend la plus courte
    return from(seconds).pipe(
      mergeMap(
        (second) =>
          // On calcule la distance entre le début et le point disponible
          this.computeDistance(start, second, options).pipe(
            concatMap((distance) => {
              const nexts: IPathPoint[] = [...availables.filter((a) => a !== second), ...unavailables];

              // On cherche la distance minimum depuis le point disponible et les points restants
              return this.findMinDistancePath(second, nexts, [...precs, start], options).pipe(
                map((d) => {
                  if (d == null) {
                    return null;
                  }
                  return {
                    distance: d.distance + distance,
                    path: [start, ...d.path]
                  };
                })
              );
            })
          ),
        5
      ),
      reduce((acc, x) => (x == null ? acc : acc == null || acc.distance > x.distance ? x : acc), null as IDistancePath)
    );
  }

  // Calcul la distance entre 2 points, soit vol d'oiseau ou distance réelle
  private computeDistance(start: IPathPoint, end: IPathPoint, options?: IOptions): Observable<number> {
    if (options?.directLine) {
      return timer(0).pipe(map(() => computeDistanceBetween(start.memberRole.geoposition.latitude, start.memberRole.geoposition.longitude, end.memberRole.geoposition.latitude, end.memberRole.geoposition.longitude)));
    }
    return this.placesHttpService
      .calculateRoute(start.memberRole, end.memberRole, {
        storedProfile: options?.truckProfile
      })
      .pipe(
        map((res) => res.distance),
        catchError(() => of(computeDistanceBetween(start.memberRole.geoposition.latitude, start.memberRole.geoposition.longitude, end.memberRole.geoposition.latitude, end.memberRole.geoposition.longitude)))
      );
  }
}
