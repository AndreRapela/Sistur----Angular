# SisTur Frontend

SPA Angular do SisTur para experiencia turistica em Fernando de Noronha.

## Requisitos

- Node.js 20+
- NPM 10+

## Configuracao

Use `src/environments/environment.example.ts` como referencia para preencher:

```ts
apiUrl: 'https://<backend>/api',
googleClientId: '<client-id-google-ou-vazio>',
googleMapsApiKey: '<google-maps-browser-key>'
```

Sem `googleMapsApiKey`, o app usa o mapa local Leaflet como fallback. Com a chave, a pagina de mapa ativa Google Maps, Places e rotas reais.

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
- Output: `dist/sistur`

## Observacoes de lancamento

- Configure a mesma origem do frontend em `CORS_ALLOWED_ORIGINS` no backend.
- O cadastro publico cria usuarios Free; upgrades Pro/Premium devem passar pelo fluxo comercial/admin.
- As fotos exibidas pelo app devem ser reais/licenciadas. O app mostra estado de foto pendente quando nao ha imagem confiavel.
