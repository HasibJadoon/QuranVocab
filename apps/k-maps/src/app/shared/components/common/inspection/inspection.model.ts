import { IDocumentLink, IMeaning, ITracable } from '../models/types.model';
import { WheelPosition } from '../svg-vehicle-damages/svg-vehicle-damages.service';

/**
 * IVehicleCheckQuestion interface pour le referentiel d'actions obligatoires (pattern de questions)
 */

/**
 * IMPORTANT : Une vérification ne doit avoir qu'un seul type de vérification
 *
 *  "yes_no" XOR "unique_aswer" XOR "multi_answer" XOR "free_text" XOR "attachment"
 */
export interface IVehicleCheckQuestion extends ITracable {
  _id?: string;
  code?: string;
  type: string;
  is_valid?: boolean;
  // nom du groupe de questions
  group_name: IMeaning;
  // type de verification style "OUI/NON"
  yes_no?: ICheckQuestionYesNo;
  // type de verification style "réponse unique (type radio button)"
  unique_answer?: ICheckQuestionWithChoices;
  // type de verification "style "réponse multiples (type checkbox)"
  multi_answers?: ICheckQuestionWithChoices;
  // type de verification style "texte"
  free_text?: ICheckQuestionFreeText;
  // type de verification style "pièces jointes"
  attachment?: ICheckQuestionAttachment;
}

/**
 * IMPORTANT : Une sous-vérification ne doit avoir qu'un seul type de sous-vérification
 *
 *  "yes_no" XOR "unique_answer" XOR "multi_answer"
 */
export interface IVehicleSubcheckQuestion extends ITracable {
  type: 'yes_no' | 'unique_answer' | 'multi_answers';
  // type de sous-verification style "OUI/NON"
  yes_no?: ISubcheckQuestionYesNo;
  // type de sous-verification style "réponse unique (type radio button)"
  unique_answer?: ISubcheckQuestionWithChoices;
  // type de sous-verification "style "réponse multiples (type checkbox)"
  multi_answers?: ISubcheckQuestionWithChoices;
}

/**
 * style "OUI/NON"
 */

/**
 * IMPORTANT :
 *        -  un "check_attachment" est global à la vérification, s'il est renseigné le "yes_attachment" et le "no_attachment" ne doivent aps être renseignés
 *        -  idem pour les champs "comment"
 *        -  idem pour les champs "statement"
 */
export interface ICheckQuestionYesNo {
  // titre de la vérification (ou question)
  check_name?: IMeaning;
  // pièces jointes associées à la vérification
  // non concerné si inexistant
  check_attachment?: IInspAttachment;
  // commentaires associées à la vérification
  // non concerné si inexistant
  check_comment?: IComment;
  // conditions particulières associées à la vérification
  // non concerné si inexistant
  check_statement?: string;

  yes?: {
    // pièces jointes associées au choix (seulement si check_attachment n'est pas renseigné)
    // non concerné si inexistant
    yes_attachment?: IInspAttachment;
    // commentaires associés au choix (seulement si check_comment n'est pas renseigné)
    // non concerné si inexistant
    yes_comment?: IComment;
    // conditions particulières associées au choix (seulement si check_statement n'est pas renseigné)
    // non concerné si inexistant
    yes_statement?: string;

    // sous vérification associée au choix
    yes_subcheck?: IVehicleSubcheckQuestion;

    repair?: IRepair;
  };
  no?: {
    // pièces jointes associées au choix (seulement si check_attachment n'est pas renseigné)
    // non concerné si inexistant
    no_attachment?: IInspAttachment;
    // commentaires associés au choix (seulement si check_comment n'est pas renseigné)
    // non concerné si inexistant
    no_comment?: IComment;
    // conditions particulières associées au choix (seulement si check_statement n'est pas renseigné)
    // non concerné si inexistant
    no_statement?: string;

    // sous vérification associée au choix
    no_subcheck?: IVehicleSubcheckQuestion;

    repair?: IRepair;
  };
}

