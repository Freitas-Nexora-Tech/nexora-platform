# Nexora Booking — Current State

## Projeto

O Nexora Booking é a plataforma de gestão de reservas da Nexora Tech.

Tecnologias principais:

- Next.js
- TypeScript
- Supabase
- Git / GitHub
- Netlify

---

# Estado atual

## Financeiro

### 9K.1 — Financeiro base

**Estado:** CONCLUÍDO

Implementado:

- cálculo da receita;
- cálculo do caixa;
- filtro por empresa;
- utilização do fuso horário da empresa;
- apenas marcações `concluido` geram receita;
- marcações `cancelado` não entram;
- marcações `confirmado` não entram até serem concluídas;
- marcações `pendente` não entram.

---

## 9K.2 — Histórico financeiro dos 12 meses

**Estado:** CONCLUÍDO

Implementado e validado:

- histórico dos últimos 12 meses;
- meses sem movimentos apresentados como €0,00;
- receita mensal;
- quantidade de marcações concluídas;
- total dos últimos 12 meses;
- identificação do mês atual;
- apenas `concluido` entra na receita;
- cancelados excluídos;
- confirmados excluídos até serem concluídos;
- respeito pelo fuso horário da empresa;
- build de produção validado;
- teste visual concluído.

---

## 9K.3 — Visão anual

**Estado:** CONCLUÍDO

Implementado:

- visão financeira anual;
- total anual;
- visão mensal;
- indicadores anuais;
- gráficos financeiros;
- utilização da mesma base financeira do 9K.2;
- sem duplicação desnecessária da regra financeira;
- cálculo baseado exclusivamente em marcações `concluido`.

---

# Permissões e acessos

## Etapa 10 — Sistema de permissões

**Estado:** CONCLUÍDO

Foi implementado um sistema de permissões por empresa.

### Perfis

#### Administrador da empresa

Tem acesso completo às áreas da respetiva empresa.

#### Funcionário

Tem acesso apenas às permissões atribuídas.

#### Utilizador desativado

Não pode aceder ao Booking.

---

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

---

## Segurança das permissões

As permissões são verificadas em várias camadas:

### Interface

A aplicação apresenta apenas as áreas permitidas ao utilizador.

### Proxy

O acesso direto através de URL é validado antes de permitir a entrada na área.

### Páginas

As páginas Booking possuem verificações próprias de:

- autenticação;
- membro da empresa;
- utilizador ativo;
- alteração obrigatória de password;
- administrador ou permissão necessária.

### APIs

As APIs Booking foram revistas para validar:

- autenticação;
- existência do membro;
- estado ativo;
- `must_change_password`;
- administrador ou permissão necessária;
- empresa correta;
- acesso ao recurso solicitado.

### Supabase

As tabelas relevantes possuem RLS e políticas para manter o isolamento entre empresas.

---

# Equipa

Foi implementado o sistema de membros da empresa através de:

`company_members`

Informação relevante:

- utilizador;
- empresa;
- role;
- username;
- estado ativo;
- alteração obrigatória de password.

Os funcionários não são eliminados quando deixam a empresa.

São desativados através de:

`is_active = false`

---

# Passwords

As passwords são geridas pelo Supabase Auth.

Não são armazenadas em texto simples na aplicação.

Novos funcionários podem ser obrigados a alterar a password no primeiro acesso através de:

`must_change_password`

---

# Calendário

Foram implementadas melhorias na navegação e gestão das marcações.

### Funcionalidades

- vista diária;
- vista semanal;
- navegação entre dias;
- navegação entre semanas;
- clique no cabeçalho de um dia semanal para abrir a vista diária;
- clique numa marcação para abrir detalhes;
- modal compacto de detalhes;
- ações de gestão dentro do modal;
- respeito pela permissão `marcacoes`.

---

# Clientes

A área de Clientes está protegida pela permissão:

`clientes`

Um funcionário com essa permissão pode utilizar as operações permitidas na área de Clientes.

---

# Estado do Booking

O estado global do Booking é apresentado corretamente tanto para administradores como para funcionários.

Foi criada a função segura:

`public.get_booking_status(uuid)`

Esta função permite consultar o estado `agendamento_ativo` sem obrigar o funcionário a possuir a permissão `configuracoes`.

