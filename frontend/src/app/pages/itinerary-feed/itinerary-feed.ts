import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { ItineraryService } from '../../services/itinerary.service';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ShareService } from '../../services/share.service';

@Component({
  selector: 'app-itinerary-feed',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, AvatarModule, TagModule, RouterModule, SkeletonModule, DialogModule, InputTextModule, FormsModule],
  template: `
    <div class="feed-container min-h-screen bg-gray-50 p-4 md:p-8">
      <div class="max-w-4xl mx-auto">
        <header class="mb-10 text-center">
          <span class="text-primary font-bold text-xs uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full mb-3 inline-block">Comunidade SisTur</span>
          <h1 class="text-4xl md:text-5xl font-black text-gray-900 tracking-tight m-0">Roteiros Inspiradores</h1>
          <p class="text-gray-500 font-medium mt-2">Veja como outros viajantes estÃ£o vivendo Noronha.</p>
        </header>

        @if (loading) {
          <div class="flex flex-col gap-8">
            @for (i of [1,2,3]; track i) {
              <div class="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                <div class="flex items-center gap-3 mb-6">
                  <p-skeleton shape="circle" size="3rem"></p-skeleton>
                  <div class="flex-1">
                    <p-skeleton width="30%" height="1rem" styleClass="mb-2"></p-skeleton>
                    <p-skeleton width="20%" height="0.5rem"></p-skeleton>
                  </div>
                </div>
                <p-skeleton width="60%" height="2rem" styleClass="mb-3"></p-skeleton>
                <p-skeleton width="100%" height="1.5rem" styleClass="mb-6"></p-skeleton>
                <p-skeleton width="100%" height="12rem" borderRadius="1.5rem"></p-skeleton>
              </div>
            }
          </div>
        } @else {
          <div class="flex flex-col gap-8">
            @for (itin of itineraries; track itin.id) {
              <div class="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <!-- User Info Header -->
                <div class="p-6 flex items-center justify-between border-b border-gray-50">
                  <div class="flex items-center gap-3">
                    <p-avatar [image]="itin.userPhoto || 'assets/default-avatar.png'" shape="circle" size="large"></p-avatar>
                    <div>
                      <h3 class="font-bold text-gray-900 leading-none">{{ itin.userName }}</h3>
                      <span class="text-xs text-gray-400 capitalize">Viajante {{ itin.userRole }}</span>
                    </div>
                  </div>
                  <p-tag [value]="itin.items?.length + ' paradas'" severity="info" [rounded]="true"></p-tag>
                </div>

                <!-- Itinerary Content -->
                <div class="p-6">
                  <h2 class="text-2xl font-extrabold text-gray-800 mb-2">{{ itin.title || 'Viagem dos Sonhos: Noronha' }}</h2>
                  <p class="text-gray-500 mb-6 line-clamp-2">{{ itin.description || 'Uma jornada inesquecÃ­vel explorando os melhores picos e sabores da ilha!' }}</p>

                  <!-- Featured Image Preview -->
                  <div class="h-64 mb-6 rounded-2xl overflow-hidden relative group">
                     <img [src]="itin.coverImage || 'assets/placeholder-itinerary.jpg'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                     <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                        <span class="text-white font-bold text-sm"><i class="pi pi-eye mr-2"></i> {{ itin.views }} visualizaÃ§Ãµes</span>
                     </div>
                  </div>
                </div>

                <!-- Action Footer -->
                <div class="px-6 py-4 bg-gray-50 flex justify-between items-center">
                  <div class="flex items-center gap-4 text-gray-400">
                    <button (click)="toggleLike(itin)" [class.text-red-500]="itin.userLiked" class="flex items-center gap-1 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer">
                      <i [class]="itin.userLiked ? 'pi pi-heart-fill' : 'pi pi-heart'"></i> <span class="text-xs font-bold">{{ itin.likes }}</span>
                    </button>
                    <button (click)="openComments(itin)" class="flex items-center gap-1 hover:text-blue-500 transition-colors bg-transparent border-none cursor-pointer">
                      <i class="pi pi-comment"></i> <span class="text-xs font-bold">{{ itin.commentsCount }}</span>
                    </button>
                    <button (click)="openShareDialog(itin)" class="flex items-center gap-1 hover:text-green-500 transition-colors bg-transparent border-none cursor-pointer">
                      <i class="pi pi-share-alt"></i>
                    </button>
                  </div>
                  <p-button label="Ver Detalhes" icon="pi pi-arrow-right" styleClass="p-button-text p-button-sm font-bold"></p-button>
                </div>
              </div>
            }

            @if (loadingMore) {
              <div class="flex justify-center p-4 text-primary">
                <i class="pi pi-spin pi-spinner text-2xl"></i>
              </div>
            }
          </div>
        }
      </div>
    </div>

    <!-- Modal de ComentÃ¡rios -->
    <p-dialog header="ComentÃ¡rios" [(visible)]="displayComments" [modal]="true" [style]="{width: '100%', maxWidth: '500px'}" [draggable]="false" [resizable]="false">
      <!-- ... -->
      <div class="flex flex-col h-[60vh]">
        <!-- Lista de ComentÃ¡rios -->
        <div class="flex-1 overflow-y-auto p-2 space-y-4">
          @if (loadingComments) {
            <div class="flex justify-center py-8">
              <i class="pi pi-spin pi-spinner text-2xl text-primary"></i>
            </div>
          } @else if (currentComments.length === 0) {
            <div class="text-center text-gray-500 py-8">
              Nenhum comentÃ¡rio ainda. Seja o primeiro a comentar!
            </div>
          } @else {
            @for (comment of currentComments; track comment.id) {
              <div class="flex gap-3">
                <img [src]="comment.userPhoto || 'assets/default-avatar.png'" class="w-8 h-8 rounded-full object-cover">
                <div class="flex-1 bg-gray-50 rounded-2xl p-3">
                  <div class="flex justify-between items-baseline mb-1">
                    <span class="font-bold text-sm text-gray-900">{{ comment.userName }}</span>
                  </div>
                  <p class="text-gray-700 text-sm m-0">{{ comment.content }}</p>
                </div>
              </div>
            }
          }
        </div>

        <!-- Input de Novo ComentÃ¡rio -->
        <div class="mt-4 pt-4 border-t flex gap-2 items-center">
          <input type="text" pInputText [(ngModel)]="newCommentText" (keyup.enter)="postComment()" placeholder="Adicione um comentÃ¡rio..." class="flex-1 rounded-full px-4 text-sm" [disabled]="postingComment">
          <button pButton icon="pi pi-send" [loading]="postingComment" class="p-button-rounded p-button-primary" (click)="postComment()" [disabled]="!newCommentText.trim()"></button>
        </div>
      </div>
    </p-dialog>

    <p-dialog header="Compartilhar" [(visible)]="displayShare" [modal]="true" [style]="{width: '300px'}" [draggable]="false" [resizable]="false">
        <div class="flex flex-col gap-3 p-2">
            <button class="bg-green-500 text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-green-600 transition font-bold" (click)="shareWhatsApp()">
                <i class="pi pi-whatsapp text-xl"></i> WhatsApp
            </button>
            <button class="bg-gray-800 text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-900 transition font-bold" (click)="shareTwitter()">
                <i class="pi pi-twitter text-xl"></i> X / Twitter
            </button>
            <button class="bg-blue-100 text-blue-800 px-4 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-200 transition font-bold" (click)="copyLink()">
                <i class="pi pi-link text-xl"></i> Copiar Link
            </button>
        </div>
    </p-dialog>
  `,
  styles: [`
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class ItineraryFeedComponent implements OnInit {
  itineraries: any[] = [];
  loading = true;
  loadingMore = false;
  page = 0;
  size = 5;
  hasMore = true;

  // VariÃ¡veis para Modal de ComentÃ¡rios
  displayComments = false;
  displayShare = false;
  loadingComments = false;
  postingComment = false;
  currentComments: any[] = [];
  selectedItinerary: any = null;
  newCommentText = '';
  selectedItineraryForShare: any = null;

  private http = inject(HttpClient);
  private itineraryService = inject(ItineraryService);
  private messageService = inject(MessageService);
  public shareService = inject(ShareService);

  ngOnInit() {
    this.loadFeed();
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
      if (!this.loadingMore && this.hasMore) {
        this.page++;
        this.loadFeed(true);
      }
    }
  }

  loadFeed(append = false) {
    if (append) this.loadingMore = true;
    else this.loading = true;

    this.http.get(`${environment.apiUrl}/itineraries/feed?page=${this.page}&size=${this.size}`).subscribe({
      next: (res: any) => {
        const newItems = res.data?.content || [];
        if (append) {
          this.itineraries = [...this.itineraries, ...newItems];
        } else {
          this.itineraries = newItems;
        }
        this.hasMore = res.data?.last === false;
        this.loading = false;
        this.loadingMore = false;
      },
      error: () => {
        this.loading = false;
        this.loadingMore = false;
      }
    });
  }

  toggleLike(itin: any) {
    itin.userLiked = !itin.userLiked;
    itin.likes += itin.userLiked ? 1 : -1;
    this.http.post(`${environment.apiUrl}/itineraries/${itin.id}/like`, {}).subscribe({
      error: () => {
        // Revert on error
        itin.userLiked = !itin.userLiked;
        itin.likes += itin.userLiked ? 1 : -1;
      }
    });
  }

  openComments(itin: any) {
    this.selectedItinerary = itin;
    this.displayComments = true;
    this.loadingComments = true;
    this.currentComments = [];
    this.newCommentText = '';

    this.http.get(`${environment.apiUrl}/itineraries/${itin.id}/comments`).subscribe({
      next: (res: any) => {
        this.currentComments = res.data || [];
        this.loadingComments = false;
      },
      error: () => {
        this.loadingComments = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar comentÃ¡rios' });
      }
    });
  }

  postComment() {
    if (!this.newCommentText.trim() || !this.selectedItinerary) return;

    this.postingComment = true;
    const payload = { content: this.newCommentText };

    this.http.post(`${environment.apiUrl}/itineraries/${this.selectedItinerary.id}/comments`, payload).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.currentComments.unshift(res.data);
          this.selectedItinerary.commentsCount++;
        }
        this.newCommentText = '';
        this.postingComment = false;
      },
      error: () => {
        this.postingComment = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao enviar comentÃ¡rio' });
      }
    });
  }

  cloneItinerary(itin: any) {
    // LÃ³gica para adicionar todos os itens ao roteiro do usuÃ¡rio logado
    itin.items.forEach((item: any) => {
      this.itineraryService.toggleItem({
        id: item.originalId,
        type: item.type,
        name: item.name,
        image: item.photoUrl,
        location: item.location
      });
    });
    this.messageService.add({ severity: 'success', summary: 'Copiado!', detail: 'Roteiro clonado para sua lista.' });
  }

  openShareDialog(itin: any) {
    this.selectedItineraryForShare = itin;
    this.displayShare = true;
  }

  shareWhatsApp() {
    if (this.selectedItineraryForShare) {
      this.shareService.shareWhatsApp(this.selectedItineraryForShare);
    }
  }

  shareTwitter() {
    if (this.selectedItineraryForShare) {
      this.shareService.shareTwitter(this.selectedItineraryForShare);
    }
  }

  copyLink() {
    if (this.selectedItineraryForShare) {
      if (this.shareService.copyLink(this.selectedItineraryForShare)) {
        this.messageService.add({ severity: 'success', summary: 'Copiado', detail: 'Link copiado para a Ã¡rea de transferÃªncia!' });
      }
    }
  }
}

