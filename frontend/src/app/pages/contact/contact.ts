import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.html',
  styles: []
})
export class ContactComponent {
  name = '';
  email = '';
  message = '';

  submitContact(event: Event) {
    event.preventDefault();

    const subject = encodeURIComponent(`Contato SisTur - ${this.name || 'Visitante'}`);
    const body = encodeURIComponent(
      `Nome: ${this.name || 'Não informado'}\n` +
      `E-mail: ${this.email || 'Não informado'}\n\n` +
      `${this.message || 'Olá, gostaria de saber mais sobre os planos e benefícios.'}`
    );

    window.location.href = `mailto:ajuda@sistur.gov.br?subject=${subject}&body=${body}`;
  }
}
