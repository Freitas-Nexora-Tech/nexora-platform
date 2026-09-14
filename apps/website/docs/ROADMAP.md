# Nexora Booking — Roadmap

## Objetivo

Construir uma plataforma de gestão de reservas profissional da Nexora Tech, com gestão operacional, financeira, utilizadores, permissões e segurança.

---

# Estado das etapas

## 1 — Estrutura base

**Estado:** CONCLUÍDO

* Estrutura inicial do Booking.
* Integração com Next.js.
* Integração com Supabase.
* Base da aplicação.

---

## 2 — Empresas

**Estado:** CONCLUÍDO

* Estrutura de empresas.
* Associação dos dados à empresa.
* Identificação da empresa do utilizador.

---

## 3 — Clientes

**Estado:** CONCLUÍDO

* Gestão de clientes.
* Associação dos clientes às marcações.

---

## 4 — Serviços

**Estado:** CONCLUÍDO

* Gestão de serviços.
* Valores dos serviços.
* Associação dos serviços às marcações.

---

## 5 — Profissionais

**Estado:** CONCLUÍDO

* Gestão de profissionais.
* Associação dos profissionais às marcações.

---

## 6 — Agendamentos

**Estado:** CONCLUÍDO

* Criação de marcações.
* Data e hora.
* Cliente.
* Serviço.
* Profissional.
* Estado da marcação.
* Valor.
* Notas.

Estados suportados:

* pendente
* confirmado
* concluido
* cancelado

---

## 7 — Gestão operacional

**Estado:** CONCLUÍDO / EM REVISÃO**

* Gestão das marcações.
* Visualização dos estados.
* Operações relacionadas com o Booking.

---

## 8 — Dashboard

**Estado:** CONCLUÍDO / EM REVISÃO**

* Indicadores principais.
* Dados operacionais.
* Integração com os dados do Booking.

---

# 9 — Financeiro

## 9K.1 — Financeiro base

**Estado:** CONCLUÍDO

* Cálculo da receita.
* Cálculo do caixa.
* Filtro por empresa.
* Utilização do fuso horário da empresa.
* Apenas `concluido` gera receita.
* Cancelados não entram.
* Confirmados não entram até serem concluídos.

---

## 9K.2 — Histórico financeiro dos 12 meses

## 9K.2 — Histórico financeiro dos 12 meses
**Estado:** CONCLUÍDO

Implementado e testado:

- Histórico dos últimos 12 meses.
- Meses sem movimentos apresentados como €0,00.
- Receita mensal.
- Quantidade de marcações concluídas.
- Total dos últimos 12 meses.
- Mês atual identificado.
- Apenas `concluido` entra na receita.
- Cancelados excluídos.
- Confirmados excluídos até serem concluídos.
- Respeito pelo fuso horário da empresa.
- Build de produção validado.
- Teste visual concluído.

---

Objetivo:

Criar histórico financeiro mensal dos últimos 12 meses.

Requisitos:

* apresentar 12 meses;
* incluir meses sem movimentos;
* receita mensal;
* número de marcações concluídas;
* €0,00 quando não existir receita;
* ordenação cronológica;
* respeitar o fuso horário da empresa;
* utilizar apenas marcações `concluido`.

---

## 9K.3 — Visão anual

## 9K.3 — Visão anual
**Estado:** EM DESENVOLVIMENTO ← ATUAL

Objetivo:

* total anual;
* visão mensal;
* indicadores anuais;
* gráficos financeiros;
* utilizar a mesma fonte de dados do 9K.2;
* evitar duplicação da lógica.

---

# 10 — Permissões e acessos

**Estado:** PENDENTE

Objetivo:

Criar um sistema profissional de permissões.

A segurança deverá existir em:

### Interface

Mostrar apenas o que cada perfil deve utilizar.

### Servidor/API

Impedir chamadas não autorizadas mesmo que o utilizador tente aceder diretamente à API.

### Supabase

Aplicar RLS e políticas adequadas para impedir acesso indevido aos dados.

Objetivos:

* administrador/proprietário com acesso completo;
* funcionários com acesso apenas ao necessário;
* cartões administrativos exclusivos;
* impedir acesso direto através de URL;
* impedir manipulação através de chamadas à API.

---

# 11 — Auditoria de segurança

**Estado:** PENDENTE

Revisão completa do Booking.

Verificar:

* autenticação;
* autorização;
* páginas;
* rotas;
* APIs;
* Supabase;
* RLS;
* políticas;
* acesso direto por URL;
* exposição de dados;
* permissões dos utilizadores;
* ações disponíveis por perfil;
* variáveis de ambiente;
* chaves e segredos;
* possíveis bypasses de segurança.

---

# 12 — Revisão geral e estabilização

**Estado:** PENDENTE

Depois das funcionalidades principais:

* revisão do código;
* correção de bugs;
* validação dos fluxos;
* testes;
* revisão da interface;
* performance;
* segurança;
* preparação para produção.

---

# Regra de trabalho

Cada etapa deve seguir:

1. Implementar.
2. Testar.
3. Corrigir.
4. Confirmar funcionamento.
5. Atualizar `CURRENT-STATE.md`.
6. Atualizar `CHANGELOG.md`.
7. Criar commit Git.

Uma etapa só é considerada **CONCLUÍDA** depois destes passos.

---

# Etapa atual

# Etapa atual

**9K.3 — Visão anual**

Próximo objetivo imediato:

Implementar e testar a visão financeira anual utilizando a base criada no 9K.2.
