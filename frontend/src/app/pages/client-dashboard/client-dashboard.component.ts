import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { AnalyticsService } from '../../services/analytics.service';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Establishment, EstablishmentType, ApiResponse, EstablishmentStatsDTO } from '../../models/tourism.models';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './client-dashboard.component.html'
})
export class ClientDashboardComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private analytics = inject(AnalyticsService);
  isEditing = false;
  myEst: Partial<Establishment> = {
    name: '',
    description: '',
    type: 'RESTAURANT' as EstablishmentType,
    averagePrice: 0,
    location: '',
    photoUrl: '',
    websiteUrl: '',
    instagramUrl: '',
    openingHours: '',
    amenities: '',
    contactNumber: '',
    discountDescription: '',
    discountHours: '',
    isPremiumExclusive: false
  };
  reviews: any[] = [];
  establishmentStats: EstablishmentStatsDTO | null = null;

  constructor(
    private auth: AuthService,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.analytics.pageView('/client/dashboard', 'PAGE', 'client-dashboard');
    this.loadMyEstablishment();
  }

  loadMyEstablishment() {
    // Current user's establishment - assuming owner logic
    const user = this.auth.getUser() as any;
    if (user?.ownedEstablishmentId) {
      this.isEditing = false;
      this.api.getEstablishmentById(user.ownedEstablishmentId).subscribe((res: ApiResponse<Establishment>) => {
        this.myEst = res.data;
        this.loadReviews(user.ownedEstablishmentId);
        this.loadEstablishmentStats(user.ownedEstablishmentId);
        this.cdr.markForCheck();
      });
      return;
    }

    this.isEditing = true;
    this.myEst = {
      name: '',
      description: '',
      type: 'RESTAURANT' as EstablishmentType,
      averagePrice: 0,
      location: '',
      photoUrl: '',
      websiteUrl: '',
      instagramUrl: '',
      openingHours: '',
      amenities: '',
      contactNumber: '',
      discountDescription: '',
      discountHours: '',
      isPremiumExclusive: false
    };
    this.reviews = [];
    this.establishmentStats = null;
    this.cdr.markForCheck();
  }

  loadReviews(id: number) {
    this.api.getEstablishmentReviews(id).subscribe((res: any) => {
      this.reviews = res.data || [];
      this.cdr.markForCheck();
    });
  }

  loadEstablishmentStats(id: number) {
    this.api.getEstablishmentStats(id).subscribe((res: ApiResponse<EstablishmentStatsDTO>) => {
      this.establishmentStats = res.data;
      this.cdr.markForCheck();
    });
  }

  saveEstablishment() {
    if (!this.myEst.name || !this.myEst.type || !this.myEst.location) {
      return;
    }

    if (this.myEst.id) {
      this.api.updateEstablishment(this.myEst.id, this.myEst).subscribe({
        next: () => {
          this.isEditing = false;
          this.loadMyEstablishment();
        }
      });
      return;
    }

    this.api.createEstablishment(this.myEst).subscribe({
      next: (res) => {
        const created = res.data;
        const current = this.auth.getUser();

        this.auth.updateProfile({
          name: current?.name || '',
          bio: current?.bio || '',
          photoUrl: current?.photoUrl || '',
          ownedEstablishmentId: created.id
        }).subscribe({
          next: () => {
            this.myEst = created;
            this.isEditing = false;
            this.loadMyEstablishment();
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  badges = [
    { id: 1, name: 'Pioneiro', icon: 'pi-flag', color: 'bg-primary', unlocked: true, description: 'Um dos primeiros negócios cadastrados' },
    { id: 2, name: 'Favorito', icon: 'pi-heart-fill', color: 'bg-red-400', unlocked: true, description: 'Mais de 100 favoritos de turistas' },
    { id: 3, name: 'Sustentável', icon: 'pi-leaf', color: 'bg-nature', unlocked: true, description: 'Selo de práticas eco-friendly' },
    { id: 4, name: 'Top Rated', icon: 'pi-star-fill', color: 'bg-yellow-400', unlocked: false, description: 'Média de avaliação acima de 4.8' },
    { id: 5, name: 'Verificado', icon: 'pi-check-circle', color: 'bg-emerald-500', unlocked: true, description: 'Identidade e localização verificadas' },
    { id: 6, name: 'Engajado', icon: 'pi-comments', color: 'bg-secondary', unlocked: false, description: 'Responde a 100% das avaliações' }
  ];
}
