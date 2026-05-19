import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgClass } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { OrganizationService } from '../../services/organization.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-create-organization',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    DatePickerModule,
    ButtonModule,
    ToastModule,
    NgClass
  ],
  templateUrl: './create-organization.component.html',
  styleUrl: './create-organization.component.css'
})
export class CreateOrganizationComponent implements OnInit {
  loading = false;
  passwordFocused = false;
  passwordCriteria = {
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    specialChar: false
  };

  form = new FormGroup({
    organizationName: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(160)]),
    establishedAt: new FormControl<Date | null>(null),
    activityDescription: new FormControl('', [Validators.required, Validators.minLength(5), Validators.maxLength(2000)]),
    adminUsername: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(64)]),
    adminPassword: new FormControl('', [Validators.required, Validators.minLength(8)])
  });

  constructor(
    private organizationService: OrganizationService,
    private messageService: MessageService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.userService.isLoggedIn()) {
      this.router.navigate(['/documents']);
    }

    this.form.get('adminPassword')?.valueChanges.subscribe((password) => {
      this.checkPasswordStrength(password || '');
    });
  }

  submit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.organizationService.createOrganizationRequest({
      organizationName: this.form.value.organizationName?.trim() || '',
      establishedAt: this.form.value.establishedAt ?? null,
      activityDescription: this.form.value.activityDescription?.trim() || '',
      adminUsername: this.form.value.adminUsername?.trim() || '',
      adminPassword: this.form.value.adminPassword || ''
    }).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Uspesno',
          detail: res.message
        });
        this.form.reset({
          organizationName: '',
          establishedAt: null,
          activityDescription: '',
          adminUsername: '',
          adminPassword: ''
        });
        setTimeout(() => this.router.navigate(['/login']), 2200);
      },
      error: (err) => {
        const detail = err?.error?.message || err?.error || 'Neuspesno slanje zahteva za organizaciju.';
        this.messageService.add({
          severity: 'error',
          summary: 'Greska',
          detail
        });
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  fieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return 'Ovo polje je obavezno.';
    }

    if (control.errors['minlength']) {
      return `Minimalno ${control.errors['minlength'].requiredLength} karaktera.`;
    }

    if (control.errors['maxlength']) {
      return `Maksimalno ${control.errors['maxlength'].requiredLength} karaktera.`;
    }

    return 'Neispravan unos.';
  }

  onPasswordFocus(): void {
    this.passwordFocused = true;
  }

  onPasswordBlur(): void {
    const passwordControl = this.form.get('adminPassword');
    if (passwordControl?.valid || !passwordControl?.value) {
      this.passwordFocused = false;
    }
  }

  private checkPasswordStrength(password: string): void {
    this.passwordCriteria.length = password.length >= 8;
    this.passwordCriteria.lowercase = /[a-z]/.test(password);
    this.passwordCriteria.uppercase = /[A-Z]/.test(password);
    this.passwordCriteria.number = /\d/.test(password);
    this.passwordCriteria.specialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  }
}
