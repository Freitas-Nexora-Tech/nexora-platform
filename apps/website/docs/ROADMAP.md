Nexora Booking — Roadmap

Este documento acompanha a evolução funcional e técnica do Nexora Booking.

9 — Área Financeira

9K.1 — Financeiro base

Estado: CONCLUÍDO

Implementado:

cálculo da receita;

utilização de agendamentos.valor;

filtro por empresa;

utilização do fuso horário da empresa;

somente estado = 'concluido' gera receita.

9K.2 — Histórico financeiro dos 12 meses

Estado: CONCLUÍDO

Implementado:

últimos 12 meses;

meses sem movimentos;

receita mensal;

quantidade de concluídos;

total dos 12 meses;

mês atual identificado;

ordenação cronológica;

respeito pelo fuso horário da empresa;

somente concluídos entram na receita.

Validação:

Supabase validado;

build validado;

navegador validado.

9K.3 — Visão anual

Estado: CONCLUÍDO

Implementado:

seleção do ano;

navegação entre anos;

janeiro a dezembro;

receita anual;

número de marcações concluídas;

média mensal;

melhor mês com receita;

pior mês com receita;

meses sem receita apresentados como €0,00;

mesma regra financeira do histórico mensal.

10 — Permissões e acessos

Estado: CONCLUÍDO

Foi implementado o modelo de acesso por empresa.

Perfis

Administrador

Acesso completo à empresa.

Funcionário

Acesso apenas às permissões atribuídas.

Desativado

Sem acesso ao Booking.

Permissões

agenda

clientes

marcacoes

servicos

profissionais

disponibilidade

bloqueios

financeiro

configuracoes

equipa

Componentes de segurança

Implementados:

company_members;

company_member_permissions;

controlo de role;

controlo de is_active;

controlo de must_change_password;

proteção por proxy;

proteção nas páginas;

proteção nas APIs;

validação de empresa;

validação de permissões;

RLS no Supabase.

Primeiro acesso

Novos funcionários podem ser obrigados a alterar a password através de:

must_change_password

O sistema bloqueia o acesso às áreas normais do Booking enquanto essa alteração estiver pendente.

O fluxo foi transferido para uma API server-side e testado.

11 — Auditoria de segurança

Estado: CONCLUÍDO

Foi realizada uma auditoria abrangente do Nexora Booking.

Áreas auditadas

autenticação;

autorização;

proxy;

páginas;

APIs;

RLS;

policies;

funções de segurança;

permissões;

isolamento por empresa;

acesso direto por URL;

controlo de funcionários;

primeiro acesso;

estado ativo/inativo.

APIs auditadas

Foram revistas as APIs de:

agendamentos;

cancelamento;

conclusão;

alteração de estado;

clientes;

serviços;

profissionais;

disponibilidade;

bloqueios;

configurações;

onboarding;

login;

primeiro acesso.

As APIs foram revistas para garantir:

autenticação;

membro válido;

membro ativo;

must_change_password;

administrador ou permissão adequada;

empresa correta;

acesso ao recurso correto.

RLS auditado

Foram revistas as principais tabelas do Booking, incluindo:

agendamentos;

bloqueios;

clientes;

companies;

company_ai_settings;

company_documents;

company_knowledge;

company_member_permissions;

company_members;

company_subscriptions;

product_subscriptions;

products;

profissionais;

profissionais_servicos;

servicos;

configuracoes_agendamento;

disponibilidade.

Teste com funcionário

Foi realizado teste real com funcionário com permissões limitadas.

Resultado:

Calendário acessível com agenda;

Clientes acessível com clientes;

Financeiro bloqueado sem financeiro;

outras áreas bloqueadas sem a respetiva permissão;

acesso direto por URL protegido;

Booking apresentado como ativo quando a configuração da empresa está ativa.

Correção do estado do Booking

Foi identificado e corrigido um problema no qual:

administrador via o Booking como ativo;

funcionário via o Booking como suspenso.

A causa estava na forma como o estado do Booking era consultado.

A função:

public.get_booking_status(uuid)

foi retirada do fluxo de consulta autenticado e teve a sua execução restringida.

O dashboard passou a consultar configuracoes_agendamento.agendamento_ativo server-side através do cliente administrativo, depois de validar a empresa e o acesso do utilizador.

