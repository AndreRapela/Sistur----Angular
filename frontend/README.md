# SisTur Frontend

SPA Angular do SisTur para experiencia turistica em Fernando de Noronha.

## Requisitos

- Node.js 20+
- NPM 10+

## Configuracao

Defina as variaveis necessárias no terminal local ou no serviço de deploy:

```text
SISTUR_API_URL=https://<backend>/api
GOOGLE_MAPS_API_KEY=<chave-browser-do-google-maps>
SISTUR_PUBLIC_APP_URL=https://<dominio-publico>
SISTUR_SUPPORT_EMAIL=<email-real>
SISTUR_SUPPORT_PHONE=<telefone-real>
SISTUR_SUPPORT_WHATSAPP=<pais-ddd-numero-somente-digitos>
```

`npm run start` e `npm run build` geram `public/runtime-config.js` sem versionar a chave. Sem a variável, o app usa Leaflet como fallback. Com a chave, a página de mapa ativa Google Maps, Places, fotos, avaliações, horários e rotas reais.

Restrinja a chave no Google Cloud aos dominios publicados do SisTur e a `http://localhost:4200/*` durante o desenvolvimento.

## Execucao local

```bash
npm install
npm run start
```

Acesse:

```text
http://localhost:4200
```

## Build

```bash
npm run build
```

## Deploy

- Root directory: `frontend`
- Build command: `npm run build`
- Output: `dist/sistur/browser`

## Observacoes de lancamento

- Configure a mesma origem do frontend em `CORS_ALLOWED_ORIGINS` no backend.
- O build de produção gera uma PWA. O roteiro local e o shell continuam disponíveis offline; dados ao vivo exigem conexão.
- Orçamento, despesas e códigos de reserva ficam somente no dispositivo e não são publicados na API social. O usuário pode exportar compromissos em `.ics`.
- O cadastro publico cria usuarios Free; upgrades Pro/Premium devem passar pelo fluxo comercial/admin.
- As fotos exibidas pelo app devem ser reais/licenciadas. O app mostra estado de foto pendente quando nao ha imagem confiavel.
