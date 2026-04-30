import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface TimelineItem {
  year: string;
  title: string;
  text: string;
}

interface CultureCard {
  icon: string;
  title: string;
  text: string;
  tone: string;
}

@Component({
  selector: 'app-culture',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './culture.html',
  styles: []
})
export class CultureComponent {
  heroImage = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1600&q=80';

  timeline: TimelineItem[] = [
    {
      year: '1503',
      title: 'Descoberta e primeiros mapas',
      text: 'Fernando de Noronha surge nos relatos de navegação do início do século XVI e passa a figurar cedo na rota do Atlântico brasileiro.'
    },
    {
      year: 'séculos XVII e XVIII',
      title: 'Fortes, defesa e vigilância',
      text: 'A ilha ganha fortificações e postos estratégicos para proteger o litoral e controlar o território.'
    },
    {
      year: 'séculos XIX e XX',
      title: 'Presídio e base militar',
      text: 'A ocupação muda o cotidiano local e deixa marcas arquitetônicas e memórias que ainda aparecem no traçado urbano.'
    },
    {
      year: 'hoje',
      title: 'Patrimônio e turismo ordenado',
      text: 'A vida cultural combina conservação, festa, fé, gastronomia e eventos que fortalecem o sentimento de pertencimento.'
    }
  ];

  cultureCards: CultureCard[] = [
    {
      icon: 'pi pi-map',
      title: 'Vila dos Remédios',
      text: 'Centro histórico e afetivo da ilha, com casario, circulação de moradores e o cenário urbano mais reconhecível de Noronha.',
      tone: 'from-sky-500 to-blue-500'
    },
    {
      icon: 'pi pi-heart',
      title: 'Fé e tradição',
      text: 'A Igreja Matriz Nossa Senhora dos Remédios, a capela de São Pedro e as celebrações religiosas seguem como pontos de encontro da comunidade.',
      tone: 'from-amber-500 to-orange-500'
    },
    {
      icon: 'pi pi-calendar',
      title: 'Semana da Paixão',
      text: 'A programação recente da ilha mostra que Noronha também sabe transformar a Praça de São Miguel em palco de música, teatro e convivência.',
      tone: 'from-rose-500 to-pink-500'
    },
    {
      icon: 'pi pi-utensils',
      title: 'Gastronomia com identidade',
      text: 'Peixes, frutos do mar, receitas simples e produtos locais ajudam a contar a história da ilha sem pedir protagonismo demais.',
      tone: 'from-emerald-500 to-teal-500'
    },
    {
      icon: 'pi pi-users',
      title: 'Comunidade e esporte',
      text: 'As ações comunitárias, os projetos sociais e os eventos esportivos reforçam a ilha como lugar vivido, não apenas visitado.',
      tone: 'from-violet-500 to-fuchsia-500'
    },
    {
      icon: 'pi pi-compass',
      title: 'Cultura de respeito ao território',
      text: 'Cultura em Noronha também é aceitar limites, seguir sinalizações e entender que a paisagem faz parte da identidade local.',
      tone: 'from-cyan-500 to-sky-600'
    }
  ];

  visitorTips = [
    'Caminhe com calma pela Vila dos Remédios e perceba como história e cotidiano se misturam.',
    'Inclua pelo menos um pôr do sol em mirante ou praia para entender o ritmo da ilha.',
    'Valorize eventos e negócios locais: eles sustentam boa parte da experiência cultural de Noronha.'
  ];
}
