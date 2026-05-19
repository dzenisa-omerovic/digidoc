import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateFolderRequest,
  DeleteFolderResult,
  Folder,
  MoveFolderRequest,
  RenameFolderRequest
} from '../models/folder/folder.model';

@Injectable({ providedIn: 'root' })
export class FolderService {
  private apiUrl = 'http://localhost:5117/api/Folder';

  constructor(private http: HttpClient) {}

  getFolders(): Observable<Folder[]> {
    return this.http.get<Folder[]>(this.apiUrl, this.getRequestOptions());
  }

  createFolder(payload: CreateFolderRequest): Observable<Folder> {
    return this.http.post<Folder>(this.apiUrl, payload, this.getRequestOptions());
  }

  renameFolder(folderId: string, payload: RenameFolderRequest): Observable<Folder> {
    return this.http.put<Folder>(`${this.apiUrl}/${folderId}/rename`, payload, this.getRequestOptions());
  }

  moveFolder(folderId: string, payload: MoveFolderRequest): Observable<Folder> {
    return this.http.put<Folder>(`${this.apiUrl}/${folderId}/move`, payload, this.getRequestOptions());
  }

  deleteFolder(folderId: string): Observable<DeleteFolderResult> {
    return this.http.delete<DeleteFolderResult>(`${this.apiUrl}/${folderId}`, this.getRequestOptions());
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
