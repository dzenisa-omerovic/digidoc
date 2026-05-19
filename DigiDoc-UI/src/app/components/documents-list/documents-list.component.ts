import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { Document } from '../../models/document/document.model';
import { Template } from '../../models/template/template.model';
import { PagedResponse } from '../../models/common/paged-response.model';
import { DocumentService } from '../../services/document.service';
import { TemplateService } from '../../services/template.service';
import { FolderService } from '../../services/folder.service';
import { DeleteFolderResult, Folder } from '../../models/folder/folder.model';

export type FilterMode = 'all' | 'template' | 'noTemplate';
type FolderSelectionMode = 'all' | 'root' | 'folder';
type FolderDialogMode = 'createRoot' | 'createChild' | 'rename' | 'move';

@Component({
  selector: 'app-documents-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, FormsModule, DialogModule],
  templateUrl: './documents-list.component.html',
  styleUrls: ['./documents-list.component.css']
})
export class DocumentsListComponent implements OnInit {
  documents: Document[] = [];
  templates: Template[] = [];
  folders: Folder[] = [];
  loading = true;
  loadingTemplates = false;
  loadingFolders = false;
  error = '';
  folderError = '';
  deletingDocumentId: number | null = null;
  deleteDialogVisible = false;
  pendingDocumentDelete: Document | null = null;
  movingDocumentId: number | null = null;
  moveDocumentDialogVisible = false;
  pendingDocumentMove: Document | null = null;
  moveDocumentTargetFolderId = '__root__';

  filterMode: FilterMode = 'all';
  selectedTemplateId: number | null = null;
  showTemplateDropdown = false;

  folderSelectionMode: FolderSelectionMode = 'all';
  selectedFolderId: string | null = null;
  expandedFolderIds = new Set<string>();

  folderDialogVisible = false;
  folderDialogMode: FolderDialogMode = 'createRoot';
  folderDialogInputName = '';
  folderDialogTargetParentId = '';
  folderDialogError = '';
  folderDialogSubmitting = false;
  folderDialogTargetFolder: Folder | null = null;

  deleteFolderDialogVisible = false;
  pendingFolderDelete: Folder | null = null;
  deletingFolderId: string | null = null;

  searchInput = '';
  searchTerm = '';
  currentUserId = '';

  totalResults = 0;
  currentPage = 1;
  readonly pageSize = 20;
  totalPages = 0;


  constructor(
    private documentService: DocumentService,
    private templateService: TemplateService,
    private folderService: FolderService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.getCurrentUserIdFromToken();
    this.loadTemplates();
    this.loadFolders();
    this.loadDocuments();
  }

  get totalDocuments(): number {
    return this.totalResults;
  }

  get templatedDocumentsCount(): number {
    return this.documents.filter((doc) => doc.templateId != null).length;
  }

  get blankDocumentsCount(): number {
    return this.documents.filter((doc) => doc.templateId == null).length;
  }

  get recentDocumentsCount(): number {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    return this.documents.filter((doc) => {
      if (!doc.createdAt) {
        return false;
      }

      const created = new Date(doc.createdAt).getTime();
      return Number.isFinite(created) && created >= weekAgo;
    }).length;
  }

  get latestDocument(): Document | undefined {
    return this.documents[0];
  }

  get rootFolders(): Folder[] {
    return this.sortFolders(this.folders.filter((folder) => !folder.parentFolderId));
  }

  get selectedFolder(): Folder | null {
    if (!this.selectedFolderId) {
      return null;
    }

    return this.folders.find((folder) => this.normalizeId(folder.id) === this.normalizeId(this.selectedFolderId)) ?? null;
  }

  get selectedFolderLabel(): string {
    if (this.folderSelectionMode === 'all') {
      return 'Svi folderi';
    }

    if (this.folderSelectionMode === 'root') {
      return 'Root (bez foldera)';
    }

    return this.selectedFolder?.name ?? 'Folder';
  }

  get canManageSelectedFolder(): boolean {
    return this.folderSelectionMode === 'folder' && !!this.selectedFolder;
  }

  get availableParentFoldersForMove(): Folder[] {
    const target = this.folderDialogTargetFolder;
    if (!target) {
      return [];
    }

    return this.sortFolders(
      this.folders.filter((folder) =>
        folder.id !== target.id &&
        !this.isDescendantFolder(target.id, folder.id))
    );
  }

