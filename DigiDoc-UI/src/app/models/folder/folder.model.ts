export interface Folder {
  id: string;
  name: string;
  organizationId: string;
  parentFolderId?: string | null;
  createdByUserId?: string | null;
  createdAt: Date | string;
  documentsCount: number;
}

export interface CreateFolderRequest {
  name: string;
  parentFolderId?: string | null;
}

export interface RenameFolderRequest {
  name: string;
}

export interface MoveFolderRequest {
  parentFolderId?: string | null;
}

export interface DeleteFolderResult {
  folderId: string;
  folderName: string;
  movedDocumentsToRootCount: number;
}
