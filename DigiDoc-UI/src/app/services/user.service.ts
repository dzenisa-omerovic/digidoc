import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {BehaviorSubject, Observable, tap} from 'rxjs';
import { UserRegister } from '../models/user/user-register.model';
import { UserLogin } from '../models/user/user-login.model';
import { LoginResponse } from '../models/user/login-response.model';
import { UserInfoData } from '../models/user/user-info-data.model';
import { UpdateUser } from '../models/user/update-user.model';



@Injectable({
  providedIn: 'root'
})
export class UserService {
  private authSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
  authChanged$ = this.authSubject.asObservable();
  private apiUrl = 'http://localhost:5117/api/User';
  constructor(private http: HttpClient) { }
  login(user: UserLogin): Observable<LoginResponse> {
    console.log('1. Servis: Pokrećem login...');
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, user).pipe(
      tap((response) => {
        localStorage.setItem('token', response.token);
        this.authSubject.next(true); // 🔥 OVO JE KLJUČ
      })
    );
  }
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    this.authSubject.next(false);
  }
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }
  getCurrentUser(): Observable<UserInfoData> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<UserInfoData>(`${this.apiUrl}/me`, { headers });
  }
  register(user: UserRegister): Observable<UserRegister> {
    return this.http.post<UserRegister>(`${this.apiUrl}/register`, user);
  }
  updateUser(userData: UpdateUser): Observable<UpdateUser> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put<UpdateUser>(`${this.apiUrl}/update`, userData, { headers });
  }
  deleteAccount(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.delete(`${this.apiUrl}/delete`, { headers });
  }
  getRole(): string {
    const token = localStorage.getItem('token');
    if (!token) return 'User';

    try {
      const base64Payload = token.split('.')[1];
      const payload = JSON.parse(atob(base64Payload));
      return payload.role || 'User';
    } catch (err) {
      console.error('Token decode failed:', err);
      return 'User';
    }
  }
  getAllUsers(): Observable<UserInfoData[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<UserInfoData[]>(`${this.apiUrl}/users`, { headers });
  }

  deleteUserByAdmin(userId: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete(`${this.apiUrl}/${userId}`, { headers });
  }
  getUserById(id: string): Observable<UserInfoData> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<UserInfoData>(`${this.apiUrl}/users/${id}`, { headers });
  }
  updateUserByAdmin(userId: string, userData: UpdateUser): Observable<UpdateUser> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put<UpdateUser>(`${this.apiUrl}/update-user-by-admin/${userId}`, userData, { headers });
  }
}