/**
 * IMPORTANT :
 *        -  un "subcheck_attachment" est global à la sous-vérification, s'il est renseigné le "yes_attachment" et le "no_attachment" ne doivent aps être renseignés
 *        -  idem pour les champs "comment"
 *        -  idem pour les champs "statement"
 */
export interface ISubcheckQuestionYesNo {
  // titre de la sous-vérification (ou sous-question)
  subcheck_name?: IMeaning;
  // pièces jointes associées à la sous-vérification
  // non concerné si inexistant
  subcheck_attachment?: IInspAttachment;
  // commentaires associées à la sous-vérification
  // non concerné si inexistant
  subcheck_comment?: IComment;
  // conditions particulières associées à la sous-vérification
  // non concerné si inexistant
  subcheck_statement?: string;

  yes?: {
    // pièces jointes associées au choix (seulement si check_attachment n'est pas renseigné)
    // non concerné si inexistant
    yes_attachment?: IInspAttachment;
    // commentaires associés au choix (seulement si check_comment n'est pas renseigné)
    // non concerné si inexistant
    yes_comment?: IComment;
    // conditions particulières associées au choix (seulement si check_statement n'est pas renseigné)
    // non concerné si inexistant
    yes_statement?: string;
    repair?: IRepair;
  };
  no?: {
    // pièces jointes associées au choix (seulement si check_attachment n'est pas renseigné)
    // non concerné si inexistant
    no_attachment?: IInspAttachment;
    // commentaires associés au choix (seulement si check_comment n'est pas renseigné)
    // non concerné si inexistant
    no_comment?: IComment;
    // conditions particulières associées au choix (seulement si check_statement n'est pas renseigné)
    // non concerné si inexistant
    no_statement?: string;
    repair?: IRepair;
  };
}

/**
 * style "réponse unique (type radio button)"
 * style "réponse multiples (type checkbox)"
 */

/**
 * IMPORTANT :
 *        -  un "check_attachment" est global à la vérification, s'il est renseigné les champs "choice_attachment" ne doivent aps être renseignés
 *        -  idem pour les champs "comment"
 *        -  idem pour les champs "statement"
 */
export interface ICheckQuestionWithChoices {
  // titre de la vérification (ou question)
  check_name?: IMeaning;

  // pièces jointes associées à la vérification
  // non concerné si inexistant
  check_attachment?: IInspAttachment;
  // commentaires associées à la vérification
  // non concerné si inexistant
  check_comment?: IComment;
  // conditions particulières associées à la vérification
  // non concerné si inexistant
  check_statement?: string;

  // choix possibles
  choices: ICheckQuestionChoice[];
}

/**
 * IMPORTANT :
 *        -  un "subcheck_attachment" est global à la sous-vérification, s'il est renseigné les champs "choice_attachment" ne doivent aps être renseignés
 *        -  idem pour les champs "comment"
 *        -  idem pour les champs "statement"
 */
export interface ISubcheckQuestionWithChoices {
  // titre de la sous-vérification (ou sous-question)
  subcheck_name?: IMeaning;
  // pièces jointes associées à la sous-vérification
  // non concerné si inexistant
  subcheck_attachment?: IInspAttachment;
  // commentaires associées à la sous-vérification
  // non concerné si inexistant
  subcheck_comment?: IComment;
  // conditions particulières associées à la sous-vérification
  // non concerné si inexistant
  subcheck_statement?: string;

  // choix possibles
  choices: [
    {
      _id: string;
      // pièces jointes associées au choix (seulement si check_attachment n'est pas renseigné)
      // non concerné si inexistant
      choice_attachment?: IInspAttachment;
      // commentaires associés au choix (seulement si check_comment n'est pas renseigné)
      // non concerné si inexistant
      choice_comment?: IComment;
      // conditions particulières associés au choix (seulement si check_statement n'est pas renseigné)
      // non concerné si inexistant
      choice_statement?: string;
      // le texte pour le choix
      choice: IMeaning;
      repair?: IRepair;
    }
  ];
}

/**
 * style "texte"
 */

