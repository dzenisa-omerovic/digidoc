import { Routes } from '@angular/router';
import {RegisterComponent} from './components/register/register.component';
import {LoginComponent} from './components/login/login.component';
import {AuthWarningComponent} from './components/auth-warning/auth-warning.component';
import {MyAccountComponent} from './components/my-account/my-account.component';
import {CreateTemplateComponent} from './components/create-template/create-template.component';
import {TemplatesListComponent} from './components/templates-list/templates-list.component';
import {CreateDocumentComponent} from './components/create-document/create-document.component';
import { HomeComponent } from './components/home/home.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'auth-warning',
    component: AuthWarningComponent
  },
  {
    path: 'my-account',
    component: MyAccountComponent
  },
  {
    path: 'create-template',
    component: CreateTemplateComponent
  },
  {
    path: 'templates',
    component: TemplatesListComponent
  },
  {
    path: 'edit-template/:id',
    component: CreateTemplateComponent
  },

  {
    path: 'template/:id/fill',
    component: CreateDocumentComponent
  },
  {
    path: 'create-blank-document',
    loadComponent: () => import('./components/create-blank-document/create-blank-document.component').then(m => m.CreateBlankDocumentComponent)
  },
  {
    path: 'documents',
    loadComponent: () => import('./components/documents-list/documents-list.component').then(m => m.DocumentsListComponent)
  },
  {
    path: 'document/:id',
    loadComponent: () => import('./components/document-detail/document-detail.component').then(m => m.DocumentDetailComponent)
  },
  {
    path: 'document/:id/edit',
    loadComponent: () => import('./components/document-edit/document-edit').then(m => m.DocumentEditComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
