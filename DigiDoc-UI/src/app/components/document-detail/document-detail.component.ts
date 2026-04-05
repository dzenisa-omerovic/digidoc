import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { DocumentService } from '../../services/document.service';
import { Document } from '../../models/document/document.model';

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
  error = '';
  pages: SafeHtml[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private documentService: DocumentService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.error = 'Dokument nije pronaÄ‘en.';
      this.loading = false;
      return;
    }

    this.documentService.getDocumentById(+id).subscribe({
      next: (doc) => {
        this.document = doc;
        this.pages = this.buildPageSafeHtml(doc.content);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'GreÅ¡ka pri uÄitavanju dokumenta. Proverite da li dokument postoji.';
        this.loading = false;
        this.cdr.detectChanges();
      }
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
}

