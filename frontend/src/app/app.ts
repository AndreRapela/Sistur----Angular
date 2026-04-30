import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { BottomNavComponent } from './components/bottom-nav/bottom-nav';
import { ToastComponent } from './components/toast/toast';
import { CommonModule } from '@angular/common';
import { signal, computed } from '@angular/core';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, BottomNavComponent, ToastComponent, CommonModule],
  templateUrl: './app.html',
  styles: []
})
export class AppComponent {
  title = 'SisTur';

  auth = inject(AuthService);
  private router = inject(Router);

  currentRoute = signal<string>('');

  // Rotas onde navbar NÃO deve aparecer
  private hiddenNavbarRoutes = ['/login', '/register'];

  showNavbar = computed(() => {
    const isAuth = this.auth.isAuthenticated();
    const currentRoute = this.currentRoute();
    const isHiddenRoute = this.hiddenNavbarRoutes.some(route => currentRoute.startsWith(route));

    return isAuth && !isHiddenRoute;
  });

  constructor() {
    // Atualizar a rota atual quando houver navegação
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute.set(event.urlAfterRedirects || event.url);
      });
  }

  showSabat = false;
  sabatMessage = signal('');
  isTyping = false;

  private tips = [
    "Experimente o pôr do sol na Praia do Meio hoje, está incrível!",
    "Dica de ouro: Reserve o passeio de barco para as 9h para evitar ventos fortes.",
    "O Restaurante do Zé está com uma moqueca especial hoje. Imperdível!",
    "A trilha do Piquinho é melhor no início da manhã para fotos perfeitas.",
    "Já conferiu o seu roteiro? Tem ótimos eventos musicais na vila hoje à noite!"
  ];

  toggleSabat() {
    this.showSabat = !this.showSabat;
    if (this.showSabat && !this.sabatMessage()) {
      this.generateSabatTip();
    }
  }

  generateSabatTip() {
    this.isTyping = true;
    this.sabatMessage.set('');

    // Simulating AI typing
    setTimeout(() => {
      const randomTip = this.tips[Math.floor(Math.random() * this.tips.length)];
      this.sabatMessage.set(randomTip);
      this.isTyping = false;
    }, 1500);
  }
}