export interface ICheckQuestionFreeText {
  // titre de la vérification (ou question)
  check_name?: IMeaning;
  // pièces jointes associées à la vérification
  // non concerné si inexistant
  check_attachment?: IInspAttachment;
  // conditions particulières associées à la vérification
  // non concerné si inexistant
  check_statement?: string;
  // type de texte
  type: IFreeTextTypeEnum;
  // nombre de caractères max
  max_length?: number;
}

/**
 * style "pièces jointes"
 */

export interface ICheckQuestionAttachment {
  // titre de la vérification (ou question)
  check_name?: IMeaning;
  // commentaires associées à la vérification
  // non concerné si inexistant
  check_comment?: IComment;
  // conditions particulières associées à la vérification
  // non concerné si inexistant
  check_statement?: string;

  // possibilité de joindre plusieurs fichiers ? (multiple par défaut si non renseigné)
  multiple?: boolean;
}

/**
 * utilities
 */

export interface IInspectAttachment {
  // pièce jointe requise ? true (requis), false (affiché mais pas obligatoire)
  required: boolean;
  // possibilité de joindre plusieurs fichiers ? (multiple par défaut si non renseigné)
}

export interface IComment {
  // commentaire requis ? true (requis), false (affiché mais pas obligatoire)
  required: boolean;
}

export enum IFreeTextTypeEnum {
  string = 'string',
  number = 'number',
  phone_number = 'phone_number',
  float = 'float',
  mail = 'mail'
}

export interface ICheckData {
  rtoId: string;
  manifestId: string;
  vehicleId: string;
  step: 'pickup' | 'delivery';
  vehicle?: any;
  isEditable?: boolean;
  ioId?: string;
}

export interface ICheckQuestionChoice {
  _id: string;
  // pièces jointes associées au choix (seulement si check_attachment n'est pas renseigné)
  // non concerné si inexistant
  choice_attachment?: IInspAttachment;
  // commentaires associés au choix (seulement si check_comment n'est pas renseigné)
  // non concerné si inexistant
  choice_comment?: IComment;
  // conditions particulières associés au choix (seulement si check_statement n'est pas renseigné)
  // non concerné si inexistant
  choice_statement?: string;
  // le texte pour le choix
  choice: IMeaning;
  // sous vérification associée au choix
  choice_subcheck?: IVehicleSubcheckQuestion;

  repair?: IRepair;
}

export interface IInspAttachment {
  required: boolean;
  multiple: boolean;
}

export interface IComment {
  required: boolean;
}

// for the referential:

export interface IDamage {
  _id: string;
  name: IMeaning;
  isDimensional?: boolean;
}

export interface IVehicleElement {
  _id: string;
  type: string;
  zone: number;
  subzone?: string;
  name: IMeaning;
  damages: Array<IDamage>;
}

export interface IVehicleDeclaredDamage {
  _id?: string;
  type: string;
  zone: number;
  subzone: string;
  element: {
    element_id: string;
    name: any;
    damage: {
      damage_id: string;
      name: any;
      dimensions?: number;
    };
  };
  comment: string;
  photos: any;
  coordinates: {
    x: number;
    y: number;
  };
  wheelPosition?: WheelPosition | string;
  attachments?: IDocumentLink[];
  sync_id?: string;
}

/**
 * IvehicleInspection interface pour l'insertion liée à une inspection (par véhicule)
 */
export interface IVehicleInspection extends ITracable {
  // id du RoadTransportOrder associé
  rto_id: string;
  // id du manifest associé
  manifest_id: string;
  // id du vehicule associé
  vehicle_id: string;
  // données d'inspections concernant l'enlèvement
  pickup?: {
    // données d'inspection concernant les actions obligatoires
    checks?: IVehicleInspectionCheckResult[];
    // données d'inspection concernant les dommages par élément endommagé
    damages?: IVehicleInspectionElement[];
  };
  // données d'inspections concernant la livraison
  delivery?: {
    // données d'inspection concernant les actions obligatoires
    checks?: IVehicleInspectionCheckResult[];
    // données d'inspection concernant les dommages par élément endommagé
    damages?: IVehicleInspectionElement[];
  };
}

