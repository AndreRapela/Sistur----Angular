import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';
import { authGuard } from './guards/auth.guard';
import { UserRole } from './services/auth.service';

const allUserRoles: UserRole[] = ['FREE_TOURIST', 'PRO_TOURIST', 'PREMIUM_TOURIST', 'USER', 'CLIENT', 'ADMIN'];

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'client-dashboard', redirectTo: 'client/dashboard', pathMatch: 'full' },
  { path: 'admin-dashboard', redirectTo: 'admin/dashboard', pathMatch: 'full' },
  { path: 'restaurant/:id', redirectTo: 'restaurants/:id', pathMatch: 'full' },
  { path: 'hotel/:id', redirectTo: 'hotels/:id', pathMatch: 'full' },
  { path: 'home', title: 'SisTur Noronha | Planeje sua viagem', loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent) },
  { path: 'login', title: 'Entrar | SisTur Noronha', loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent), canActivate: [authGuard] },
  { path: 'register', title: 'Criar conta | SisTur Noronha', loadComponent: () => import('./pages/login/register').then(m => m.RegisterComponent), canActivate: [authGuard] },
  { path: 'environmental', title: 'Meio ambiente e conservação | SisTur Noronha', loadComponent: () => import('./pages/environmental/environmental').then(m => m.EnvironmentalComponent) },
  { path: 'culture', title: 'Cultura e história | SisTur Noronha', loadComponent: () => import('./pages/culture/culture').then(m => m.CultureComponent) },
  { path: 'pontos-turisticos', title: 'Pontos turísticos de Noronha | SisTur', loadComponent: () => import('./pages/tourist-points/tourist-points').then(m => m.TouristPointsComponent), data: { preload: true, preloadDelay: 1800 } },
  { path: 'pontos-turisticos/:id', title: 'Ponto turístico | SisTur Noronha', loadComponent: () => import('./pages/tourist-point-detail/tourist-point-detail').then(m => m.TouristPointDetailComponent) },
  { path: 'contact', title: 'Contato e ajuda | SisTur Noronha', loadComponent: () => import('./pages/contact/contact').then(m => m.ContactComponent) },
  { path: 'essenciais', title: 'Antes de viajar para Noronha | SisTur', loadComponent: () => import('./pages/travel-essentials/travel-essentials').then(m => m.TravelEssentialsComponent), data: { preload: true, preloadDelay: 2000 } },
  { path: 'events', title: 'Eventos em Fernando de Noronha | SisTur', loadComponent: () => import('./pages/event-list/event-list').then(m => m.EventListComponent) },
  { path: 'tours', title: 'Passeios em Fernando de Noronha | SisTur', loadComponent: () => import('./pages/tour-list/tour-list').then(m => m.TourListComponent), data: { preload: true, preloadDelay: 2200 } },
  { path: 'restaurants', title: 'Restaurantes em Fernando de Noronha | SisTur', loadComponent: () => import('./pages/establishment-list/establishment-list').then(m => m.EstablishmentListComponent), data: { preload: true, preloadDelay: 1600 } },
  { path: 'hotels', title: 'Hospedagens em Fernando de Noronha | SisTur', loadComponent: () => import('./pages/establishment-list/establishment-list').then(m => m.EstablishmentListComponent) },
  { path: 'conveniencias', title: 'Conveniências em Fernando de Noronha | SisTur', loadComponent: () => import('./pages/establishment-list/establishment-list').then(m => m.EstablishmentListComponent), data: { preload: true, preloadDelay: 2400 } },
  { path: 'map', title: 'Mapa de Fernando de Noronha | SisTur', loadComponent: () => import('./pages/map-page/map-page').then(m => m.MapPageComponent), data: { preload: true, preloadDelay: 900 } },
  { path: 'itinerary', title: 'Meu roteiro de Noronha | SisTur', loadComponent: () => import('./pages/itinerary/itinerary').then(m => m.ItineraryPageComponent), data: { preload: true, preloadDelay: 2600 } },
  { path: 'itinerary-shared/:token', title: 'Roteiro compartilhado | SisTur', loadComponent: () => import('./pages/itinerary-shared/itinerary-shared').then(m => m.ItinerarySharedComponent) },
  { path: 'profile', title: 'Meu perfil | SisTur', loadComponent: () => import('./pages/profile/profile').then(m => m.ProfilePageComponent), canActivate: [roleGuard(allUserRoles)] },
  { path: 'roteiros', title: 'Roteiros da comunidade | SisTur', loadComponent: () => import('./pages/itinerary-feed/itinerary-feed').then(m => m.ItineraryFeedComponent), canActivate: [roleGuard(allUserRoles)] },

  // Páginas de Detalhes
  { path: 'events/:id', title: 'Evento | SisTur Noronha', loadComponent: () => import('./pages/event-detail/event-detail').then(m => m.EventDetailComponent) },
  { path: 'tours/:id', title: 'Passeio | SisTur Noronha', loadComponent: () => import('./pages/tour-detail/tour-detail').then(m => m.TourDetailComponent) },
  { path: 'restaurants/:id', title: 'Restaurante | SisTur Noronha', loadComponent: () => import('./pages/establishment-detail/establishment-detail').then(m => m.EstablishmentDetailComponent) },
  { path: 'hotels/:id', title: 'Hospedagem | SisTur Noronha', loadComponent: () => import('./pages/establishment-detail/establishment-detail').then(m => m.EstablishmentDetailComponent) },
  { path: 'conveniencias/:id', title: 'Conveniência | SisTur Noronha', loadComponent: () => import('./pages/establishment-detail/establishment-detail').then(m => m.EstablishmentDetailComponent) },
  { path: 'establishments/:id', title: 'Lugar | SisTur Noronha', loadComponent: () => import('./pages/establishment-detail/establishment-detail').then(m => m.EstablishmentDetailComponent) },

  // Rotas Protegidas - Admin
  {
    path: 'admin/dashboard',
    title: 'Painel administrativo | SisTur',
    loadComponent: () => import('./pages/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [roleGuard(['ADMIN'])]
  },

  // Rotas Protegidas - Client (Business Owner)
  {
    path: 'client/dashboard',
    title: 'Painel do parceiro | SisTur',
    loadComponent: () => import('./pages/client-dashboard/client-dashboard.component').then(m => m.ClientDashboardComponent),
    canActivate: [roleGuard(['CLIENT', 'ADMIN'])]
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found-redirect/not-found-redirect').then(m => m.NotFoundRedirectComponent)
  }
];
