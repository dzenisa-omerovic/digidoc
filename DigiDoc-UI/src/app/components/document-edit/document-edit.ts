import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Editor } from 'primeng/editor';
import { Toast } from 'primeng/toast';
import { DocumentService } from '../../services/document.service';
import { Document } from '../../models/document/document.model';
import { DocumentVersion } from '../../models/document/document-version.model';
import { UpdateDocumentRequest } from '../../models/document/update-document-request.model';

@Component({
  selector: 'app-document-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, Editor, Toast],
  providers: [MessageService],
  templateUrl: './document-edit.html',
  styleUrl: './document-edit.css'
})
export class DocumentEditComponent implements OnInit {
  private quillEditor?: any;

  documentId?: number;
  loading = true;
  saving = false;
  error = '';

  documentTitle = '';
  documentDescription = '';
  editorContent = '';

  versions: DocumentVersion[] = [];
  selectedLeftVersionId?: number;
  selectedRightVersionId?: number;

  leftPreview: SafeHtml = '';
  rightPreview: SafeHtml = '';
  addedLines: string[] = [];
  removedLines: string[] = [];

  readonly editorModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ header: [1, 2, 3, false] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'link', 'image'],
      ['clean']
    ]
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private documentService: DocumentService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const parsed = Number(idParam);
    if (!idParam || Number.isNaN(parsed)) {
      this.error = 'Neispravan ID dokumenta.';
      this.loading = false;
      return;
    }

    this.documentId = parsed;
    this.loadData();
  }

  onEditorInit(event: any): void {
    this.quillEditor = event.editor ?? event.instance ?? event;
    if (this.editorContent) {
      this.quillEditor.clipboard.dangerouslyPasteHTML(0, this.editorContent);
    }
  }

  onEditorContentChange(content: string): void {
    this.editorContent = content ?? '';
  }

  saveChanges(): void {
    if (!this.documentId) {
      return;
    }

    const safeTitle = this.documentTitle.trim();
    const safeContent = this.getEditorBodyHtml().trim();
    if (!safeTitle || !safeContent || safeContent === '<p><br></p>') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Paznja',
        detail: 'Naslov i sadrzaj dokumenta su obavezni.'
      });
      return;
    }

    this.saving = true;
    const payload: UpdateDocumentRequest = {
      title: safeTitle,
      description: this.documentDescription?.trim() ?? '',
      content: safeContent
    };

    this.documentService.updateDocument(this.documentId, payload).subscribe({
      next: (response) => {
        this.documentTitle = response.title;
        this.documentDescription = response.description;
        this.editorContent = response.content;
        this.messageService.add({
          severity: 'success',
          summary: 'Sacuvano',
          detail: `Nova verzija je sacuvana (v${response.latestVersionNumber}).`
        });
        this.loadVersions(response.latestVersionNumber);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Greska',
          detail: 'Sistem nije uspeo da sacuva novu verziju dokumenta.'
        });
      },
      complete: () => {
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  openDocument(): void {
    if (!this.documentId) {
      return;
    }
    this.router.navigate(['/document', this.documentId]);
  }

  onVersionSelectionChange(): void {
    this.refreshComparisonPanels();
  }

  versionLabel(version: DocumentVersion): string {
    return `v${version.versionNumber} (${this.formatDate(version.createdAt)})`;
  }

  trackByVersionId(_: number, item: DocumentVersion): number {
    return item.id;
  }

  private loadData(): void {
    if (!this.documentId) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.documentService.getDocumentById(this.documentId).subscribe({
      next: (doc) => {
        this.assignDocument(doc);
        this.loadVersions();
      },
      error: () => {
        this.error = 'Dokument nije moguce ucitati.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadVersions(preferredRightVersionNumber?: number): void {
    if (!this.documentId) {
      return;
    }

    this.documentService.getDocumentVersions(this.documentId).subscribe({
      next: (versions) => {
        this.versions = [...versions].sort((a, b) => a.versionNumber - b.versionNumber);
        this.applyVersionDefaults(preferredRightVersionNumber);
        this.refreshComparisonPanels();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Verzije dokumenta nisu dostupne.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private assignDocument(doc: Document): void {
    this.documentTitle = doc.title ?? '';
    this.documentDescription = doc.description ?? '';
    this.editorContent = doc.content ?? '';
  }

  private applyVersionDefaults(preferredRightVersionNumber?: number): void {
    if (this.versions.length === 0) {
      this.selectedLeftVersionId = undefined;
      this.selectedRightVersionId = undefined;
      return;
    }

    const right =
      preferredRightVersionNumber !== undefined
        ? this.versions.find((version) => version.versionNumber === preferredRightVersionNumber) ?? this.versions[this.versions.length - 1]
        : this.versions[this.versions.length - 1];

    const rightIndex = this.versions.findIndex((version) => version.id === right.id);
    const left = rightIndex > 0 ? this.versions[rightIndex - 1] : this.versions[0];

    this.selectedRightVersionId = right.id;
    this.selectedLeftVersionId = left.id;
  }

  private refreshComparisonPanels(): void {
    const left = this.versions.find((version) => version.id === this.selectedLeftVersionId);
    const right = this.versions.find((version) => version.id === this.selectedRightVersionId);

    this.leftPreview = this.sanitizer.bypassSecurityTrustHtml(left?.content ?? '<p>Nema podataka.</p>');
    this.rightPreview = this.sanitizer.bypassSecurityTrustHtml(right?.content ?? '<p>Nema podataka.</p>');

    const leftLines = this.extractTextLines(left?.content ?? '');
    const rightLines = this.extractTextLines(right?.content ?? '');
    this.addedLines = this.uniqueLines(rightLines.filter((line) => !leftLines.includes(line))).slice(0, 25);
    this.removedLines = this.uniqueLines(leftLines.filter((line) => !rightLines.includes(line))).slice(0, 25);
  }

  private extractTextLines(html: string): string[] {
    if (!html) {
      return [];
    }

    if (typeof DOMParser === 'undefined') {
      return html
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => !!line);
    }

    const parser = new DOMParser();
    const parsed = parser.parseFromString(html, 'text/html');
    const rawText = (parsed.body.textContent ?? '').replace(/\r/g, '\n');
    return rawText
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter((line) => !!line);
  }

  private uniqueLines(lines: string[]): string[] {
    return Array.from(new Set(lines));
  }

  private getEditorBodyHtml(): string {
    const editorRoot = this.quillEditor?.root as HTMLElement | undefined;
    return editorRoot ? editorRoot.innerHTML : this.editorContent;
  }

  private formatDate(value: Date | string | undefined): string {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }
    return date.toLocaleString('sr-RS');
  }
}
