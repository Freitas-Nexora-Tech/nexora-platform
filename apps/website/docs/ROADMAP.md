# Nexora Booking — Roadmap

Este documento acompanha a evolução funcional e técnica do Nexora Booking.

---

# 9 — Área Financeira

## 9K.1 — Financeiro base

**Estado: CONCLUÍDO**

Implementado:

- cálculo da receita;
- utilização de `agendamentos.valor`;
- filtro por empresa;
- utilização do fuso horário da empresa;
- somente `estado = 'concluido'` gera receita.

---

## 9K.2 — Histórico financeiro dos 12 meses

**Estado: CONCLUÍDO**

Implementado:

- últimos 12 meses;
- meses sem movimentos;
- receita mensal;
- quantidade de concluídos;
- total dos 12 meses;
- mês atual identificado;
- ordenação cronológica;
- respeito pelo fuso horário da empresa;
- somente concluídos entram na receita.

Validação:

- Supabase validado;
- build validado;
- navegador validado.

---

## 9K.3 — Visão anual

**Estado: CONCLUÍDO**

Implementado:

- seleção do ano;
- navegação entre anos;
- janeiro a dezembro;
- receita anual;
- número de marcações concluídas;
- média mensal;
- melhor mês com receita;
- pior mês com receita;
- meses sem receita apresentados como €0,00;
- mesma regra financeira do histórico mensal.

---

# 10 — Permissões e acessos

**Estado: CONCLUÍDO**

Foi implementado o modelo de acesso por empresa.

## Perfis

### Administrador

Acesso completo à empresa.

### Funcionário

Acesso apenas às permissões atribuídas.

### Desativado

Sem acesso ao Booking.

---

## Permissões

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

---

## Componentes de segurança

Implementados:

- `company_members`;
- `company_member_permissions`;
- controlo de `role`;
- controlo de `is_active`;
- controlo de `must_change_password`;
- proteção por proxy;
- proteção nas páginas;
- proteção nas APIs;
- validação de empresa;
- validação de permissões;
- RLS no Supabase.

---

## Primeiro acesso

Novos funcionários podem ser obrigados a alterar a password através de:

`must_change_password`

O sistema bloqueia o acesso às áreas normais do Booking enquanto essa alteração estiver pendente.

---

# 11 — Auditoria de segurança

**Estado: CONCLUÍDO**

Foi realizada uma auditoria abrangente do Nexora Booking.

## Áreas auditadas

- autenticação;
- autorização;
- proxy;
- páginas;
- APIs;
- RLS;
- policies;
- funções de segurança;
- permissões;
- isolamento por empresa;
- acesso direto por URL;
- controlo de funcionários;
- primeiro acesso;
- estado ativo/inativo.

---

## APIs auditadas

Foram revistas as APIs de:

- agendamentos;
- cancelamento;
- conclusão;
- alteração de estado;
- clientes;
- serviços;
- profissionais;
- disponibilidade;
- bloqueios;
- configurações;
- onboarding.

As APIs foram revistas para garantir:

- autenticação;
- membro válido;
- membro ativo;
- `must_change_password`;
- administrador ou permissão adequada;
- empresa correta;
- acesso ao recurso correto.

---

## RLS auditado

Foram revistas as principais tabelas do Booking, incluindo:

- `agendamentos`;
- `bloqueios`;
- `clientes`;
- `companies`;
- `company_ai_settings`;
- `company_documents`;
- `company_knowledge`;
- `company_member_permissions`;
- `company_members`;
- `company_subscriptions`;
- `product_subscriptions`;
- `products`;
- `profissionais`;
- `profissionais_servicos`;
- `servicos`;
- `configuracoes_agendamento`;
- `disponibilidade`.

---

## Teste com funcionário

Foi realizado teste real com funcionário com permissões limitadas.

Resultado:

- Calendário acessível com `agenda`;
- Clientes acessível com `clientes`;
- Financeiro bloqueado sem `financeiro`;
- outras áreas bloqueadas sem a respetiva permissão;
- acesso direto por URL protegido;
- Booking apresentado como ativo quando a configuração da empresa está ativa.

---

## Correção do estado do Booking

Foi identificado e corrigido um problema no qual:

- administrador via o Booking como ativo;
- funcionário via o Booking como suspenso.

A causa estava na leitura de `configuracoes_agendamento`, que estava protegida pela permissão `configuracoes`.

Foi criada a função:

`public.get_booking_status(uuid)`

A função permite consultar de forma segura apenas o estado global do Booking para membros ativos da respetiva empresa.

Problema validado como resolvido.

---

## Hardening futuro

A auditoria funcional foi concluída.

Permanecem identificados alguns pontos de hardening:

1. `products` possui RLS ativo sem policies.
2. Leaked Password Protection ainda não está ativado.
3. O fluxo `onboarding/company` deve ser revisto relativamente a membros inativos.
4. `complete_first_login()` pode ser endurecida para validar mais rigorosamente a alteração efetiva da password.

Estes pontos ficam registados para a revisão de estabilização e preparação para produção.

---

# 12 — Revisão geral e estabilização

**Estado: PRÓXIMA ETAPA**

Objetivo:

Fazer a revisão final do Nexora Booking antes da preparação para produção.

---

## 12.1 — Revisão funcional

Verificar:

- Login;
- primeiro acesso;
- alteração de password;
- logout;
- recuperação de acesso;
- dashboard;
- calendário;
- marcações;
- clientes;
- serviços;
- profissionais;
- disponibilidade;
- bloqueios;
- configurações;
- equipa;
- financeiro;
- onboarding.

---

## 12.2 — Revisão de permissões

Testar sistematicamente:

### Administrador

Acesso a todas as áreas.

### Funcionário

Acesso apenas às permissões atribuídas.

### Funcionário sem permissão

Bloqueio através de:

- interface;
- URL direta;
- API.

### Funcionário desativado

Bloqueio total do Booking.

---

## 12.3 — Hardening de segurança

Rever:

- `products`;
- Leaked Password Protection;
- `onboarding/company`;
- `complete_first_login()`;
- funções `SECURITY DEFINER`;
- `GRANT EXECUTE`;
- RLS;
- policies;
- exposição de dados;
- isolamento entre empresas.

---

## 12.4 — Revisão de interface

Verificar:

- desktop;
- tablet;
- mobile;
- navegação;
- mensagens de erro;
- estados vazios;
- carregamentos;
- modais;
- formulários;
- consistência visual.

---

## 12.5 — Revisão técnica

Verificar:

- `npm run build`;
- erros TypeScript;
- warnings relevantes;
- logs;
- variáveis de ambiente;
- dependências;
- rotas;
- APIs;
- performance;
- código duplicado.

---

## 12.6 — Preparação para produção

Antes do lançamento:

- validar Supabase;
- validar autenticação;
- validar RLS;
- validar domínio;
- validar Netlify;
- validar variáveis de ambiente;
- executar testes finais;
- criar backup;
- criar commit final;
- preparar deploy.

---

# Checklist geral

- [x] Financeiro base
- [x] Histórico financeiro 12 meses
- [x] Visão anual
- [x] Permissões
- [x] Proteção de páginas
- [x] Proteção de APIs
- [x] RLS auditado
- [x] Teste com funcionário
- [x] Estado do Booking corrigido
- [x] Auditoria funcional de segurança
- [ ] Revisão geral
- [ ] Hardening final
- [ ] Testes finais
- [ ] Preparação para produção

---

# Etapa atual

**Etapa 12 — Revisão geral e estabilização**

Próximo objetivo:

**Revisar, testar e preparar o Nexora Booking para produção.**