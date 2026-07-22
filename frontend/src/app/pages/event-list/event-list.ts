import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from "@angular/core";
import { CommonModule, NgOptimizedImage } from "@angular/common";
import { RouterModule, Router } from "@angular/router";
import { Title } from "@angular/platform-browser";
import { finalize } from "rxjs/operators";
import { ApiService } from "../../services/api.service";
import { ItineraryService } from "../../services/itinerary.service";
import { ToastService } from "../../services/toast.service";
import { AnalyticsService } from "../../services/analytics.service";
import { Event } from "../../models/tourism.models";
import { SkeletonListComponent } from "../../components/skeleton-list/skeleton-list";
import { openExternalLink } from "../../utils/external-link";

@Component({
  selector: "app-event-list",
  standalone: true,
  imports: [CommonModule, SkeletonListComponent, RouterModule, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./event-list.html"
})
export class EventListComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private titleService = inject(Title);
  private toastService = inject(ToastService);
  private analytics = inject(AnalyticsService);
  public itinerary = inject(ItineraryService);
  protected readonly String = String;

  events = signal<Event[]>([]);
  loading = signal(true);
  selectedCategory = signal("Todos");
  categories = computed(() => {
    const values = this.events()
      .map(event => event.category)
      .filter((category): category is string => Boolean(category))
      .sort((a, b) => a.localeCompare(b, "pt-BR"));

    return ["Todos", ...Array.from(new Set(values))];
  });

  filteredEvents = computed(() => {
    const cat = this.selectedCategory();
    const all = this.events();
    if (cat === "Todos") return all;
    return all.filter(e => e.category === cat);
  });

  ngOnInit() {
    this.titleService.setTitle("Eventos em Noronha - SisTur");
    this.analytics.pageView('/events', 'PAGE', 'events');
    this.loadEvents();
  }

  loadEvents() {
    this.loading.set(true);
    this.api.getEvents()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res: any) => {
          if (res.data) {
            this.events.set(res.data.content || []);
          }
        }
      });
  }

  viewDetails(event: Event) {
    this.analytics.conversion('EVENT', 'DETAIL_OPEN', event.id, `/events/${event.id}`);
    this.router.navigate(["/events", event.id]);
  }

  goToMap() {
    this.analytics.conversion('EVENT', 'MAP_CLICK', 'events', '/events');
    this.router.navigate(['/map'], { queryParams: { category: 'EVENT' } });
  }

  openCategoryInGoogle() {
    this.analytics.googleCategoryClick("EVENT", "Eventos", "/events");
    openExternalLink("https://www.google.com/maps/search/?api=1&query=eventos%20Fernando%20de%20Noronha");
  }

  toggleLike(event: Event) {
    const nextLikes = (event.likes || 0) + 1;
    this.events.update(items =>
      items.map(item => item.id === event.id ? { ...item, likes: nextLikes } : item)
    );
    this.analytics.conversion('EVENT', 'LIKE', event.id, `/events/${event.id}`);
  }

  shareEvent(event: Event) {
    this.analytics.conversion('EVENT', 'SHARE', event.id, `/events/${event.id}`);
    const url = `${window.location.origin}/events/${event.id}`;

    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description || "Confira este evento em Noronha!",
        url
      }).catch(() => this.copyToClipboard(url));
    } else {
      this.copyToClipboard(url);
    }
  }

  private async copyToClipboard(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      this.toastService.add({ severity: "success", summary: "Copiado", detail: "Link do evento copiado!" });
    } catch {
      this.toastService.add({ severity: "warn", summary: "Nao copiado", detail: "Nao foi possivel copiar o link do evento." });
    }
  }

  findOnMap(event: Event) {
    this.analytics.conversion('EVENT', 'MAP_CLICK', event.id, `/events/${event.id}`);
    this.router.navigate(["/map"], { queryParams: { id: event.id, type: "EVENT" } });
  }

  openGoogleService(event: Event) {
    const query = encodeURIComponent(`${event.title} ${event.location || "Fernando de Noronha"}`);
    this.analytics.googleServiceClick("EVENT", event.id, event.title, `/events/${event.id}`);
    openExternalLink(`https://www.google.com/maps/search/?api=1&query=${query}`);
  }

  toggleItinerary(event: Event) {
    const wasAdded = this.itinerary.isInItinerary(event.id, 'EVENT');
    this.itinerary.toggleItem({
      id: event.id,
      type: "EVENT",
      name: event.title,
      image: event.photoUrl,
      location: event.location,
      addedAt: new Date()
    });
    this.analytics.conversion('EVENT', wasAdded ? 'ITINERARY_REMOVE' : 'ITINERARY_ADD', event.id, `/events/${event.id}`);
  }
}
