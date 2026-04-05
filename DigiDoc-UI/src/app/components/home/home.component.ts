import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  highlights = [
    {
      icon: 'pi pi-file-edit',
      title: 'Pametni Sabloni',
      description: 'Kreiraj dokument jednom, pa ga koristi neograniceno uz placeholder polja i uredan pregled.'
    },
    {
      icon: 'pi pi-bolt',
      title: 'Brzo Popunjavanje',
      description: 'Unesi podatke kroz dinamicka polja i odmah dobij gotov dokument za pregled i cuvanje.'
    },
    {
      icon: 'pi pi-sitemap',
      title: 'XML Izvoz',
      description: 'Automatski XML je spreman po default-u, uz Advanced override kada je potreban custom format.'
    }
  ];

  navigateWithAuth(event: Event, targetRoute: string): void {
    event.preventDefault();

    if (this.userService.isLoggedIn()) {
      this.router.navigate([targetRoute]);
      return;
    }

    this.router.navigate(['/auth-warning']);
  }

  navigateToLoginOrAccount(event: Event): void {
    event.preventDefault();

    if (this.userService.isLoggedIn()) {
      this.router.navigate(['/my-account']);
      return;
    }

    this.router.navigate(['/login']);
  }
}
