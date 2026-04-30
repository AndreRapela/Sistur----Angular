export interface TouristPointDetailMeta {
  bestSeason: string;
  idealWeather: string;
  bestTimeWindow: string;
  localContext: string;
  historicalContext: string;
  visitDuration: string;
  imageGallery: string[];
}

export const touristPointDetails: Record<number, TouristPointDetailMeta> = {
  1: {
    bestSeason: 'Agosto a novembro',
    idealWeather: 'Mar calmo e céu limpo',
    bestTimeWindow: 'Manhã cedo, com maré baixa',
    localContext: 'Acesso pelo Parque Nacional com controle de visitação. É o tipo de praia que pede planejamento para aproveitar a descida e a subida com calma.',
    historicalContext: 'O Sancho virou símbolo de preservação e de visita responsável, consolidando a imagem de Noronha como destino de natureza protegida.',
    visitDuration: '3 a 4 horas',
    imageGallery: [
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  2: {
    bestSeason: 'Agosto a outubro',
    idealWeather: 'Sol forte e mar transparente',
    bestTimeWindow: 'Maré baixa e primeira luz do dia',
    localContext: 'A travessia exige atenção ao acesso e recompensa com um dos visuais mais fortes da ilha.',
    historicalContext: 'A paisagem diante do Morro Dois Irmãos marcou a memória visual de Noronha e virou cartão-postal instantâneo.',
    visitDuration: '2 a 3 horas',
    imageGallery: [
      'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  3: {
    bestSeason: 'Setembro a dezembro',
    idealWeather: 'Céu aberto e vento moderado',
    bestTimeWindow: 'Nascer do sol',
    localContext: 'Praia ampla, com sensação de isolamento e caminhada longa. É uma das melhores para quem gosta de silêncio e horizonte aberto.',
    historicalContext: 'A região ganhou relevância por observação de tartarugas e pela força da paisagem preservada, mais do que por estrutura turística.',
    visitDuration: '2 horas',
    imageGallery: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  4: {
    bestSeason: 'Agosto a novembro',
    idealWeather: 'Manhã limpa e mar calmo',
    bestTimeWindow: 'Primeiras horas da manhã',
    localContext: 'O melhor é chegar cedo e ficar atento ao movimento dos golfinhos. É um ponto mais de contemplação do que de banho.',
    historicalContext: 'A baía se tornou referência mundial pela presença constante dos golfinhos rotadores, ligados à identidade ambiental de Noronha.',
    visitDuration: '1 a 2 horas',
    imageGallery: [
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  5: {
    bestSeason: 'Julho a dezembro',
    idealWeather: 'Mar claro e sol intenso',
    bestTimeWindow: 'Maré baixa',
    localContext: 'É um dos melhores pontos para snorkel, com observação de fauna marinha em água calma.',
    historicalContext: 'A prática de observação marinha consolidou o Sueste como referência de educação ambiental dentro do parque.',
    visitDuration: '2 a 3 horas',
    imageGallery: [
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  6: {
    bestSeason: 'Ano todo, com preferência para a estação seca',
    idealWeather: 'Fim de tarde com vento leve',
    bestTimeWindow: 'Fim da tarde',
    localContext: 'Praia acessível e com boa leitura do Morro do Pico. É uma escolha sólida para banho sem pressa e para terminar o dia.' ,
    historicalContext: 'A Conceição sempre funcionou como praia de convivência local, onde o visitante percebe o ritmo mais cotidiano da ilha.',
    visitDuration: '2 horas',
    imageGallery: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  7: {
    bestSeason: 'Março a outubro',
    idealWeather: 'Ondas fortes e vento constante',
    bestTimeWindow: 'Manhã e mar agitado',
    localContext: 'O ponto é mais indicado para surfistas e observadores de mar aberto do que para banho tranquilo.',
    historicalContext: 'A Cacimba do Padre ajudou a consolidar a imagem esportiva da ilha, especialmente pela relação com o surf.',
    visitDuration: '2 horas',
    imageGallery: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  8: {
    bestSeason: 'Ano todo',
    idealWeather: 'Qualquer tempo',
    bestTimeWindow: 'Manhã',
    localContext: 'Área histórica e de chegada da ilha, boa para entender a relação entre porto, pesca e abastecimento.',
    historicalContext: 'O Porto de Santo Antônio é uma das zonas mais antigas de ocupação e circulação da ilha.',
    visitDuration: '1 a 2 horas',
    imageGallery: [
      'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  9: {
    bestSeason: 'Ano todo',
    idealWeather: 'Fim de tarde ou noite',
    bestTimeWindow: 'Fim da tarde e noite',
    localContext: 'Centro da vida urbana da ilha, com fluxo de moradores, comércio e acesso fácil a outros pontos.',
    historicalContext: 'A Vila dos Remédios concentra a formação histórica de Noronha e preserva a lógica de ocupação colonial.',
    visitDuration: '1 a 2 horas',
    imageGallery: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  10: {
    bestSeason: 'Ano todo, preferindo o fim da tarde',
    idealWeather: 'Céu limpo para vista aberta',
    bestTimeWindow: 'Fim da tarde',
    localContext: 'Vale combinar a visita com a Vila dos Remédios porque a leitura histórica fica mais completa em sequência.',
    historicalContext: 'A fortaleza é um dos marcos militares mais importantes da ilha e ajuda a entender a estratégia de defesa do arquipélago.',
    visitDuration: '1 a 2 horas',
    imageGallery: [
      'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  11: {
    bestSeason: 'Ano todo',
    idealWeather: 'Entardecer sereno',
    bestTimeWindow: 'Entardecer',
    localContext: 'Ótima para juntar memória e caminhada curta, sem exigir deslocamento longo.',
    historicalContext: 'A capela representa a tradição dos pescadores e a religiosidade popular da ilha.',
    visitDuration: '45 min a 1 hora',
    imageGallery: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  12: {
    bestSeason: 'Ano todo',
    idealWeather: 'Céu aberto para o pôr do sol',
    bestTimeWindow: 'Pôr do sol',
    localContext: 'É uma parada de observação panorâmica e funciona muito bem no fim do dia.',
    historicalContext: 'O Boldró virou ponto clássico de encontro por reunir vista, vento e a leitura mais ampla da costa oeste.',
    visitDuration: '1 hora',
    imageGallery: [
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  13: {
    bestSeason: 'Estação seca, entre agosto e novembro',
    idealWeather: 'Tempo firme e temperaturas amenas',
    bestTimeWindow: 'Manhã',
    localContext: 'Trilha mais longa, ideal para quem quer vegetação, costões e um ritmo de visita mais exploratório.',
    historicalContext: 'As trilhas do parque passaram a integrar a conservação com a visitação organizada, valorizando o contato guiado com a ilha.',
    visitDuration: '4 a 6 horas',
    imageGallery: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  14: {
    bestSeason: 'Ano todo com agendamento',
    idealWeather: 'Maré baixa',
    bestTimeWindow: 'Maré baixa',
    localContext: 'Visitação controlada e sensível, com foco total na preservação da piscina natural.',
    historicalContext: 'A Atalaia é um exemplo de como Noronha equilibra visitação e proteção ambiental.',
    visitDuration: '2 a 3 horas',
    imageGallery: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  15: {
    bestSeason: 'Ano todo',
    idealWeather: 'Qualquer tempo',
    bestTimeWindow: 'Qualquer horário',
    localContext: 'Ponto de apoio para informações, agendamentos e orientações do parque, ótimo para abrir ou fechar o roteiro.',
    historicalContext: 'O centro de visitantes concentra a mediação entre turismo, educação ambiental e gestão do arquipélago.',
    visitDuration: '30 a 45 min',
    imageGallery: [
      'https://images.unsplash.com/photo-1519834785169-98b0d5a9d2a6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80'
    ]
  }
};
