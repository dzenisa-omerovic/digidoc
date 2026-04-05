import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { MessageService } from 'primeng/api';
import { Router, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { Button } from 'primeng/button';
import { NgIf } from '@angular/common';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    Button,
    RouterLink,
    NgIf,
    RadioButtonModule,
    ToastModule,
    DialogModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  isAdmin: boolean = false;
  loginForm: FormGroup;
  passwordVisible: boolean = false;
  userData: any = null;
  isLoadingUser: boolean = true;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private messageService: MessageService,
    private router: Router
  ) {
      this.loginForm = new FormGroup({
        username: new FormControl('', Validators.required),
        password: new FormControl('', Validators.required)
      });
  }
  ngOnInit() {
    this.checkLoginStatus();
  }

  checkLoginStatus() {
    this.isLoadingUser = true;
    if (this.userService.isLoggedIn()) {
      this.userService.getCurrentUser().subscribe({
        next: (user) => {
          console.log("Dobijeni podaci od API-ja:", user);
          this.userData = user;
          this.isAdmin = this.userService.getRole() === 'Admin';
          if (user.dateOfBirth) {
            user.dateOfBirth = new Date(user.dateOfBirth);
          }
          this.isLoadingUser = false;
        },
        error: () => {
          this.userData = null;
          this.isLoadingUser = false;
        }
      });
    } else {
      this.userData = null;
      this.isLoadingUser = false;
    }
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }
  onSubmit(): void {
    if (!this.loginForm.valid) {
      return;
    }

    const loginData = {
      ...this.loginForm.value
    };

    console.log('Login request:', loginData);

    this.userService.login(loginData).subscribe({
      next: (response) => {
        console.log("API Response:", response);
        this.router.navigate(['/my-account']);
        this.messageService.add({
          severity: 'success',
          summary: 'Login Successful',
          detail: 'You are now logged in!'
        });
        this.checkLoginStatus();


        console.log('User successfully logged in!');


      },

      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Login Error',
          detail: 'Invalid username or password.'
        });

        console.error('Error logging user:', err);
      }
    });
  }
  logout(): void {
    this.userService.logout();
    this.userData = null;
    this.loginForm.reset();
  }

}

