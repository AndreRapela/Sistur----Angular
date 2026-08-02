# Segurança e privacidade

Este documento descreve controles técnicos. Não substitui análise jurídica nem a política de privacidade publicada pela empresa operadora.

## Dados tratados

- Conta: nome, e-mail, hash de senha, função, foto e biografia opcional.
- Planejamento: roteiro, notas, horários, lugares e compartilhamento escolhido pelo usuário.
- Conteúdo social: comentários, curtidas e avaliações.
- Analytics: ações, página, categoria, identificador de item, usuário quando autenticado e IP pseudonimizado.
- Geolocalização: usada no navegador para mapa e rota. O fluxo atual não persiste a posição exata como histórico de localização.

## Controles implementados

- Senhas com BCrypt e limite compatível de 8 a 72 caracteres.
- JWT com expiração configurável e segredo mínimo de 32 caracteres.
- Papéis `ADMIN`, `CLIENT` e turista validados no backend.
- Roteiros privados não aparecem em feed, comentários ou likes públicos.
- Links compartilhados usam UUID e não aceitam fallback por ID numérico.
- DTOs impedem alteração de proprietário, visualizações, token e datas pelo cliente.
- CORS restrito aos domínios configurados.
- Erros 4xx/5xx possuem código e `requestId`; exceções internas não são expostas.
- Swagger desligado por padrão.
- IP de analytics é pseudonimizado com SHA-256 e sal próprio.
- Referrer e caminhos têm query strings sensíveis removidas, exceto filtros permitidos.
- Login, cadastro, tracking e cálculos públicos possuem rate limit local com resposta `429` e `Retry-After`.
- O deploy Vercel recebe HSTS, proteção contra iframe/MIME sniffing, política de referrer e permissões restritas.

## Pendências obrigatórias para produção comercial

1. Definir controlador de dados, encarregado/canal, bases legais, retenção e processo de atendimento ao titular.
2. Publicar política de privacidade e termos revisados com a identidade real da empresa.
3. Implementar exportação e exclusão de conta, inclusive roteiros, avaliações e vínculo de analytics quando aplicável.
4. Configurar WAF/rate limit distribuído no provedor e calibrar os limites locais com métricas reais.
5. Ativar alertas, logs centralizados, rotação de segredo e resposta a incidentes.
6. Habilitar backup, PITR e teste periódico de restauração do Supabase.
7. Revisar armazenamento do JWT. Cookie `HttpOnly` por BFF reduz exposição a XSS em operações de maior risco.
8. Mover fotos de perfil para storage com URL assinada, antimalware e política de retenção ao crescer.
9. Implantar CSP primeiro em modo de relatório e depois em bloqueio, cobrindo Google, Esri e demais fontes autorizadas.
10. Definir a base legal de analytics e, se a decisão jurídica exigir consentimento, implementar preferência revogável antes do tracking.

## LGPD

A ANPD mantém orientações e regras também para agentes de pequeno porte. Medidas técnicas e administrativas essenciais continuam necessárias: [Resolução CD/ANPD nº 2](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022) e [Guia de Segurança da Informação](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-vf.pdf).

## Resposta a incidente

- Preservar logs e identificar `requestId`, horário, usuário e versão implantada.
- Conter acesso, rotacionar credenciais e bloquear vetores ativos.
- Avaliar dados e titulares afetados com responsável jurídico.
- Comunicar conforme obrigação aplicável e documentar decisões.
- Corrigir, testar restauração e publicar retrospectiva interna com ações preventivas.