Problema validado como resolvido.

Hardening futuro

A auditoria funcional foi concluída.

Permanecem identificados alguns pontos de hardening:

products possui RLS ativo sem policies.

Leaked Password Protection ainda não está ativado/disponível na configuração atual.

O fluxo onboarding/company deve ser revisto relativamente a membros inativos.

O fluxo de criação de empresa poderá futuramente ser tornado transacional.

A atualização de permissões de profissionais poderá futuramente ser tornada transacional.

Estes pontos ficam registados para a revisão de estabilização e preparação para produção.

12 — Revisão geral e estabilização

Estado: EM ANDAMENTO

Objetivo:

Fazer a revisão final do Nexora Booking antes da preparação para produção.

12.1 — Revisão funcional

Já validado

Login;

primeiro acesso;

alteração de password;

dashboard;

calendário;

marcações públicas;

clientes;

profissionais;

estado do Booking;

Nexora AI integrado com Booking público;

consulta de serviços pela IA;

consulta de profissionais pela IA;

consulta de horários pela IA;

criação de proposta pela IA;

recolha e validação dos dados do cliente;

confirmação explícita da marcação;

criação da marcação real no Booking;

revalidação da disponibilidade no momento da confirmação;

proteção contra confirmação duplicada;

isolamento entre sessões públicas;

alteração de serviço, profissional, data ou hora antes da confirmação;

rejeição de dados obrigatórios incompletos;

validação do formato do email;

tratamento de propostas expiradas;

proteção contra conflitos de disponibilidade entre proposta e confirmação;

testes funcionais da IA pública.

A validar

logout;

recuperação de acesso;

serviços;

disponibilidade;

bloqueios;

configurações;

equipa;

financeiro;

onboarding.

12.2 — Revisão de permissões

Testar sistematicamente:

Administrador

Acesso a todas as áreas.

Funcionário

Acesso apenas às permissões atribuídas.

Funcionário sem permissão

Bloqueio através de:

interface;

URL direta;

API.

Funcionário desativado

Bloqueio total do Booking.

12.3 — Hardening de segurança

Rever:

products;

Leaked Password Protection;

onboarding/company;

funções SECURITY DEFINER;

GRANT EXECUTE;

RLS;

policies;

exposição de dados;

isolamento entre empresas.

12.4 — Revisão de interface

Verificar:

desktop;

tablet;

mobile;

navegação;

mensagens de erro;

estados vazios;

carregamentos;

modais;

formulários;

consistência visual.

12.5 — Revisão técnica

Verificar:

npm run build;

erros TypeScript;

warnings relevantes;

logs;

variáveis de ambiente;

dependências;

rotas;

APIs;

performance;

código duplicado.

12.6 — Preparação para produção

Antes do lançamento:

validar Supabase;

validar autenticação;

validar RLS;

validar domínio;

validar Netlify;

validar variáveis de ambiente;

executar testes finais;

criar backup;

criar commit;

fazer push;

validar deploy;

realizar teste final no ambiente publicado.

Checklist geral

Financeiro base

Histórico financeiro 12 meses

Visão anual

Permissões

Proteção de páginas

Proteção de APIs

RLS auditado

Teste com funcionário

Estado do Booking corrigido

Login Booking

Primeiro acesso

Marcações públicas

Reutilização de clientes

Confirmar/cancelar marcações

Calendário semanal

Calendário diário

Posicionamento dos cartões no calendário

Auditoria funcional de segurança

Nexora AI integrado com Booking público

Consulta de serviços pela IA

Consulta de profissionais pela IA

Consulta de horários pela IA

Criação de proposta pela IA

Confirmação explícita da marcação

Criação da marcação real no Booking

Revalidação de disponibilidade na confirmação

Proteção contra confirmação duplicada

Isolamento entre sessões públicas

Alteração de reserva antes da confirmação

Validação de dados obrigatórios

Validação de email

Testes funcionais da IA pública

Revisão geral

Hardening final

Testes finais

Preparação para produção

Deploy final validado

Etapa atual

Etapa 12 — Revisão geral e estabilização

Objetivo atual:

Revisar, testar e preparar o Nexora Booking para produção.