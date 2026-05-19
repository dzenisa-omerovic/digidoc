import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { MessageService } from 'primeng/api';
import { Router, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { Button } from 'primeng/button';
import { CommonModule, NgIf } from '@angular/common';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { TemplateService } from '../../services/template.service';
import { DocumentService } from '../../services/document.service';
import { Template } from '../../models/template/template.model';
import { Document } from '../../models/document/document.model';
import { OrganizationDeleteResult, OrganizationService } from '../../services/organization.service';
import { Organization } from '../../models/organization/organization.model';
import { UserInfoData } from '../../models/user/user-info-data.model';

@Component({
  selector: 'app-my-account',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    Button,
    RouterLink,
    NgIf,
    RadioButtonModule,
    ToastModule,
    DialogModule,
  ],
  templateUrl: './my-account.component.html',
  styleUrl: './my-account.component.css'
})
export class MyAccountComponent implements OnInit {
  isAdmin: boolean = false;
  isOrgAdmin: boolean = false;
  passwordVisible: boolean = false;
  updateForm: FormGroup;
  userData: any = null;
  isLoadingUser: boolean = false;
  activeTab: string = 'osnovno'; // Podrazumevano prvi tab
  myTemplates: Template[] = [];
  myDocuments: Document[] = [];
  loadingMyTemplates = false;
  loadingMyDocuments = false;
  myTemplatesLoadError = false;
  myDocumentsLoadError = false;
  adminUsers: UserInfoData[] = [];
  adminOrganizations: Organization[] = [];
  loadingAdminUsers = false;
  loadingAdminOrganizations = false;
  adminUsersLoadError = false;
  adminOrganizationsLoadError = false;
  deleteOrganizationDialogVisible = false;
  pendingOrganizationDelete: Organization | null = null;
  deletingOrganizationId: string | null = null;
  deletingTemplateId: number | null = null;
  deletingDocumentId: number | null = null;
  deleteItemDialogVisible = false;
  pendingTemplateDelete: Template | null = null;
  pendingDocumentDelete: Document | null = null;
  setActiveTab(tab: string) {
    this.activeTab = tab;
    if ((this.isAdmin || this.isOrgAdmin) && tab === 'admin-users') {
      this.loadAdminUsers();
    }
    if (this.isAdmin && tab === 'admin-organizations') {
      this.loadAdminOrganizations();
    }
  }
  constructor(
    private userService: UserService,
    private templateService: TemplateService,
    private documentService: DocumentService,
    private organizationService: OrganizationService,
    private messageService: MessageService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.updateForm = new FormGroup({
      name: new FormControl(''),
      username: new FormControl(''),
      surname: new FormControl(''),
      email: new FormControl(''),
      dateOfBirth: new FormControl(''),
      isFemale: new FormControl(''),
      currentPassword: new FormControl(''),
      newPassword: new FormControl(''),
      jmbg: new FormControl('', [Validators.pattern(/^\d{13}$/)]),
      jobTitle: new FormControl(''),
      address: new FormControl(''),
      city: new FormControl('')
    });


  }

  ngOnInit() {
    this.checkLoginStatus();
  }

  checkLoginStatus() {
    this.isLoadingUser = true;
    if (this.userService.isLoggedIn()) {
      this.userService.getCurrentUser().subscribe({
        next: (user) => {
          if (user.dateOfBirth) {
            user.dateOfBirth = new Date(user.dateOfBirth);
          }
          const role = this.userService.getRole();
          const isAdmin = role === 'Admin';
          const isOrgAdmin = role === 'AdminOrg';
          setTimeout(() => {
            this.userData = user;
            this.isAdmin = isAdmin;
            this.isOrgAdmin = isOrgAdmin;
            this.updateForm.patchValue(user);
            this.isLoadingUser = false;
            if (this.isAdmin) {
              this.activeTab = 'admin-users';
              this.loadAdminUsers();
              this.loadAdminOrganizations();
            } else if (this.isOrgAdmin) {
              this.activeTab = 'admin-users';
              this.loadAdminUsers();
            } else {
              this.activeTab = 'osnovno';
              this.loadMyTemplates();
              this.loadMyDocuments();
            }
            this.cdr.detectChanges(); // OBAVEZNO OVDE
          }, 0);
        }
      });
    }
  }

  loadMyTemplates() {
    this.loadingMyTemplates = true;
    this.myTemplatesLoadError = false;

    this.templateService.getAllTemplates().subscribe({
      next: (templates) => {
        this.myTemplates = this.filterTemplatesForCurrentUser(templates);
        this.loadingMyTemplates = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.myTemplates = [];
        this.loadingMyTemplates = false;
        this.myTemplatesLoadError = true;
        this.cdr.detectChanges();
      }
    });
  }

