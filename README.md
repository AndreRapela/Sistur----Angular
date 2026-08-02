# SisTur Noronha

Plataforma web de descoberta e planejamento turístico para Fernando de Noronha. O produto reúne mapa, geolocalização, perfis de lugares, clima, roteiro, informações práticas e métricas para estabelecimentos e administradores.

## Estrutura

- `frontend/`: Angular 21, PWA, Leaflet e integração opcional com Google Maps/Places.
- `backend/`: Spring Boot 3.4, Java 21, PostgreSQL/Supabase, Flyway e JWT.
- `docker-compose.yml`: PostgreSQL e API para desenvolvimento local.
- `docs/`: arquitetura, revisão de mercado, segurança, dados e checklist de lançamento.
- `.github/`: CI do frontend e atualização semanal de dependências.

O backend é um repositório Git separado referenciado por este repositório principal. Commits e pushes devem ser feitos primeiro em `backend/` e depois na raiz.

## Recursos atuais

- Mapa responsivo com categorias, agrupamento de marcadores, geolocalização e rotas.
- Google Maps/Places para fotos, avaliações, horários, contatos e links externos quando a chave está configurada.
- Catálogo real de praias, pontos, restaurantes, hospedagens, passeios e conveniências.
- Páginas próprias para cards e estabelecimentos.
- Roteiro local, modo compacto, reservas privadas, orçamento dividido, calendário `.ics`, salvamento em nuvem, compartilhamento por token e otimização contextual.
- Clima terrestre e marítimo com cache, alertas e recomendações de segurança.
- Calculadora da TPA 2026 e informações do Parque Nacional com fontes oficiais.
- Painéis de procura, funil e cliques de conversão para administração e parceiros.
- Instalação PWA e disponibilidade do roteiro local sem conexão.

## Desenvolvimento local

Requisitos: Docker Desktop, Node.js 20+, npm 10+ e, para execução sem Docker, JDK 21.

```bash
docker compose up --build
```

Em outro terminal:

```bash
cd frontend
npm install
npm start
```

Abra `http://localhost:4200`. A API fica em `http://localhost:8080` e o Swagger local em `http://localhost:8080/swagger-ui/index.html`.

Use os arquivos `.env.example`, `frontend/.env.example` e `backend/.env.example` como referência. Nunca versione senhas, tokens ou chaves do Google.

## Qualidade

```bash
cd backend
.\mvnw.cmd test

cd ../frontend
npm test -- --watch=false
npm run build
npm audit --omit=dev
```

## Documentação

- [Arquitetura](docs/ARCHITECTURE.md)
- [Produto e mercado](docs/PRODUCT_MARKET_REVIEW.md)
- [Segurança e privacidade](docs/SECURITY_PRIVACY.md)
- [Governança de dados](docs/DATA_GOVERNANCE.md)
- [Checklist de lançamento](docs/RELEASE_CHECKLIST.md)

## Estado comercial

O software está funcional para demonstração e pilotos controlados. A publicação comercial ainda depende de identidade jurídica, canais reais de suporte, política de privacidade e termos aprovados, contratos com parceiros, monitoramento, backups e confirmação das configurações de produção. O checklist detalha cada bloqueador para evitar que um protótipo seja apresentado como operação pronta antes da hora.
