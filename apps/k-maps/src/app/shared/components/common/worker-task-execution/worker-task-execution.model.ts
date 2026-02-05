import { WorkerTaskExecutionStatus } from './worker-task-execution-status.domain';
import { ITracable } from '../models/types.model';

export interface IWorkerTaskExecution extends ITracable {
  _id: string;
  // Id unique de la worker task
  unique_id: string;
  // Id de la session
  execution_id?: string;
  // Id du parent
  parent_execution_id?: string;
  // Nom du worker
  worker_name?: string;
  // Status
  status: WorkerTaskExecutionStatus;
  // tags lié à l'execution
  tags?: {
    kind: string;
    value: string;
  }[];
  // Action qui a permit l'execution
  action?: string;
  // Description action
  action_description?: string;
  // Utilisateur qui a fait l'action
  action_by?: string;
  // Date de l'action
  action_date?: Date;
  // Total d'element de l'action
  total?: number;
  // Element courant de l'action
  index?: number;
  // Description de l'element courant
  description?: string;
  // Date début du traitement
  start_date?: Date;
  // Date fin du traitement
  end_date?: Date;
  // Information erreur
  error?: Error;
}
