# Governança de dados turísticos

## Hierarquia de fontes

1. Órgão responsável: TPA, Parque Nacional, regras, trilhas e alertas oficiais.
2. Canal oficial do estabelecimento ou operador: preço, cardápio, contato, duração e reserva.
3. Google Places: situação operacional, horário, avaliação, volume de reviews, foto e endereço.
4. Fonte editorial confiável: contexto, recomendações e descrições, sempre identificada.

Uma fonte inferior não deve sobrescrever uma informação oficial mais recente.

## Campos mínimos para publicação

- Nome real e categoria correta.
- Coordenadas dentro da área válida de Fernando de Noronha.
- Descrição factual sem superlativos não comprovados.
- Link Google ou fonte primária.
- Horário e contato quando publicados pelo responsável.
- Data de verificação.
- Foto licenciada ou foto do Google com atribuição. Sem imagem confiável, mostrar ausência de foto em vez de imagem fictícia.
- Preço acompanhado de escopo, unidade, data e aviso de confirmação.

## Frequência recomendada

| Informação | Revisão máxima sugerida |
| --- | --- |
| Alerta climático e mar | Tempo real, com cache curto |
| Situação aberto/fechado | Google ao abrir a tela |
| Horário e contato | 30 dias |
| Preço e cardápio | 30 dias ou evento do parceiro |
| Passeio, duração e inclusão | 30 dias |
| TPA e ingresso do parque | A cada ano e ao receber aviso oficial |
| Regras ambientais | 30 dias e antes de alta temporada |
| Foto e licença | Na publicação e na troca do ativo |

## Processo editorial

1. Coletar URL primária e registrar data.
2. Conferir nome, endereço, coordenadas e estado operacional.
3. Comparar preço com unidade correta: por pessoa, diária, prato ou passeio.
4. Validar direitos da imagem e atribuição.
5. Publicar com `dataVerifiedAt` e `dataSourceUrl`.
6. Executar verificação automática de links e revisão humana por amostra.
7. Despublicar rapidamente locais encerrados ou informação contestada.

## Avaliações e depoimentos

- Avaliações Google permanecem vinculadas à fonte e abrem no Google.
- Avaliações próprias exigem autenticação, uma nota por usuário e política de moderação.
- O proprietário deve ter canal de resposta e denúncia.
- Não copiar textos longos de terceiros nem apresentar review externo como conteúdo próprio.

## Conversão

`GOOGLE_SERVICE_CLICK` e eventos semelhantes medem saída do SisTur. O termo recomendado no painel é “cliques enviados”, não “compras”. Uma venda só entra em `confirmed_purchase` após confirmação técnica ou conciliação do parceiro.

## Dados privados da viagem

- Códigos de confirmação, despesas, pagadores e orçamento não pertencem ao catálogo turístico nem ao analytics.
- A versão atual mantém esses campos apenas no dispositivo e não os inclui no roteiro público ou na API social.
- A exportação `.ics` é iniciada pelo usuário e pode conter código de confirmação; o arquivo passa a ser responsabilidade do aplicativo de calendário escolhido.
- Sincronização futura exige consentimento claro, controle por participante, criptografia, prazo de retenção e exclusão completa.
- Importação de e-mail ou documentos não deve ser ativada antes de uma avaliação LGPD e de segurança específica.
