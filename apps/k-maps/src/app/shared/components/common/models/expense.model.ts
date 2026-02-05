import { ExpenseStatus } from './domains/expense-status.domain';
import { IDocumentLink } from './types.model';

export interface IExpense {
  _id?: string;
  expense_no: string;
  // Type de note de frais
  type_of_expense: {
    group: string;
    type: string;
  };
  // Montant de la Note de frais
  amount: number;
  // Devise du montant saisi dans la note de frais
  currency: string;
  // Description de la note de frais
  description?: string;
  // Documents attaché à la note de frais
  attachments?: IDocumentLink[];
  created_by?: string;
  created_date?: Date;
  updated_by?: string;
  updated_date?: Date;
  // Statut de la note de frais
  status: ExpenseStatus;
  // Statut de facturation de la note de frais
  invoiced: boolean;
  // Informations de l'objet auquel est rattachée l’expense
  attached_object: IExpenseAttachedObject;
  // informations sur les resources
  resources?: Array<IExpenseRessource>;
  // Priopriétaire de l'expense
  owner_id: string;
}

export interface IExpenseAttachedObject {
  type: 'rto';
  object: {
    // N° du RTO
    rto_no?: string;
    // Identifiant du RTO
    rto_id?: string;
    // N° du trip
    trip_no?: string;
    // Identifiant du trip
    trip_id?: string;
    // N° du transport_order
    transport_order_no?: string;
    // Identifiant du transport_order
    transport_order_id?: string;
  };
}

export interface IExpenseRessource {
  // Identifiant de la ressource
  resource_id: string;
  // Nom de la ressource
  name: string;
  // Type de la ressource
  type: string;
  // fournisseur
  provider?: {
    // Identifiant du tiers fournisseur de la resource
    third_party_id: string;
    // Nom du fournisseur de la resource
    name: string;
  };
  mre_contract?: {
    contract_id;
    code: string;
    name: string;
  }[];
}
