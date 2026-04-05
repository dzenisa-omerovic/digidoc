import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
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
import { ButtonModule } from 'primeng/button'; // Promenjeno u ButtonModule
import { RadioButtonModule } from 'primeng/radiobutton';
import { Router } from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker'; // OBAVEZNO DatePickerModule
import { InputTextModule } from 'primeng/inputtext';
import {NgClass} from '@angular/common'; // OBAVEZNO InputTextModule

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
    NgClass
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm: FormGroup;
  passwordVisible: boolean = false;
  passwordFocused: boolean = false;
  passwordCriteria = {
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    specialChar: false
  };

  constructor(private fb: FormBuilder, private userService: UserService, private messageService: MessageService, private router: Router) {
    this.registerForm = new FormGroup({
      username: new FormControl('', [Validators.required, Validators.minLength(5), Validators.maxLength(15)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      phoneNumber: new FormControl('', [Validators.required, Validators.pattern(/^\d{10,15}$/)]),
      password: new FormControl('', Validators.required),
      name: new FormControl('', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]),
      surname: new FormControl('', [Validators.required, Validators.minLength(5), Validators.maxLength(30)]),
      isFemale: new FormControl(null, Validators.required),
      dateOfBirth: new FormControl('', [Validators.required, this.validateAge.bind(this)])
    });
    this.registerForm.get('password')!.valueChanges.subscribe(password => {
      this.checkPasswordStrength(password || '');
    });
  }

  onPasswordFocus() {
    this.passwordFocused = true;
  }

  onPasswordBlur() {
    const passwordControl = this.registerForm.get('password');
    if (passwordControl!.valid || !passwordControl!.value) {
      this.passwordFocused = false;
    }
  }

  checkPasswordStrength(password: string): void {
    this.passwordCriteria.length = password.length >= 8; // Promenila sam na 8 jer ti u HTML-u piše 8
    this.passwordCriteria.lowercase = /[a-z]/.test(password);
    this.passwordCriteria.uppercase = /[A-Z]/.test(password);
    this.passwordCriteria.number = /\d/.test(password);
    this.passwordCriteria.specialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  }

  validateAge(control: AbstractControl): ValidationErrors | null {
    if (!control || !control.value) {
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

    if (age > 18 || (age === 18 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)))) {
      return null;
    }

    return { underage: true };
  }

  getErrorMessage(field: string): string {
    const newControl = this.registerForm.get(field);

    if (!newControl) {
      return '';
    }

    if (newControl.hasError('required')) {
      return 'Ovo polje je obavezno';
    }
    if (newControl.hasError('minlength')) {
      const minLength = newControl.getError('minlength')?.requiredLength || 0;
      return `Minimalna dužina je ${minLength} karaktera`;
    }
    if (newControl.hasError('maxlength')) {
      const maxLength = newControl.getError('maxlength')?.requiredLength || 0;
      return `Maksimalna dužina je ${maxLength} karaktera`;
    }
    if (newControl.hasError('email')) {
      return 'Unesite validnu email adresu';
    }
    if (newControl.hasError('pattern')) {
      return 'Broj telefona mora imati između 10 i 15 cifara';
    }
    if (field === 'dateOfBirth' && newControl.hasError('underage')) {
      return 'Ne možete kreirati nalog ako imate ispod 18 godina!';
    }
    return '';
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  onSubmit(): void {
    if (!this.registerForm.valid) {
      return;
    }

    const registerData = {
      ...this.registerForm.value,
      isFemale: this.registerForm.value.isFemale === 'true'
    };

    this.userService.register(registerData).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Uspešno', detail: 'Nalog je uspešno kreiran!' });
        setTimeout(() => {
          const loginData = {
            username: this.registerForm.value.username,
            password: this.registerForm.value.password
          };
          this.userService.login(loginData).subscribe({
            next: () => {
              this.router.navigate(['/my-account']);
            },
          });
        }, 2000);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Greška', detail: 'Došlo je do greške pri registraciji.' });
      }
    });
  }
}