  get templateCoveragePercent(): number {
    if (this.documents.length === 0) {
      return 0;
    }

    return Math.round((this.templatedDocumentsCount / this.documents.length) * 100);
  }

  get focusMessage(): string {
    if (this.totalResults === 0) {
      return 'Krenite od jednog praznog dokumenta ili sablona i izgradite vasu biblioteku.';
    }

    if (this.recentDocumentsCount >= 5) {
      return 'Odlican tempo. Ove nedelje ste kreirali vise dokumenata nego obicno.';
    }

    if (this.templateCoveragePercent >= 60) {
      return 'Dobra standardizacija. Vecina dokumenata koristi sablone.';
    }

    return 'Predlog: napravite jos sablona da ubrzate sledece dokumente.';
  }

  get hasPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  get hasNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  onSearchInputChange(value: string): void {
    this.searchInput = value;
  }

  submitSearch(): void {
    this.searchTerm = this.searchInput.trim();
    this.currentPage = 1;
    this.loadDocuments();
  }

  clearSearch(): void {
    if (!this.searchInput && !this.searchTerm) {
      return;
    }

    this.searchInput = '';
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadDocuments();
  }

  goToPreviousPage(): void {
    if (!this.hasPreviousPage) {
      return;
    }

    this.currentPage -= 1;
    this.loadDocuments();
  }

  goToNextPage(): void {
    if (!this.hasNextPage) {
      return;
    }

    this.currentPage += 1;
    this.loadDocuments();
  }

  loadTemplates(): void {
    this.loadingTemplates = true;
    this.templateService.getAllTemplates().subscribe({
      next: (templates) => {
        this.templates = templates;
        this.loadingTemplates = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingTemplates = false;
      }
    });
  }

  loadDocuments(): void {
    this.loading = true;
    this.error = '';

    const request = {
      q: this.searchTerm || undefined,
      page: this.currentPage,
      pageSize: this.pageSize,
      templateId: this.filterMode === 'template' ? this.selectedTemplateId : null,
      noTemplate: this.filterMode === 'noTemplate',
      folderId: this.folderSelectionMode === 'folder' ? this.selectedFolderId : null,
      rootOnly: this.folderSelectionMode === 'root'
    };

    this.documentService.getDocuments(request).subscribe({
      next: (response) => this.handleDocsLoaded(response),
      error: () => this.handleDocsError()
    });
  }

  private handleDocsLoaded(response: PagedResponse<Document>): void {
    this.documents = response.items;
    this.totalResults = response.total;
    this.currentPage = response.page;
    this.totalPages = response.totalPages;
    this.loading = false;
    this.cdr.detectChanges();
  }

  private handleDocsError(): void {
    this.error = 'Greska pri ucitavanju dokumenata.';
    this.documents = [];
    this.totalResults = 0;
    this.totalPages = 0;
    this.loading = false;
    this.cdr.detectChanges();
  }

