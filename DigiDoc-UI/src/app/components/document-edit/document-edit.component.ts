import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { diffWordsWithSpace } from 'diff';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { Editor } from 'primeng/editor';
import { Toast } from 'primeng/toast';
import { DocumentService } from '../../services/document.service';
import { Document } from '../../models/document/document.model';
import { DocumentVersion } from '../../models/document/document-version.model';
import { UpdateDocumentRequest } from '../../models/document/update-document-request.model';

@Component({
  selector: 'app-document-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DialogModule, Editor, Toast],
  providers: [MessageService],
  templateUrl: './document-edit.component.html',
  styleUrls: ['./document-edit.component.css']
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

  showComparisonDialog = false;
  comparisonLeftLabel = '';
  comparisonRightLabel = '';
  leftComparedPreview: SafeHtml = '';
  rightComparedPreview: SafeHtml = '';

  readonly editorModules = {
    toolbar: '#document-edit-toolbar'
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
        this.loadVersionsAndOpenComparison(response.latestVersionNumber);
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

  versionLabel(version: DocumentVersion): string {
    return `v${version.versionNumber} (${this.formatDate(version.createdAt)})`;
  }

  closeComparisonDialog(): void {
    this.showComparisonDialog = false;
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
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Dokument nije moguce ucitati.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadVersionsAndOpenComparison(preferredRightVersionNumber: number): void {
    if (!this.documentId) {
      return;
    }

    this.documentService.getDocumentVersions(this.documentId).subscribe({
      next: (versions) => {
        const orderedVersions = [...versions].sort((a, b) => a.versionNumber - b.versionNumber);
        this.openComparisonForLatestSave(orderedVersions, preferredRightVersionNumber);
      },
      error: () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Napomena',
          detail: 'Verzije nisu dostupne za prikaz poredjenja.'
        });
      }
    });
  }

  private assignDocument(doc: Document): void {
    this.documentTitle = doc.title ?? '';
    this.documentDescription = doc.description ?? '';
    this.editorContent = doc.content ?? '';
  }

  private openComparisonForLatestSave(orderedVersions: DocumentVersion[], preferredRightVersionNumber: number): void {
    if (orderedVersions.length === 0) {
      return;
    }

    const right =
      orderedVersions.find((version) => version.versionNumber === preferredRightVersionNumber) ??
      orderedVersions[orderedVersions.length - 1];
    const rightIndex = orderedVersions.findIndex((version) => version.id === right.id);
    const left = rightIndex > 0 ? orderedVersions[rightIndex - 1] : undefined;

    this.comparisonLeftLabel = left ? this.versionLabel(left) : 'Prethodna verzija ne postoji';
    this.comparisonRightLabel = this.versionLabel(right);

    const comparison = this.buildWordLevelComparison(left?.content ?? '', right.content ?? '');
    this.leftComparedPreview = this.sanitizer.bypassSecurityTrustHtml(comparison.leftHtml);
    this.rightComparedPreview = this.sanitizer.bypassSecurityTrustHtml(comparison.rightHtml);
    this.showComparisonDialog = true;
    this.cdr.detectChanges();
  }

  private buildWordLevelComparison(leftHtml: string, rightHtml: string): ComparedContent {
    if (typeof DOMParser === 'undefined') {
      return { leftHtml, rightHtml };
    }

    const safeLeft = leftHtml || '<p></p>';
    const safeRight = rightHtml || '<p></p>';
    const parser = new DOMParser();
    const leftDoc = parser.parseFromString(safeLeft, 'text/html');
    const rightDoc = parser.parseFromString(safeRight, 'text/html');
    const leftText = leftDoc.body.textContent ?? '';
    const rightText = rightDoc.body.textContent ?? '';
    const parts = diffWordsWithSpace(leftText, rightText);

    const leftSegments: CompareSegment[] = [];
    const rightSegments: CompareSegment[] = [];

    for (const part of parts) {
      if (part.added) {
        rightSegments.push({ text: part.value, changed: true });
        continue;
      }

      if (part.removed) {
        leftSegments.push({ text: part.value, changed: true });
        continue;
      }

      leftSegments.push({ text: part.value, changed: false });
      rightSegments.push({ text: part.value, changed: false });
    }

    this.applySegmentsToDocument(leftDoc, leftSegments, 'diff-removed-word');
    this.applySegmentsToDocument(rightDoc, rightSegments, 'diff-added-word');

    return {
      leftHtml: leftDoc.body.innerHTML,
      rightHtml: rightDoc.body.innerHTML
    };
  }

  private applySegmentsToDocument(document: globalThis.Document, segments: CompareSegment[], className: string): void {
    const textNodes = this.getTextNodes(document.body);
    let segmentIndex = 0;
    let segmentOffset = 0;

    for (const node of textNodes) {
      const value = node.nodeValue ?? '';
      if (!value.length) {
        continue;
      }

      const fragment = document.createDocumentFragment();
      let nodeOffset = 0;

      while (nodeOffset < value.length) {
        if (segmentIndex >= segments.length) {
          fragment.appendChild(document.createTextNode(value.slice(nodeOffset)));
          break;
        }

        const currentSegment = segments[segmentIndex];
        const remainingInSegment = currentSegment.text.length - segmentOffset;
        const remainingInNode = value.length - nodeOffset;
        const take = Math.min(remainingInSegment, remainingInNode);
        const piece = value.slice(nodeOffset, nodeOffset + take);

        if (currentSegment.changed && /\S/.test(piece)) {
          const marker = document.createElement('span');
          marker.className = className;
          marker.textContent = piece;
          fragment.appendChild(marker);
        } else {
          fragment.appendChild(document.createTextNode(piece));
        }

        nodeOffset += take;
        segmentOffset += take;

        if (segmentOffset >= currentSegment.text.length) {
          segmentIndex += 1;
          segmentOffset = 0;
        }
      }

      node.parentNode?.replaceChild(fragment, node);
    }
  }

  private getTextNodes(root: HTMLElement): Text[] {
    const nodes: Text[] = [];
    const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();

    while (current) {
      nodes.push(current as Text);
      current = walker.nextNode();
    }

    return nodes;
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

interface CompareSegment {
  text: string;
  changed: boolean;
}

interface ComparedContent {
  leftHtml: string;
  rightHtml: string;
}
