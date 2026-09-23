# Nexora Booking — Changelog

Este ficheiro regista as principais alterações, decisões e marcos do desenvolvimento do Nexora Booking.

---

# 2026-09-14 — Estrutura de continuidade

## Documentação criada

Criada a estrutura de documentação permanente do projeto:

- `docs/CURRENT-STATE.md`
- `docs/ROADMAP.md`
- `docs/CHANGELOG.md`

## Objetivo

Garantir continuidade do desenvolvimento mesmo quando uma conversa atingir o limite de contexto ou for necessário iniciar uma nova conversa.

---

# 2026-09-14 — Financeiro

## Estado confirmado

Validada a estrutura da tabela `agendamentos` no Supabase.

Campos financeiros relevantes:

- `empresa_id`
- `inicio`
- `estado`
- `valor`

## Regra financeira confirmada

Somente marcações com:

`estado = concluido`

entram no cálculo da receita.

Não entram:

- `cancelado`
- `confirmado`
- `pendente`

## Dados encontrados na validação

- 3 concluídos — €100,00
- 4 confirmados — €140,00
- 2 cancelados — €80,00

---

# 2026-09-14 — 9K.2

## Histórico financeiro dos 12 meses

**Estado inicial:** EM DESENVOLVIMENTO

Objetivo:

Criar uma visão mensal dos últimos 12 meses, incluindo meses sem movimentos.

Requisitos definidos:

- 12 meses;
- receita mensal;
- número de concluídos;
- meses sem receita = €0,00;
- ordenação cronológica;
- respeito pelo fuso horário da empresa;
- somente `concluido` gera receita.

---

# 2026-09-14 — 9K.2 CONCLUÍDO

## Histórico financeiro dos 12 meses

O histórico financeiro mensal foi implementado e validado.

Funcionalidades:

- apresentação dos últimos 12 meses;
- meses sem movimentos apresentados como €0,00;
- receita mensal;
- quantidade de marcações concluídas por mês;
- total dos últimos 12 meses;
- identificação do mês atual;
- cálculo baseado exclusivamente em `estado = 'concluido'`;
- marcações canceladas excluídas da receita;
- marcações confirmadas excluídas até serem concluídas;
- cálculo respeitando o fuso horário da empresa.

## Validação

- Estrutura do Supabase validada.
- Dados financeiros validados.
- Build de produção: **OK**
- Teste no navegador: **OK**

---

# 2026-09-14 — 9K.3 CONCLUÍDO

## Visão anual financeira

Foi implementada a visão anual do módulo financeiro.

Funcionalidades:

- seleção do ano;
- navegação entre anos;
- apresentação de janeiro a dezembro;
- receita anual;
- quantidade anual de marcações concluídas;
- média mensal;
- identificação do melhor mês com receita;
- identificação do pior mês com receita;
- meses sem receita apresentados como €0,00;
- utilização da mesma regra financeira do histórico dos 12 meses.

A regra permanece:

`estado = 'concluido'`

é o único estado considerado para receita.

---

# 2026-09-20 — Calendário e permissões

## Adicionado

- Modal de detalhes das marcações.
- Clique nas marcações da vista diária e semanal.
- Navegação da vista semanal para a vista diária através dos cabeçalhos dos dias.
- Novo componente `MarcacaoCalendarioButton`.

## Alterado

- Ações de gestão de marcações passaram para o modal de detalhes.
- Modal otimizado para ocupar menos espaço no ecrã.
- Permissões `agenda` e `marcacoes` continuam separadas.
- Área de Clientes passou a validar a permissão `clientes`.
- A permissão `clientes` mantém acesso a consulta, criação, edição e eliminação.

## Validação

- `npm run build` concluído com sucesso.

---

# 2026-09-21/23 — Permissões e controlo de acesso

## Etapa 10 — Permissões e acessos

Foi implementado e auditado o modelo de acesso por empresa.

## Perfis

### Administrador da empresa

Acesso completo à respetiva empresa.

### Funcionário

Acesso apenas às permissões atribuídas.

### Utilizador desativado

Sem acesso ao Booking.

## Permissões disponíveis

- `agenda`
- `clientes`
- `marcacoes`
- `servicos`
- `profissionais`
- `disponibilidade`
- `bloqueios`
- `financeiro`
- `configuracoes`
- `equipa`

## Estrutura

Utilização de:

- `company_members`
- `company_member_permissions`

O estado do membro é controlado através de:

- `is_active`
- `role`
- `must_change_password`

Os funcionários não são eliminados quando deixam a empresa. São desativados.

---

# 2026-09-21/23 — Proteção das páginas Booking

As páginas do Booking foram revistas para validar:

- autenticação;
- existência do membro;
- empresa;
- estado ativo;
- `must_change_password`;
- role;
- permissão necessária.

O acesso direto através de URL também passou a ser protegido pelo proxy.

Funcionários sem a permissão correspondente são redirecionados para a área principal do Booking.

---

# 2026-09-21/23 — Auditoria das APIs Booking

Foi realizada uma revisão das APIs do Booking.

Foram revistas rotas relacionadas com:

