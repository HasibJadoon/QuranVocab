import { OfflineActionStatus } from './domains/offline-action-status.domain';
import { IDocumentLink } from './types.model';

export interface Attach64 extends IAttachment {
  file?: File;
  base64?: string;
  last_modified?: number;
  signature?: boolean;
}

export interface IExtrasDriverAppOnly {
  dro_no: string;
  id_veh: string;
  step: 'pickup' | 'delivery';
  vehicle_path?: string;
}

export interface IAttachment {
  _id?: string;
  // Nom du document
  name?: string;
  // Type du document
  type?: string;
  // url distante
  remote_url?: string;
  // url locale
  local_url?: string;
  // base 64
  base64?: string;
  // id utilisé pour synchro des données locales et distantes
  sync_id?: string;
  // id du document stocké sur S3 (dans la collection documents)
  document_id?: string;
  // la photo a t'elle fini de chargé ?
  is_loaded?: boolean;
  // extras infos
  extras?: {
    [key: string]: any;
    driver_app_only?: IExtrasDriverAppOnly;
  };
  // Meta data
  meta_data?: {
    [key: string]: any;
  };
}

export interface IAction {
  action_name: string;
  status: OfflineActionStatus;
  picture_sync_id?: string;
  shared_info?: {
    step?: 'pickup' | 'delivery';
  };
}

export function isBase64(attachment: Attach64 | IDocumentLink | IAttachment): attachment is Attach64 {
  return !!(<Attach64>attachment)?.base64;
}
