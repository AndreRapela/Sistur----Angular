import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ItineraryService } from '../../services/itinerary.service';
import { Signal, computed } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="desktop-nav" [class.scrolled]="scrolled">
      <div class="logo cursor-pointer" routerLink="/home">
         <span class="logo-text">SisTur</span>
         <span class="logo-subtitle">Noronha</span>
      </div>

      <div class="nav-links">
        <a routerLink="/home" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Explore</a>
        <a routerLink="/events" routerLinkActive="active">Eventos</a>
        <a routerLink="/itinerary" routerLinkActive="active">Roteiro</a>
        <a routerLink="/map" routerLinkActive="active">Mapa</a>
        
        <div class="dropdown-wrapper">
          <span class="nav-label">Descubra <i class="pi pi-chevron-down text-xs"></i></span>
          <div class="dropdown-content">
            <a routerLink="/restaurants"><i class="pi pi-utensils"></i> Onde Comer</a>
            <a routerLink="/hotels"><i class="pi pi-home"></i> Onde Ficar</a>
            <a routerLink="/events"><i class="pi pi-calendar"></i> Eventos</a>
            <a routerLink="/tours"><i class="pi pi-camera"></i> Passeios</a>
          </div>
        </div>

        <a routerLink="/culture" routerLinkActive="active">História</a>
        <a routerLink="/environmental" routerLinkActive="active">Ambiental</a>
        <a routerLink="/contact" routerLinkActive="active">Contato</a>
      </div>

      <div class="user-actions">
        <!-- Itinerário -->
        <a routerLink="/itinerary" class="icon-btn relative">
          <i class="pi pi-calendar"></i>
          @if (itinerary.items().length > 0) {
            <span class="badge">{{itinerary.items().length}}</span>
          }
        </a>

        @if (auth.isAuthenticated()) {
          <div class="user-profile-wrapper user-info-trigger">
            <div class="avatar">{{auth.currentUser()?.name?.charAt(0)}}</div>
            <div class="user-menu shadow-2">
              <div class="p-3 text-sm border-bottom-1 border-gray-200">
                <div class="font-bold text-gray-800">{{auth.currentUser()?.name}}</div>
                <div class="text-primary text-xs font-bold mt-1">{{auth.currentUser()?.role}}</div>
              </div>
              
              @if (auth.hasRole('ADMIN')) {
                <a routerLink="/admin/dashboard" class="logout-btn p-2 block text-gray-700 text-sm no-underline"><i class="pi pi-shield mr-2"></i> Painel Admin</a>
              }
              @if (auth.hasRole('CLIENT')) {
                <a routerLink="/client/dashboard" class="logout-btn p-2 block text-gray-700 text-sm no-underline"><i class="pi pi-briefcase mr-2"></i> Meu Negócio</a>
              }
              <a routerLink="/profile" class="logout-btn p-2 block text-gray-700 text-sm no-underline"><i class="pi pi-user mr-2"></i> Meu Perfil</a>
              
              <button (click)="auth.logout()" class="logout-btn p-2 block w-full text-left text-red-500 font-bold border-none bg-transparent cursor-pointer mt-1">
                <i class="pi pi-sign-out mr-2"></i> Sair
              </button>
            </div>
          </div>
        } @else {
          <button routerLink="/login" class="btn-primary" style="padding: 8px 16px; font-size: 0.9rem;">Entrar</button>
        }
      </div>
    </nav>
  `,
  styles: [`
    .desktop-nav {
      display: none;
      height: 75px;
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(10px);
      padding: 0 40px;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .logo {
      display: flex;
      flex-direction: column;
      line-height: 1;
      .logo-text { font-size: 26px; font-weight: 950; color: var(--primary); letter-spacing: -1.5px; }
      .logo-subtitle { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;}
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 32px;
      a, .nav-label {
        text-decoration: none; color: #475569; font-weight: 700; font-size: 15px; cursor: pointer; transition: all 0.2s;
        &:hover, &.active { color: var(--primary); transform: translateY(-1px); }
      }
    }

    .dropdown-wrapper {
      position: relative;
      padding: 20px 0;
      &:hover .dropdown-content { display: block; transform: translateY(0); opacity: 1; pointer-events: auto; }
    }

    .dropdown-content {
      position: absolute; top: 100%; left: 0; background: white; min-width: 180px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1); border-radius: 12px; padding: 8px;
      display: none; opacity: 0; transition: all 0.2s;
      a { display: block; padding: 10px 15px; border-radius: 8px; color: #475569; }
      a:hover { background: #f1f5f9; color: var(--primary); }
    }

    .role-link {
        padding: 6px 12px; border-radius: 8px; font-size: 13px !important;
        &.admin-link { background: #fee2e2; color: #ef4444 !important; }
        &.client-link { background: #ecfdf5; color: #10b981 !important; }
    }

    .user-actions {
      display: flex; align-items: center; gap: 15px;
      .icon-btn { border: none; background: transparent; color: #94a3b8; font-size: 19px; cursor: pointer; transition: color 0.2s; }
      .icon-btn:hover { color: var(--primary); }
    }

    .user-profile-wrapper { position: relative; }
    .user-info-trigger {
        &:hover .user-menu { display: block; }
        .avatar {
          width: 42px; height: 42px; background: var(--primary); color: white; border-radius: 14px;
          display: flex; align-items: center; justify-content: center; font-weight: 800; cursor: pointer;
        }
    }

    .user-menu {
        position: absolute; right: 0; top: 100%; min-width: 200px;
        background: white; border-radius: 16px; display: none; padding: 5px;
        z-index: 1001; 
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        
        /* Ponte para manter o hover */
        &::before {
          content: '';
          position: absolute;
          top: -15px; left: 0; right: 0; height: 15px;
        }

        .logout-btn:hover { background: #fef2f2; border-radius: 10px; }
    }

    @media (min-width: 768px) {
      .desktop-nav { display: flex; }
    }
    .animate-bounce-short {
      animation: bounceShort 1s infinite;
    }
    @keyframes bounceShort {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }
  `]
})
export class NavbarComponent {
  scrolled = false;

  constructor(public auth: AuthService, public itinerary: ItineraryService) {}
}
