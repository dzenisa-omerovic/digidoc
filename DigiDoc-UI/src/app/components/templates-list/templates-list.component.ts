import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
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
    InputTextModule
  ],
  templateUrl: './templates-list.component.html',
  styleUrls: ['./templates-list.component.css']
})
export class TemplatesListComponent implements OnInit {
  templates: Template[] = [];
  loading = true;
  searchQuery = '';
  loadError = false;

  constructor(
    private templateService: TemplateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.loadError = false;
    this.templateService.getAllTemplates().subscribe({
      next: (data) => {
        this.templates = data;
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

  get filteredTemplates(): Template[] {
    const query = this.searchQuery.trim().toLowerCase();

    if (!query) {
      return this.templates;
    }

    return this.templates.filter((template) =>
      template.name.toLowerCase().includes(query) ||
      (template.description ?? '').toLowerCase().includes(query)
    );
  }

  getTemplateCountLabel(count: number): string {
    if (count === 1) {
      return '1 sablon';
    }

    return `${count} sablona`;
  }
}