/**
 * IvehicleInspectionElement interface pour l'insertion d'un dommage sur un élément lié à une inspection
 */
export interface IVehicleInspectionElement extends ITracable {
  _id?: string;
  // dommage interne, externe
  type: string;
  // zone concernée
  zone: number;
  // élément endommagé
  element: {
    // id de l'élément (dans le référentiel)
    element_id: string;
    // nom de l'élément
    name: IMeaning;
    // type de dommage
    damage: {
      // id du dommage (dans le référentiel)
      damage_id: string;
      // nom du dommage
      name: IMeaning;
      // taille du dommage
      dimensions?: number;
    };
  };
  // pièces jointes au dommage
  attachments?: Array<IDocumentLink>;
  attachmentsUrls?: Array<string>;
  // commentaire lié au dommage
  comment?: string;
  // coordonnées du dommage (lié au calque utilisé lors de la saisie du dommage)
  coordinates: {
    x: number;
    y: number;
  };
}

/**
 * IvehicleInspectionCheck interface pour l'insertion d'une reponse à une question (action obligatoire) lors d'une inspection
 */
export interface IVehicleInspectionCheckResult extends ITracable {
  // id de l'action obligatoire associée (dans le référentiel)
  _id: string;
  check_id: string;
  type: 'yes_no' | 'unique_answer' | 'multi_answers' | 'free_text' | 'attachment';
  // type de réponse OUI/NON
  yes_no?: ICheckResultYesNo;
  // type de réponse à choix unique
  unique_answer?: ICheckResultUnique;
  // type de réponse à choix multiples
  multi_answers?: ICheckResultMulti;
  // type de réponse texte libre
  free_text?: ICheckResultFreetext;
  // type de réponse pièces jointes
  attachment?: ICheckResultAttachment;
}

/**
 * IvehicleInspectionSubCheck interface pour l'insertion d'une reponse à une sous-question (sous action obligatoire) lors d'une inspection
 */
export interface IVehicleInspectionSubcheckResult extends ITracable {
  type: 'yes_no' | 'unique_answer' | 'multi_answers';
  // type de réponse OUI/NON
  yes_no?: ISubcheckResultYesNo;
  // type de réponse à choix unique
  unique_answer?: ISubcheckResultUnique;
  // type de réponse à choix multiples
  multi_answers?: ISubcheckResultMulti;
}

export enum ANSWER_TYPE {
  yes_no = 'yes_no',
  unique_answer = 'unique_answer',
  multi_answers = 'multi_answers',
  free_text = 'free_text',
  attachment = 'attachment'
}

export enum SUB_ANSWER_TYPE {
  yes_no = 'yes_no',
  unique_answer = 'unique_answer',
  multi_answers = 'multi_answers'
}

export interface ICheckResultYesNo {
  // réponse
  choice: ICheckResultYesNoChoice;
  // type de réponse pièces jointes
  check_attachment?: Array<IDocumentLink>;
  // commentaire
  check_comment?: string;
}

export interface ICheckResultYesNoChoice {
  value: boolean;
  // sous action associée
  choice_subcheck?: IVehicleInspectionSubcheckResult;
  // type de réponse pièces jointes
  choice_attachment?: Array<IDocumentLink>;
  // commentaire
  choice_comment?: string;
}

export interface ICheckResultUnique {
  // réponse
  choice: ICheckResultUniqueChoice;
  // type de réponse pièces jointes
  check_attachment?: Array<IDocumentLink>;
  // commentaire
  check_comment?: string;
}

export interface ICheckResultUniqueChoice {
  choice_id: string;
  name: IMeaning;
  // sous action associée
  choice_subcheck?: IVehicleInspectionSubcheckResult;
  // type de réponse pièces jointes
  choice_attachment?: Array<IDocumentLink>;
  // commentaire
  choice_comment?: string;
}

