import { ToastService } from '../../services/toast.service';
import { Component, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NgOptimizedImage],
  templateUrl: './profile.html'
})
export class ProfilePageComponent {
  private toastService = inject(ToastService);
  public auth = inject(AuthService);
  private http = inject(HttpClient);

  editMode = false;
  tempUser: any = {};
  itineraries = signal<any[]>([]);
  badges = signal<any[]>([]);
  currentTab = signal<'roteiros' | 'conquistas'>('roteiros');

  userTierLabel = signal('Free');
  userTierDescription = signal('Explore o app com o plano gratuito.');

    constructor() {
    this.loadMyItineraries();
    this.loadMyBadges();
    this.updateTierCopy();
  }

  private updateTierCopy() {
    const role = this.auth.currentUser()?.role;
    if (role === 'PREMIUM_TOURIST') {
      this.userTierLabel.set('Premium');
      this.userTierDescription.set('Eventos em tempo real e ofertas exclusivas em estabelecimentos parceiros.');
      return;
    }

    if (role === 'PRO_TOURIST') {
      this.userTierLabel.set('Pro');
      this.userTierDescription.set('Eventos em tempo real e acesso ampliado ao conteúdo da ilha.');
      return;
    }

    this.userTierLabel.set('Free');
    this.userTierDescription.set('Explore roteiros, restaurantes, hotéis e mapas com o plano gratuito.');
  }

  loadMyBadges() {
    this.http.get<{data: any[]}>(`${environment.apiUrl}/gamification/badges`).subscribe({
      next: (res) => this.badges.set(res.data || []),
    });
  }

  loadMyItineraries() {
    this.http.get(`${environment.apiUrl}/itineraries/my`).subscribe({
      next: (res: any) => this.itineraries.set(res.data || []),
      error: () => console.warn('Erro ao carregar roteiros do perfil')
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.toastService.add({ severity: 'info', summary: 'Upload', detail: 'Simulando upload de imagem...' });
    }
  }

  toggleEdit() {
    this.editMode = !this.editMode;
    if (this.editMode) {
      const current = this.auth.currentUser();
      this.tempUser = {
        name: current?.name || '',
        bio: (current as any)?.bio || '',
        photoUrl: current?.photoUrl || ''
      };
    }
  }

  isFreeUser() {
    return this.auth.isFreeTier();
  }

  saveProfile() {
    this.auth.updateProfile(this.tempUser).subscribe({
      next: () => {
        this.toastService.add({ severity: 'success', summary: 'Sucesso', detail: 'Perfil atualizado com sucesso!' });
        this.editMode = false;
      },
      error: () => {
        this.toastService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao atualizar perfil' });
      }
    });
  }
}
