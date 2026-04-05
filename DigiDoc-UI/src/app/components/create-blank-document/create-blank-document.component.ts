import { ChangeDetectorRef, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { Editor } from 'primeng/editor';
import { Toast } from 'primeng/toast';
import { DocumentService } from '../../services/document.service';
import { CreateDocumentRequest } from '../../models/document/create-document-request.model';

interface FloatingTextBox {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
}

@Component({
  selector: 'app-create-blank-document',
  templateUrl: './create-blank-document.component.html',
  styleUrls: ['./create-blank-document.component.css'],
  imports: [FormsModule, Editor, ButtonDirective, Toast],
  providers: [MessageService],
  standalone: true
})
export class CreateBlankDocumentComponent {
  private quillEditor?: any;
  private nextTextBoxId = 1;
  @ViewChild('floatingLayer') floatingLayerRef?: ElementRef<HTMLElement>;
  private dragSession?: {
    id: number;
    mode: 'move' | 'resize';
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    originWidth: number;
    originHeight: number;
  };

  documentTitle = '';
  documentDescription = '';
  editorContent = '';
  floatingTextBoxes: FloatingTextBox[] = [];
  activeTextBoxId?: number;
  readonly minTextBoxZoneHeight = 0;

  readonly editorModules = {
    toolbar: '#blank-doc-toolbar'
  };

  get textBoxZoneHeight(): number {
    if (this.floatingTextBoxes.length === 0) {
      return 0;
    }

    const maxBottom = Math.max(...this.floatingTextBoxes.map((box) => box.y + box.height));
    return Math.max(this.minTextBoxZoneHeight, maxBottom);
  }

  get textFlowOffset(): number {
    return this.textFlowTopOffset;
  }

  get textFlowTopOffset(): number {
    const box = this.getFlowAnchorBox();

    if (!box) {
      return 0;
    }

    return Math.max(0, box.height + 8 - box.y);
  }

  get textFlowLeftOffset(): number {
    const box = this.getFlowAnchorBox();

    if (!box) {
      return 0;
    }

    const layerWidth = this.getFloatingLayerSize().width;
    const boxCenter = box.x + box.width / 2;
    const isOnLeftSide = boxCenter <= layerWidth / 2;

    if (!isOnLeftSide) {
      return 0;
    }
    const gap = 10;
    const neededOffset = box.x + box.width + gap;
    return this.clamp(neededOffset, 0, Math.max(0, layerWidth - 40));
  }

  get textFlowRightOffset(): number {
    const box = this.getFlowAnchorBox();

    if (!box) {
      return 0;
    }

    const layerWidth = this.getFloatingLayerSize().width;
    const boxCenter = box.x + box.width / 2;
    const isOnRightSide = boxCenter > layerWidth / 2;

    if (!isOnRightSide) {
      return 0;
    }
    const gap = 10;
    const neededOffset = (layerWidth - box.x) + gap;
    return this.clamp(neededOffset, 0, Math.max(0, layerWidth - 40));
  }

  constructor(
    private documentService: DocumentService,
    private messageService: MessageService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  onEditorInit(event: any) {
    this.quillEditor = event.editor ?? event.instance ?? event;
    const bodyHtml = this.getEditorBodyHtml();
    if (!this.editorContent && bodyHtml) {
      this.editorContent = bodyHtml;
    }
  }

  onEditorContentChange(content: string) {
    this.editorContent = content ?? '';
  }

  goBack() {
    this.router.navigate(['/']);
  }

  insertSubheading() {
    this.insertBlock('<h2>Novi podnaslov</h2><p><br></p>');
  }

  insertQuote() {
    this.insertBlock('<blockquote>Unesite vas citat ili vaznu napomenu ovde...</blockquote><p><br></p>');
  }

  addFloatingTextBox() {
    const layer = this.getFloatingLayerSize();
    const zoneHeight = Math.max(160, this.textBoxZoneHeight);
    const maxX = Math.max(0, layer.width - 280);
    const maxY = Math.max(0, zoneHeight - 140);
    const box: FloatingTextBox = {
      id: this.nextTextBoxId++,
      x: Math.min(60 + this.floatingTextBoxes.length * 12, maxX),
      y: Math.min(Math.max(8, this.textBoxZoneHeight - 32), maxY),
      width: 280,
      height: 140,
      text: ''
    };

    this.floatingTextBoxes = [...this.floatingTextBoxes, box];
    this.activeTextBoxId = box.id;
  }

  removeFloatingTextBox(id: number) {
    this.floatingTextBoxes = this.floatingTextBoxes.filter((box) => box.id !== id);
    if (this.activeTextBoxId === id) {
      this.activeTextBoxId = undefined;
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: PointerEvent) {
    const target = event.target as HTMLElement | null;

    if (!target) {
      this.activeTextBoxId = undefined;
      return;
    }

    const clickedInsideTextBox = !!target.closest('.floating-textbox');
    if (!clickedInsideTextBox) {
      this.activeTextBoxId = undefined;
    }
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeyDown(event: KeyboardEvent) {
    if (!this.activeTextBoxId) {
      return;
    }

    const isDeleteKey = event.key === 'Delete' || event.key === 'Backspace';
    if (!isDeleteKey) {
      return;
    }

    const target = event.target as HTMLElement | null;
    const typingInInput =
      target?.tagName === 'INPUT' ||
      target?.tagName === 'TEXTAREA' ||
      target?.isContentEditable;

    if (typingInInput) {
      return;
    }

    event.preventDefault();
    this.removeFloatingTextBox(this.activeTextBoxId);
  }

  startDrag(event: PointerEvent, id: number) {
    if (event.button !== 0 || this.dragSession) {
      return;
    }

    event.preventDefault();
    const target = this.floatingTextBoxes.find((item) => item.id === id);
    if (!target) {
      return;
    }

    this.activeTextBoxId = id;
    this.dragSession = {
      id,
      mode: 'move',
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: target.x,
      originY: target.y,
      originWidth: target.width,
      originHeight: target.height
    };

    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', this.onPointerMove, { passive: false });
    window.addEventListener('pointerup', this.onPointerUp, { passive: false });
  }

  startDragFromBox(event: PointerEvent, id: number) {
    const target = event.target as HTMLElement | null;

    if (!target) {
      return;
    }

    const isResizeHandle = target.closest('.resize-handle');
    const isBody = target.closest('.floating-body');
    const isSelectionHandle = target.closest('.selection-handle');
    const isRemoveButton = target.closest('.remove-box');

    if (isResizeHandle || isBody || isSelectionHandle || isRemoveButton) {
      return;
    }

    this.startDrag(event, id);
  }

  startResize(event: PointerEvent, id: number) {
    if (event.button !== 0 || this.dragSession) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const target = this.floatingTextBoxes.find((item) => item.id === id);
    if (!target) {
      return;
    }

    this.activeTextBoxId = id;
    this.dragSession = {
      id,
      mode: 'resize',
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: target.x,
      originY: target.y,
      originWidth: target.width,
      originHeight: target.height
    };

    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', this.onPointerMove, { passive: false });
    window.addEventListener('pointerup', this.onPointerUp, { passive: false });
  }

  private onPointerMove = (event: PointerEvent) => {
    if (!this.dragSession || event.pointerId !== this.dragSession.pointerId) {
      return;
    }

    event.preventDefault();
    const target = this.floatingTextBoxes.find((item) => item.id === this.dragSession!.id);
    if (!target) {
      return;
    }

    const layer = this.getFloatingLayerSize();
    const virtualHeight = Math.max(layer.height, this.textBoxZoneHeight) + 1200;
    const deltaX = event.clientX - this.dragSession.startX;
    const deltaY = event.clientY - this.dragSession.startY;

    if (this.dragSession.mode === 'move') {
      const rawX = this.dragSession.originX + deltaX;
      const rawY = this.dragSession.originY + deltaY;
      const maxX = Math.max(0, layer.width - target.width);
      const maxY = Math.max(0, virtualHeight - target.height);
      const updatedX = this.clamp(rawX, 0, maxX);
      const updatedY = this.clamp(rawY, 0, maxY);
      target.x = updatedX;
      target.y = updatedY;
    } else {
      const maxWidth = Math.max(180, layer.width - target.x);
      const maxHeight = Math.max(110, virtualHeight - target.y);
      const rawWidth = this.dragSession.originWidth + deltaX;
      const rawHeight = this.dragSession.originHeight + deltaY;
      target.width = this.clamp(rawWidth, 180, maxWidth);
      target.height = this.clamp(rawHeight, 110, maxHeight);
    }

    this.floatingTextBoxes = [...this.floatingTextBoxes];
    this.cdr.detectChanges();
  };

  private onPointerUp = (event: PointerEvent) => {
    if (!this.dragSession || event.pointerId !== this.dragSession.pointerId) {
      return;
    }

    this.dragSession = undefined;
    document.body.style.userSelect = '';
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
  };

  updateTextBoxText(id: number, text: string) {
    this.updateTextBox(id, { text });
  }

  insertTableBlock() {
    this.insertBlock(`
      <table class="custom-table">
        <tbody>
          <tr>
            <td>Kolona 1</td>
            <td>Kolona 2</td>
          </tr>
          <tr>
            <td>Podatak 1</td>
            <td>Podatak 2</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
    `);
  }

  saveDocument() {
    if (!this.documentTitle.trim() || !this.editorContent.trim() || this.editorContent === '<p><br></p>') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Paznja',
        detail: 'Popunite naziv dokumenta i unesite neki sadrzaj.'
      });
      return;
    }

    const payload: CreateDocumentRequest = {
      title: this.documentTitle,
      description: this.documentDescription,
      content: this.buildDocumentContentWithTextBoxes(),
      templateId: null
    };

    this.documentService.createDocument(payload).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Uspeh',
          detail: 'Dokument je uspesno kreiran!'
        });

        setTimeout(() => {
          this.router.navigate(['/document', response.id]);
        }, 1000);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Greska',
          detail: 'Sistem nije uspeo da sacuva dokument.'
        });
      }
    });
  }

  private updateTextBox(id: number, patch: Partial<FloatingTextBox>) {
    this.floatingTextBoxes = this.floatingTextBoxes.map((item) =>
      item.id === id ? { ...item, ...patch } : item
    );
  }

  private buildDocumentContentWithTextBoxes(): string {
    if (this.floatingTextBoxes.length === 0) {
      return this.editorContent;
    }

    const textBoxesHtml = this.floatingTextBoxes
      .map((box) => {
        const safeText = this.escapeHtml(box.text).replace(/\n/g, '<br>');

        return `
          <div
            style="
              position:absolute;
              left:${box.x}px;
              top:${box.y}px;
              width:${box.width}px;
              min-height:${box.height}px;
              border:1px solid #000000;
              background:#ffffff;
              border-radius:0;
              padding:12px;
              box-sizing:border-box;
            ">
            ${safeText}
          </div>
        `;
      })
      .join('');

    return `
      <div style="position:relative; min-height:${this.textBoxZoneHeight}px; margin-bottom:16px;">
        ${textBoxesHtml}
      </div>
      <div>
        ${this.editorContent}
      </div>
    `;
  }

  private insertBlock(html: string) {
    if (!this.quillEditor) {
      this.editorContent += html;
      return;
    }

    this.quillEditor.focus();
    const selection = this.quillEditor.getSelection(true);
    const index = selection?.index ?? this.quillEditor.getLength();

    this.quillEditor.clipboard.dangerouslyPasteHTML(index, html, 'user');
    this.quillEditor.setSelection(index + 1, 0, 'user');
    this.editorContent = this.getEditorBodyHtml();
  }

  private getEditorBodyHtml(): string {
    const editorRoot = this.quillEditor?.root as HTMLElement | undefined;
    return editorRoot ? editorRoot.innerHTML : this.editorContent;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private getFloatingLayerSize(): { width: number; height: number } {
    const layer = this.floatingLayerRef?.nativeElement;

    if (!layer) {
      return { width: 794, height: 1122 };
    }

    return {
      width: Math.max(0, layer.clientWidth),
      height: Math.max(0, layer.clientHeight)
    };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private getFlowAnchorBox(): FloatingTextBox | undefined {
    if (this.floatingTextBoxes.length === 0) {
      return undefined;
    }

    if (this.activeTextBoxId) {
      const active = this.floatingTextBoxes.find((box) => box.id === this.activeTextBoxId);
      if (active) {
        return active;
      }
    }

    return this.floatingTextBoxes[0];
  }
}

