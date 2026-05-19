import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Template } from '../models/template/template.model';

export interface TemplateFilterQuery {
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private apiUrl = 'http://localhost:5117/api/Template';

  constructor(private http: HttpClient) {}

  createTemplate(template: Template): Observable<Template> {
    return this.http.post<Template>(this.apiUrl, template, this.getRequestOptions());
  }

  getAllTemplates(filters?: TemplateFilterQuery): Observable<Template[]> {
    let params = new HttpParams();
    const search = filters?.search?.trim();

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<Template[]>(this.apiUrl, {
      ...this.getRequestOptions(),
      params
    });
  }

  getTemplateById(id: number): Observable<Template> {
    return this.http.get<Template>(`${this.apiUrl}/${id}`, this.getRequestOptions());
  }

  updateTemplate(id: number, template: Template): Observable<Template> {
    return this.http.put<Template>(`${this.apiUrl}/${id}`, template, this.getRequestOptions());
  }

  deleteTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getRequestOptions());
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
