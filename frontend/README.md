# 📱 SisTur - Frontend (Angular 21)

[![Angular](https://img.shields.io/badge/Angular%2021-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io/)
[![PrimeNG](https://img.shields.io/badge/PrimeNG-DE363E?style=for-the-badge&logo=primeng&logoColor=white)](https://primeng.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

> Uma Single Page Application (SPA) ultra-reativa, desenvolvida para entregar a melhor experiência de usuário em Fernando de Noronha.

---

## ✨ Funcionalidades em Destaque

- **UX iFood-Style**: Interface moderna com categorias circulares, carrosséis de eventos e navegação mobile intuitiva.
- **Roteiro Interativo**: Adicione eventos, restaurantes e hotéis ao seu planejamento diário com feedback visual (Toast).
- **IA Sabat**: Dicas contextuais integradas via Drawer reativo.
- **Geolocalização**: Visualização de estabelecimentos diretamente no mapa.
- **PWA Ready**: Otimizado para instalação em dispositivos mobile.

---

## 🛠️ Tecnologias Utilizadas

- **Framework**: Angular 21 (Signals e Control Flow)
- **UI Kit**: PrimeNG (Componentes de alta performance)
- **Estilização**: Tailwind CSS + Custom SCSS
- **Navegação**: Angular Router com RoleGuards
- **Ícones**: PrimeIcons + Font Awesome

---

## 🚀 Como Iniciar localmente

### Pré-requisitos
- Node.js 20+
- NPM 10+

### Passo a Passo
1.  Instale as dependências:
    ```bash
    npm install
    ```
2.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run start
    ```
3.  Acesse `http://localhost:4200` no seu navegador.

---

## 🌍 Deploy no Vercel

O projeto está otimizado para deploy simples no Vercel:
1.  **Framework Preset**: Selecione **Angular** no painel do Vercel.
2.  **Root Directory**: Defina como `frontend`.
3.  **Build Settings**: O Vercel detectará automaticamente o comando `npm run build` e o diretório de saída correspondente.
4.  **SPA Routing**: O arquivo `frontend/vercel.json` já cuida do redirecionamento automático das rotas.

---

## 📁 Estrutura de Pastas

- `src/app/pages`: Páginas da aplicação (Home, Login, Eventos, Itinerário).
- `src/app/components`: Componentes reutilizáveis (Navbar, BottomNav, Skeleton).
- `src/app/services`: Lógica de consumo de API e Estado (Auth, Itinerary, Api).
- `src/app/guards`: Proteção de rotas baseada em autenticação e papéis.

---

**SisTur - O seu paraíso, planejado.**
