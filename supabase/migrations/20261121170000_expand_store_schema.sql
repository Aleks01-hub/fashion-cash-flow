-- Fashion Cash Flow: expansão aditiva do esquema Supabase
-- Esta migration NÃO remove nem limpa dados. Pode ser executada mais de uma vez.

-- Campos usados pelo frontend atual e não presentes no esquema inicial.
alter table public.produtos
  add column if not exists categoria text,
  add column if not exists estoque_minimo integer not null default 0,
  add column if not exists tags jsonb not null default '[]'::jsonb,
  add column if not exists detalhes jsonb not null default '{}'::jsonb,
  add column if not exists ativo boolean not null default true;

alter table public.variacoes
  add column if not exists reservado integer not null default 0,
  add column if not exists em_bolsa integer not null default 0;

alter table public.clientes
  add column if not exists cpf text,
  add column if not exists observacoes text,
  add column if not exists av_total numeric(10,2) not null default 0,
  add column if not exists av_saldo numeric(10,2) not null default 0,
  add column if not exists av_vencimento date,
  add column if not exists av_plano jsonb not null default '{}'::jsonb,
  add column if not exists pagamentos jsonb not null default '[]'::jsonb,
  add column if not exists compras_historico jsonb not null default '[]'::jsonb;

alter table public.vendas
  add column if not exists numero bigint,
  add column if not exists loja text,
  add column if not exists subtotal numeric(10,2) not null default 0,
  add column if not exists valor_pago numeric(10,2) not null default 0,
  add column if not exists troco numeric(10,2) not null default 0,
  add column if not exists vencimento date,
  add column if not exists observacoes text,
  add column if not exists status_pagamento text not null default 'pago',
  add column if not exists cashback_gerado numeric(10,2) not null default 0;

alter table public.venda_itens
  add column if not exists produto_id uuid references public.produtos(id) on delete set null,
  add column if not exists nome_produto text,
  add column if not exists cor text,
  add column if not exists tamanho text,
  add column if not exists desconto numeric(10,2) not null default 0,
  add column if not exists total numeric(10,2) not null default 0;

-- Fornecedores e compras (incluindo itens/custos por variação).
create table if not exists public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  contato text,
  email text,
  endereco text,
  observacoes text,
  created_at timestamptz not null default now()
);

create table if not exists public.compras (
  id uuid primary key default gen_random_uuid(),
  fornecedor_id uuid references public.fornecedores(id) on delete set null,
  fornecedor_nome text not null,
  data_compra timestamptz not null default now(),
  total numeric(12,2) not null default 0,
  status text not null default 'recebida' check (status in ('recebida','pendente','cancelada')),
  observacoes text,
  created_at timestamptz not null default now()
);

create table if not exists public.compra_itens (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references public.compras(id) on delete cascade,
  produto_id uuid references public.produtos(id) on delete set null,
  variacao_id uuid references public.variacoes(id) on delete set null,
  nome_produto text not null,
  cor text,
  tamanho text,
  quantidade integer not null check (quantidade > 0),
  custo_unitario numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0
);

