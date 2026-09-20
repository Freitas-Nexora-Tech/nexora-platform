# Nexora Booking — Changelog

Este ficheiro regista as principais alterações e marcos do desenvolvimento.

---

## 2026-09-14 — Estrutura de continuidade

### Documentação criada

Criada a estrutura de documentação permanente do projeto:

* `docs/CURRENT-STATE.md`
* `docs/ROADMAP.md`
* `docs/CHANGELOG.md`

### Objetivo

Garantir continuidade do desenvolvimento mesmo quando uma conversa atingir o limite de contexto ou for necessário iniciar uma nova conversa.

---

## 2026-09-14 — Financeiro

### Estado confirmado

Validada a estrutura da tabela `agendamentos` no Supabase.

Campos financeiros relevantes:

* `empresa_id`
* `inicio`
* `estado`
* `valor`

### Regra financeira confirmada

Somente marcações com:

`estado = concluido`

entram no cálculo da receita.

Não entram:

* `cancelado`
* `confirmado`
* `pendente`

### Dados atualmente encontrados

* 3 concluídos — €100,00
* 4 confirmados — €140,00
* 2 cancelados — €80,00

---

## 2026-09-14 — 9K.2

### Histórico financeiro dos 12 meses

**Estado:** EM DESENVOLVIMENTO

Objetivo:

Criar uma visão mensal dos últimos 12 meses, incluindo meses sem movimentos.

Requisitos definidos:

* 12 meses;
* receita mensal;
* número de concluídos;
* meses sem receita = €0,00;
* ordenação cronológica;
* respeito pelo fuso horário da empresa;
* somente `concluido` gera receita.

---

# Próximos marcos

1. Finalizar 9K.2 — Histórico financeiro dos 12 meses.
2. Testar 9K.2.
3. Atualizar `CURRENT-STATE.md`.
4. Atualizar este changelog.
5. Criar commit Git.
6. Implementar 9K.3 — Visão anual.
7. Implementar 10 — Permissões e acessos.
8. Implementar 11 — Auditoria de segurança.
9. Fazer revisão geral e preparação para produção.

## 2026-09-14 — 9K.2 CONCLUÍDO

### Histórico financeiro dos 12 meses

O histórico financeiro mensal foi implementado e validado.

Funcionalidades:

* apresentação dos últimos 12 meses;
* meses sem movimentos apresentados como €0,00;
* receita mensal;
* quantidade de marcações concluídas por mês;
* total dos últimos 12 meses;
* identificação do mês atual;
* cálculo baseado exclusivamente em `estado = 'concluido'`;
* marcações canceladas excluídas da receita;
* marcações confirmadas excluídas até serem concluídas;
* cálculo respeitando o fuso horário da empresa.

### Validação

* Estrutura do Supabase validada.
* Dados financeiros validados.
* Build de produção: **OK**
* Teste no navegador: **OK**

## 2026-09-20 — Calendário e permissões

### Adicionado
- Modal de detalhes das marcações.
- Clique nas marcações da vista diária e semanal.
- Navegação da vista semanal para a vista diária através dos cabeçalhos dos dias.
- Novo componente `MarcacaoCalendarioButton`.

### Alterado
- Ações de gestão de marcações passaram para o modal de detalhes.
- Modal otimizado para ocupar menos espaço no ecrã.
- Permissões `agenda` e `marcacoes` continuam separadas.
- Área de Clientes passou a validar a permissão `clientes`.
- A permissão `clientes` mantém acesso a consulta, criação, edição e eliminação.

### Validação
- `npm run build` concluído com sucesso.

### Próxima etapa

