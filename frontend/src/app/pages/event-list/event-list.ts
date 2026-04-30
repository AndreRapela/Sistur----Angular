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
  categories = ["Todos", "Cultural", "Esportivo", "Gastronômico", "Ecológico"];

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
    this.router.navigate(["/map"]);
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
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description || "Confira este evento em Noronha!",
        url: window.location.href
      }).catch(() => this.copyToClipboard());
    } else {
      this.copyToClipboard();
    }
  }

  private copyToClipboard() {
    navigator.clipboard.writeText(window.location.href);
    this.toastService.add({ severity: "success", summary: "Copiado", detail: "Link do evento copiado!" });
  }

  findOnMap(event: Event) {
    this.analytics.conversion('EVENT', 'MAP_CLICK', event.id, `/events/${event.id}`);
    this.router.navigate(["/map"], { queryParams: { id: event.id, type: "EVENT" } });
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
