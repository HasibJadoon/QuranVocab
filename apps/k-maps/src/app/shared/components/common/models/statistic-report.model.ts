import { PowerBiTenant } from '@lib-shared/common/models/domains/powerbi-tenant.domain';
import { ITracable, IMeaning } from '@lib-shared/common/models/types.model';

export interface IStatisticReport extends ITracable {
  _id: string;
  // Nom
  names: IMeaning;
  // Description
  descriptions: IMeaning;
  // Service
  service?: string;
  // Pour un tiers particulier
  third_party?: {
    id: string;
    name: string;
  };
  // Tags
  tags?: string[];
  // Is dataset not RLS protected ?
  no_rls?: boolean;
  // Workspace power bi
  workspace?: {
    id: string;
    name?: string;
  };
  // Report power bi
  report?: {
    id: string;
    name?: string;
  };
  // Datasets power bi
  datasets?: string[];
  // S3 url
  s3_url?: string;
  // Tenant
  tenant?: PowerBiTenant;
}
