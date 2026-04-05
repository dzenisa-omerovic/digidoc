import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-auth-warning',
  standalone: true,
  imports: [
    Button
  ],
  templateUrl: './auth-warning.component.html',
  styleUrl: './auth-warning.component.css'
})
export class AuthWarningComponent {
  constructor(private router: Router) {}

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}
