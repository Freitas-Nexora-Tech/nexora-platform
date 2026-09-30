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

O fluxo de primeiro acesso utiliza uma API server-side para concluir a alteração do estado `must_change_password`.

A função `complete_first_login()` deixou de ser utilizada diretamente pelo cliente autenticado e a execução da função foi restringida.

---

# Login do Booking

Foi implementado o login próprio do Nexora Booking através de username e password.

Fluxo atual:

1. utilizador introduz username e password;
2. `/api/booking/login` localiza o membro;
3. o membro é validado como ativo;
4. o email associado ao utilizador Auth é obtido no servidor;
5. o Supabase Auth valida a password;
6. a sessão é estabelecida no navegador;
7. utilizadores com `must_change_password = true` são encaminhados para a alteração de password;
8. restantes utilizadores entram no Booking.

O login foi testado e validado no navegador.

---

# Calendário

**Estado:** FUNCIONAL E VALIDADO

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
- confirmar marcação;
- cancelar marcação;
- respeito pela permissão `marcacoes`;
- marcações canceladas deixam de aparecer no calendário;
- horários apresentados de acordo com o fuso horário da empresa.

### Posicionamento das marcações

Foi corrigido o cálculo da posição vertical dos cartões na grelha.

Anteriormente a posição era calculada em percentagem relativamente à altura total do contentor.

O cálculo atual utiliza a altura real das linhas da grelha:

- vista semanal: 80px por hora;
- vista diária: 90px por hora.

Os cartões ficam alinhados diretamente com os horários apresentados na grelha.

A correção foi testada com marcações reais e validada visualmente.

---

# Clientes

A área de Clientes está protegida pela permissão:

`clientes`

Um funcionário com essa permissão pode utilizar as operações permitidas na área de Clientes.

---

# Marcações públicas

O fluxo de marcação pública do Nexora Booking foi implementado e validado.

### Fluxo público

O cliente consegue:

- consultar a empresa;
- consultar os serviços;
- selecionar profissional;
- consultar datas;
- consultar horários disponíveis;
- preencher os seus dados;
- confirmar a marcação;
- receber a confirmação da marcação.

As marcações públicas são criadas inicialmente com estado:

`pendente`

### Clientes existentes

Quando um cliente faz uma nova marcação utilizando um email já existente na mesma empresa, o sistema reutiliza o cliente existente em vez de criar um duplicado.

Este comportamento foi testado e validado.

### Capacidade dos horários

Quando a capacidade configurada para um horário é atingida, o horário deixa de ser apresentado como disponível publicamente.

Uma marcação cancelada liberta novamente o horário.

Este comportamento foi testado e validado.

---

# Estado do Booking

O estado do Booking é apresentado corretamente tanto para administradores como para funcionários.

O dashboard consulta atualmente a configuração `configuracoes_agendamento` server-side para determinar o estado de:

`agendamento_ativo`

A leitura é realizada através do cliente administrativo no servidor, depois de a empresa e o acesso do utilizador terem sido previamente validados.

Isto evita depender da função `get_booking_status()` no cliente autenticado.

Foi corrigido e validado o problema em que o Booking aparecia como:

**Agendamentos suspensos**

apesar de a configuração real estar ativa.

---

# Profissionais

Os profissionais podem existir sem acesso ao Booking.

Foi implementada a possibilidade de associar um acesso Booking a um profissional.

### Profissional sem acesso

O profissional existe normalmente e não possui uma conta Booking.

### Profissional com acesso

Pode possuir:

- username;
- conta Supabase Auth;
- estado ativo;
- `must_change_password`;
- permissões específicas.

O acesso do profissional é associado através de:

`company_members.profissional_id`

A criação e gestão do acesso Booking do profissional é controlada pelo administrador da empresa.

Foi criado e validado um acesso de profissional com permissões limitadas.

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
- onboarding;
- login;
- primeiro acesso/alteração de password.

As APIs mantêm validações de autenticação, membro ativo, permissões e empresa.

Operações privilegiadas que anteriormente dependiam diretamente de funções `SECURITY DEFINER` foram transferidas, quando apropriado, para APIs server-side.

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
- `public.is_nexora_admin()`

