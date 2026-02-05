import { DateTime } from 'luxon';

export interface IWorking {
  // Minute de départ
  start: number;
  // Minute de fin
  end: number;
}

export interface ISettings {
  defaultPeriod: string;
  defaultSection: string;
  workings: IWorking[];
  defaultSize?: number;
  autoRefresh: boolean;
  time: {
    request: 'never' | 'always' | 'custom';
    custom?: {
      sections: string[];
    };
  };
}

export interface IPeriod {
  // Nom de la période
  nameKey: string;
  // Nombre de jours de la période
  nbDays: number;
  // Liste des sections possible
  sections: string[];
  // Section par defaut
  defaultSection?: string;
  // Fonction pour aller à la date précédente
  getPrevDate: (date: DateTime) => DateTime;
  // Fonction pour aller à la date suivante
  getNextDate: (date: DateTime) => DateTime;
  // Fonction pour avoir la date de départ
  startDate: (date: DateTime) => DateTime;
}

export interface IPlage {
  _id: string;
  // Nombre de minute minimum
  min: number;
  // Nombre de minute maximum (non inclus)
  max: number;
  // temps par default quand drop sur cette plage
  default: number;
  // Icon à rajouter
  icon?: string;
}

export interface ISection {
  // Nom de la section
  nameKey: string;
  // Est ce qu'on cache la barre ?
  hidden?: boolean;
  // Taille d'une plage
  plageWidth: number;
  // Style de la tuile
  itemStyle?: 'normal' | 'light';
  // Liste des plages
  plages: IPlage[];
  // Utiliser les heures de travailles
  working?: {
    size: number;
  };
}

export interface IDay {
  _id: string;
  date: DateTime;
  today: boolean;
  past: boolean;
  current: boolean;
}