export interface ICheckResultMulti {
  // réponse
  choices: ICheckResultMultiChoice[];
  // type de réponse pièces jointes
  check_attachment?: Array<IDocumentLink>;
  // commentaire
  check_comment?: string;
}

export interface ICheckResultMultiChoice {
  choice_id: string;
  checkbox: boolean;
  name: IMeaning;
  // sous action associée
  choice_subcheck?: IVehicleInspectionSubcheckResult;
  // type de réponse pièces jointes
  choice_attachment?: Array<IDocumentLink>;
  // commentaire
  choice_comment?: string;
}

export interface ICheckResultFreetext {
  // texte libre
  value: string;
  // type de réponse pièces jointes
  check_attachment?: Array<IDocumentLink>;
}

export interface ICheckResultAttachment {
  // type de réponse pièces jointes
  value?: Array<IDocumentLink>;
  // commentaire
  check_comment?: string;
}

export interface ISubcheckResultYesNo {
  // réponse
  choice: ISubcheckResultYesNoChoice;
  // type de réponse pièces jointes
  subcheck_attachment?: Array<IDocumentLink>;
  // commentaire
  subcheck_comment?: string;
}

export interface ISubcheckResultYesNoChoice {
  value: boolean;
  // type de réponse pièces jointes
  choice_attachment?: Array<IDocumentLink>;
  // commentaire
  choice_comment?: string;
}

export interface ISubcheckResultUnique {
  // réponse
  choice: ISubcheckResultUniqueChoice;
  // type de réponse pièces jointes
  subcheck_attachment?: Array<IDocumentLink>;
  // commentaire
  subcheck_comment?: string;
}

export interface ISubcheckResultUniqueChoice {
  choice_id: string;
  name: IMeaning;
  // type de réponse pièces jointes
  choice_attachment?: Array<IDocumentLink>;
  // commentaire
  choice_comment?: string;
}

export interface ISubcheckResultMulti {
  // réponse
  choices: ISubcheckResultMultiChoice[];
  // type de réponse pièces jointes
  subcheck_attachment?: Array<IDocumentLink>;
  // commentaire
  subcheck_comment?: string;
}

export interface ISubcheckResultMultiChoice {
  choice_id: string;
  checkbox: boolean;
  name: IMeaning;
  // type de réponse pièces jointes
  choice_attachment?: Array<IDocumentLink>;
  // commentaire
  choice_comment?: string;
}

export interface IFullInspection extends ITracable {
  wheel_position?: WheelPosition;
  _id?: string;
  rto_id?: string;
  manifest_id?: string;
  vehicle_id?: string;
  transport_order_no?: string;
  trip_no?: string;
  vehicle?: {
    vin?: string;
    license_plate?: string;
    maker?: any;
    model?: any;
  };
  questions?: {
    _id?: string;
    pickup: { checks: Array<any>; damages: boolean };
    delivery: { checks: Array<any>; damages: boolean };
    contract_id?: string;
    version_id?: string;
  };
  responses?: {
    pickup?: { checks: Array<any>; damages: Array<any> };
    delivery?: { checks: Array<any>; damages: Array<any> };
  };
  summary?: {
    pickup?: {
      checks_required: boolean;
      checks_total: number;
      checks_valid: number;
      damages_required: boolean;
      damages_total: number;
    };
    delivery?: {
      checks_required: boolean;
      checks_total: number;
      checks_valid: number;
      damages_total: number;
      damages_required: boolean;
    };
  };
}

export interface IInspectionConfig {
  _id: string;
  constract?: any;
  version?: any;
  pickup: {
    damages: boolean;
    checks: Array<string>;
  };
  delivery: {
    damages: boolean;
    checks: Array<string>;
  };
}

export interface IServiceRef {
  _id?: string;
  code: string;
  name: IMeaning;
  description: IMeaning;
  entity: string;
}

export interface IRepair {
  type: 'service' | 'damage' | null;
  service?: {
    tags: string[];
  };
  damage?: {
    type: 'INT' | 'EXT';
    element_id: string;
    element_name: string;
    damage_id: string;
    damage_name: string;
  };
}