As funções privilegiadas utilizam `SECURITY DEFINER` quando necessário e estão configuradas com `search_path` restrito.

A execução pública das funções privilegiadas foi revista e os `GRANT EXECUTE` foram restringidos de acordo com a finalidade de cada função.

### Funções protegidas

A execução autenticada foi restringida para funções que deixaram de ser necessárias diretamente pelo cliente, incluindo:

- `complete_first_login()`
- `criar_empresa_booking(text, text)`
- `get_booking_status(uuid)`

A função:

`is_nexora_admin()`

mantém execução para utilizadores autenticados porque é utilizada pelas policies RLS para determinar acesso de administradores Nexora.

A função:

`criar_agendamento(...)`

mantém utilização pública para suportar o fluxo de marcação pública.

---

# Testes realizados

Foi testado um funcionário real do ambiente de desenvolvimento com permissões limitadas.

Resultado confirmado:

- acesso ao Calendário quando possui `agenda`;
- acesso a Clientes quando possui `clientes`;
- bloqueio do Financeiro sem `financeiro`;
- bloqueio das restantes áreas sem a respetiva permissão;
- bloqueio através de acesso direto por URL;
- login Booking por username e password;
- primeiro acesso com alteração obrigatória de password;
- estado do Booking apresentado corretamente;
- criação de marcações públicas;
- reutilização de cliente existente;
- confirmação de marcações;
- cancelamento de marcações;
- remoção de marcações canceladas do calendário;
- vista diária;
- vista semanal;
- posicionamento correto dos cartões de marcação;
- navegação entre dias e semanas;
- build de produção validado durante as alterações.

---

# Security Advisor

A revisão do Security Advisor identificou os seguintes pontos:

1. `products` possui RLS ativo sem policies.

2. `criar_agendamento(...)` é uma função `SECURITY DEFINER` executável por `anon`, necessária para o fluxo público de marcação.

3. `is_nexora_admin()` é uma função `SECURITY DEFINER` executável por `authenticated`, necessária para as policies RLS que utilizam a verificação de administrador Nexora.

4. O Leaked Password Protection do Supabase permanece como ponto de configuração dependente do plano/configuração do projeto.

O alerta de `products` não foi eliminado artificialmente através da criação de uma policy pública, uma vez que a tabela é tratada como catálogo interno.

As funções públicas foram analisadas individualmente de acordo com a sua finalidade, em vez de simplesmente eliminar todos os `SECURITY DEFINER`.

---

# Pontos de hardening ainda identificados

A auditoria funcional e de autorização foi concluída, mas existem alguns pontos de endurecimento que permanecem identificados para uma futura revisão de produção:

1. A tabela `products` possui RLS ativo mas atualmente não possui policies.

2. O Leaked Password Protection do Supabase ainda não está ativado/disponível na configuração atual.

3. Existe um pequeno ponto a rever no fluxo `onboarding/company` relativamente a membros inativos.

4. O fluxo de onboarding de empresa utiliza operações server-side separadas para criação da empresa e associação do administrador; poderá ser tornado transacional numa futura revisão.

5. A atualização de permissões de profissionais poderá futuramente ser tornada transacional para evitar estados intermédios em caso de falha.

Estes pontos não invalidam a conclusão da auditoria funcional de permissões, mas devem ser considerados antes da preparação final para produção.

---

# Estrutura atual de acesso

### Nexora Admin

Acesso administrativo à plataforma Nexora.

### Administrador da empresa

Acesso completo à respetiva empresa.

### Funcionário

Acesso exclusivamente às permissões atribuídas.

### Profissional com acesso Booking

Acesso às permissões Booking atribuídas ao seu `company_member`.

### Profissional sem acesso Booking

Sem conta de acesso ao Booking.

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

Profissional com acesso Booking testado:

`isabelle`

---

### Nexora Tech

Administrador:

`freitas2805`

---

# Próxima etapa

## Etapa 12 — Revisão geral e estabilização

**Estado:** EM ANDAMENTO

Objetivos:

- revisão geral do código;
- correção de bugs;
- validação dos fluxos;
- testes;
- revisão da interface;
- performance;
- hardening de segurança;
- preparação para produção;
- validação do deploy Netlify.

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
9. Fazer push quando a fase estiver validada.
10. Validar o deploy após o push.