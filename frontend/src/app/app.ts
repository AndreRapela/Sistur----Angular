import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { BottomNavComponent } from './components/bottom-nav/bottom-nav';
import { NavbarComponent } from './components/navbar/navbar';
import { ToastComponent } from './components/toast/toast';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, BottomNavComponent, ToastComponent, CommonModule],
  templateUrl: './app.html',
  styles: [`
    .app-main {
      min-height: 100vh;
      padding-bottom: 86px;
    }

    .app-main.map-route {
      min-height: 0;
      height: calc(100dvh - 75px);
      overflow: hidden;
      padding-bottom: 0;
    }

    @media (min-width: 768px) {
      .app-main {
        padding-bottom: 0;
      }
    }
  `]
})
export class AppComponent {
  title = 'SisTur';

  auth = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  currentRoute = signal<string>('');
  showSabat = false;
  sabatMessage = signal('');
  isTyping = false;

  private hiddenNavbarRoutes = ['/login', '/register'];

  showNavbar = computed(() => {
    const currentRoute = this.currentRoute();
    const isHiddenRoute = this.hiddenNavbarRoutes.some(route => currentRoute.startsWith(route));
    return !isHiddenRoute;
  });

  isMapRoute = computed(() => this.currentRoute().startsWith('/map'));
  showSabatButton = computed(() => this.auth.isAuthenticated() && !this.isMapRoute());

  private tips = [
    'Experimente o pôr do sol na Praia do Meio hoje. A caminhada curta compensa bastante.',
    'Dica de ouro: reserve o passeio de barco para as 9h para evitar ventos fortes.',
    'Para jantar, compare restaurantes pelo mapa e salve o favorito antes de sair.',
    'A trilha do Piquinho é melhor no início da manhã para fotos e temperatura mais amena.',
    'Confira o roteiro antes de sair: organizar por proximidade evita deslocamentos desnecessários.'
  ];

  constructor() {
    this.currentRoute.set(this.router.url);
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(event => {
        this.currentRoute.set(event.urlAfterRedirects || event.url);
      });
  }

  toggleSabat() {
    this.showSabat = !this.showSabat;
    if (this.showSabat && !this.sabatMessage()) {
      this.generateSabatTip();
    }
  }

  generateSabatTip() {
    this.isTyping = true;
    this.sabatMessage.set('');

    setTimeout(() => {
      const randomTip = this.tips[Math.floor(Math.random() * this.tips.length)];
      this.sabatMessage.set(randomTip);
      this.isTyping = false;
    }, 900);
  }
}
