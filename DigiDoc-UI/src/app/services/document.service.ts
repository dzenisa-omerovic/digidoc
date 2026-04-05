import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateDocumentRequest } from '../models/document/create-document-request.model';
import { Document } from '../models/document/document.model';
import { DocumentVersion } from '../models/document/document-version.model';
import { UpdateDocumentRequest } from '../models/document/update-document-request.model';
import { UpdateDocumentResponse } from '../models/document/update-document-response.model';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private apiUrl = 'http://localhost:5117/api/Document';

  constructor(private http: HttpClient) {}

  createDocument(document: CreateDocumentRequest): Observable<Document> {
    return this.http.post<Document>(this.apiUrl, document, this.getRequestOptions());
  }

  getAllDocuments(): Observable<Document[]> {
    return this.http.get<Document[]>(this.apiUrl, this.getRequestOptions());
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