-- Movimentações de estoque, inclusive ajustes, trocas, compras e devoluções.
create table if not exists public.estoque_movimentos (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid references public.produtos(id) on delete set null,
  variacao_id uuid references public.variacoes(id) on delete set null,
  tipo text not null check (tipo in ('venda','entrada','troca','ajuste','compra','devolucao')),
  quantidade integer not null,
  observacao text,
  venda_id uuid references public.vendas(id) on delete set null,
  compra_id uuid references public.compras(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Trocas/devoluções preservam o snapshot dos itens da operação original.
create table if not exists public.trocas_devolucoes (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid not null references public.vendas(id) on delete restrict,
  cliente_id uuid references public.clientes(id) on delete set null,
  item_devolvido jsonb not null,
  item_substituto jsonb,
  quantidade_devolvida integer not null default 1,
  diferenca numeric(12,2) not null default 0,
  observacoes text,
  created_at timestamptz not null default now()
);

-- Caixa: sessões de abertura/fechamento e movimentos auditáveis.
create table if not exists public.caixa_sessoes (
  id uuid primary key default gen_random_uuid(),
  operador_id uuid references auth.users(id) on delete set null,
  operador_nome text,
  loja text,
  aberto_em timestamptz not null default now(),
  valor_abertura numeric(12,2) not null default 0,
  fechado_em timestamptz,
  valor_contado numeric(12,2),
  diferenca numeric(12,2),
  status text not null default 'aberto' check (status in ('aberto','fechado')),
  observacoes text
);

alter table public.caixa_movimentos
  add column if not exists sessao_id uuid references public.caixa_sessoes(id) on delete set null,
  add column if not exists forma_pagamento text,
  add column if not exists operador_id uuid references auth.users(id) on delete set null,
  add column if not exists loja text,
  add column if not exists categoria text;

-- Agenda comercial: reservas, sacolas e eventos de calendário.
create table if not exists public.agenda_reservas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id) on delete set null,
  cliente_nome text not null,
  tipo text not null check (tipo in ('reserva','bag')),
  itens jsonb not null default '[]'::jsonb,
  valor numeric(12,2) not null default 0,
  ate timestamptz,
  status text not null default 'ativa',
  created_at timestamptz not null default now()
);

create table if not exists public.agenda_eventos (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  titulo text not null,
  tipo text not null check (tipo in ('Aniversário','Feriado','Promoção','Importante')),
  observacoes text,
  cliente_id uuid references public.clientes(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Perfil individual, permissões da equipe e configurações por usuário/loja.
create table if not exists public.perfis (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  telefone text,
  foto_url text,
  papel text not null default 'Caixa' check (papel in ('Administrador','Gerente','Vendedor','Caixa')),
  modo_acesso text not null default 'gestao' check (modo_acesso in ('gestao','vendedor')),
  permissoes jsonb not null default '[]'::jsonb,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.configuracoes_loja (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  loja text not null default 'Loja Centro',
  nome_empresa text,
  prazo_ficha_dias integer not null default 30,
  alertas jsonb not null default '{}'::jsonb,
  tema text not null default 'system' check (tema in ('light','dark','system')),
  tabelas_compactas boolean not null default false,
  mensagens_whatsapp jsonb not null default '{}'::jsonb,
  meta_mensal numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, loja)
);

create index if not exists idx_variacoes_produto on public.variacoes(produto_id);
create index if not exists idx_vendas_created_at on public.vendas(created_at);
create index if not exists idx_vendas_cliente on public.vendas(cliente_id);
create index if not exists idx_venda_itens_venda on public.venda_itens(venda_id);
create index if not exists idx_estoque_movimentos_created_at on public.estoque_movimentos(created_at);
create index if not exists idx_compras_data on public.compras(data_compra);
create index if not exists idx_agenda_eventos_data on public.agenda_eventos(data);

-- RLS para todas as tabelas criadas/alteradas: somente sessões autenticadas.
-- A política é criada apenas se ainda não existir, preservando políticas existentes.
do $$
declare t text;
begin
  foreach t in array array[
    'produtos','variacoes','clientes','vendas','venda_itens','caixa_movimentos',
    'fornecedores','compras','compra_itens','estoque_movimentos','trocas_devolucoes',
    'caixa_sessoes','agenda_reservas','agenda_eventos','perfis','configuracoes_loja'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    if not exists (
      select 1 from pg_policies
      where schemaname='public' and tablename=t and policyname='authenticated_full_access'
    ) then
      execute format(
        'create policy authenticated_full_access on public.%I for all to authenticated using (true) with check (true)',
        t
      );
    end if;
  end loop;
end $$;

-- Observação: esta policy atende ao modelo atual de uma única loja/tenant.
-- Antes de oferecer múltiplas lojas/contas a clientes, restringir policies por user_id/tenant_id.
