import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { DocumentService } from '../../services/document.service';
import { Document } from '../../models/document/document.model';
import { DocumentVersion } from '../../models/document/document-version.model';

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './document-detail.component.html',
  styleUrls: ['./document-detail.component.css']
})
export class DocumentDetailComponent implements OnInit {
  document?: Document;
  loading = true;
  loadingVersions = false;
  error = '';
  versionsError = '';
  pages: SafeHtml[] = [];
  activeContent = '';
  versions: DocumentVersion[] = [];
  selectedVersionId: number | null = null;
  selectedVersionNumber: number | null = null;
  selectedVersionCreatedAt: Date | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private documentService: DocumentService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idValue = params.get('id');
      const id = idValue ? Number(idValue) : NaN;

      if (!Number.isFinite(id)) {
        this.error = 'Dokument nije pronadjen.';
        this.loading = false;
        this.document = undefined;
        this.pages = [];
        this.versions = [];
        this.cdr.detectChanges();
        return;
      }

      this.loadDocument(id);
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  editDocument(): void {
    if (!this.document?.id) {
      return;
    }

    this.router.navigate(['/document', this.document.id, 'edit']);
  }

  exportPdf(): void {
    if (!this.document) {
      return;
    }

    const currentTitle = this.getCurrentDocumentTitle();
    const pagedHtml = this.paginateHtml(this.activeContent || this.document.content || '');
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      return;
    }

    const pagesMarkup = pagedHtml
      .map((page, index) => `
        <article class="pdf-page">
          <header class="pdf-meta">
            <span>${this.escapeHtml(currentTitle)}</span>
            <span>Strana ${index + 1}</span>
          </header>
          <section class="pdf-content">${page}</section>
        </article>
      `)
      .join('');