  loadMyDocuments() {
    this.loadingMyDocuments = true;
    this.myDocumentsLoadError = false;

    this.loadMyDocumentsPage(1, []);
  }

  loadAdminUsers(): void {
    this.loadingAdminUsers = true;
    this.adminUsersLoadError = false;

    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.adminUsers = users;
        this.loadingAdminUsers = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.adminUsers = [];
        this.loadingAdminUsers = false;
        this.adminUsersLoadError = true;
        this.cdr.detectChanges();
      }
    });
  }

  loadAdminOrganizations(): void {
    this.loadingAdminOrganizations = true;
    this.adminOrganizationsLoadError = false;

    this.organizationService.getOrganizations().subscribe({
      next: (organizations) => {
        this.adminOrganizations = organizations;
        this.loadingAdminOrganizations = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.adminOrganizations = [];
        this.loadingAdminOrganizations = false;
        this.adminOrganizationsLoadError = true;
        this.cdr.detectChanges();
      }
    });
  }

  openDeleteOrganizationDialog(organization: Organization): void {
    if (!organization?.id || this.deletingOrganizationId != null) {
      return;
    }

    this.pendingOrganizationDelete = organization;
    this.deleteOrganizationDialogVisible = true;
  }

  cancelDeleteOrganizationDialog(): void {
    this.deleteOrganizationDialogVisible = false;
    this.pendingOrganizationDelete = null;
  }

  confirmDeleteOrganization(): void {
    const organizationId = this.pendingOrganizationDelete?.id;
    if (!organizationId || this.deletingOrganizationId != null) {
      this.cancelDeleteOrganizationDialog();
      return;
    }

    this.deleteOrganizationDialogVisible = false;
    this.deletingOrganizationId = organizationId;

    this.organizationService.deleteOrganization(organizationId).subscribe({
      next: (result: OrganizationDeleteResult) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Uspesno',
          detail: `Organizacija "${result.organizationName}" je obrisana (korisnici: ${result.deletedUsersCount}, sabloni: ${result.deletedTemplatesCount}, dokumenti: ${result.deletedDocumentsCount}, verzije: ${result.deletedDocumentVersionsCount}).`
        });

        const currentUserOrganizationId = this.normalizeGuid(this.userData?.organizationId);
        const deletedOrganizationId = this.normalizeGuid(result.organizationId);
        if (currentUserOrganizationId && currentUserOrganizationId === deletedOrganizationId) {
          this.logout();
          return;
        }

        this.loadAdminOrganizations();
        this.loadAdminUsers();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Greska',
          detail: 'Nije moguce obrisati organizaciju.'
        });
      },
      complete: () => {
        this.deletingOrganizationId = null;
        this.pendingOrganizationDelete = null;
        this.cdr.detectChanges();
      }
    });
  }

  isDeletingOrganization(organizationId: string): boolean {
    return !!organizationId && this.deletingOrganizationId === organizationId;
  }

  get pendingOrganizationDeleteName(): string {
    const name = this.pendingOrganizationDelete?.name?.trim();
    return name || 'ovu organizaciju';
  }

  approveUser(userId: string): void {
    const request$ = this.isAdmin
      ? this.userService.approveUserByAdmin(userId)
      : this.userService.approveUserByOrgAdmin(userId);

    request$.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Uspesno',
          detail: this.isAdmin
            ? 'Korisnik je odobren od strane glavnog administratora.'
            : 'Korisnik je odobren za pridruzivanje organizaciji.'
        });
        this.loadAdminUsers();
      },
      error: (err) => {
        const detail = err?.error?.message || err?.error || 'Nije moguce odobriti korisnika.';
        this.messageService.add({
          severity: 'error',
          summary: 'Greska',
          detail
        });
      }
    });
  }

  rejectPendingUser(userId: string): void {
    this.userService.deleteUserByAdmin(userId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Uspesno',
          detail: 'Registracija je odbijena.'
        });
        this.loadAdminUsers();
      },
      error: (err) => {
        const detail = err?.error?.message || err?.error || 'Nije moguce odbiti registraciju.';
        this.messageService.add({
          severity: 'error',
          summary: 'Greska',
          detail
        });
      }
    });
  }

  deleteUserByAdmin(userId: string): void {
    this.userService.deleteUserByAdmin(userId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Uspesno',
          detail: 'Korisnik je obrisan.'
        });
        this.loadAdminUsers();
      },
      error: (err) => {
        const detail = err?.error?.message || err?.error || 'Nije moguce obrisati korisnika.';
        this.messageService.add({
          severity: 'error',
          summary: 'Greska',
          detail
        });
      }
    });
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }
  logout(): void {
    this.userService.logout();
    this.userData = null;
    this.updateForm.reset();
    this.router.navigate(['/login']);
  }
  deleteAccountDialogVisible: boolean = false;

  confirmDeleteAccount(): void {
    this.userService.deleteAccount().subscribe({
      next: () => {
        this.logout();

        this.messageService.add({
          severity: 'success',
          summary: 'Nalog obrisan',
          detail: 'VaÅ¡ nalog je uspeÅ¡no obrisan.',
          life: 1500
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'GreÅ¡ka',
          detail: 'DoÅ¡lo je do greÅ¡ke prilikom brisanja naloga.'
        });
      },
      complete: () => {
        this.deleteAccountDialogVisible = false;
        setTimeout(() => {
          this.router.navigate(['/ads']);
        }, 1500);
      }
    });
  }

  cancelDeleteAccount(): void {
    this.deleteAccountDialogVisible = false;
  }

  onUpdate(): void {
    if (!this.updateForm.valid) {
      return;
    }
    const updateData = {...this.updateForm.value};
    console.log('Update data:', updateData);
    this.userService.updateUser(this.updateForm.value).subscribe({
      next: () => {

        this.messageService.add({
          severity: 'success',
          summary: 'Update Successful',
          detail: 'Your data has been updated!'
        });
        this.checkLoginStatus();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Update Error',
          detail: 'There was a problem updating your data.'
        });
      }
    });
  }

  openTemplateFill(templateId?: number): void {
    if (!templateId) {
      return;
    }

    this.router.navigate(['/template', templateId, 'fill']);
  }

  openTemplateEdit(templateId?: number): void {
    if (!templateId) {
      return;
    }

    this.router.navigate(['/edit-template', templateId]);
  }

  openDocument(documentId?: number): void {
    if (!documentId) {
      return;
    }

    this.router.navigate(['/document', documentId]);
  }

  openDocumentEdit(documentId?: number): void {
    if (!documentId) {
      return;
    }

    this.router.navigate(['/document', documentId, 'edit']);
  }

  isDeletingTemplate(templateId?: number): boolean {
    return templateId != null && this.deletingTemplateId === templateId;
  }

  isDeletingDocument(documentId?: number): boolean {
    return documentId != null && this.deletingDocumentId === documentId;
  }

  deleteTemplate(template: Template, event?: Event): void {
    event?.stopPropagation();

    const templateId = template.id;
    if (!templateId || this.deletingTemplateId != null) {
      return;
    }

    this.pendingTemplateDelete = template;
    this.pendingDocumentDelete = null;
    this.deleteItemDialogVisible = true;
  }

  deleteDocument(document: Document, event?: Event): void {
    event?.stopPropagation();

    const documentId = document.id;
    if (!documentId || this.deletingDocumentId != null) {
      return;
    }

    this.pendingDocumentDelete = document;
    this.pendingTemplateDelete = null;
    this.deleteItemDialogVisible = true;
  }

  cancelDeleteItem(): void {
    this.deleteItemDialogVisible = false;
    this.pendingTemplateDelete = null;
    this.pendingDocumentDelete = null;
  }

  confirmDeleteItem(): void {
    if (this.pendingTemplateDelete?.id) {
      this.performTemplateDelete(this.pendingTemplateDelete.id);
      return;
    }

    if (this.pendingDocumentDelete?.id) {
      this.performDocumentDelete(this.pendingDocumentDelete.id);
      return;
    }

    this.cancelDeleteItem();
  }

  get pendingDeleteItemLabel(): string {
    if (this.pendingTemplateDelete) {
      return this.pendingTemplateDelete.name?.trim() || 'ovaj sablon';
    }

    if (this.pendingDocumentDelete) {
      return this.pendingDocumentDelete.title?.trim() || 'ovaj dokument';
    }

    return 'odabranu stavku';
  }

  get pendingDeleteItemTypeLabel(): string {
    if (this.pendingTemplateDelete) {
      return 'sablon';
    }

    if (this.pendingDocumentDelete) {
      return 'dokument';
    }

    return 'stavku';
  }

  private performTemplateDelete(templateId: number): void {
    this.deleteItemDialogVisible = false;
    this.deletingTemplateId = templateId;

    this.templateService.deleteTemplate(templateId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Uspesno',
          detail: 'Sablon je obrisan.'
        });

        this.loadMyTemplates();
        this.loadMyDocuments();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Greska',
          detail: 'Nije moguce obrisati sablon.'
        });
      },
      complete: () => {
        this.deletingTemplateId = null;
        this.pendingTemplateDelete = null;
        this.pendingDocumentDelete = null;
        this.cdr.detectChanges();
      }
    });
  }

  private performDocumentDelete(documentId: number): void {
    this.deleteItemDialogVisible = false;
    this.deletingDocumentId = documentId;

    this.documentService.deleteDocument(documentId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Uspesno',
          detail: 'Dokument je obrisan.'
        });

        this.loadMyDocuments();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Greska',
          detail: 'Nije moguce obrisati dokument.'
        });
      },
      complete: () => {
        this.deletingDocumentId = null;
        this.pendingTemplateDelete = null;
        this.pendingDocumentDelete = null;
        this.cdr.detectChanges();
      }
    });
  }

  get pendingOrganizationRequests(): UserInfoData[] {
    if (!this.isAdmin) {
      return [];
    }

    return this.adminUsers.filter((user) => user.isOrganizationCreationRequest);
  }

  get pendingGlobalApprovalUsers(): UserInfoData[] {
    if (!this.isAdmin) {
      return [];
    }

    return this.adminUsers.filter((user) => !user.isOrganizationCreationRequest && !user.isApproved);
  }

  get pendingOrganizationUsers(): UserInfoData[] {
    return this.adminUsers.filter((user) =>
      !user.isOrganizationCreationRequest &&
      user.isApproved &&
      !user.isOrganizationApproved
    );
  }

  get pendingUsers(): UserInfoData[] {
    return this.pendingGlobalApprovalUsers;
  }

  get approvedUsers(): UserInfoData[] {
    return this.adminUsers.filter((user) =>
      !user.isOrganizationCreationRequest &&
      user.isApproved &&
      user.isOrganizationApproved
    );
  }

  getOrganizationLabel(user: UserInfoData): string {
    return user.isOrganizationApproved ? 'Organizacija' : 'Zahtev za organizaciju';
  }

  getTemplateOrganizationName(template: Template): string {
    return template.organization?.name?.trim() || 'N/A';
  }

  getDocumentOrganizationName(document: Document): string {
    return (document as any).organization?.name?.trim() || (document as any).organizationName?.trim() || 'N/A';
  }

  getCreatorName(document: Document): string {
    const creator = document.createdByDisplayName;
    if (creator && creator.trim()) {
      return creator.trim();
    }

    return 'Nepoznat korisnik';
  }

  get organizationDisplayName(): string {
    const organizationName = this.userData?.organizationName?.trim();
    if (organizationName) {
      return organizationName;
    }

    const companyName = this.userData?.company?.trim();
    return companyName || 'Nije dodeljena';
  }

  private filterTemplatesForCurrentUser(templates: Template[]): Template[] {
    const userId = this.normalizeId(this.userData?.id);
    if (!userId) {
      return [];
    }

    return templates.filter((template) => {
      const anyTemplate = template as any;
      const ownerId = this.normalizeId(
        anyTemplate?.createdByUserId ??
        anyTemplate?.ownerId ??
        anyTemplate?.createdById ??
        anyTemplate?.userId ??
        anyTemplate?.authorId
      );

      return !!ownerId && ownerId === userId;
    });
  }

  private filterDocumentsForCurrentUser(documents: Document[]): Document[] {
    const userId = this.normalizeId(this.userData?.id);
    if (!userId) {
      return [];
    }

    return documents.filter((document) => {
      const anyDocument = document as any;
      const ownerId = this.normalizeId(
        anyDocument?.createdByUserId ??
        anyDocument?.ownerId ??
        anyDocument?.createdById ??
        anyDocument?.userId ??
        anyDocument?.authorId
      );

      return !!ownerId && ownerId === userId;
    });
  }

  private loadMyDocumentsPage(page: number, accumulator: Document[]): void {
    this.documentService.getDocuments({ page, pageSize: 20 }).subscribe({
      next: (response) => {
        const merged = [...accumulator, ...response.items];

        if (page < response.totalPages) {
          this.loadMyDocumentsPage(page + 1, merged);
          return;
        }

        this.myDocuments = this.filterDocumentsForCurrentUser(merged);
        this.loadingMyDocuments = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.myDocuments = [];
        this.loadingMyDocuments = false;
        this.myDocumentsLoadError = true;
        this.cdr.detectChanges();
      }
    });
  }

  private normalizeText(value: unknown): string {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
  }

  private normalizeId(value: unknown): string {
    if (typeof value === 'number') {
      return String(value);
    }

    return typeof value === 'string' ? value.trim() : '';
  }

  private normalizeGuid(value: unknown): string {
    return this.normalizeId(value).toLowerCase();
  }

}

