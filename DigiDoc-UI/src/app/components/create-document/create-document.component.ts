import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TemplateService } from '../../services/template.service';
import { DocumentService } from '../../services/document.service';
import { Template } from '../../models/template/template.model';
import { TemplateField } from '../../models/template/template-field.model';
import { CreateDocumentRequest } from '../../models/document/create-document-request.model';

@Component({
  selector: 'app-create-document',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    DialogModule
  ],
  templateUrl: './create-document.component.html',
  styleUrls: ['./create-document.component.css']
})
export class CreateDocumentComponent implements OnInit {
  template?: Template;
  form = new FormGroup({});
  loading = true;
  saving = false;
  matchedPlaceholderCount = 0;
  saveSuccess = '';
  saveError = '';
  fillDialogVisible = false;
  pages: SafeHtml[] = [];
  currentSpreadIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private templateService: TemplateService,
    private documentService: DocumentService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.templateService.getTemplateById(+id).subscribe({
      next: (template) => {
        this.template = template;
        this.buildForm(template.fields);
        this.updatePreview();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  buildForm(fields: TemplateField[]): void {
    const controls: Record<string, FormControl> = {};

    fields.forEach((field) => {
      controls[field.name] = new FormControl('', field.isRequired ? Validators.required : []);
    });

    this.form = new FormGroup(controls);
    this.form.valueChanges.subscribe(() => this.updatePreview());
  }

  updatePreview(): void {
    const html = this.applyValuesToTemplate(true);
    this.pages = this.buildPageSafeHtml(html);
    this.currentSpreadIndex = Math.min(this.currentSpreadIndex, Math.max(this.spreads.length - 1, 0));
  }

  applyValuesToTemplate(usePreviewFallback = false): string {
    const sourceHtml = this.template?.htmlContent ?? '';
    const values = this.form.getRawValue() as Record<string, string | null>;
    let replacedCount = 0;

    const result = Object.entries(values).reduce((html, [key, value]) => {
      const formattedValue = this.formatFieldValue(key, value ?? '');
      const pattern = new RegExp(`{{\\s*${this.escapeRegExp(key)}\\s*}}`, 'gi');

      if (pattern.test(html)) {
        replacedCount++;
      }

      pattern.lastIndex = 0;
      const fallbackValue = usePreviewFallback ? `<span class="placeholder-value">{{${key}}}</span>` : '';
      return html.replace(pattern, formattedValue || fallbackValue);
    }, sourceHtml);

    this.matchedPlaceholderCount = replacedCount;
    return result;
  }

  formatFieldValue(fieldName: string, value: string): string {
    const field = this.template?.fields.find((item) => item.name === fieldName);

    if (!field || !value) {
      return '';
    }

    if (field.type === 'date') {
      const date = new Date(value);

      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleDateString('sr-RS');
      }
    }

    return value;
  }

  getInputType(field: TemplateField): string {
    if (field.type === 'number') {
      return 'number';
    }

    if (field.type === 'date') {
      return 'date';
    }

    return 'text';
  }

  getPlaceholder(field: TemplateField): string {
    if (field.type === 'date') {
      return 'Izaberite datum';
    }

    if (field.type === 'number') {
      return 'Unesite broj';
    }

    return `Unesite ${field.label.toLowerCase()}`;
  }

  resetForm(): void {
    this.form.reset();
    this.saveSuccess = '';
    this.saveError = '';
    this.updatePreview();
  }

  openFillDialog(): void {
    this.fillDialogVisible = true;
  }

  closeFillDialog(): void {
    this.fillDialogVisible = false;
  }

  previousSpread(): void {
    this.currentSpreadIndex = Math.max(this.currentSpreadIndex - 1, 0);
  }

  nextSpread(): void {
    this.currentSpreadIndex = Math.min(this.currentSpreadIndex + 1, this.spreads.length - 1);
  }

  exportPdf(): void {
    if (!this.template) {
      this.saveError = 'Sablon nije dostupan za izvoz.';
      this.saveSuccess = '';
      return;
    }

    const pagedHtml = this.paginateHtml(this.applyValuesToTemplate());
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      this.saveError = 'Browser je blokirao otvaranje PDF pregleda.';
      this.saveSuccess = '';
      return;
    }

    const pagesMarkup = pagedHtml
      .map((page, index) => `
        <article class="pdf-page">
          <header class="pdf-meta">
            <span>${this.escapeHtml(this.template?.name ?? 'Dokument')}</span>
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
          <title>${this.escapeHtml(this.template.name)} - PDF</title>
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
    if (!this.template) {
      this.saveError = 'Sablon nije dostupan za izvoz.';
      this.saveSuccess = '';
      return;
    }

    const xmlContent = this.generateXmlDocument();
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileNameBase = (this.template.name || 'dokument')
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'dokument';

    link.href = objectUrl;
    link.download = `${fileNameBase}.xml`;
    link.click();

    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  saveDocument(): void {
    if (!this.template?.id) {
      this.saveError = 'Sablon nije spreman za cuvanje dokumenta.';
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.saveError = 'Popunite sva obavezna polja pre cuvanja dokumenta.';
      this.saveSuccess = '';
      this.fillDialogVisible = true;
      return;
    }

    const payload = this.buildCreateDocumentRequest(this.template.id);
    this.saving = true;
    this.saveError = '';
    this.saveSuccess = '';

    this.documentService.createDocument(payload).subscribe({
      next: (response) => {
        this.saving = false;
        this.saveSuccess = 'Dokument je uspesno sacuvan.';
        this.fillDialogVisible = false;
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.router.navigate(['/document', response.id]);
        }, 1000);
      },
      error: (error: HttpErrorResponse) => {
        this.saving = false;
        this.saveError = this.resolveSaveError(error);
        this.cdr.detectChanges();
      }
    });
  }

  hasFieldError(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  get spreads(): SafeHtml[][] {
    const spreads: SafeHtml[][] = [];

    for (let i = 0; i < this.pages.length; i += 2) {
      spreads.push(this.pages.slice(i, i + 2));
    }

    return spreads.length > 0 ? spreads : [[this.sanitizer.bypassSecurityTrustHtml('')]];
  }

  private buildCreateDocumentRequest(templateId: number): CreateDocumentRequest {
    const baseTemplateName = this.template?.name?.trim() || 'Dokument';

    return {
      title: `Dokument - ${baseTemplateName}`,
      description: this.template?.description ?? '',
      content: this.applyValuesToTemplate(),
      templateId
    };
  }

  private resolveSaveError(error: HttpErrorResponse): string {
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }

    if (error.error && typeof error.error === 'object') {
      const apiMessage = error.error.message ?? error.error.title ?? error.error.detail;

      if (typeof apiMessage === 'string' && apiMessage.trim()) {
        return apiMessage;
      }
    }

    return 'Cuvanje dokumenta nije uspelo. Proveri backend i bazu.';
  }

  private buildPageSafeHtml(html: string): SafeHtml[] {
    const chunks = this.paginateHtml(html);
    return chunks.map((chunk) => this.sanitizer.bypassSecurityTrustHtml(chunk));
  }

  private paginateHtml(html: string): string[] {
    if (typeof DOMParser === 'undefined') {
      return [html];
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
    const wrapper = doc.body.firstElementChild as HTMLElement | null;

    if (!wrapper) {
      return [html];
    }

    const nodes = Array.from(wrapper.childNodes);

    if (nodes.length === 0) {
      return [html];
    }

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

    if (tagName === 'img') {
      return 850;
    }

    if (tagName === 'table') {
      return 900;
    }

    if (tagName === 'h1') {
      return 240 + textLength;
    }

    if (tagName === 'h2' || tagName === 'h3') {
      return 180 + textLength;
    }

    if (tagName === 'ul' || tagName === 'ol') {
      return 220 + textLength * 1.2;
    }

    return 120 + textLength * 1.1;
  }

  private generateXmlDocument(): string {
    const sourceXml = this.template?.xmlTemplate?.trim() ?? '';
    const values = this.form.getRawValue() as Record<string, string | null>;

    if (!sourceXml) {
      return this.generateAutoXmlDocument(values);
    }

    const xmlWithValues = Object.entries(values).reduce((xml, [key, value]) => {
      const formattedValue = this.formatFieldValue(key, value ?? '');
      const escapedValue = this.escapeXml(formattedValue);
      const pattern = new RegExp(`{{\\s*${this.escapeRegExp(key)}\\s*}}`, 'gi');

      return xml.replace(pattern, escapedValue);
    }, sourceXml);

    const normalizedXml = this.ensureSingleXmlRoot(xmlWithValues);

    return `<?xml version="1.0" encoding="UTF-8"?>\n${normalizedXml}`;
  }

  private generateAutoXmlDocument(values: Record<string, string | null>): string {
    const templateName = this.escapeXml(this.template?.name?.trim() || 'Dokument');
    const generatedAt = new Date().toISOString();
    const fieldNames = this.collectXmlFieldNames();

    const fieldsXml = fieldNames
      .map((fieldName) => {
        const formattedValue = this.formatFieldValue(fieldName, values[fieldName] ?? '');
        const escapedFieldValue = this.escapeXml(formattedValue);

        return `    <${fieldName}>${escapedFieldValue}</${fieldName}>`;
      })
      .join('\n');

    const metadataLines = [
      '  <metadata>',
      `    <templateName>${templateName}</templateName>`,
      `    <generatedAt>${this.escapeXml(generatedAt)}</generatedAt>`
    ];
    if (this.template?.id != null) {
      metadataLines.push(`    <templateId>${this.escapeXml(String(this.template.id))}</templateId>`);
    }
    metadataLines.push('  </metadata>');

    const fieldsLines = ['  <fields>'];
    if (fieldsXml) {
      fieldsLines.push(fieldsXml);
    }
    fieldsLines.push('  </fields>');

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<content>',
      ...metadataLines,
      ...fieldsLines,
      '</content>'
    ].join('\n');
  }

  private collectXmlFieldNames(): string[] {
    const namesFromFields = this.template?.fields
      .map((field) => field.name?.trim())
      .filter((name): name is string => !!name) ?? [];
    const namesFromHtml = this.extractIdentifiers(this.template?.htmlContent ?? '');

    return Array.from(new Set([...namesFromFields, ...namesFromHtml]));
  }

  private extractIdentifiers(content: string): string[] {
    const placeholderMatches = Array.from(content.matchAll(/{{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*}}/g)).map(
      (match) => match[1]
    );

    return Array.from(new Set([...placeholderMatches]));
  }

  private ensureSingleXmlRoot(xml: string): string {
    const trimmedXml = xml.trim();

    if (!trimmedXml) {
      return '<DocumentExport />';
    }

    if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') {
      return `<DocumentExport>\n${trimmedXml}\n</DocumentExport>`;
    }

    const parser = new DOMParser();
    const parsedXml = parser.parseFromString(trimmedXml, 'application/xml');

    if (!parsedXml.querySelector('parsererror') && parsedXml.documentElement) {
      return trimmedXml;
    }

    const wrappedXml = `<DocumentExport>\n${trimmedXml}\n</DocumentExport>`;
    const reparsedXml = parser.parseFromString(wrappedXml, 'application/xml');

    if (!reparsedXml.querySelector('parsererror') && reparsedXml.documentElement) {
      return wrappedXml;
    }

    const serializer = new XMLSerializer();
    const safeDocument = document.implementation.createDocument('', 'DocumentExport', null);
    const root = safeDocument.documentElement;

    root.appendChild(safeDocument.createCDATASection(trimmedXml));

    return serializer.serializeToString(safeDocument);
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
