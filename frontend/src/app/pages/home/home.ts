import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CarouselModule } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ItineraryService } from '../../services/itinerary.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, CarouselModule, ButtonModule, CardModule, InputTextModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="home-container max-w-[1400px] mx-auto">
      
      <!-- HERO COM BACKGROUND DE NORONHA -->
      <section class="hero-section relative overflow-hidden rounded-b-[60px]">
        <div class="hero-bg"></div>
        <div class="hero-overlay"></div>
        
        <div class="hero-content relative z-10 max-w-[800px] mx-auto text-center px-4">
          <h1 class="text-3xl md:text-6xl font-black text-white mb-8 tracking-tight drop-shadow-lg">
            Descubra o melhor de <span class="text-primary-light">Noronha</span>
          </h1>
          <p class="text-white/90 text-lg md:text-xl font-medium mb-10 max-w-2xl mx-auto">Viva experiências inesquecíveis no santuário ecológico mais preservado do Brasil.</p>
          
          <div class="search-box p-2 bg-white flex items-center gap-2">
            <div class="flex-1 flex items-center gap-3 px-4">
              <i class="pi pi-search text-slate-400"></i>
              <input type="text" placeholder="Buscar praias, passeios ou eventos..." 
                     class="search-input w-full py-3 border-none outline-none text-slate-700 font-medium">
            </div>
            <button class="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-primary/90 transition-all active:scale-95">
              Buscar
            </button>
          </div>
        </div>
      </section>

      <!-- CARROSSEL DE EVENTOS (NOVIDADE) -->
      <section class="px-4 py-8">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-black text-slate-800">Eventos em Destaque</h2>
          <a routerLink="/events" class="text-primary font-bold text-sm hover:underline">Ver todos</a>
        </div>
        
        <p-carousel [value]="eventHighlights" [numVisible]="3" [numScroll]="1" [responsiveOptions]="responsiveOptions" [circular]="true" [autoplayInterval]="5000">
          <ng-template let-event pTemplate="item">
            <div class="px-2">
              <div class="relative h-48 rounded-2xl overflow-hidden group cursor-pointer" [routerLink]="['/events']">
                <img [src]="event.image" loading="lazy" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div class="absolute bottom-4 left-4 text-white">
                  <span class="text-[10px] uppercase font-black bg-cta px-2 py-0.5 rounded-md mb-2 inline-block">Hoje</span>
                  <h3 class="font-bold text-lg leading-tight">{{event.title}}</h3>
                </div>
              </div>
            </div>
          </ng-template>
        </p-carousel>
      </section>

      <!-- CATEGORIAS ESTILO IFOOD (CÍRCULOS E SUB-OPÇÕES) -->
      <section class="px-4 py-12">
        <h2 class="text-2xl font-black text-slate-800 mb-8">O que você procura hoje?</h2>
        <div class="grid grid-cols-4 md:grid-cols-8 gap-y-10 gap-x-4">
          @for (cat of categories; track cat.label) {
            <div class="flex flex-col items-center group cursor-pointer" [routerLink]="cat.route">
              <div class="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full shadow-premium border border-slate-50 flex items-center justify-center group-hover:scale-110 transition-all duration-300 mb-3">
                <i [class]="'pi ' + cat.icon" class="text-2xl text-primary"></i>
              </div>
              <span class="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest text-center group-hover:text-primary transition-colors">{{cat.label}}</span>
              
              <!-- SUB-OPÇÕES RÁPIDAS (ESTILO IFOOD) -->
              <div class="hidden md:flex flex-wrap justify-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                @for (sub of cat.subs; track sub) {
                  <span class="text-[8px] font-bold text-slate-300 hover:text-primary">{{sub}}</span>
                }
              </div>
            </div>
          }
        </div>
      </section>

      <!-- DESTAQUES COM MAIS ESPAÇAMENTO -->
      <section class="px-4 py-16 bg-slate-50/50 rounded-[40px] my-10 border border-slate-100">
        <div class="max-w-6xl mx-auto">
          <div class="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
            <div>
              <span class="text-primary font-black uppercase tracking-widest text-[10px]">Curadoria Especial</span>
              <h2 class="text-3xl md:text-4xl font-black text-slate-800 mt-2">Os Queridinhos da Ilha</h2>
            </div>
            <p class="max-w-[400px] text-slate-500 font-medium text-sm leading-relaxed">
              Selecionamos a dedo as experiências mais autênticas e bem avaliadas pelos visitantes.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            @for (item of highlights; track item.title) {
              <div class="bg-white p-4 rounded-[32px] shadow-premium border border-slate-50 group hover:-translate-y-2 transition-all duration-300 cursor-pointer">
                <div class="relative h-64 rounded-[24px] overflow-hidden mb-5">
                  <img [src]="item.image" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                  <div class="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl font-black text-slate-800 text-xs shadow-xl flex items-center gap-1.5">
                    <i class="pi pi-star-fill text-yellow-400"></i> {{item.rating}}
                  </div>
                  <div class="absolute bottom-4 left-4">
                    <span class="bg-primary text-white text-[10px] font-black uppercase px-3 py-1 rounded-lg">{{item.category}}</span>
                  </div>
                </div>
                
                <h3 class="text-xl font-black text-slate-800 mb-2 truncate px-2">{{item.title}}</h3>
                <div class="flex items-center gap-2 text-slate-400 text-xs font-bold px-2 mb-4">
                  <i class="pi pi-map-marker text-primary"></i> {{item.location}}
                </div>
                
                <div class="flex items-center justify-between border-t border-slate-50 pt-4 mt-2 px-2">
                   <span class="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Experiência</span>
                   <div class="flex gap-2">
                     <button (click)="toggleItinerary(item); $event.stopPropagation()"
                             [class.bg-secondary]="itinerary.isAdded(item.title, 'HIGHLIGHT')"
                             [class.text-white]="itinerary.isAdded(item.title, 'HIGHLIGHT')"
                             class="w-10 h-10 bg-slate-50 text-slate-400 rounded-full hover:bg-secondary hover:text-white transition-all flex items-center justify-center">
                       <i [class]="itinerary.isAdded(item.title, 'HIGHLIGHT') ? 'pi pi-calendar-times' : 'pi pi-calendar-plus'" class="text-lg"></i>
                     </button>
                     <button class="w-10 h-10 bg-slate-50 text-primary rounded-full hover:bg-primary hover:text-white transition-all">
                       <i class="pi pi-arrow-right"></i>
                     </button>
                   </div>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- CTA FINAL IFOOD STYLE -->
      <section class="px-4 py-20 pb-32 md:pb-20">
        <div class="bg-gradient-to-br from-primary to-primary-dark rounded-[40px] p-10 md:p-20 text-center relative overflow-hidden group">
          <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div class="relative z-10 max-w-[600px] mx-auto">
            <h2 class="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">Prepare seu roteiro dos sonhos</h2>
            <p class="text-white/80 text-lg font-medium mb-10">Convide amigos, acompanhe eventos em tempo real e não perca nenhum segundo no paraíso.</p>
            <button routerLink="/itinerary" class="bg-white text-primary font-black px-12 py-5 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-3 mx-auto">
              Ver Meu Roteiro <i class="pi pi-arrow-right text-xl"></i>
            </button>
          </div>
        </div>
      </section>

    </div>
  `,
  styles: [`
    .home-container {
      padding-bottom: 2rem;
    }
    
    .hero-section {
      position: relative;
      min-height: 70vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4rem 5%;
      overflow: hidden;
    }
    .hero-bg {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background-image: url('https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&q=60&w=1200');
      background-size: cover;
      background-position: center;
    }
    .hero-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.3));
    }
    .hero-content {
      position: relative;
      z-index: 10;
      color: white;
      max-width: 600px;
    }
    .hero-tag {
      background: var(--cta-color, #FF9F1C);
      color: white;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      display: inline-block;
      margin-bottom: 1.5rem;
    }
    .hero-title {
      font-size: 4rem;
      font-weight: 900;
      line-height: 1.1;
      margin-bottom: 1rem;
    }
    .hero-title span {
      font-style: italic;
      color: var(--secondary-color, #00B4D8);
    }
    .hero-subtitle {
      font-size: 1.2rem;
      line-height: 1.6;
      margin-bottom: 2rem;
      opacity: 0.9;
    }
    .hero-actions {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }

    .search-container {
      max-width: 1000px;
      margin: -40px auto 0;
      position: relative;
      z-index: 20;
      padding: 0 20px;
    }
    .search-box {
      background: white;
      border-radius: 20px;
      padding: 8px 15px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
      display: flex;
      align-items: center;
      gap: 15px;
      border: 1px solid #f1f5f9;
    }
    .search-input-wrapper {
      flex-grow: 1;
    }
    .search-input {
      border: none !important;
      background: #f8fafc !important;
      border-radius: 12px !important;
      padding: 10px 15px !important;
      font-size: 1rem;
      transition: all 0.3s ease;
    }
    .search-input:focus {
      background: white !important;
      box-shadow: 0 0 0 2px var(--primary-color-light, #E0F2FE);
    }

    .content-section {
      max-width: 1200px;
      margin: 4rem auto;
      padding: 0 20px;
    }
    .section-header {
      margin-bottom: 2rem;
    }
    .section-header h2 {
      font-size: 2.2rem;
      font-weight: 900;
      color: var(--text-main);
      margin: 0;
    }
    .section-header p {
      color: #64748b;
      margin-top: 5px;
    }
    .highlight-tag {
      color: var(--primary-color);
      font-weight: 900;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    /* Cards Categories */
    .category-card:hover .category-img {
      transform: scale(1.1);
    }
    .category-img {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;
      transition: transform 0.5s ease;
    }
    .category-overlay {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
    }
    .category-info {
      position: absolute;
      bottom: 20px; left: 20px;
      color: white;
    }
    .category-info i {
      color: var(--cta-color);
      font-size: 1.5rem;
      margin-bottom: 5px;
    }
    .category-info h3 {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 900;
    }

    /* Cards Highlights */
    .item-card {
      transition: transform 0.3s;
    }
    .item-card:hover {
      transform: translateY(-5px);
    }
    .item-img-container {
      position: relative;
      height: 200px;
    }
    .item-img {
      width: 100%; height: 100%; object-fit: cover;
    }
    .rating-badge {
      position: absolute;
      top: 15px; right: 15px;
      background: rgba(255,255,255,0.9);
      padding: 5px 10px;
      border-radius: 20px;
      font-weight: 900;
      font-size: 0.85rem;
      display: flex; gap: 5px; align-items: center;
    }
    .item-category {
      background: var(--primary-color);
      color: white;
      padding: 4px 10px;
      border-radius: 10px;
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      display: inline-block;
      margin-bottom: 10px;
    }
    .item-title {
      font-weight: 900;
      font-size: 1.4rem;
      margin: 0 0 10px 0;
    }
    .item-desc {
      color: #64748b;
      font-size: 0.95rem;
      line-height: 1.5;
    }
    .item-location {
      color: var(--primary-color);
      font-weight: 700;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .contact-box {
      border-radius: 20px;
      padding: 3rem;
      text-align: center;
      color: white;
    }
    .contact-box h3 { font-size: 2rem; font-weight: 900; margin-bottom: 10px;}
    .contact-box p { opacity: 0.9; margin-bottom: 20px;}
    
    @media (max-width: 768px) {
      .hero-title { font-size: 2.8rem; }
      .search-card { flex-direction: column; }
    }
  `]
})
export class HomeComponent {
  constructor(public itinerary: ItineraryService) {}

  categories: { label: string, icon: string, route: string, subs: string[] }[] = [
    { label: 'Ambiental', icon: 'pi-globe', route: '/environmental', subs: ['Trilhas', 'Projetos', 'Praias'] },
    { label: 'Cultura', icon: 'pi-palette', route: '/culture', subs: ['Museus', 'História', 'Arte'] },
    { label: 'Passeios', icon: 'pi-camera', route: '/tours', subs: ['Barco', 'Buggy', 'Mergulho'] },
    { label: 'Comer', icon: 'pi-utensils', route: '/restaurants', subs: ['Peixe', 'Bares', 'Cafés'] },
    { label: 'Dormir', icon: 'pi-home', route: '/hotels', subs: ['Pousada', 'Holanda', 'Resort'] },
    { label: 'Eventos', icon: 'pi-calendar', route: '/events', subs: ['Shows', 'Festas', 'Luau'] },
    { label: 'Mapa', icon: 'pi-map', route: '/map', subs: ['GPS', 'Pontos'] },
    { label: 'Roteiros', icon: 'pi-directions', route: '/itinerary', subs: ['Plano', 'Amigos'] }
  ];

  eventHighlights = [
    { title: 'Festival Gastronômico', image: 'https://images.unsplash.com/photo-1514525253361-bee8718a300c' },
    { title: 'Luau na Praia do Meio', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3' },
    { title: 'Pôr do Sol Musical', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745' }
  ];

  responsiveOptions = [
    { breakpoint: '1024px', numVisible: 3, numScroll: 1 },
    { breakpoint: '768px', numVisible: 2, numScroll: 1 },
    { breakpoint: '560px', numVisible: 1, numScroll: 1 }
  ];

  highlights = [
    { 
      title: 'Baía do Sancho', 
      description: 'Eleita diversas vezes a melhor praia do mundo, com águas cristalinas e vida marinha abundante.', 
      image: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f', 
      rating: 5.0, 
      category: 'Praia', 
      location: 'Parque Nacional' 
    },
    { 
      title: 'Restaurante Varanda', 
      description: 'O melhor da culinária local com uma vista privilegiada para o pôr do sol mais famoso do Brasil.', 
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', 
      rating: 4.8, 
      category: 'Gastronomia', 
      location: 'Vila dos Remédios' 
    },
    { 
      title: 'Ilha Tour Completo', 
      description: 'Conheça os principais pontos turísticos da ilha em um dia inteiro de aventura e descobertas.', 
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5', 
      rating: 4.9, 
      category: 'Passeio', 
      location: 'Toda a Ilha' 
    }
  ];

  scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  toggleItinerary(item: any) {
    this.itinerary.toggleItem({
      id: String(item.title),
      type: 'HIGHLIGHT',
      name: item.title,
      image: item.image,
      location: item.location,
      addedAt: new Date()
    });
  }
}

