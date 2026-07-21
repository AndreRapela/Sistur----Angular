import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { AnalyticsService } from '../../services/analytics.service';
import { ItineraryService } from '../../services/itinerary.service';
import { ItineraryItemType } from '../../services/itinerary.service';

interface QuickAction {
  label: string;
  description: string;
  icon: string;
  route: string;
  queryParams?: Record<string, string>;
  tone: 'blue' | 'green' | 'orange' | 'purple';
}

interface DiscoveryCard {
  id: string;
  title: string;
  category: string;
  location: string;
  icon: string;
  type: ItineraryItemType;
  route: string;
  queryParams?: Record<string, string>;
  note: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent {
  public itinerary = inject(ItineraryService);
  private router = inject(Router);
  private analytics = inject(AnalyticsService);
  private title = inject(Title);

  searchQuery = '';

  quickActions: QuickAction[] = [
    {
      label: 'Mapa ao vivo',
      description: 'Restaurantes, passeios, pontos e conveniências por perto.',
      icon: 'pi pi-map',
      route: '/map',
      tone: 'blue'
    },
    {
      label: 'Onde comer',
      description: 'Todos os restaurantes e bares cadastrados ou encontrados.',
      icon: 'pi pi-utensils',
      route: '/map',
      queryParams: { category: 'RESTAURANT' },
      tone: 'orange'
    },
    {
      label: 'Passeios',
      description: 'Experiências, trilhas, barco, mergulho e agências locais.',
      icon: 'pi pi-camera',
      route: '/map',
      queryParams: { category: 'TOUR' },
      tone: 'green'
    },
    {
      label: 'Conveniências',
      description: 'Postos, mercados, feiras e serviços úteis da ilha.',
      icon: 'pi pi-shopping-bag',
      route: '/conveniencias',
      tone: 'purple'
    }
  ];

  plannerLinks = [
    { label: 'Pontos turísticos', icon: 'pi pi-compass', route: '/pontos-turisticos' },
    { label: 'Restaurantes', icon: 'pi pi-utensils', route: '/restaurants' },
    { label: 'Hospedagem', icon: 'pi pi-home', route: '/hotels' },
    { label: 'Roteiro', icon: 'pi pi-calendar', route: '/itinerary' }
  ];

  discoveryCards: DiscoveryCard[] = [
    {
      id: 'sancho',
      title: 'Baía do Sancho',
      category: 'Praia',
      location: 'Parque Nacional Marinho',
      icon: 'pi pi-compass',
      type: 'HIGHLIGHT',
      route: '/map',
      queryParams: { category: 'POINT', q: 'sancho' },
      note: 'Priorize manhã cedo e confira regras de acesso.'
    },
    {
      id: 'food',
      title: 'Jantar na Vila',
      category: 'Gastronomia',
      location: 'Vila dos Remédios',
      icon: 'pi pi-utensils',
      type: 'RESTAURANT',
      route: '/map',
      queryParams: { category: 'RESTAURANT', q: 'vila' },
      note: 'Compare distância, avaliação e horário antes de sair.'
    },
    {
      id: 'boat',
      title: 'Passeio de barco',
      category: 'Experiência',
      location: 'Porto de Santo Antônio',
      icon: 'pi pi-camera',
      type: 'TOUR',
      route: '/map',
      queryParams: { category: 'TOUR', q: 'barco' },
      note: 'Bom para encaixar entre praias e almoço.'
    }
  ];

  constructor() {
    this.title.setTitle('SisTur Noronha - Planeje, descubra e navegue');
    this.analytics.pageView('/home', 'PAGE', 'home');
  }

  submitSearch() {
    const query = this.searchQuery.trim();
    this.router.navigate(['/map'], {
      queryParams: query ? { q: query } : undefined
    });
  }

  addDiscovery(card: DiscoveryCard) {
    this.itinerary.toggleItem({
      id: card.id,
      type: card.type,
      name: card.title,
      location: card.location,
      category: card.category
    });
  }

  openMap(card: DiscoveryCard) {
    this.router.navigate([card.route], { queryParams: card.queryParams });
  }
}
