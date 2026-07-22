# SisTur Frontend

SPA Angular do SisTur para experiencia turistica em Fernando de Noronha.

## Requisitos

- Node.js 20+
- NPM 10+

## Configuracao

Defina a variavel de ambiente abaixo no terminal local ou no servico de deploy:

```text
GOOGLE_MAPS_API_KEY=<chave-browser-do-google-maps>
```

`npm run start` e `npm run build` geram `public/runtime-config.js` sem versionar a chave. Sem a variavel, o app usa o mapa local Leaflet como fallback. Com a chave, a pagina de mapa ativa Google Maps, Places, fotos, avaliacoes, horarios e rotas reais.

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
- Output: `dist/sistur`

## Observacoes de lancamento

- Configure a mesma origem do frontend em `CORS_ALLOWED_ORIGINS` no backend.
- O cadastro publico cria usuarios Free; upgrades Pro/Premium devem passar pelo fluxo comercial/admin.
- As fotos exibidas pelo app devem ser reais/licenciadas. O app mostra estado de foto pendente quando nao ha imagem confiavel.
