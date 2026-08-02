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
  imageProcessing = signal(false);
  tempUser: any = {};
  itineraries = signal<any[]>([]);
  badges = signal<any[]>([]);
  currentTab = signal<'roteiros' | 'conquistas'>('roteiros');

  userTierLabel = signal('Viajante');
  userTierDescription = signal('Planeje Noronha com mapa, clima e roteiro em uma conta gratuita.');
  planCards = [
    {
      name: 'Viajante',
      price: 'Gratuito',
      description: 'Para descobrir a ilha e organizar a viagem antes e durante a estadia.',
      features: ['Mapa e geolocalização', 'Clima e cuidados', 'Roteiro local e na nuvem']
    },
    {
      name: 'Parceiro',
      price: 'Comercial',
      description: 'Para negócios de Noronha gerenciarem presença, ofertas e resultados no SisTur.',
      features: ['Perfil comercial editável', 'Métricas de procura e saída', 'Ofertas e links de conversão']
    }
  ];

    constructor() {
    this.loadMyItineraries();
    this.loadMyBadges();
    this.updateTierCopy();
  }

  private updateTierCopy() {
    const role = this.auth.currentUser()?.role;
    if (role === 'CLIENT') {
      this.userTierLabel.set('Parceiro');
      this.userTierDescription.set('Gerencie seu estabelecimento e acompanhe o interesse dos viajantes.');
      return;
    }

    if (role === 'ADMIN') {
      this.userTierLabel.set('Operação');
      this.userTierDescription.set('Acesso administrativo à operação e aos indicadores do SisTur.');
      return;
    }

    this.userTierLabel.set('Viajante');
    this.userTierDescription.set('Planeje Noronha com mapa, clima e roteiro em uma conta gratuita.');
  }

  loadMyBadges() {
    this.http.get<{data: any[]}>(`${environment.apiUrl}/gamification/badges`).subscribe({
      next: (res) => this.badges.set(res.data || []),
    });
  }

  loadMyItineraries() {
    this.http.get(`${environment.apiUrl}/itineraries/my`).subscribe({
      next: (res: any) => this.itineraries.set(res.data || []),
      error: () => this.itineraries.set([])
    });
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
      this.toastService.add({ severity: 'warn', summary: 'Foto inválida', detail: 'Use JPG, PNG ou WebP com até 8 MB.' });
      input.value = '';
      return;
    }

    this.imageProcessing.set(true);
    try {
      this.tempUser.photoUrl = await this.prepareProfilePhoto(file);
      this.toastService.add({ severity: 'success', summary: 'Foto pronta', detail: 'Clique em Salvar para atualizar seu perfil.' });
    } catch {
      this.toastService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível preparar a imagem.' });
    } finally {
      this.imageProcessing.set(false);
      input.value = '';
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

  isCurrentPlan(planName: string) {
    return this.userTierLabel().toLowerCase() === planName.toLowerCase();
  }

  saveProfile() {
    if (this.imageProcessing()) return;
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

  private async prepareProfilePhoto(file: File): Promise<string> {
    const bitmap = await createImageBitmap(file);
    const maxSide = 384;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      bitmap.close();
      throw new Error('Canvas indisponível');
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    for (const quality of [0.84, 0.72, 0.6]) {
      const result = canvas.toDataURL('image/jpeg', quality);
      if (result.length <= 190_000) return result;
    }

    throw new Error('Imagem acima do limite');
  }
}
