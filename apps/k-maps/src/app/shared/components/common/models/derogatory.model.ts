import { InvoiceableEvent } from '../contract/invoiceable-event.domain';

export interface IDerogatory {
  // code activité
  activity_code?: string;
  // code article
  article_code?: string;
  // infos du customer
  customer_transcodification?: IDerogatoryCustomerTranscodification;
  // infos de l'incoterm
  incoterm?: IDerogatoryIncoterm;
  // le client facturé
  billed_customer?: IThirdPartyInfos;
  // le transporteur
  supplier?: IThirdPartyInfos;
  // Evenement de taxation
  invoiceable_event?: InvoiceableEvent;
  // code externe
  service_x_code?: string;
}

interface IDerogatoryIncoterm {
  code?: string;
  additional_info?: string;
}

interface IDerogatoryCustomerTranscodification {
  codification?: string;
  value?: string;
}

export interface IThirdPartyInfos {
  third_party_id?: string;
  code?: string;
  x_code?: string;
  name?: string;
  agency?: string;
  exclude?: boolean;
}
