import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DocumentService } from '../../services/document.service';
import { Document } from '../../models/document/document.model';

@Component({
  selector: 'app-documents-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './documents-list.component.html',
  styleUrls: ['./documents-list.component.css']
})
export class DocumentsListComponent implements OnInit {
  documents: Document[] = [];
  loading = true;
  error = '';

  constructor(
    private documentService: DocumentService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loading = true;
    this.error = '';
    this.documentService.getAllDocuments().subscribe({
      next: (docs) => {
        this.documents = docs;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Greška pri učitavanju dokumenata.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openDocument(id?: number): void {
    if (id) {
      this.router.navigate(['/document', id]);
    }
  }
}
