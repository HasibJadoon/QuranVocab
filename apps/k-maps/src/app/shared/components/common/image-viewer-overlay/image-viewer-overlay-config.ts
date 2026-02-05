import { IAttachment } from '../models/attachments.model';

export class McitImageViewerOverlayConfig {
  urls: string[] | IAttachment[];
  current: number;
  customFilenames?: string[];
}
