import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { BottomNavComponent } from './components/bottom-nav/bottom-nav';
import { ToastModule } from 'primeng/toast';
import { CommonModule } from '@angular/common';
import { signal } from '@angular/core';
import { AuthService } from './services/auth.service';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, BottomNavComponent, ToastModule, CommonModule, DrawerModule, ButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  title = 'SisTur';

  constructor(public auth: AuthService) {}
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
