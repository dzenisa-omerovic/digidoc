export interface UpdateDocumentResponse {
  id: number;
  title: string;
  description: string;
  content: string;
  templateId?: number | null;
  createdAt: Date;
  latestVersionNumber: number;
}