Isto corrige o problema em que um funcionário via:

**Agendamentos suspensos**

enquanto o administrador via:

**Agendamentos ativos**

apesar de a configuração real estar ativa.

A correção foi validada no navegador.

---

# Auditoria de segurança

## Etapa 11 — Auditoria

**Estado:** CONCLUÍDA

Foi realizada uma revisão abrangente do Booking.

### Áreas revistas

- autenticação;
- autorização;
- proxy;
- páginas;
- APIs;
- Supabase;
- RLS;
- policies;
- permissões;
- acesso direto por URL;
- isolamento por empresa;
- ações disponíveis por perfil;
- funções `SECURITY DEFINER`;
- permissões `GRANT EXECUTE`;
- variáveis de ambiente;
- exposição de segredos;
- possíveis bypasses de autorização.

---

# APIs Booking auditadas

Foram revistas as rotas de:

- agendamentos;
- estados das marcações;
- cancelamento;
- conclusão;
- clientes;
- serviços;
- profissionais;
- disponibilidade;
- bloqueios;
- configurações;
- onboarding.

As APIs mantêm validações de autenticação, membro ativo, permissões e empresa.

---

# RLS

Foi realizada revisão das principais tabelas do Booking.

Entre as tabelas revistas:

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

O isolamento por empresa é baseado no utilizador autenticado e nas relações existentes em `company_members`.

---

# Funções de segurança

As funções principais utilizadas para autorização incluem:

- `private.is_company_admin(uuid)`
- `private.has_company_permission(uuid, text)`

Estas funções utilizam `SECURITY DEFINER` e estão configuradas com `search_path` restrito.

A execução pública das funções privilegiadas foi revista e os `GRANT EXECUTE` foram restringidos de acordo com a finalidade de cada função.

---

# Testes realizados

Foi testado um funcionário real do ambiente de desenvolvimento com permissões limitadas.

Resultado confirmado:

- acesso ao Calendário quando possui `agenda`;
- acesso a Clientes quando possui `clientes`;
- bloqueio do Financeiro sem `financeiro`;
- bloqueio das restantes áreas sem a respetiva permissão;
- bloqueio através de acesso direto por URL;
- estado do Booking apresentado corretamente;
- build de produção validado durante as alterações.

---

# Pontos de hardening ainda identificados

A auditoria funcional e de autorização foi concluída, mas existem alguns pontos de endurecimento que permanecem identificados para uma futura revisão de produção:

1. A tabela `products` possui RLS ativo mas atualmente não possui policies.
2. O Leaked Password Protection do Supabase ainda não está ativado.
3. Existe um pequeno ponto a rever no fluxo `onboarding/company` relativamente a membros inativos.
4. A função `complete_first_login()` poderá ser endurecida para garantir de forma mais rigorosa que a password foi efetivamente alterada antes de concluir o primeiro acesso.

Estes pontos não invalidam a conclusão da auditoria funcional de permissões, mas devem ser considerados antes da preparação final para produção.

---

# Estrutura atual de acesso

### Nexora Admin

Acesso administrativo à plataforma Nexora.

### Administrador da empresa

Acesso completo à respetiva empresa.

### Funcionário

Acesso exclusivamente às permissões atribuídas.

### Desativado

Sem acesso ao Booking.

---

# Empresas atualmente utilizadas

### Flor & Cura

Administrador:

`dyzenf`

Funcionário:

`geral.dpwash`

Permissões atuais do funcionário:

- `agenda`
- `clientes`

### Nexora Tech

Administrador:

`freitas2805`

---

# Próxima etapa

## Etapa 12 — Revisão geral e estabilização

Objetivos:

- revisão geral do código;
- correção de bugs;
- validação dos fluxos;
- testes;
- revisão da interface;
- performance;
- hardening de segurança;
- preparação para produção.

---

# Regra de continuidade

Antes de iniciar uma nova etapa:

1. Implementar.
2. Testar.
3. Corrigir.
4. Confirmar funcionamento.
5. Atualizar `CURRENT-STATE.md`.
6. Atualizar `ROADMAP.md`.
7. Atualizar `CHANGELOG.md`.
8. Criar commit Git.
9. Fazer push apenas quando explicitamente decidido.