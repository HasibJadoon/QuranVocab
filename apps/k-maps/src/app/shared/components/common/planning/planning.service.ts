import { Injectable } from '@angular/core';
import { HOURS_PER_DAY, MINUTES_PER_HOUR } from './planning-constants';
import { ISection, IWorking } from './planning.model';

@Injectable({
  providedIn: 'root'
})
export class McitPlanningService {
  constructor() {}

  /**
   * Permet de créer des heures de travails custom pour ensuite les afficher quand le planning
   * est en mode 'Heure travaillée'
   */
  createPlagesFromWorking(prefix: string, workings: IWorking[], size: number): ISection['plages'] {
    return workings.reduce((acc, x, i) => {
      // Si le start n'est pas le même que le end précédent
      if (x.start > (i === 0 ? 0 : workings[i - 1].end)) {
        acc.push({
          _id: `${prefix}_${acc.length}`,
          min: i === 0 ? 0 : workings[i - 1].end * MINUTES_PER_HOUR,
          max: x.start * MINUTES_PER_HOUR,
          default: i === 0 ? 0 : workings[i - 1].end * MINUTES_PER_HOUR,
          icon: 'fal fa-ellipsis-h'
        });
      }
      // Plage entre le start et end
      for (let j = (x.start * MINUTES_PER_HOUR) / size; j < (x.end * MINUTES_PER_HOUR) / size; j++) {
        acc.push({
          _id: `${prefix}_${acc.length}`,
          min: j * size,
          max: (j + 1) * size,
          default: j * size
        });
      }
      // Si c'est le dernier alors on fait le dernier si inférieur de 24h
      if (i === workings.length - 1 && x.end < HOURS_PER_DAY) {
        acc.push({
          _id: `${prefix}_${acc.length}`,
          min: x.end * MINUTES_PER_HOUR,
          max: HOURS_PER_DAY * MINUTES_PER_HOUR,
          default: x.end * MINUTES_PER_HOUR,
          icon: 'fal fa-ellipsis-h'
        });
      }
      return acc;
    }, []);
  }

  /**
   * Permet de créer des plages horaires custom pour ensuite les afficher quand le planning
   * est en mode 'Heure travaillée'
   */
  createPlagesFromTimeSlot(prefix: string, timeSlot: IWorking[]): ISection['plages'] {
    return timeSlot.reduce((acc, x, i) => {
      // Si le start n'est pas le même que le end précédent
      if (x.start > (i === 0 ? 0 : timeSlot[i - 1].end)) {
        acc.push({
          _id: `${prefix}_${acc.length}`,
          min: i === 0 ? 0 : timeSlot[i - 1].end * MINUTES_PER_HOUR,
          max: x.start * MINUTES_PER_HOUR,
          default: i === 0 ? 0 : timeSlot[i - 1].end * MINUTES_PER_HOUR,
          icon: 'fal fa-ellipsis-h'
        });
      }
      // Plage entre le start et end
      acc.push({
        _id: `${prefix}_${acc.length}`,
        min: x.start * MINUTES_PER_HOUR,
        max: x.end * MINUTES_PER_HOUR,
        default: x.start * MINUTES_PER_HOUR,
        icon: 'fal fa-ellipsis-h'
      });
      // Si c'est le dernier alors on fait le dernier si inférieur de 24h
      if (i === timeSlot.length - 1 && x.end < HOURS_PER_DAY) {
        acc.push({
          _id: `${prefix}_${acc.length}`,
          min: x.end * MINUTES_PER_HOUR,
          max: HOURS_PER_DAY * MINUTES_PER_HOUR,
          default: x.end * MINUTES_PER_HOUR,
          icon: 'fal fa-ellipsis-h'
        });
      }
      return acc;
    }, []);
  }
}
