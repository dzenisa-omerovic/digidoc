import { DocumentVersion } from './document-version.model';

export interface Document {
  id?: number;
  title: string;
  description: string;
  content: string;
  templateId?: number | null;
  createdAt?: Date;
  versions?: DocumentVersion[];
}
