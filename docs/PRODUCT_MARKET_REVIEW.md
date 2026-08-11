# Revisão de produto e mercado

Revisão atualizada em 02/08/2026. As referências servem para identificar padrões de mercado, não para copiar identidade visual ou conteúdo protegido.

## Referências observadas

- [Wanderlog Help Center](https://help.wanderlog.com/hc/en-us): listas, roteiro diário, mapa, colaboração, documentos, orçamento e uso móvel.
- [Otimização de rota no Wanderlog](https://help.wanderlog.com/hc/en-us/articles/13545624787867-Optimize-route): ordenação de paradas como recurso de planejamento.
- [Acesso offline no Wanderlog](https://help.wanderlog.com/hc/en-us/articles/13545182856859-Download-trip-plan-for-offline-access): continuidade durante viagens com conexão ruim.
- [Orçamento no Wanderlog](https://help.wanderlog.com/hc/en-us/sections/5154400242843--Manage-costs): limite, despesas e acompanhamento de custos.
- [Reservas e documentos no Wanderlog](https://help.wanderlog.com/hc/en-us/sections/5159087453595--Reservations-and-documents): organização de confirmações da viagem.
- [Visualização compacta no Wanderlog](https://help.wanderlog.com/hc/en-us/articles/13356092870427-Itinerary-compact-view): leitura de mais itens em uma única tela.
- [TripIt Getting Started](https://help.tripit.com/en/support/solutions/articles/103000063304-getting-started): consolidação de reservas, documentos, mapas, clima e calendário.
- [Google Maps](https://support.google.com/maps/answer/144349?hl=en): detalhes, horários, cardápios, rotas, listas e reservas.
- [Listas do Google Maps](https://support.google.com/maps/answer/7280933?hl=pt-BR): listas privadas, compartilhadas e colaborativas.
- [Viator Supplier API](https://docs.viator.com/supplier-api/technical/api-overview/): disponibilidade, preço, reserva e confirmação integrados.
- [GetYourGuide Supplier](https://supply.getyourguide.support/hc/en-us): gestão de produtos, reservas e conectividade.

## Matriz de produto

| Capacidade | SisTur atual | Padrão competitivo | Próximo passo |
| --- | --- | --- | --- |
| Descoberta por categoria | Implementada | Essencial | Manter cobertura e qualidade editorial |
| Perfis ricos de lugares | Implementados com Google e dados próprios | Essencial | SLA de atualização e reivindicação pelo proprietário |
| Mapa e geolocalização | Implementados com Google e fallback Leaflet | Essencial | QA em aparelhos reais e áreas de sinal ruim |
| Roteiro por dia e horário | Implementado | Essencial | Melhorar edição por arrastar no mobile |
| Visualização compacta | Implementada | Comum em planners maduros | Medir preferência e densidade em aparelhos reais |
| Otimização de rota | Implementada por contexto e distância | Diferencial esperado | Explicar fonte e limitações ao usuário |
| Clima e alertas | Implementados, com lente preventiva no mapa e acesso ao INMET | Diferencial local forte | Integrar alerta oficial somente quando houver fonte pública estável e verificável |
| Offline | Shell e roteiro local implementados | Forte em viagem | Baixar mapa e detalhes selecionados com consentimento e limites de licença |
| Colaboração simultânea | Não implementada | Presente no Wanderlog | Fase 2 com convite, permissões e histórico |
| Reservas organizadas | Implementadas manualmente e privadas no dispositivo | Presente em planners maduros | Sincronização criptografada e importação de e-mail somente após revisão LGPD |
| Orçamento e divisão de gastos | Implementados com limite, categorias, reservas e rateio | Frequente | Participantes nomeados e acerto de contas na colaboração |
| Exportação para calendário | Implementada em `.ics` | Integração esperada | Adicionar calendário conectado somente com consentimento OAuth |
| Documentos de viagem | Não implementados | TripIt e Wanderlog oferecem | Cofre criptografado, retenção e exclusão antes de aceitar arquivos |
| Compra dentro do app | Não implementada | Forte em OTAs | Integração com parceiro, estoque e cancelamento antes de prometer checkout |
| Conversão confirmada | Apenas clique de saída | Mercado usa callback e atribuição | Webhook, affiliate ID ou conciliação com parceiros |
| Painel do parceiro | Editor e métricas implementados | Necessário B2B | Moderação, reivindicação, equipe e cobrança |
| Avaliações | Google e depoimentos próprios | Essencial | Política de moderação, denúncia e direito de resposta |
| SEO e compartilhamento | Títulos e preview básicos | Essencial para aquisição | Prerenderizar páginas públicas, gerar sitemap e metadados por perfil |

## Posicionamento recomendado

O melhor espaço para o SisTur não é ser um guia genérico. É ser a camada operacional de Noronha: regras ambientais, custos obrigatórios, clima e mar, deslocamento, planejamento e descoberta comercial no mesmo fluxo.

Proposta curta: **“Noronha planejada do desembarque ao último passeio.”**

## Modelo de negócio recomendado

1. Plano gratuito para viajantes, preservando mapa, clima, regras e roteiro como aquisição.
2. Assinatura B2B para estabelecimentos com perfil reivindicado, edição, ofertas, analytics e atendimento.
3. Comissão ou afiliado somente em parceiros que ofereçam atribuição e política clara de cancelamento.
4. Destaques patrocinados identificados como publicidade, sem alterar avaliações orgânicas.
5. Dados agregados para operação turística apenas com anonimização, contrato e finalidade legítima.

Não cobrar plano Pro do viajante até existirem benefícios exclusivos verificáveis, cobrança, cancelamento e suporte. Promessas sem entrega prejudicam confiança e aumentam risco de consumo.

## Métricas principais

- Ativação: visitante que abre mapa e salva o primeiro lugar.
- Planejamento: roteiros com pelo menos três paradas e um dia definido.
- Intenção comercial: clique em reserva, cardápio, telefone, WhatsApp ou rota.
- Conversão confirmada: compra conciliada por parceiro, separada de clique.
- Retenção: retorno em 7 e 30 dias, especialmente perto da data da viagem.
- Qualidade: percentual de perfis verificados, links válidos, preços dentro do SLA e denúncias resolvidas.
- Parceiros: estabelecimentos ativos, taxa de resposta e receita recorrente.

## Roadmap sugerido

### Antes da venda

- Identidade jurídica, domínio, suporte, termos, privacidade e contratos.
- Monitoramento, backup, rate limit, baseline do banco e teste de restauração.
- Revisão de licença de todas as fotos e confirmação amostral dos links e preços.
- Testes em Android, iPhone, conexão lenta e geolocalização negada.
- Domínio final, sitemap, prerender das páginas públicas e teste de preview em WhatsApp/Google.

### Piloto comercial

- Reivindicação e aprovação de estabelecimento.
- Links rastreáveis por parceiro e relatório de origem.
- Moderação de avaliações e ofertas.
- Cobrança B2B e cancelamento documentado.

### Expansão

- Colaboração simultânea e sincronização privada de despesas e reservas.
- Importação consentida de confirmações e cofre de documentos com criptografia.
- Inventário e disponibilidade via fornecedores.
- Notificações opt-in e mapa offline selecionável.

## Entrega da comparação de 02/08/2026

Foram incorporadas quatro lacunas de alto valor que não dependem de contrato com OTA ou acesso à caixa de e-mail do usuário:

1. Área única de reservas para voo, hospedagem, passeio, restaurante e transporte.
2. Orçamento com limite, despesas por categoria, pagador, divisão e custo por viajante.
3. Exportação do roteiro e das reservas para Google Agenda, Apple Calendar e Outlook via `.ics`.
4. Alternância entre roteiro detalhado e compacto.

Reservas, códigos e despesas permanecem no dispositivo e não entram no roteiro público nem no payload atual da API. Importação automática de e-mail, documentos e colaboração simultânea ficaram no roadmap porque exigem consentimento, criptografia, revogação de acesso, auditoria e uma política de retenção antes de serem comercialmente seguras.

## Pacote comercial inicial

O primeiro produto vendável deve ser o **perfil parceiro verificado**, não uma assinatura do turista. O pacote mínimo inclui perfil próprio, foto licenciada, contato, horário, cardápio ou reserva, oferta identificada, presença no mapa e painel de ações comerciais. O SisTur precisa registrar clique e origem; compra confirmada só entra quando o parceiro fornecer callback, webhook, código de afiliado ou conciliação.

Público inicial recomendado:

1. Restaurantes e operadores de passeio com demanda digital e link de reserva.
2. Pousadas que precisam orientar o hóspede antes e durante a viagem.
3. Serviços essenciais cuja informação correta reduz atrito na ilha.

Hipótese para teste, não tabela definitiva: piloto assistido de 30 a 60 dias sem cobrança ou com taxa de implantação; depois, mensalidade B2B simples por perfil e uma faixa superior para destaque identificado, equipe e relatórios. O preço deve ser definido após 10 a 15 entrevistas com parceiros e comparação entre receita incremental, custo de atualização e disposição a pagar.

## Piloto de 90 dias

1. Selecionar 10 parceiros, conferir propriedade do negócio e assinar autorização de conteúdo.
2. Publicar 100% dos campos mínimos com SLA de 30 dias e links rastreáveis.
3. Medir visualização, abertura do perfil, rota, cardápio, contato e saída para reserva separadamente.
4. Entregar relatório quinzenal com linguagem de clique/intenção, nunca de venda não confirmada.
5. Entrevistar viajantes e parceiros, corrigir os três maiores atritos e medir repetição.
6. Converter o piloto apenas quando suporte, cobrança, cancelamento e atualização editorial estiverem operacionais.

Critérios de prova sugeridos: pelo menos 70% dos parceiros ativos usando o painel, 90% dos perfis dentro do SLA, links críticos sem erro e demonstração de que as ações comerciais são úteis ao parceiro. Receita deve ser tratada como hipótese até haver contratos e cobrança recorrente.
