# Nexora Booking — Estado Atual

## Projeto

**Nome:** Nexora Booking
**Plataforma:** Nexora Tech
**Stack principal:** Next.js + TypeScript + Supabase

## Estado atual

**Etapa atual:** 9K.3 — Visão anual

**Data da última atualização:** 14/09/2026

---

## 9 — Área Financeira

### 9K.1 — Financeiro base

Estado: **CONCLUÍDO**

Funcionalidades existentes:

* Área financeira do Booking.
* Leitura dos dados da tabela `agendamentos`.
* Identificação da empresa através de `empresa_id`.
* Utilização do fuso horário da empresa.
* Cálculo de valores financeiros.
* Separação dos estados das marcações.
* Apenas marcações com estado `concluido` entram na receita/caixa.
* Marcações `cancelado` não entram na receita.
* Marcações `confirmado` ainda não entram na receita.
* Valores financeiros utilizam o campo `valor`.

### 9K.2 — Histórico financeiro dos 12 meses

Estado: **CONCLUÍDO**

Implementado e testado:

- Histórico dos últimos 12 meses.
- Meses sem movimentos apresentados como €0,00.
- Receita mensal.
- Quantidade de marcações concluídas.
- Total dos últimos 12 meses.
- Mês atual identificado.
- Apenas marcações `concluido` entram na receita.
- Cancelados excluídos.
- Confirmados excluídos até serem concluídos.
- Cálculo respeitando o fuso horário da empresa.
- Build de produção validado com sucesso.
- Teste visual no navegador concluído com sucesso.

Objetivo:

Criar uma visão mensal dos últimos 12 meses, incluindo meses sem movimentos.

Cada mês deverá apresentar:

* mês e ano;
* número de marcações concluídas;
* receita total;
* €0,00 quando não existirem movimentos.

Regras:

* Somente `estado = 'concluido'` gera receita.
* Cancelamentos não geram receita.
* Marcações confirmadas não geram receita até serem concluídas.
* O cálculo deve respeitar o fuso horário da empresa.
* Os 12 meses devem aparecer mesmo quando a receita for zero.
* A ordenação deve ser cronológica.

### 9K.3 — Visão anual

Estado: **EM DESENVOLVIMENTO**

Será construída sobre a base de dados e lógica criada no 9K.2.

Objetivo:

* visão financeira anual;
* total anual;
* comparação mensal;
* utilização dos mesmos dados do histórico de 12 meses;
* evitar duplicação da lógica financeira.

---

## Base de dados

Projeto Supabase ativo.

Tabela principal utilizada no financeiro:

`public.agendamentos`

Campos relevantes confirmados:

* `id` — uuid
* `empresa_id` — uuid
* `cliente_id` — uuid
* `servico_id` — uuid
* `profissional_id` — uuid
* `inicio` — timestamp with time zone
* `fim` — timestamp with time zone
* `estado` — text
* `notas` — text
* `created_at` — timestamp with time zone
* `updated_at` — timestamp with time zone
* `valor` — numeric

Estados atualmente observados:

* `pendente`
* `confirmado`
* `concluido`
* `cancelado`

Dados financeiros atualmente existentes no ambiente:

* concluído: 3 marcações / €100,00
* confirmado: 4 marcações / €140,00
* cancelado: 2 marcações / €80,00

Regra financeira confirmada:

**Somente concluídos entram na receita.**

---

## Ficheiro financeiro principal

`app/nexora-ai/booking/financeiro/page.tsx`

Este ficheiro já contém a lógica financeira base e será utilizado como ponto de partida para o 9K.2.

---

## Próximas etapas

### 9K.2

Histórico financeiro dos 12 meses.

### 9K.3

Visão anual.

### 10

Permissões e acessos.

As permissões deverão ser implementadas em três níveis:

1. Interface.
2. Servidor/API.
3. Supabase/RLS.

Objetivo:

* cartões/áreas administrativas exclusivos do administrador/proprietário;
* funcionários apenas com acesso ao necessário para o trabalho;
* impedir acesso apenas por URL ou chamadas diretas à API.

### 11

Auditoria geral de segurança do Nexora Booking.

Verificar:

* páginas;
* rotas;
* APIs;
* autenticação;
* autorização;
* Supabase;
* RLS;
* acessos diretos;
* dados expostos;
* ações disponíveis para cada perfil.

---

## Regra de continuidade

Ao terminar cada etapa importante:

1. Atualizar este ficheiro.
2. Atualizar `ROADMAP.md`.
3. Registar a alteração em `CHANGELOG.md`.
4. Criar um commit Git quando a etapa estiver estável.

Nunca considerar uma etapa concluída sem atualizar o estado do projeto.

### Calendário e permissões — melhoria concluída

- Vista diária e semanal implementadas.
- Cabeçalhos dos dias na vista semanal são clicáveis e abrem a vista diária correspondente.
- Marcações na vista semanal e diária são clicáveis.
- Criado `DetalhesMarcacaoModal.tsx` para consulta dos detalhes da marcação.
- Criado `MarcacaoCalendarioButton.tsx` para gerir a abertura do modal.
- Modal apresenta:
  - cliente
  - serviço
  - profissional
  - horário
  - estado
  - notas
- Ações de gestão passaram para o modal.
- Ações de gestão continuam condicionadas à permissão `marcacoes`.
- Funcionários com apenas `agenda` conseguem consultar marcações, mas não geri-las.
- Área de Clientes alinhada com a permissão `clientes`.
- Quem possui `clientes` pode consultar, criar, editar e eliminar clientes.
- Quem não possui `clientes` é redirecionado para o Booking.
- Testes realizados com build concluído com sucesso.
