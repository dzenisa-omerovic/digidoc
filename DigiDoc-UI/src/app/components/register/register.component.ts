import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { UserService } from '../../services/user.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { Router } from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { NgClass } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { OrganizationService } from '../../services/organization.service';
import { Organization } from '../../models/organization/organization.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ToastModule,
    ReactiveFormsModule,
    PasswordModule,
    ButtonModule,
    RadioButtonModule,
    DatePickerModule,
    InputTextModule,
    NgClass,
    SelectModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  registrationMode: 'join' | 'create-org' = 'join';
  organizations: Organization[] = [];
  loadingOrganizations = false;
  registerForm: FormGroup;
  passwordVisible = false;
  passwordFocused = false;
  passwordCriteria = {
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    specialChar: false
  };

  constructor(
    private userService: UserService,
    private organizationService: OrganizationService,
    private messageService: MessageService,
    private router: Router
  ) {
    this.registerForm = new FormGroup({
      username: new FormControl('', [Validators.required, Validators.minLength(5), Validators.maxLength(15)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      phoneNumber: new FormControl('', [Validators.required, Validators.pattern(/^\d{10,15}$/)]),
      password: new FormControl('', Validators.required),
      name: new FormControl('', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]),
      surname: new FormControl('', [Validators.required, Validators.minLength(5), Validators.maxLength(30)]),
      isFemale: new FormControl(null, Validators.required),
      dateOfBirth: new FormControl('', [Validators.required, this.validateAge.bind(this)]),
      organizationId: new FormControl(null, Validators.required),
      createOrganizationRequest: new FormControl(false),
      organizationName: new FormControl('')
    });

    this.registerForm.get('password')?.valueChanges.subscribe((password) => {
      this.checkPasswordStrength(password || '');
    });
  }

  ngOnInit(): void {
    this.loadOrganizations();
  }

  onRegistrationModeChange(mode: 'join' | 'create-org'): void {
    this.registrationMode = mode;
    const organizationIdControl = this.registerForm.get('organizationId');
    const organizationNameControl = this.registerForm.get('organizationName');
    const createOrganizationRequestControl = this.registerForm.get('createOrganizationRequest');

    if (!organizationIdControl || !organizationNameControl || !createOrganizationRequestControl) {
      return;
    }

    if (mode === 'create-org') {
      createOrganizationRequestControl.setValue(true);
      organizationIdControl.clearValidators();
      organizationIdControl.setValue(null);
      organizationNameControl.setValidators([Validators.required, Validators.minLength(3), Validators.maxLength(160)]);
    } else {
      createOrganizationRequestControl.setValue(false);
      organizationIdControl.setValidators([Validators.required]);
      organizationNameControl.clearValidators();
      organizationNameControl.setValue('');
    }

    organizationIdControl.updateValueAndValidity();
    organizationNameControl.updateValueAndValidity();
  }

  private loadOrganizations(): void {
    this.loadingOrganizations = true;
    this.organizationService.getOrganizations().subscribe({
      next: (organizations) => {
        this.organizations = organizations;
        this.loadingOrganizations = false;
      },
      error: () => {
        this.organizations = [];
        this.loadingOrganizations = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Greska',
          detail: 'Ne mozemo da ucitamo listu organizacija.'
        });
      }
    });
  }

  onPasswordFocus(): void {
    this.passwordFocused = true;
  }

  onPasswordBlur(): void {
    const passwordControl = this.registerForm.get('password');
    if (passwordControl?.valid || !passwordControl?.value) {
      this.passwordFocused = false;
    }
  }

  checkPasswordStrength(password: string): void {
    this.passwordCriteria.length = password.length >= 8;
    this.passwordCriteria.lowercase = /[a-z]/.test(password);
    this.passwordCriteria.uppercase = /[A-Z]/.test(password);
    this.passwordCriteria.number = /\d/.test(password);
    this.passwordCriteria.specialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  }

  validateAge(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const birthDate = new Date(control.value);
    if (isNaN(birthDate.getTime())) {
      return null;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    return age >= 18 ? null : { underage: true };
  }

  getErrorMessage(field: string): string {
    const control = this.registerForm.get(field);
    if (!control) {
      return '';
    }

    if (control.hasError('required')) {
      if (field === 'organizationId') {
        return 'Izaberite organizaciju';
      }

      if (field === 'organizationName') {
        return 'Unesite naziv nove organizacije';
      }

      return 'Ovo polje je obavezno';
    }

    if (control.hasError('minlength')) {
      const minLength = control.getError('minlength')?.requiredLength || 0;
      return `Minimalna duzina je ${minLength} karaktera`;
    }

    if (control.hasError('maxlength')) {
      const maxLength = control.getError('maxlength')?.requiredLength || 0;
      return `Maksimalna duzina je ${maxLength} karaktera`;
    }

    if (control.hasError('email')) {
      return 'Unesite validnu email adresu';
    }

    if (control.hasError('pattern')) {
      return 'Broj telefona mora imati izmedju 10 i 15 cifara';
    }

    if (field === 'dateOfBirth' && control.hasError('underage')) {
      return 'Ne mozete kreirati nalog ako imate ispod 18 godina';
    }

    return '';
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  onSubmit(): void {
    if (!this.registerForm.valid || this.loadingOrganizations) {
      return;
    }

    const createOrganizationRequest = this.registrationMode === 'create-org';
    const registerData = {
      ...this.registerForm.value,
      isFemale: this.registerForm.value.isFemale === 'true',
      createOrganizationRequest,
      organizationId: createOrganizationRequest ? null : this.registerForm.value.organizationId,
      organizationName: createOrganizationRequest ? this.registerForm.value.organizationName : null
    };

    this.userService.register(registerData).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Uspesno',
          detail: response?.message || 'Nalog je kreiran i ceka odobrenje.'
        });
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        const detail = err?.error?.message || err?.error || 'Doslo je do greske pri registraciji.';
        this.messageService.add({
          severity: 'error',
          summary: 'Greska',
          detail
        });
      }
    });
  }
}
