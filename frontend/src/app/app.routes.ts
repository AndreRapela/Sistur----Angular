import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';
import { authGuard } from './guards/auth.guard';
import { UserRole } from './services/auth.service';

const allUserRoles: UserRole[] = ['FREE_TOURIST', 'PRO_TOURIST', 'PREMIUM_TOURIST', 'USER', 'CLIENT', 'ADMIN'];
const eventAccessRoles: UserRole[] = ['PRO_TOURIST', 'PREMIUM_TOURIST', 'CLIENT', 'ADMIN'];

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'client-dashboard', redirectTo: 'client/dashboard', pathMatch: 'full' },
  { path: 'admin-dashboard', redirectTo: 'admin/dashboard', pathMatch: 'full' },
  { path: 'restaurant/:id', redirectTo: 'establishments/:id', pathMatch: 'full' },
  { path: 'hotel/:id', redirectTo: 'establishments/:id', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent), canActivate: [roleGuard(allUserRoles)] },
  { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent), canActivate: [authGuard] },
  { path: 'register', loadComponent: () => import('./pages/login/register').then(m => m.RegisterComponent), canActivate: [authGuard] },
  { path: 'environmental', loadComponent: () => import('./pages/environmental/environmental').then(m => m.EnvironmentalComponent), canActivate: [roleGuard(allUserRoles)] },
  { path: 'culture', loadComponent: () => import('./pages/culture/culture').then(m => m.CultureComponent), canActivate: [roleGuard(allUserRoles)] },
  { path: 'pontos-turisticos', loadComponent: () => import('./pages/tourist-points/tourist-points').then(m => m.TouristPointsComponent), canActivate: [roleGuard(allUserRoles)] },
  { path: 'pontos-turisticos/:id', loadComponent: () => import('./pages/tourist-point-detail/tourist-point-detail').then(m => m.TouristPointDetailComponent), canActivate: [roleGuard(allUserRoles)] },
  { path: 'contact', loadComponent: () => import('./pages/contact/contact').then(m => m.ContactComponent), canActivate: [roleGuard(allUserRoles)] },
  { path: 'events', loadComponent: () => import('./pages/event-list/event-list').then(m => m.EventListComponent), canActivate: [roleGuard(eventAccessRoles)] },
  { path: 'tours', loadComponent: () => import('./pages/tour-list/tour-list').then(m => m.TourListComponent), canActivate: [roleGuard(allUserRoles)] },
  { path: 'restaurants', loadComponent: () => import('./pages/establishment-list/establishment-list').then(m => m.EstablishmentListComponent), canActivate: [roleGuard(allUserRoles)] },
  { path: 'hotels', loadComponent: () => import('./pages/establishment-list/establishment-list').then(m => m.EstablishmentListComponent), canActivate: [roleGuard(allUserRoles)] },
  { path: 'map', loadComponent: () => import('./pages/map-page/map-page').then(m => m.MapPageComponent), canActivate: [roleGuard(allUserRoles)] },
  { path: 'itinerary', loadComponent: () => import('./pages/itinerary/itinerary').then(m => m.ItineraryPageComponent), canActivate: [roleGuard(allUserRoles)] },
  { path: 'itinerary-shared/:token', loadComponent: () => import('./pages/itinerary-shared/itinerary-shared').then(m => m.ItinerarySharedComponent) },
  { path: 'profile', loadComponent: () => import('./pages/profile/profile').then(m => m.ProfilePageComponent), canActivate: [roleGuard(allUserRoles)] },
  { path: 'roteiros', loadComponent: () => import('./pages/itinerary-feed/itinerary-feed').then(m => m.ItineraryFeedComponent), canActivate: [roleGuard(allUserRoles)] },

  // Páginas de Detalhes
  { path: 'events/:id', loadComponent: () => import('./pages/event-detail/event-detail').then(m => m.EventDetailComponent), canActivate: [roleGuard(eventAccessRoles)] },
  { path: 'tours/:id', loadComponent: () => import('./pages/tour-detail/tour-detail').then(m => m.TourDetailComponent), canActivate: [roleGuard(allUserRoles)] },
  { path: 'establishments/:id', loadComponent: () => import('./pages/establishment-detail/establishment-detail').then(m => m.EstablishmentDetailComponent), canActivate: [roleGuard(allUserRoles)] },

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
  {
    path: '**',
    loadComponent: () => import('./pages/not-found-redirect/not-found-redirect').then(m => m.NotFoundRedirectComponent)
  }
];
