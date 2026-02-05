import { Period } from './domains/period.domain';
import { IResource } from '@lib-shared/common/models/resource.model';

export interface IResourceAssociation {
  _id?: string;
  // Ressource du transporteur
  carrier_id?: string;
  // Id des deux ressources liées
  resources: IResource[];
  // Date de début de liaison entre ces ressources
  start_date: string;
  // Période horaire de début (matin ou après midi)
  start_period: Period;
  // Date de fin de liaison entre ces deux ressources
  end_date?: string;
  // Période horaire de fin (matin ou après midi)
  end_period?: Period;
}

export interface IResourceAssociationSearchFilter {
  resource_id: string;
  carrier_id?: string;
  start_date?: string;
  days?: string;
  end_date?: string;
  start_period?: string;
  end_period?: string;
}
