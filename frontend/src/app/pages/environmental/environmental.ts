import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface HighlightCard {
  icon: string;
  title: string;
  text: string;
  tone: string;
}

interface TipCard {
  icon: string;
  title: string;
  text: string;
}

interface ChecklistCard {
  title: string;
  text: string;
}

@Component({
  selector: 'app-environmental',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './environmental.html',
  styles: []
})
export class EnvironmentalComponent {
  heroImage = 'https://static.wixstatic.com/media/2b2627_eeb8d7b6092249f0bc8fdc54f616f809~mv2.jpg/v1/fill/w_1225,h_556,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/2b2627_eeb8d7b6092249f0bc8fdc54f616f809~mv2.jpg';

  stats = [
    { value: '70%', label: 'do arquipélago protegido pelo Parque Nacional Marinho' },
    { value: '2001', label: 'ano em que Noronha entrou na lista de Patrimônio Mundial Natural' },
    { value: '2', label: 'unidades de conservação federais que estruturam a visitação' }
  ];

  highlights: HighlightCard[] = [
    {
      icon: 'pi pi-shield',
      title: 'Unesco e Ramsar',
      text: 'Fernando de Noronha é Patrimônio Mundial Natural e sítio Ramsar. O destino foi desenhado para valorizar biodiversidade, paisagem e uso racional da ilha.',
      tone: 'from-emerald-500 to-teal-500'
    },
    {
      icon: 'pi pi-ticket',
      title: 'TPA e ingresso organizam a visita',
      text: 'A entrada na ilha passa pela Taxa de Preservação Ambiental e, para boa parte dos atrativos, pelo ingresso do Parque Nacional Marinho.',
      tone: 'from-sky-500 to-blue-500'
    },
    {
      icon: 'pi pi-recycle',
      title: 'Plástico Zero e Carbono Zero',
      text: 'A agenda ambiental da ilha incentiva redução de resíduos, proíbe descartáveis e prepara a transição para uma mobilidade cada vez mais limpa.',
      tone: 'from-amber-500 to-orange-500'
    },
    {
      icon: 'pi pi-leaf',
      title: 'Visitação com limite inteligente',
      text: 'As trilhas e piscinas naturais são controladas por agendamento para reduzir impacto e manter a experiência boa para quem visita e para quem vive na ilha.',
      tone: 'from-lime-500 to-emerald-600'
    }
  ];

  guideCards: TipCard[] = [
    {
      icon: 'pi pi-map',
      title: 'Maré baixa manda no roteiro',
      text: 'Piscinas naturais e certas trilhas dependem da tábua de maré. Consultar isso antes da viagem evita frustração e ajuda a escolher o melhor dia.'
    },
    {
      icon: 'pi pi-users',
      title: 'Condutor credenciado em trilhas sensíveis',
      text: 'Alguns atrativos precisam de acompanhamento de condutor cadastrado pelo ICMBio. Essa regra existe para proteger os ambientes mais frágeis.'
    },
    {
      icon: 'pi pi-ban',
      title: 'Nada de descartar ou alimentar a fauna',
      text: 'A fauna é a principal estrela da ilha. Respeite a sinalização, não alimente animais e leve sempre seu lixo de volta.'
    }
  ];

  checklist: ChecklistCard[] = [
    { title: 'Leve garrafa reutilizável', text: 'A ilha estimula hábitos de baixo impacto e o uso de descartáveis é cada vez menos bem-vindo.' },
    { title: 'Use protetor e roupa adequados', text: 'O sol é forte e o acesso a muitas praias exige caminhada em terreno irregular.' },
    { title: 'Reserve trilhas e atrativos', text: 'Os melhores horários somem rápido nos períodos de maior procura.' },
    { title: 'Prefira deslocamentos leves', text: 'A experiência de Noronha fica melhor quando a rotina da ilha é respeitada, sem pressa nem excesso.' }
  ];
}
