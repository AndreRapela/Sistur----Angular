import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { AnalyticsService } from '../../services/analytics.service';
import { ItineraryService } from '../../services/itinerary.service';
import { ItineraryItemType } from '../../services/itinerary.service';
import {
  GooglePlaceDetails,
  GooglePlaceDetailsService
} from '../../services/google-place-details.service';

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
  type: ItineraryItemType;
  route: string;
  queryParams?: Record<string, string>;
  note: string;
  practicalInfo: string;
  googleQuery: string;
  googleMapsUrl: string;
  fallbackRating: number;
  fallbackReviewCount?: number;
  photoUrl: string;
  photoCredit: string;
  photoCreditUrl: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  public itinerary = inject(ItineraryService);
  private router = inject(Router);
  private analytics = inject(AnalyticsService);
  private title = inject(Title);
  private googlePlaces = inject(GooglePlaceDetailsService);

  readonly googleDetails = signal<Record<string, GooglePlaceDetails>>({});
  readonly starPositions = [1, 2, 3, 4, 5];

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
      icon: 'pi pi-shop',
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
    { label: 'Restaurantes', icon: 'pi pi-shop', route: '/restaurants' },
    { label: 'Hospedagem', icon: 'pi pi-home', route: '/hotels' },
    { label: 'Roteiro', icon: 'pi pi-calendar', route: '/itinerary' }
  ];

  discoveryCards: DiscoveryCard[] = [
    {
      id: 'sancho',
      title: 'Baía do Sancho',
      category: 'Praia',
      location: 'Parque Nacional Marinho',
      type: 'HIGHLIGHT',
      route: '/map',
      queryParams: { category: 'POINT', q: 'sancho' },
      note: 'Priorize manhã cedo e confira as regras e os horários de acesso.',
      practicalInfo: 'Ingresso do Parque Nacional necessário',
      googleQuery: 'Baía do Sancho',
      googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Ba%C3%ADa%20do%20Sancho%2C%20Fernando%20de%20Noronha',
      fallbackRating: 4.9,
      fallbackReviewCount: 1409,
      photoUrl: '/assets/places/baia-do-sancho.jpg',
      photoCredit: 'dronepicr · CC BY 2.0',
      photoCreditUrl: 'https://commons.wikimedia.org/wiki/File:Fernando_de_Noronha_Island_-_Baia_do_Sancho_-_Strand_(18908547939).jpg'
    },
    {
      id: 'cacimba-bistro',
      title: 'Cacimba Bistrô',
      category: 'Gastronomia',
      location: 'Vila dos Remédios',
      type: 'RESTAURANT',
      route: '/map',
      queryParams: { category: 'RESTAURANT', q: 'cacimba' },
      note: 'Cozinha regional sofisticada, com destaque para peixes e frutos do mar.',
      practicalInfo: 'Média local estimada: R$ 170 por pessoa',
      googleQuery: 'Restaurante Cacimba Bistrô',
      googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Restaurante%20Cacimba%20Bistr%C3%B4%2C%20Fernando%20de%20Noronha',
      fallbackRating: 4.5,
      fallbackReviewCount: 1855,
      photoUrl: '/assets/places/cacimba-bistro.jpg',
      photoCredit: 'A Riqueza de Viajar',
      photoCreditUrl: 'https://www.ariquezadeviajar.com/2018/10/onde-comer-em-fernando-de-noronha.html'
    },
    {
      id: 'passeio-lancha-noronha',
      title: 'Passeio de Lancha Noronha',
      category: 'Experiência',
      location: 'Porto de Santo Antônio',
      type: 'TOUR',
      route: '/map',
      queryParams: { category: 'TOUR', q: 'barco' },
      note: 'Passeio privativo pelo Mar de Dentro, com paradas para mergulho livre.',
      practicalInfo: 'Saída pelo porto · sujeito às condições do mar',
      googleQuery: 'Passeio de Lancha Noronha',
      googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Passeio%20de%20Lancha%20Noronha%2C%20Fernando%20de%20Noronha',
      fallbackRating: 5,
      photoUrl: '/assets/places/bubba-noronha-hero.png',
      photoCredit: 'Passeio de Lancha Noronha',
      photoCreditUrl: 'https://passeiodelanchanoronha.com.br/'
    }
  ];

  constructor() {
    this.title.setTitle('SisTur Noronha - Planeje, descubra e navegue');
    this.analytics.pageView('/home', 'PAGE', 'home');
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.setTimeout(() => void this.enrichDiscoveryCards(), 250);
    }
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

  detailsFor(card: DiscoveryCard): GooglePlaceDetails | undefined {
    return this.googleDetails()[card.id];
  }

  displayPhoto(card: DiscoveryCard): string {
    return this.detailsFor(card)?.photoUrl || card.photoUrl;
  }

  displayRating(card: DiscoveryCard): number {
    return this.detailsFor(card)?.rating ?? card.fallbackRating;
  }

  displayReviewCount(card: DiscoveryCard): number | undefined {
    return this.detailsFor(card)?.reviewCount ?? card.fallbackReviewCount;
  }

  displayLocation(card: DiscoveryCard): string {
    return this.detailsFor(card)?.formattedAddress || card.location;
  }

  googleUrl(card: DiscoveryCard): string {
    const details = this.detailsFor(card);
    return details?.reviewsUrl || details?.googleMapsUrl || card.googleMapsUrl;
  }

  photoCredit(card: DiscoveryCard): string {
    return this.detailsFor(card)?.photoAttribution?.name || card.photoCredit;
  }

  photoCreditUrl(card: DiscoveryCard): string {
    return this.detailsFor(card)?.photoAttribution?.url || card.photoCreditUrl;
  }

  starIcon(rating: number, position: number): string {
    if (rating >= position) return 'pi pi-star-fill';
    if (rating >= position - 0.5) return 'pi pi-star-half-fill';
    return 'pi pi-star';
  }

  formatReviewCount(count: number | undefined): string {
    return count == null
      ? 'Avaliações'
      : `${new Intl.NumberFormat('pt-BR').format(count)} avaliações`;
  }

  onPhotoError(card: DiscoveryCard, event: Event): void {
    const image = event.target as HTMLImageElement;
    const fallbackUrl = new URL(card.photoUrl, window.location.origin).href;
    if (image.src !== fallbackUrl) {
      image.src = card.photoUrl;
    }
  }

  trackGoogleOpen(card: DiscoveryCard): void {
    this.analytics.googleServiceClick(card.type, card.id, card.title, '/home');
  }

  private async enrichDiscoveryCards(): Promise<void> {
    await Promise.all(this.discoveryCards.map(async card => {
      const details = await this.googlePlaces.getDetails({
        name: card.title,
        googleQuery: card.googleQuery
      });

      if (details) {
        this.googleDetails.update(current => ({ ...current, [card.id]: details }));
      }
    }));
  }
}
