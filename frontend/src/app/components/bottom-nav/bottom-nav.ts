import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bottom-nav pb-safe">
      <a routerLink="/home" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
        <div class="icon-box"><i class="pi pi-home text-xl"></i></div>
        <span>Explore</span>
      </a>

      <a routerLink="/events" routerLinkActive="active" class="nav-item">
        <div class="icon-box"><i class="pi pi-calendar text-xl"></i></div>
        <span>Eventos</span>
      </a>

      <a routerLink="/roteiros" routerLinkActive="active" class="nav-item">
        <div class="icon-box"><i class="pi pi-users text-xl"></i></div>
        <span>Roteiros</span>
      </a>

      <a routerLink="/itinerary" routerLinkActive="active" class="nav-item">
        <div class="icon-box"><i class="pi pi-map-marker text-xl"></i></div>
        <span>Roteiro</span>
      </a>

      @if (auth.isAuthenticated()) {
        <a (click)="auth.logout()" class="nav-item logout">
          <div class="icon-box"><i class="pi pi-sign-out text-xl"></i></div>
          <span>Sair</span>
        </a>
      } @else {
        <a routerLink="/profile" routerLinkActive="active" class="nav-item">
          <div class="icon-box"><i class="pi pi-user text-xl"></i></div>
          <span>Perfil</span>
        </a>
      }
    </nav>
  `,
  styles: [`
    .bottom-nav {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      height: 75px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(15px);
      border-top: 1px solid rgba(0,0,0,0.05);
      display: flex;
      align-items: center;
      justify-content: space-around;
      z-index: 1000;
      box-shadow: 0 -5px 20px rgba(0,0,0,0.05);
    }
    
    .pb-safe { padding-bottom: env(safe-area-inset-bottom, 0px); }

    .nav-item {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      flex: 1; gap: 4px;
      text-decoration: none;
      --item-color: var(--primary-color);
      color: #94a3b8;
    }

    .icon-box {
      padding: 8px; border-radius: 12px; transition: all 0.3s ease;
    }

    .nav-item span {
      font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; transition: color 0.3s ease;
    }

    .nav-item:hover .icon-box, .nav-item.active .icon-box {
      background: color-mix(in srgb, var(--item-color) 15%, transparent);
      color: var(--item-color);
    }

    .nav-item:hover span, .nav-item.active span {
      color: var(--item-color);
    }

    .logout { --item-color: #ef4444; cursor: pointer; }

    @media (min-width: 768px) {
      .bottom-nav { display: none; }
    }
  `]
})
export class BottomNavComponent {
  constructor(public auth: AuthService) {}
}
