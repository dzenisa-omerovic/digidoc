import {Component, OnInit, OnDestroy, ChangeDetectorRef} from '@angular/core';
import { MenubarModule } from 'primeng/menubar';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import {Router, RouterLink} from '@angular/router';
import { UserService } from '../../services/user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    MenubarModule,
    BadgeModule,
    AvatarModule,
    RouterLink,
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  items: any[] = [];
  private authSub!: Subscription;
  userName: string = '';

  constructor(
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef // Ubaci ga u konstruktor
  ) {}

  ngOnInit() {
    console.log('3. Navbar: Inicijalizacija...');
    this.updateMenuItems();
    this.authSub = this.userService.authChanged$.subscribe((isLoggedIn) => {
      console.log('Auth changed:', isLoggedIn);
      this.updateMenuItems();
    });
  }

  updateMenuItems() {
    const isLoggedIn = this.userService.isLoggedIn();
    const role = this.userService.getRole();

    if (isLoggedIn) {
      this.buildLoggedInMenu(role);
    } else {
      this.setGuestMenu();
    }
  }

  buildLoggedInMenu(role: string | null) {
    if (role === 'Admin') {
      this.items = [
        { label: `Admin: ${this.userName}`, icon: 'pi pi-fw pi-user-focus' },
        { label: 'Odjavi se', icon: 'pi pi-fw pi-power-off', command: () => this.logout() }
      ];
    } else {
      this.items = [
        { label: 'PoÄetna', icon: 'pi pi-fw pi-home', routerLink: ['/'] },
        { label: 'Napravi sablon', icon: 'pi pi-fw pi-file-edit', routerLink: ['/create-template'] },
        { label: 'Kreiraj dokument', icon: 'pi pi-fw pi-file', routerLink: ['/create-blank-document'] },
        { label: this.userName || 'Profil', icon: 'pi pi-fw pi-user', routerLink: ['/my-account'] },
        { label: 'Sabloni', icon: 'pi pi-fw pi-folder-open', routerLink: ['/templates'] },
        { label: 'Dokumenti', icon: 'pi pi-fw pi-copy', routerLink: ['/documents'] },
        { label: 'Odjavi se', icon: 'pi pi-fw pi-power-off', command: () => this.logout(), styleClass: 'logout-item' }
      ];
    }
  
  }

  setGuestMenu() {
    this.items = [
      { label: 'PoÄetna', icon: 'pi pi-fw pi-home', routerLink: ['/'] },
      { label: 'Kreiraj nalog', icon: 'pi pi-fw pi-user-plus', routerLink: ['/register'] },
      { label: 'Prijava', icon: 'pi pi-fw pi-sign-in', routerLink: ['/login'] }
    ];
  }

  logout() {
    this.userService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy() {
    if (this.authSub) this.authSub.unsubscribe();
  }
}

