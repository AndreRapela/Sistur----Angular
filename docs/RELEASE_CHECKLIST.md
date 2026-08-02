# Checklist de lançamento

## Bloqueadores comerciais

- [ ] Razão social, CNPJ, domínio e marca definidos.
- [ ] Namespace `br.gov.noronha` confirmado como autorizado ou renomeado para o domínio real da operadora.
- [ ] E-mail, telefone e WhatsApp reais configurados no deploy.
- [ ] Termos de uso, política de privacidade, política de cookies e canal do titular publicados.
- [ ] Contratos de parceiros, regras de destaque e política de cancelamento aprovados.
- [ ] Licença e crédito de todas as imagens comprovados.
- [ ] Preços, horários, contatos e links revisados dentro do SLA.
- [ ] Chave Google restrita por domínio/API, faturamento e cotas com alerta.
- [ ] CORS somente com domínios finais.
- [ ] Supabase com backup/PITR e restauração testada.
- [ ] WAF distribuído, monitoramento de uptime, erros e latência ativos; rate limit local já existe.
- [ ] Baseline SQL completa e `JPA_DDL_AUTO=validate` em produção.
- [ ] Processo de suporte, moderação, incidente e remoção de dados treinado.

## Qualidade técnica

- [ ] `.\mvnw.cmd test` passa em JDK 21.
- [ ] `npm test -- --watch=false` passa.
- [ ] `npm run build` respeita budgets.
- [ ] `npm audit --omit=dev` sem vulnerabilidade conhecida.
- [ ] Migrações testadas em cópia anonimizada do banco.
- [ ] Health check responde sem expor detalhes internos.
- [ ] Erros exibem `requestId` e logs permitem correlação.
- [ ] Nenhum segredo aparece em Git, bundle, log ou screenshot.

## QA de experiência

- [ ] Android Chrome e Samsung Internet.
- [ ] iPhone Safari e PWA instalada.
- [ ] Desktop Chrome, Edge e Firefox.
- [ ] Tela de 320 px, tablet, notebook e monitor largo.
- [ ] Geolocalização permitida, negada, indisponível e imprecisa.
- [ ] Conexão lenta, offline, API fora do ar e Google bloqueado.
- [ ] Mapa com zoom, clusters, lista lateral e controles sem sobreposição.
- [ ] Rotas e “Como chegar” abrem corretamente sem aplicativo Google Maps instalado.
- [ ] Reservas e orçamento persistem offline e nunca aparecem no roteiro público ou analytics.
- [ ] Exportação `.ics` abre corretamente no Google Agenda, Apple Calendar e Outlook.
- [ ] Valores, datas e divisão de despesas usam formato brasileiro e permanecem legíveis em 320 px.
- [ ] Leitor de tela, teclado, foco, contraste e tamanho de toque revisados.
- [ ] Sitemap, prerender das páginas públicas e previews de WhatsApp/Google validados no domínio final.

## Métricas de aceite do piloto

- P95 da API abaixo de 500 ms nos endpoints sem provedor externo.
- LCP móvel abaixo de 2,5 s em conexão 4G representativa.
- Taxa de erro abaixo de 1% por rota crítica.
- Nenhum link quebrado entre os 30 perfis mais acessados.
- 100% dos preços exibidos com fonte e data.
- Cliques externos e compras confirmadas apresentados como métricas separadas.

## Go/no-go

O lançamento é “go” somente quando todos os bloqueadores comerciais possuem responsável e evidência. Build verde, sozinho, não significa operação pronta para venda.

## Validação local em 02/08/2026

- [x] Backend em JDK 21: 11 testes, sem falhas.
- [x] Frontend Angular: 13 testes, sem falhas.
- [x] Build de produção dentro dos budgets; mapa permanece em chunk lazy.
- [x] `npm audit --omit=dev`: nenhuma vulnerabilidade de produção conhecida.
- [x] `npm audit`: nenhuma vulnerabilidade conhecida, incluindo ferramentas de desenvolvimento.
- [x] `docker compose config`: configuração válida.
- [x] CI e atualização automatizada de dependências adicionadas aos dois repositórios.

Ainda exigem evidência externa: migração em cópia do Supabase, restauração, aparelhos reais, Core Web Vitals em rede móvel, licenças de imagens e validação comercial dos dados.
