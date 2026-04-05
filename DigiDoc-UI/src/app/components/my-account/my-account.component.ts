import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { MessageService } from 'primeng/api';
import { Router, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { Button } from 'primeng/button';
import { CommonModule, NgIf } from '@angular/common';
import { GenderPipe } from '../../pipes/gender.pipe';
import { DatePicker } from 'primeng/datepicker';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { TemplateService } from '../../services/template.service';
import { DocumentService } from '../../services/document.service';
import { Template } from '../../models/template/template.model';
import { Document } from '../../models/document/document.model';

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
  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private templateService: TemplateService,
    private documentService: DocumentService,
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
      company: new FormControl(''),
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
          const isAdmin = this.userService.getRole() === 'Admin';
          setTimeout(() => {
            this.userData = user;
            this.isAdmin = isAdmin;
            this.updateForm.patchValue(user);
            this.isLoadingUser = false;
            this.loadMyTemplates();
            this.loadMyDocuments();
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

    this.documentService.getAllDocuments().subscribe({
      next: (documents) => {
        this.myDocuments = this.filterDocumentsForCurrentUser(documents);
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

  private filterTemplatesForCurrentUser(templates: Template[]): Template[] {
    const userId = this.normalizeId(this.userData?.id);
    const username = this.normalizeText(this.userData?.username);
    const email = this.normalizeText(this.userData?.email);

    const matchedTemplates = templates.filter((template) => {
      const anyTemplate = template as any;
      const ownerId = this.normalizeId(
        anyTemplate?.ownerId ??
        anyTemplate?.createdById ??
        anyTemplate?.userId ??
        anyTemplate?.authorId
      );
      const ownerName = this.normalizeText(
        anyTemplate?.ownerUsername ??
        anyTemplate?.createdByUsername ??
        anyTemplate?.username ??
        anyTemplate?.authorUsername
      );
      const ownerEmail = this.normalizeText(
        anyTemplate?.ownerEmail ??
        anyTemplate?.createdByEmail ??
        anyTemplate?.email ??
        anyTemplate?.authorEmail
      );

      return (
        (!!userId && !!ownerId && ownerId === userId) ||
        (!!username && !!ownerName && ownerName === username) ||
        (!!email && !!ownerEmail && ownerEmail === email)
      );
    });

    if (matchedTemplates.length > 0) {
      return matchedTemplates;
    }
    return templates;
  }

  private filterDocumentsForCurrentUser(documents: Document[]): Document[] {
    const userId = this.normalizeId(this.userData?.id);
    const username = this.normalizeText(this.userData?.username);
    const email = this.normalizeText(this.userData?.email);

    const matchedDocuments = documents.filter((document) => {
      const anyDocument = document as any;
      const ownerId = this.normalizeId(
        anyDocument?.ownerId ??
        anyDocument?.createdById ??
        anyDocument?.userId ??
        anyDocument?.authorId
      );
      const ownerName = this.normalizeText(
        anyDocument?.ownerUsername ??
        anyDocument?.createdByUsername ??
        anyDocument?.username ??
        anyDocument?.authorUsername
      );
      const ownerEmail = this.normalizeText(
        anyDocument?.ownerEmail ??
        anyDocument?.createdByEmail ??
        anyDocument?.email ??
        anyDocument?.authorEmail
      );

      return (
        (!!userId && !!ownerId && ownerId === userId) ||
        (!!username && !!ownerName && ownerName === username) ||
        (!!email && !!ownerEmail && ownerEmail === email)
      );
    });

    if (matchedDocuments.length > 0) {
      return matchedDocuments;
    }
    return documents;
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

}

