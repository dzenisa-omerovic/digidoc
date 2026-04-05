import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { Editor } from 'primeng/editor';
import { InputText } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Toast } from 'primeng/toast';
import { TemplateField } from '../../models/template/template-field.model';
import { Template } from '../../models/template/template.model';
import { TemplateService } from '../../services/template.service';

@Component({
  selector: 'app-create-template',
  templateUrl: './create-template.component.html',
  styleUrls: ['./create-template.component.css'],
  imports: [
    FormsModule,
    Editor,
    TableModule,
    InputText,
    SelectModule,
    ButtonDirective,
    Toast
  ],
  providers: [MessageService]
})
export class CreateTemplateComponent implements OnInit {
  private quillEditor?: any;

  template: Template = {
    name: '',
    description: '',
    htmlContent: '',
    fields: []
  };

  editorContent = '';

  fieldTypes = [
    { label: 'Tekstualno polje', value: 'text' },
    { label: 'Numericko polje', value: 'number' },
    { label: 'Datum', value: 'date' }
  ];

  isEditMode = false;
  templateId?: number;

  constructor(
    private templateService: TemplateService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.templateId = +idParam;
      this.loadTemplate(this.templateId);
    }
  }

  loadTemplate(id: number) {
    this.templateService.getTemplateById(id).subscribe({
      next: (data) => {
        this.template = data;
        this.editorContent = data.htmlContent || '';
        
        if (this.quillEditor && this.editorContent) {
          this.quillEditor.clipboard.dangerouslyPasteHTML(0, this.editorContent);
        }
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Greska', detail: 'Nije moguce ucitati sablon.' });
        this.router.navigate(['/templates']);
      }
    });
  }

  onEditorInit(event: any) {
    this.quillEditor = event.editor ?? event.instance ?? event;
    
    if (this.editorContent) {
      this.quillEditor.clipboard.dangerouslyPasteHTML(0, this.editorContent);
    } else {
      this.editorContent = this.getEditorBodyHtml();
      this.template.htmlContent = this.editorContent;
      this.syncFieldsFromEditorContent();
    }
  }

  onEditorContentChange(content: string) {
    this.editorContent = content ?? '';
    this.template.htmlContent = this.editorContent;
    this.syncFieldsFromEditorContent();
  }

  addField() {
    const newField: TemplateField = {
      name: '',
      label: '',
      type: 'text',
      isRequired: true
    };

    this.template.fields = [...this.template.fields, newField];
  }

  removeField(index: number) {
    this.template.fields.splice(index, 1);
  }

  goBack() {
    this.router.navigate(['/templates']);
  }

  insertSubheading() {
    this.insertBlock('<h2>Podnaslov sekcije</h2><p><br></p>');
  }

  insertSignatureLine() {
    this.insertBlock(`
      <p><br></p>
      <p>______________________________</p>
      <p>Potpis</p>
      <p><br></p>
    `);
  }

  insertPlaceholderToken() {
    this.insertBlock('<p>{{naziv_polja}}</p><p><br></p>');
  }

  saveTemplate() {
    if (!this.template.name || this.template.fields.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Paznja',
        detail: 'Popunite naziv i bar jedno polje'
      });
      return;
    }

    this.template.htmlContent = this.editorContent;

    const payload: Template = {
      ...this.template,
      xmlTemplate: undefined
    };

    if (this.isEditMode && this.templateId) {
      this.templateService.updateTemplate(this.templateId, payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Uspeh',
            detail: 'Sablon je uspesno azuriran!'
          });

          setTimeout(() => {
            this.router.navigate(['/templates']);
          }, 1000);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Greska',
            detail: 'Sistem nije uspeo da azurira sablon.'
          });
        }
      });
    } else {
      this.templateService.createTemplate(payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Uspeh',
            detail: 'Sablon je uspesno kreiran!'
          });

          setTimeout(() => {
            this.router.navigate(['/templates']);
          }, 1000);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Greska',
            detail: 'Sistem nije uspeo da sacuva sablon.'
          });
        }
      });
    }
  }

  private insertBlock(html: string) {
    if (!this.quillEditor) {
      this.editorContent += html;
      this.template.htmlContent = this.editorContent;
      return;
    }

    this.quillEditor.focus();
    const selection = this.quillEditor.getSelection(true);
    const index = selection?.index ?? this.quillEditor.getLength();

    this.quillEditor.clipboard.dangerouslyPasteHTML(index, html, 'user');
    this.quillEditor.setSelection(index + 1, 0, 'user');
    this.editorContent = this.getEditorBodyHtml();
    this.template.htmlContent = this.editorContent;
    this.syncFieldsFromEditorContent();
  }

  private getEditorBodyHtml(): string {
    const editorRoot = this.quillEditor?.root as HTMLElement | undefined;

    if (!editorRoot) {
      return this.editorContent;
    }

    return editorRoot.innerHTML;
  }

  private syncFieldsFromEditorContent() {
    this.syncFieldsFromContent(this.editorContent);
  }

  private syncFieldsFromContent(content: string) {
    const detectedIdentifiers = this.extractIdentifiers(content);

    this.template.fields = this.template.fields.filter(field => 
      !field.isAutoDiscovered || detectedIdentifiers.includes(field.name)
    );

    const existingNames = new Set(
      this.template.fields
        .map((field) => field.name?.trim())
        .filter((name): name is string => !!name)
    );

    const autoDiscoveredFields: TemplateField[] = detectedIdentifiers
      .filter((identifier) => !existingNames.has(identifier))
      .map((identifier) => ({
        name: identifier,
        label: '',
        type: 'text',
        isRequired: true,
        isAutoDiscovered: true
      }));

    if (autoDiscoveredFields.length > 0) {
      this.template.fields = [...this.template.fields, ...autoDiscoveredFields];
    }
  }

  private extractIdentifiers(content: string): string[] {
    const placeholderMatches = Array.from(content.matchAll(/{{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*}}/g)).map(
      (match) => match[1]
    );

    return Array.from(new Set([...placeholderMatches]));
  }
}
