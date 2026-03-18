import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { LoginComponent } from './pages/login/login';
import { EnvironmentalComponent } from './pages/environmental/environmental';
import { CultureComponent } from './pages/culture/culture';
import { ContactComponent } from './pages/contact/contact';
import { EventListComponent } from './pages/event-list/event-list';
import { TourListComponent } from './pages/tour-list/tour-list';
import { EstablishmentListComponent } from './pages/establishment-list/establishment-list';
import { MapPageComponent } from './pages/map-page/map-page';
import { ItineraryPageComponent } from './pages/itinerary/itinerary';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, canActivate: [roleGuard(['USER', 'CLIENT', 'ADMIN'])] },
  { path: 'login', component: LoginComponent },
  { path: 'environmental', component: EnvironmentalComponent, canActivate: [roleGuard(['USER', 'CLIENT', 'ADMIN'])] },
  { path: 'culture', component: CultureComponent, canActivate: [roleGuard(['USER', 'CLIENT', 'ADMIN'])] },
  { path: 'contact', component: ContactComponent, canActivate: [roleGuard(['USER', 'CLIENT', 'ADMIN'])] },
  { path: 'events', component: EventListComponent, canActivate: [roleGuard(['USER', 'CLIENT', 'ADMIN'])] },
  { path: 'tours', component: TourListComponent, canActivate: [roleGuard(['USER', 'CLIENT', 'ADMIN'])] },
  { path: 'restaurants', component: EstablishmentListComponent, canActivate: [roleGuard(['USER', 'CLIENT', 'ADMIN'])] },
  { path: 'hotels', component: EstablishmentListComponent, canActivate: [roleGuard(['USER', 'CLIENT', 'ADMIN'])] },
  { path: 'map', component: MapPageComponent, canActivate: [roleGuard(['USER', 'CLIENT', 'ADMIN'])] },
  { path: 'itinerary', component: ItineraryPageComponent, canActivate: [roleGuard(['USER', 'CLIENT', 'ADMIN'])] },
  { path: 'profile', loadComponent: () => import('./pages/profile/profile').then(m => m.ProfilePageComponent), canActivate: [roleGuard(['USER', 'CLIENT', 'ADMIN'])] },
  
  // Rotas Protegidas - Admin
  { 
    path: 'admin/dashboard', 
    loadComponent: () => import('./pages/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [roleGuard(['ADMIN'])]
  },
  
  // Rotas Protegidas - Client (Business Owner)
  { 
    path: 'client/dashboard', 
    loadComponent: () => import('./pages/client-dashboard/client-dashboard.component').then(m => m.ClientDashboardComponent),
    canActivate: [roleGuard(['CLIENT', 'ADMIN'])]
  },
];