    const printDocument = `
      <!doctype html>
      <html lang="sr">
        <head>
          <meta charset="utf-8" />
          <title>${this.escapeHtml(currentTitle)} - PDF</title>
          <style>
            @page {
              size: A4;
              margin: 16mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              background: #e5e7eb;
              color: #0f172a;
              font-family: Georgia, "Times New Roman", serif;
            }

            .pdf-shell {
              padding: 24px 0 40px;
            }

            .pdf-page {
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto 24px;
              padding: 20mm 18mm 22mm;
              background: #ffffff;
              box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
              page-break-after: always;
            }

            .pdf-page:last-child {
              page-break-after: auto;
            }

            .pdf-meta {
              display: flex;
              justify-content: space-between;
              gap: 16px;
              margin-bottom: 16px;
              padding-bottom: 10px;
              border-bottom: 1px solid #e2e8f0;
              color: #64748b;
              font-family: Arial, sans-serif;
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            }

            .pdf-content {
              font-size: 16px;
              line-height: 1.9;
              overflow-wrap: anywhere;
              word-break: break-word;
            }

            .pdf-content h1,
            .pdf-content h2,
            .pdf-content h3 {
              color: #0f172a;
              font-family: Georgia, "Times New Roman", serif;
              font-weight: 700;
            }

            .pdf-content p {
              margin: 0 0 1rem;
            }

            .pdf-content img {
              display: block;
              max-width: min(100%, 420px);
              height: auto;
              margin: 1rem auto;
              border-radius: 8px;
              object-fit: contain;
            }

            .pdf-content ul,
            .pdf-content ol {
              padding-left: 1.4rem;
            }

            @media print {
              body {
                background: #ffffff;
              }

              .pdf-shell {
                padding: 0;
              }

              .pdf-page {
                margin: 0;
                width: auto;
                min-height: auto;
                padding: 0;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <main class="pdf-shell">${pagesMarkup}</main>
          <script>
            window.addEventListener('load', function () {
              setTimeout(function () {
                window.print();
              }, 300);
            });
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([printDocument], { type: 'text/html' });
    const objectUrl = URL.createObjectURL(blob);

    printWindow.location.href = objectUrl;
    printWindow.onload = () => {
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    };
  }

  exportXml(): void {
    if (!this.document) {
      return;
    }

    const xmlContent = this.generateDocumentXml(
      this.document,
      this.activeContent || this.document.content || '',
      this.selectedVersionNumber
    );

    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileNameBase = (this.document.title || 'dokument')
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'dokument';

    link.href = objectUrl;
    link.download = `${fileNameBase}.xml`;
    link.click();

    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  openVersion(version: DocumentVersion): void {
    this.setActiveVersion(version);
    this.cdr.detectChanges();
  }

  isVersionActive(versionId: number): boolean {
    return this.selectedVersionId === versionId;
  }

  trackByVersionId(_: number, version: DocumentVersion): number {
    return version.id;
  }

  private loadDocument(id: number): void {
    this.loading = true;
    this.error = '';
    this.versionsError = '';
    this.document = undefined;
    this.pages = [];
    this.activeContent = '';
    this.versions = [];
    this.selectedVersionId = null;
    this.selectedVersionNumber = null;
    this.selectedVersionCreatedAt = null;

    this.documentService.getDocumentById(id).subscribe({
      next: (doc) => {
        this.document = doc;
        this.activeContent = doc.content || '';
        this.pages = this.buildPageSafeHtml(this.activeContent);
        this.loading = false;
        this.loadVersions(id);
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Greska pri ucitavanju dokumenta. Proverite da li dokument postoji.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadVersions(documentId: number): void {
    this.loadingVersions = true;
    this.versionsError = '';

    this.documentService.getDocumentVersions(documentId).subscribe({
      next: (versions) => {
        this.versions = versions;

        if (versions.length > 0) {
          this.setActiveVersion(versions[0]);
        } else {
          this.selectedVersionId = null;
          this.selectedVersionNumber = null;
          this.selectedVersionCreatedAt = this.document?.createdAt ? new Date(this.document.createdAt) : null;
          this.activeContent = this.document?.content || '';
          this.pages = this.buildPageSafeHtml(this.activeContent);
        }

        this.loadingVersions = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingVersions = false;
        this.versionsError = 'Nije moguce ucitati verzije dokumenta.';
        this.cdr.detectChanges();
      }
    });
  }

  private setActiveVersion(version: DocumentVersion): void {
    this.selectedVersionId = version.id;
    this.selectedVersionNumber = version.versionNumber;
    this.selectedVersionCreatedAt = version.createdAt ? new Date(version.createdAt) : null;
    this.activeContent = version.content || '';
    this.pages = this.buildPageSafeHtml(this.activeContent);
  }

  private getCurrentDocumentTitle(): string {
    const baseTitle = this.document?.title || 'Dokument';
    return this.selectedVersionNumber != null ? `${baseTitle} (v${this.selectedVersionNumber})` : baseTitle;
  }

  private buildPageSafeHtml(html: string): SafeHtml[] {
    const chunks = this.paginateHtml(html);
    return chunks.map(chunk => this.sanitizer.bypassSecurityTrustHtml(chunk));
  }

  private paginateHtml(html: string): string[] {
    if (typeof DOMParser === 'undefined') {
      return [html];
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
    const wrapper = doc.body.firstElementChild as HTMLElement | null;

    if (!wrapper || Array.from(wrapper.childNodes).length === 0) {
      return [html];
    }

    const nodes = Array.from(wrapper.childNodes);
    const pages: string[] = [];
    let currentPage = '';
    let currentWeight = 0;
    const maxWeight = 1900;

    nodes.forEach((node) => {
      const nodeHtml = node.nodeType === Node.TEXT_NODE
        ? `<p>${this.escapeHtml(node.textContent ?? '')}</p>`
        : (node as HTMLElement).outerHTML;
      const nodeWeight = this.estimateNodeWeight(node);

      if (currentPage && currentWeight + nodeWeight > maxWeight) {
        pages.push(currentPage);
        currentPage = nodeHtml;
        currentWeight = nodeWeight;
      } else {
        currentPage += nodeHtml;
        currentWeight += nodeWeight;
      }
    });

    if (currentPage) {
      pages.push(currentPage);
    }

    return pages.length > 0 ? pages : [html];
  }

  private estimateNodeWeight(node: ChildNode): number {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent ?? '').trim().length;
    }

    const element = node as HTMLElement;
    const textLength = (element.textContent ?? '').trim().length;
    const tagName = element.tagName.toLowerCase();

    if (tagName === 'img') return 850;
    if (tagName === 'table') return 900;
    if (tagName === 'h1') return 240 + textLength;
    if (tagName === 'h2' || tagName === 'h3') return 180 + textLength;
    if (tagName === 'ul' || tagName === 'ol') return 220 + textLength * 1.2;
    return 120 + textLength * 1.1;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private generateDocumentXml(documentModel: Document, rawContent: string, versionNumber: number | null): string {
    const title = this.escapeXml(documentModel.title ?? '');
    const description = this.escapeXml(documentModel.description ?? '');
    const createdAt = documentModel.createdAt ? new Date(documentModel.createdAt).toISOString() : new Date().toISOString();
    const content = (rawContent ?? '').trim();

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<content>',
      '  <metadata>',
      `    <title>${title}</title>`,
      `    <description>${description}</description>`,
      `    <generatedAt>${this.escapeXml(createdAt)}</generatedAt>`,
      documentModel.id != null ? `    <documentId>${this.escapeXml(String(documentModel.id))}</documentId>` : '',
      documentModel.templateId != null ? `    <templateId>${this.escapeXml(String(documentModel.templateId))}</templateId>` : '',
      versionNumber != null ? `    <versionNumber>${this.escapeXml(String(versionNumber))}</versionNumber>` : '',
      '  </metadata>',
      '  <body>',
      `    <html><![CDATA[${this.wrapCData(content)}]]></html>`,
      '  </body>',
      '</content>'
    ]
      .filter((line) => line !== '')
      .join('\n');
  }

  private wrapCData(value: string): string {
    return value.replace(/]]>/g, ']]]]><![CDATA[>');
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
