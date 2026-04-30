import { ToastService } from '../../services/toast.service';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ItineraryService } from '../../services/itinerary.service';
import { FormsModule } from '@angular/forms';
import { ShareService } from '../../services/share.service';

@Component({
  selector: 'app-itinerary-feed',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './itinerary-feed.html',
  styles: [`
    .feed-container { max-width: 100%; overflow-x: hidden; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class ItineraryFeedComponent implements OnInit {
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  itineraries: any[] = [];
  loading = true;
  loadingMore = false;
  page = 0;
  size = 5;
  hasMore = true;

  // Variáveis para Modal de Comentários
  displayComments = false;
  displayShare = false;
  loadingComments = false;
  postingComment = false;
  currentComments: any[] = [];
  selectedItinerary: any = null;
  newCommentText = '';
  selectedItineraryForShare: any = null;

  get showComments() { return this.displayComments; }
  set showComments(val: boolean) { this.displayComments = val; }
  get showShare() { return this.displayShare; }
  set showShare(val: boolean) { this.displayShare = val; }

  private http = inject(HttpClient);
  private router = inject(Router);
  private itineraryService = inject(ItineraryService);
  public shareService = inject(ShareService);

  ngOnInit() {
    this.loadFeed();
  }

  viewDetails(itin: any) {
    this.router.navigate(['/itinerary-shared', itin.shareToken || itin.id]);
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
    this.cdr.markForCheck();

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
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.loadingMore = false;
        this.cdr.markForCheck();
      }
    });
  }

  toggleLike(itin: any) {
    const nextLiked = !itin.userLiked;
    const nextLikes = Math.max(0, (itin.likes || 0) + (nextLiked ? 1 : -1));

    this.syncItineraryUpdate(itin.id, item => ({
      ...item,
      userLiked: nextLiked,
      likes: nextLikes
    }));

    this.http.post(`${environment.apiUrl}/itineraries/${itin.id}/like`, {}).subscribe({
      error: () => {
        this.syncItineraryUpdate(itin.id, item => ({
          ...item,
          userLiked: !nextLiked,
          likes: Math.max(0, (item.likes || 0) + (nextLiked ? -1 : 1))
        }));
        this.cdr.markForCheck();
      }
    });

    this.cdr.markForCheck();
  }

  openComments(itin: any) {
    this.selectedItinerary = itin;
    this.displayComments = true;
    this.loadingComments = true;
    this.currentComments = [];
    this.newCommentText = '';
    this.cdr.markForCheck();

    this.http.get(`${environment.apiUrl}/itineraries/${itin.id}/comments`).subscribe({
      next: (res: any) => {
        this.currentComments = res.data || [];
        this.loadingComments = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingComments = false;
        this.toastService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar comentÃ¡rios' });
        this.cdr.markForCheck();
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
          this.currentComments = [res.data, ...this.currentComments];
          this.syncItineraryUpdate(this.selectedItinerary.id, item => ({
            ...item,
            commentsCount: (item.commentsCount || 0) + 1
          }));
        }
        this.newCommentText = '';
        this.postingComment = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.postingComment = false;
        this.toastService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao enviar comentÃ¡rio' });
        this.cdr.markForCheck();
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
    this.toastService.add({ severity: 'success', summary: 'Copiado!', detail: 'Roteiro clonado para sua lista.' });
  }

  openShareDialog(itin: any) {
    this.selectedItineraryForShare = itin;
    this.displayShare = true;
    this.cdr.markForCheck();
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
        this.toastService.add({ severity: 'success', summary: 'Copiado', detail: 'Link copiado para a Ã¡rea de transferÃªncia!' });
      }
    }
  }

  private syncItineraryUpdate(itineraryId: number, updater: (item: any) => any) {
    this.itineraries = this.itineraries.map(item => item.id === itineraryId ? updater(item) : item);

    if (this.selectedItinerary?.id === itineraryId) {
      this.selectedItinerary = updater(this.selectedItinerary);
    }

    if (this.selectedItineraryForShare?.id === itineraryId) {
      this.selectedItineraryForShare = updater(this.selectedItineraryForShare);
    }
  }
}