  loadFolders(): void {
    this.loadingFolders = true;
    this.folderError = '';

    this.folderService.getFolders().subscribe({
      next: (folders) => {
        this.folders = folders;
        this.loadingFolders = false;

        if (this.folderSelectionMode === 'folder' && this.selectedFolderId) {
          const exists = this.folders.some((folder) => this.normalizeId(folder.id) === this.normalizeId(this.selectedFolderId));
          if (!exists) {
            this.folderSelectionMode = 'all';
            this.selectedFolderId = null;
            this.currentPage = 1;
            this.loadDocuments();
          }
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.folders = [];
        this.loadingFolders = false;
        this.folderError = 'Greska pri ucitavanju foldera.';
        this.cdr.detectChanges();
      }
    });
  }

  toggleTemplateDropdown(): void {
    this.showTemplateDropdown = !this.showTemplateDropdown;

    if (!this.showTemplateDropdown && this.filterMode === 'template' && this.selectedTemplateId == null) {
      this.filterMode = 'all';
    }
  }

  setFilter(mode: FilterMode): void {
    this.filterMode = mode;
    this.showTemplateDropdown = false;

    if (mode !== 'template') {
      this.selectedTemplateId = null;
    }

    this.currentPage = 1;
    this.loadDocuments();
  }

  selectAllFolders(): void {
    if (this.folderSelectionMode === 'all') {
      return;
    }

    this.folderSelectionMode = 'all';
    this.selectedFolderId = null;
    this.currentPage = 1;
    this.loadDocuments();
  }

  selectRootOnly(): void {
    if (this.folderSelectionMode === 'root') {
      return;
    }

    this.folderSelectionMode = 'root';
    this.selectedFolderId = null;
    this.currentPage = 1;
    this.loadDocuments();
  }

  selectFolder(folderId: string): void {
    if (this.folderSelectionMode === 'folder' && this.normalizeId(this.selectedFolderId) === this.normalizeId(folderId)) {
      return;
    }

    this.folderSelectionMode = 'folder';
    this.selectedFolderId = folderId;
    this.currentPage = 1;
    this.loadDocuments();
  }

  getChildFolders(parentFolderId: string): Folder[] {
    return this.sortFolders(
      this.folders.filter((folder) => this.normalizeId(folder.parentFolderId) === this.normalizeId(parentFolderId))
    );
  }

  hasChildren(folderId: string): boolean {
    return this.folders.some((folder) => this.normalizeId(folder.parentFolderId) === this.normalizeId(folderId));
  }

  isExpanded(folderId: string): boolean {
    return this.expandedFolderIds.has(this.normalizeId(folderId));
  }

  toggleFolder(folderId: string, event?: Event): void {
    event?.stopPropagation();
    const normalizedId = this.normalizeId(folderId);
    if (this.expandedFolderIds.has(normalizedId)) {
      this.expandedFolderIds.delete(normalizedId);
    } else {
      this.expandedFolderIds.add(normalizedId);
    }
  }

  openCreateRootFolderDialog(): void {
    this.folderDialogMode = 'createRoot';
    this.folderDialogInputName = '';
    this.folderDialogTargetParentId = '';
    this.folderDialogError = '';
    this.folderDialogSubmitting = false;
    this.folderDialogTargetFolder = null;
    this.folderDialogVisible = true;
  }

  openCreateChildFolderDialog(): void {
    if (!this.selectedFolder) {
      return;
    }

    this.folderDialogMode = 'createChild';
    this.folderDialogInputName = '';
    this.folderDialogTargetParentId = this.selectedFolder.id;
    this.folderDialogError = '';
    this.folderDialogSubmitting = false;
    this.folderDialogTargetFolder = this.selectedFolder;
    this.folderDialogVisible = true;
  }

  openRenameFolderDialog(): void {
    if (!this.selectedFolder) {
      return;
    }

    this.folderDialogMode = 'rename';
    this.folderDialogInputName = this.selectedFolder.name;
    this.folderDialogTargetParentId = this.selectedFolder.parentFolderId ?? '';
    this.folderDialogError = '';
    this.folderDialogSubmitting = false;
    this.folderDialogTargetFolder = this.selectedFolder;
    this.folderDialogVisible = true;
  }

  openMoveFolderDialog(): void {
    if (!this.selectedFolder) {
      return;
    }

    this.folderDialogMode = 'move';
    this.folderDialogInputName = this.selectedFolder.name;
    this.folderDialogTargetParentId = this.selectedFolder.parentFolderId ?? '';
    this.folderDialogError = '';
    this.folderDialogSubmitting = false;
    this.folderDialogTargetFolder = this.selectedFolder;
    this.folderDialogVisible = true;
  }

  closeFolderDialog(): void {
    this.folderDialogVisible = false;
    this.folderDialogSubmitting = false;
    this.folderDialogError = '';
  }

  submitFolderDialog(): void {
    const mode = this.folderDialogMode;
    this.folderDialogError = '';
    this.folderDialogSubmitting = true;

    if (mode === 'createRoot' || mode === 'createChild') {
      const name = this.folderDialogInputName.trim();
      if (!name) {
        this.folderDialogError = 'Naziv foldera je obavezan.';
        this.folderDialogSubmitting = false;
        return;
      }

      const parentFolderId = mode === 'createChild'
        ? (this.folderDialogTargetParentId || null)
        : null;

      this.folderService.createFolder({ name, parentFolderId }).subscribe({
        next: (folder) => {
          this.closeFolderDialog();
          this.loadFolders();
          this.folderSelectionMode = 'folder';
          this.selectedFolderId = folder.id;
          this.currentPage = 1;
          this.loadDocuments();
        },
        error: (err) => {
          this.folderDialogError = err?.error?.message || err?.error || 'Kreiranje foldera nije uspelo.';
          this.folderDialogSubmitting = false;
          this.cdr.detectChanges();
        }
      });
      return;
    }

    if (mode === 'rename') {
      const target = this.folderDialogTargetFolder;
      const name = this.folderDialogInputName.trim();
      if (!target || !name) {
        this.folderDialogError = 'Naziv foldera je obavezan.';
        this.folderDialogSubmitting = false;
        return;
      }

      this.folderService.renameFolder(target.id, { name }).subscribe({
        next: (folder) => {
          this.closeFolderDialog();
          this.loadFolders();
          this.folderSelectionMode = 'folder';
          this.selectedFolderId = folder.id;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.folderDialogError = err?.error?.message || err?.error || 'Preimenovanje foldera nije uspelo.';
          this.folderDialogSubmitting = false;
          this.cdr.detectChanges();
        }
      });
      return;
    }

    const target = this.folderDialogTargetFolder;
    if (!target) {
      this.folderDialogError = 'Folder nije pronadjen.';
      this.folderDialogSubmitting = false;
      return;
    }

    const parentFolderId = this.folderDialogTargetParentId.trim() || null;
    this.folderService.moveFolder(target.id, { parentFolderId }).subscribe({
      next: (folder) => {
        this.closeFolderDialog();
        this.loadFolders();
        this.folderSelectionMode = 'folder';
        this.selectedFolderId = folder.id;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.folderDialogError = err?.error?.message || err?.error || 'Premestanje foldera nije uspelo.';
        this.folderDialogSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  openDeleteFolderDialog(): void {
    if (!this.selectedFolder || this.deletingFolderId != null) {
      return;
    }

    this.pendingFolderDelete = this.selectedFolder;
    this.deleteFolderDialogVisible = true;
  }

  cancelDeleteFolderDialog(): void {
    this.deleteFolderDialogVisible = false;
    this.pendingFolderDelete = null;
  }

  confirmDeleteFolder(): void {
    const folder = this.pendingFolderDelete;
    if (!folder || this.deletingFolderId != null) {
      this.cancelDeleteFolderDialog();
      return;
    }

    this.deleteFolderDialogVisible = false;
    this.deletingFolderId = folder.id;
    this.folderService.deleteFolder(folder.id).subscribe({
      next: (_result: DeleteFolderResult) => {
        this.folderSelectionMode = 'all';
        this.selectedFolderId = null;
        this.loadFolders();
        this.currentPage = 1;
        this.loadDocuments();
      },
      error: (err) => {
        this.error = err?.error?.message || err?.error || 'Brisanje foldera nije uspelo.';
        this.cdr.detectChanges();
      },
      complete: () => {
        this.deletingFolderId = null;
        this.pendingFolderDelete = null;
        this.cdr.detectChanges();
      }
    });
  }

  openMoveDocumentDialog(document: Document, event?: Event): void {
    event?.stopPropagation();

    if (!document.id || this.movingDocumentId != null || !this.canDeleteDocument(document)) {
      return;
    }

    this.pendingDocumentMove = document;
    this.moveDocumentTargetFolderId = document.folderId ?? '__root__';
    this.moveDocumentDialogVisible = true;
  }

  cancelMoveDocumentDialog(): void {
    this.moveDocumentDialogVisible = false;
    this.pendingDocumentMove = null;
  }

  confirmMoveDocument(): void {
    const pendingDocument = this.pendingDocumentMove;
    const documentId = pendingDocument?.id;
    if (!pendingDocument || !documentId || this.movingDocumentId != null) {
      this.cancelMoveDocumentDialog();
      return;
    }

    const folderId = this.moveDocumentTargetFolderId === '__root__'
      ? null
      : this.moveDocumentTargetFolderId;

    this.moveDocumentDialogVisible = false;
    this.movingDocumentId = documentId;

    this.documentService.moveDocumentToFolder(documentId, folderId).subscribe({
      next: () => {
        this.loadDocuments();
        this.loadFolders();
      },
      error: (err) => {
        this.error = err?.error?.message || err?.error || 'Premestanje dokumenta nije uspelo.';
        this.cdr.detectChanges();
      },
      complete: () => {
        this.movingDocumentId = null;
        this.pendingDocumentMove = null;
        this.cdr.detectChanges();
      }
    });
  }

  onTemplateSelect(templateId: number): void {
    this.selectedTemplateId = templateId;
    this.filterMode = 'template';
    this.showTemplateDropdown = false;
    this.currentPage = 1;
    this.loadDocuments();
  }

  get activeFilterLabel(): string {
    if (this.filterMode === 'noTemplate') {
      return 'Bez sablona';
    }

    if (this.filterMode === 'template' && this.selectedTemplateId != null) {
      const selectedTemplate = this.templates.find((item) => item.id === this.selectedTemplateId);
      return selectedTemplate ? selectedTemplate.name : 'Sablon';
    }

    return 'Svi dokumenti';
  }

  openDocument(id?: number): void {
    if (id) {
      this.router.navigate(['/document', id]);
    }
  }

  isDeleting(documentId?: number): boolean {
    return documentId != null && this.deletingDocumentId === documentId;
  }

  isMoving(documentId?: number): boolean {
    return documentId != null && this.movingDocumentId === documentId;
  }

  canDeleteDocument(document: Document): boolean {
    const createdByUserId = this.normalizeId(document.createdByUserId);
    return !!this.currentUserId && !!createdByUserId && createdByUserId === this.currentUserId;
  }

  deleteDocument(document: Document, event?: Event): void {
    event?.stopPropagation();

    const documentId = document.id;
    if (!documentId || this.deletingDocumentId != null || !this.canDeleteDocument(document)) {
      return;
    }

    this.pendingDocumentDelete = document;
    this.deleteDialogVisible = true;
  }

  cancelDeleteDocument(): void {
    this.deleteDialogVisible = false;
    this.pendingDocumentDelete = null;
  }

  confirmDeleteDocument(): void {
    const pendingDocument = this.pendingDocumentDelete;
    const documentId = pendingDocument?.id;
    if (!documentId || this.deletingDocumentId != null) {
      this.cancelDeleteDocument();
      return;
    }

    this.deleteDialogVisible = false;
    this.deletingDocumentId = documentId;
    this.documentService.deleteDocument(documentId).subscribe({
      next: () => {
        if (this.documents.length === 1 && this.currentPage > 1) {
          this.currentPage -= 1;
        }

        this.loadDocuments();
      },
      error: () => {
        this.error = 'Greska pri brisanju dokumenta.';
        this.cdr.detectChanges();
      },
      complete: () => {
        this.deletingDocumentId = null;
        this.pendingDocumentDelete = null;
        this.cdr.detectChanges();
      }
    });
  }

  get pendingDocumentDeleteTitle(): string {
    const title = this.pendingDocumentDelete?.title?.trim();
    return title || 'ovaj dokument';
  }

  private getCurrentUserIdFromToken(): string {
    const token = localStorage.getItem('token');
    if (!token) {
      return '';
    }

    try {
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      const rawId = payload.nameid ?? payload.sub ?? payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
      return this.normalizeId(rawId);
    } catch {
      return '';
    }
  }

  private normalizeId(value: unknown): string {
    if (typeof value === 'string') {
      return value.trim().toLowerCase();
    }

    if (typeof value === 'number') {
      return String(value).trim().toLowerCase();
    }

    return '';
  }

  getFolderName(document: Document): string {
    const folderName = document.folder?.name?.trim();
    return folderName || 'Root';
  }

  getDocumentOrganizationName(document: Document): string {
    return document.organization?.name?.trim() || document.organizationName?.trim() || 'N/A';
  }

  getCreatorName(document: Document): string {
    const createdBy = document.createdByDisplayName;
    if (createdBy && createdBy.trim()) {
      return createdBy.trim();
    }

    return 'Nepoznat korisnik';
  }

  get pendingFolderDeleteName(): string {
    return this.pendingFolderDelete?.name?.trim() || 'ovaj folder';
  }

  get pendingDocumentMoveName(): string {
    return this.pendingDocumentMove?.title?.trim() || 'ovaj dokument';
  }

  get folderDialogTitle(): string {
    switch (this.folderDialogMode) {
      case 'createRoot':
        return 'Novi root folder';
      case 'createChild':
        return 'Novi podfolder';
      case 'rename':
        return 'Preimenuj folder';
      default:
        return 'Premesti folder';
    }
  }

  private sortFolders(folders: Folder[]): Folder[] {
    return [...folders].sort((a, b) => a.name.localeCompare(b.name, 'sr', { sensitivity: 'base' }));
  }

  private isDescendantFolder(ancestorId: string, candidateId: string): boolean {
    let cursor: string | null = candidateId;

    while (cursor) {
      const current = this.folders.find((folder) => this.normalizeId(folder.id) === this.normalizeId(cursor));
      if (!current) {
        return false;
      }

      const parentId = current.parentFolderId ?? null;
      if (!parentId) {
        return false;
      }

      if (this.normalizeId(parentId) === this.normalizeId(ancestorId)) {
        return true;
      }

      cursor = parentId;
    }

    return false;
  }

}
