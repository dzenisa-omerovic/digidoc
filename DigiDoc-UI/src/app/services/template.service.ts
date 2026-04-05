import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {Template} from '../models/template/template.model';


@Injectable({ providedIn: 'root' })
export class TemplateService {
  private apiUrl = 'http://localhost:5117/api/Template';

  constructor(private http: HttpClient) {}

  createTemplate(template: Template): Observable<Template> {
    return this.http.post<Template>(this.apiUrl, template);
  }
  getAllTemplates(): Observable<Template[]> {
    return this.http.get<Template[]>(this.apiUrl);
  }
  getTemplateById(id: number): Observable<Template> {
    return this.http.get<Template>(`${this.apiUrl}/${id}`);
  }

  updateTemplate(id: number, template: Template): Observable<Template> {
    return this.http.put<Template>(`${this.apiUrl}/${id}`, template);
  }
}

