import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { RuntimeConfigService } from '../../services/runtime-config.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './contact.html'
})
export class ContactComponent {
  readonly runtime = inject(RuntimeConfigService);
  private readonly title = inject(Title);

  name = '';
  email = '';
  message = '';

  constructor() {
    this.title.setTitle('Contato e ajuda | SisTur Noronha');
  }

  get phoneHref(): string {
    return `tel:${this.runtime.supportPhone.replace(/[^+\d]/g, '')}`;
  }

  get whatsappHref(): string {
    return this.runtime.whatsapp('Olá! Preciso de ajuda com o SisTur.') || '#';
  }

  submitContact(): void {
    const mailto = this.runtime.mailto(
      `Contato SisTur - ${this.name.trim() || 'Visitante'}`,
      `Nome: ${this.name.trim()}\nE-mail para retorno: ${this.email.trim()}\n\n${this.message.trim()}`
    );

    if (mailto) window.location.href = mailto;
  }
}
