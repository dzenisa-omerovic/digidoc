import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateDocumentRequest } from '../models/document/create-document-request.model';
import { Document } from '../models/document/document.model';
import { DocumentVersion } from '../models/document/document-version.model';
import { UpdateDocumentRequest } from '../models/document/update-document-request.model';
import { UpdateDocumentResponse } from '../models/document/update-document-response.model';
import { PagedResponse } from '../models/common/paged-response.model';

export interface DocumentQueryOptions {
  q?: string;
  page?: number;
  pageSize?: number;
  templateId?: number | null;
  noTemplate?: boolean;
  folderId?: string | null;
  rootOnly?: boolean;
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private apiUrl = 'http://localhost:5117/api/Document';

  constructor(private http: HttpClient) {}

  createDocument(document: CreateDocumentRequest): Observable<Document> {
    return this.http.post<Document>(this.apiUrl, document, this.getRequestOptions());
  }

  getDocuments(options: DocumentQueryOptions = {}): Observable<PagedResponse<Document>> {
    let params = new HttpParams()
      .set('page', String(options.page ?? 1))
      .set('pageSize', String(options.pageSize ?? 20));

    const query = options.q?.trim();
    if (query) {
      params = params.set('q', query);
    }

    if (options.noTemplate) {
      params = params.set('noTemplate', 'true');
    } else if (options.templateId != null) {
      params = params.set('templateId', String(options.templateId));
    }

    if (options.rootOnly) {
      params = params.set('rootOnly', 'true');
    } else if (options.folderId) {
      params = params.set('folderId', options.folderId);
    }

    return this.http.get<PagedResponse<Document>>(this.apiUrl, {
      ...this.getRequestOptions(),
      params
    });
  }

  getDocumentById(id: number): Observable<Document> {
    return this.http.get<Document>(`${this.apiUrl}/${id}`, this.getRequestOptions());
  }

  updateDocumentContent(id: number, content: string): Observable<Document> {
    return this.http.put<Document>(`${this.apiUrl}/${id}/content`, JSON.stringify(content), {
      ...this.getRequestOptions(),
      headers: (this.getRequestOptions().headers || new HttpHeaders()).set('Content-Type', 'application/json')
    });
  }

  updateDocument(id: number, payload: UpdateDocumentRequest): Observable<UpdateDocumentResponse> {
    return this.http.put<UpdateDocumentResponse>(`${this.apiUrl}/${id}`, payload, this.getRequestOptions());
  }

  moveDocumentToFolder(id: number, folderId: string | null): Observable<Document> {
    return this.http.put<Document>(`${this.apiUrl}/${id}/move-folder`, { folderId }, this.getRequestOptions());
  }

  deleteDocument(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getRequestOptions());
  }

  getDocumentVersions(id: number): Observable<DocumentVersion[]> {
    return this.http.get<DocumentVersion[]>(`${this.apiUrl}/${id}/versions`, this.getRequestOptions());
  }

  getDocumentVersionById(id: number, versionId: number): Observable<DocumentVersion> {
    return this.http.get<DocumentVersion>(`${this.apiUrl}/${id}/versions/${versionId}`, this.getRequestOptions());
  }

  private getRequestOptions(): { headers?: HttpHeaders } {
    const token = localStorage.getItem('token');

    if (!token) {
      return {};
    }

    return {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
  }
}
