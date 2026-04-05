export interface CreateDocumentRequest {
  title: string;
  description: string;
  content: string;
  templateId?: number | null;
}
