import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Organization } from '../models/organization/organization.model';

export interface OrganizationDeleteResult {
  organizationId: string;
  organizationName: string;
  deletedUsersCount: number;
  deletedTemplatesCount: number;
  deletedDocumentsCount: number;
  deletedDocumentVersionsCount: number;
}

export interface CreateOrganizationRequestPayload {
  organizationName: string;
  establishedAt: Date | null;
  activityDescription: string;
  adminUsername: string;
  adminPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private readonly apiUrl = 'http://localhost:5117/api/Organization';

  constructor(private http: HttpClient) {}

  getOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(this.apiUrl, this.getRequestOptions());
  }

  createOrganizationRequest(payload: CreateOrganizationRequestPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/request`, payload);
  }

  deleteOrganization(id: string): Observable<OrganizationDeleteResult> {
    return this.http.delete<OrganizationDeleteResult>(`${this.apiUrl}/${id}`, this.getRequestOptions());
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