- agendamentos;
- estados;
- cancelamentos;
- conclusões;
- clientes;
- serviços;
- profissionais;
- disponibilidade;
- bloqueios;
- configurações;
- onboarding.

As APIs foram verificadas para garantir:

- autenticação;
- membro válido;
- membro ativo;
- `must_change_password`;
- administrador ou permissão necessária;
- empresa correta;
- acesso ao recurso correto.

A lógica funcional existente foi preservada.

---

# 2026-09-21/23 — RLS e segurança Supabase

Foi realizada uma revisão das policies e do isolamento por empresa.

Foram verificadas as principais tabelas do Booking, incluindo:

- `agendamentos`
- `bloqueios`
- `clientes`
- `companies`
- `company_ai_settings`
- `company_documents`
- `company_knowledge`
- `company_member_permissions`
- `company_members`
- `company_subscriptions`
- `product_subscriptions`
- `products`
- `profissionais`
- `profissionais_servicos`
- `servicos`
- `configuracoes_agendamento`
- `disponibilidade`

## Funções de autorização

Foram utilizadas/revistas as funções:

- `private.is_company_admin(uuid)`
- `private.has_company_permission(uuid, text)`

As funções utilizam `SECURITY DEFINER` com `search_path` restrito.

Os privilégios de execução das funções sensíveis também foram revistos.

---

# 2026-09-23 — Correção do estado global do Booking

## Problema identificado

Um funcionário da Flor & Cura via o Booking como:

**Agendamentos suspensos**

enquanto o administrador da mesma empresa via:

**Agendamentos ativos**

A configuração real da empresa estava ativa.

## Causa

O estado global do Booking estava a ser obtido diretamente de:

`configuracoes_agendamento`

A leitura dessa tabela estava condicionada à permissão:

`configuracoes`

O funcionário não possuía essa permissão.

## Correção

Foi criada a função:

`public.get_booking_status(uuid)`

A função:

- verifica o membro autenticado;
- verifica a empresa;
- verifica se o membro está ativo;
- devolve apenas o estado `agendamento_ativo`.

A página principal do Booking passou a utilizar esta função para obter o estado global.

A leitura completa de `configuracoes_agendamento` continua reservada à área que necessita da permissão `configuracoes`.

## Resultado

Problema validado como **RESOLVIDO**.

O funcionário passou a visualizar corretamente o Booking como ativo.

---

# 2026-09-23 — Teste de permissões com funcionário

Foi realizado teste real utilizando o funcionário:

`geral.dpwash`

Permissões:

- `agenda`
- `clientes`

## Resultado

Acesso confirmado:

- Calendário;
- Clientes.

Acesso bloqueado:

- Financeiro;
- restantes áreas sem permissão.

Também foram realizados testes através de URLs diretas.

Resultado:

**Proteções a funcionar conforme esperado.**

---

# 2026-09-23 — Auditoria de segurança concluída

## Estado

**AUDITORIA FUNCIONAL E DE AUTORIZAÇÃO CONCLUÍDA**

Foram revistas:

- autenticação;
- autorização;
- proxy;
- páginas;
- APIs;
- RLS;
- policies;
- permissões;
- isolamento por empresa;
- funções `SECURITY DEFINER`;
- `GRANT EXECUTE`;
- primeiro acesso;
- funcionários ativos/inativos;
- acesso direto por URL.

## Pontos de hardening identificados

O Supabase Security Advisor ainda apresenta alguns avisos que ficam registados para revisão posterior:

1. `products` possui RLS ativo mas sem policies.
2. Leaked Password Protection está desativada.
3. O fluxo `onboarding/company` pode ser endurecido relativamente a membros inativos.
4. `complete_first_login()` pode ser endurecida para validar de forma mais rigorosa a alteração efetiva da password.
5. A função pública `criar_agendamento` possui execução anónima de forma intencional, necessária ao fluxo de Booking público, devendo continuar a ser revista como parte do hardening de produção.

Estes pontos ficam separados da auditoria funcional já concluída.

---

# 2026-09-23 — Próxima etapa

## Etapa 12 — Revisão geral e estabilização

Objetivos:

- revisão funcional completa;
- revisão da interface;
- testes dos principais fluxos;
- revisão de segurança adicional;
- hardening;
- performance;
- validação de produção;
- preparação do deploy.

---

# Estado atual

## Concluído

- [x] Financeiro base
- [x] Histórico financeiro dos 12 meses
- [x] Visão anual
- [x] Sistema de permissões
- [x] Proteção das páginas
- [x] Proteção das APIs
- [x] Auditoria RLS
- [x] Teste com funcionário
- [x] Correção do estado do Booking
- [x] Auditoria funcional de segurança

## Próximo

- [ ] Revisão geral
- [ ] Hardening final
- [ ] Testes finais
- [ ] Preparação para produção
- [ ] Deploy

---

# Regra de continuidade

Antes de iniciar uma nova etapa importante:

1. Implementar.
2. Testar.
3. Corrigir.
4. Confirmar funcionamento.
5. Atualizar `CURRENT-STATE.md`.
6. Atualizar `ROADMAP.md`.
7. Atualizar `CHANGELOG.md`.
8. Criar commit Git.
9. Fazer push apenas quando explicitamente decidido.