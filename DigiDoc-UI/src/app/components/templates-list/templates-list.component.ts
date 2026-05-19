import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TemplateService } from '../../services/template.service';
import { Template } from '../../models/template/template.model';

@Component({
  selector: 'app-templates-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TagModule,
    RouterModule,
    TooltipModule,
    InputTextModule,
    DialogModule
  ],
  templateUrl: './templates-list.component.html',
  styleUrls: ['./templates-list.component.css']
})
export class TemplatesListComponent implements OnInit, OnDestroy {
  templates: Template[] = [];
  loading = true;
  searchQuery = '';
  appliedSearchQuery = '';
  loadError = false;
  currentUserId = '';
  deletingTemplateId: number | null = null;
  deleteDialogVisible = false;
  pendingTemplateDelete: Template | null = null;
  deleteErrorMessage = '';

  constructor(
    private templateService: TemplateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.getCurrentUserIdFromToken();
    this.loadTemplates();
  }

  onSearchQueryChange(value: string): void {
    this.searchQuery = value ?? '';
  }

  searchTemplates(): void {
    this.appliedSearchQuery = this.searchQuery.trim();
    this.loadTemplates(this.appliedSearchQuery);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.appliedSearchQuery = '';
    this.loadTemplates('');
  }

  loadTemplates(query: string = this.appliedSearchQuery): void {
    this.loading = true;
    this.loadError = false;
    this.templateService.getAllTemplates({ search: query }).subscribe({
      next: (data) => {
        const normalized = query.trim().toLowerCase();
        this.templates = !normalized
          ? data
          : data.filter((template) =>
              (template.name ?? '').toLowerCase().includes(normalized) ||
              (template.description ?? '').toLowerCase().includes(normalized)
            );
        this.loading = false;
        this.loadError = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    // no-op
  }

  getTemplateCountLabel(count: number): string {
    if (count === 1) {
      return '1 sablon';
    }

    return `${count} sablona`;
  }

  getTemplateOrganizationName(template: Template): string {
    return template.organization?.name?.trim() || 'N/A';
  }

  isDeletingTemplate(templateId?: number): boolean {
    return templateId != null && this.deletingTemplateId === templateId;
  }

  canEditTemplate(template: Template): boolean {
    const createdByUserId = this.normalizeId(template.createdByUserId);
    return !!this.currentUserId && !!createdByUserId && createdByUserId === this.currentUserId;
  }

  canDeleteTemplate(template: Template): boolean {
    return this.canEditTemplate(template);
  }

  deleteTemplate(template: Template, event?: Event): void {
    event?.stopPropagation();

    const templateId = template.id;
    if (!templateId || this.deletingTemplateId != null || !this.canDeleteTemplate(template)) {
      return;
    }

    this.pendingTemplateDelete = template;
    this.deleteDialogVisible = true;
  }

  cancelDeleteTemplate(): void {
    this.deleteDialogVisible = false;
    this.pendingTemplateDelete = null;
  }

  confirmDeleteTemplate(): void {
    const pendingTemplate = this.pendingTemplateDelete;
    const templateId = pendingTemplate?.id;
    if (!templateId || this.deletingTemplateId != null) {
      this.cancelDeleteTemplate();
      return;
    }

    this.deleteDialogVisible = false;
    this.deleteErrorMessage = '';
    this.deletingTemplateId = templateId;
    this.templateService.deleteTemplate(templateId).subscribe({
      next: () => this.loadTemplates(this.appliedSearchQuery),
      error: () => {
        this.deleteErrorMessage = 'Greska pri brisanju sablona.';
        this.cdr.detectChanges();
      },
      complete: () => {
        this.deletingTemplateId = null;
        this.pendingTemplateDelete = null;
        this.cdr.detectChanges();
      }
    });
  }

  get pendingTemplateDeleteName(): string {
    const name = this.pendingTemplateDelete?.name?.trim();
    return name || 'ovaj sablon';
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
}
