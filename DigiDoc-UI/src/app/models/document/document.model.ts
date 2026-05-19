import { DocumentVersion } from './document-version.model';

export interface Document {
  id?: number;
  title: string;
  description: string;
  content?: string;
  templateId?: number | null;
  template?: { id: number; name: string } | null;
  folderId?: string | null;
  folder?: { id: string; name: string; parentFolderId?: string | null } | null;
  organizationId?: string | null;
  organization?: { id: string; name: string } | null;
  organizationName?: string;
  createdByUserId?: string | null;
  createdByDisplayName?: string;
  createdAt?: Date;
  snippetHtml?: string;
  versions?: DocumentVersion[];
}
