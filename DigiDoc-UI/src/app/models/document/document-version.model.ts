export interface DocumentVersion {
  id: number;
  documentId: number;
  versionNumber: number;
  content: string;
  createdAt: Date;
}
