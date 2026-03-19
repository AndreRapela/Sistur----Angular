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
  { path: 'home', loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent), canActivate: [roleGuard(['USER', 'CLIENT', 'ADMIN'])] },
  { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/login/register').then(m => m.RegisterComponent) },
  { path: 'environmental', loadComponent: () => import('./pages/environmental/environmental').then(m => m.EnvironmentalComponent), canActivate: [roleGuard(['USER', 'CLIENT', 'ADMIN'])] },
  { path: 'culture', loadComponent: () => import('./pages/culture/culture').then(m => m.CultureComponent), canActivate: [roleGuard(['USER', 'CLIENT', 'ADMIN'])] },
  { path: 'contact', loadComponent: () => import('./pages/contact/contact').then(m => m.ContactComponent), canActivate: [roleGuard(['USER', 'CLIENT', 'ADMIN'])] },
  { path: 'events', loadComponent: () => import('./pages/event-list/event-list').then(m => m.EventListComponent), canActivate: [roleGuard(['USER', 'CLIENT', 'ADMIN'])] },
  { path: 'tours', loadComponent: () => import('./pages/tour-list/tour-list').then(m => m.TourListComponent), canActivate: [roleGuard(['USER', 'CLIENT', 'ADMIN'])] },
  { path: 'restaurants', loadComponent: () => import('./pages/establishment-list/establishment-list').then(m => m.EstablishmentListComponent), canActivate: [roleGuard(['USER', 'CLIENT', 'ADMIN'])] },
  { path: 'hotels', loadComponent: () => import('./pages/establishment-list/establishment-list').then(m => m.EstablishmentListComponent), canActivate: [roleGuard(['USER', 'CLIENT', 'ADMIN'])] },
  { path: 'map', loadComponent: () => import('./pages/map-page/map-page').then(m => m.MapPageComponent), canActivate: [roleGuard(['USER', 'CLIENT', 'ADMIN'])] },
  { path: 'itinerary', loadComponent: () => import('./pages/itinerary/itinerary').then(m => m.ItineraryPageComponent), canActivate: [roleGuard(['USER', 'CLIENT', 'ADMIN'])] },
  { path: 'profile', loadComponent: () => import('./pages/profile/profile').then(m => m.ProfilePageComponent), canActivate: [roleGuard(['USER', 'CLIENT', 'ADMIN'])] },
  { path: 'roteiros', loadComponent: () => import('./pages/itinerary-feed/itinerary-feed').then(m => m.ItineraryFeedComponent), canActivate: [roleGuard(['USER', 'CLIENT', 'ADMIN'])] },
  
  // Páginas de Detalhes
  { path: 'events/:id', loadComponent: () => import('./pages/event-detail/event-detail').then(m => m.EventDetailComponent), canActivate: [roleGuard(['USER', 'CLIENT', 'ADMIN'])] },
  { path: 'tours/:id', loadComponent: () => import('./pages/tour-detail/tour-detail').then(m => m.TourDetailComponent), canActivate: [roleGuard(['USER', 'CLIENT', 'ADMIN'])] },
  { path: 'establishments/:id', loadComponent: () => import('./pages/establishment-detail/establishment-detail').then(m => m.EstablishmentDetailComponent), canActivate: [roleGuard(['USER', 'CLIENT', 'ADMIN'])] },

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
