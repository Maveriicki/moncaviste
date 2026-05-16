-- ============================================================
--  MonCaviste SaaS — Initial Schema
--  Multi-tenant : chaque caviste est un tenant isolé
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────
--  TABLE: cavistes  (tenants)
-- ─────────────────────────────────────────
create table public.cavistes (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade not null unique,
  slug          text unique not null,           -- ex: "cave-excellence-paris"
  name          text not null,                  -- nom du magasin
  logo_url      text,
  primary_color text default '#7B1D2E',
  address       text,
  phone         text,
  website       text,
  plan          text default 'free' check (plan in ('free','pro','premium')),
  is_active     boolean default true,
  settings      jsonb default '{
    "languages": ["fr"],
    "screensaver_timeout": 120,
    "kiosk_mode": false,
    "admin_password": "1234",
    "show_stock": true
  }'::jsonb,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─────────────────────────────────────────
--  TABLE: wines  (catalogue par caviste)
-- ─────────────────────────────────────────
create table public.wines (
  id            uuid primary key default uuid_generate_v4(),
  caviste_id    uuid references public.cavistes(id) on delete cascade not null,
  name          text not null,
  color         text not null check (color in ('rouge','blanc','rose','effervescent')),
  style         text,
  region        text,
  appellation   text,
  price         numeric(8,2) not null check (price >= 0),
  dryness       text check (dryness in ('sec','demi-sec','moelleux')),
  tannin        text check (tannin in ('leger','souple','tannique')),
  vintage       integer,
  in_stock      boolean default true,
  stock_qty     integer,
  foods         text[] default '{}',
  occasions     text[] default '{}',
  degustation   text,
  accord        text,
  description   text,
  temperature   text,
  garde         text,
  profil        jsonb default '{"tanins":50,"acidite":50,"corps":50,"fruit":60,"sucre":20}'::jsonb,
  image_url     text,
  position      integer default 0,             -- ordre d'affichage
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─────────────────────────────────────────
--  TABLE: conversations  (historique chat)
-- ─────────────────────────────────────────
create table public.conversations (
  id            uuid primary key default uuid_generate_v4(),
  caviste_id    uuid references public.cavistes(id) on delete cascade not null,
  session_id    text not null,                  -- UUID côté client, non authentifié
  lang          text default 'fr',
  messages      jsonb default '[]'::jsonb,      -- [{role, content, ts}]
  answers       jsonb default '{}'::jsonb,      -- réponses questionnaire
  results       jsonb default '[]'::jsonb,      -- wine_ids recommandés
  started_at    timestamptz default now(),
  ended_at      timestamptz
);

-- ─────────────────────────────────────────
--  TABLE: wine_ratings  (notes clients)
-- ─────────────────────────────────────────
create table public.wine_ratings (
  id            uuid primary key default uuid_generate_v4(),
  wine_id       uuid references public.wines(id) on delete cascade not null,
  caviste_id    uuid references public.cavistes(id) on delete cascade not null,
  session_id    text not null,
  score         integer not null check (score between 1 and 5),
  created_at    timestamptz default now(),
  unique (wine_id, session_id)
);

-- ─────────────────────────────────────────
--  INDEXES
-- ─────────────────────────────────────────
create index idx_wines_caviste        on public.wines(caviste_id);
create index idx_wines_color          on public.wines(caviste_id, color);
create index idx_wines_stock          on public.wines(caviste_id, in_stock);
create index idx_conversations_caviste on public.conversations(caviste_id);
create index idx_conversations_session on public.conversations(session_id);
create index idx_ratings_wine         on public.wine_ratings(wine_id);

-- ─────────────────────────────────────────
--  TRIGGERS: updated_at automatique
-- ─────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_cavistes_updated_at
  before update on public.cavistes
  for each row execute function public.handle_updated_at();

create trigger trg_wines_updated_at
  before update on public.wines
  for each row execute function public.handle_updated_at();

-- ─────────────────────────────────────────
--  ROW LEVEL SECURITY
-- ─────────────────────────────────────────
alter table public.cavistes       enable row level security;
alter table public.wines          enable row level security;
alter table public.conversations  enable row level security;
alter table public.wine_ratings   enable row level security;

-- cavistes : un caviste ne voit que son propre profil
create policy "caviste_select_own"
  on public.cavistes for select
  using (auth.uid() = user_id);

create policy "caviste_update_own"
  on public.cavistes for update
  using (auth.uid() = user_id);

-- wines : le caviste gère son catalogue
create policy "wines_caviste_all"
  on public.wines for all
  using (
    caviste_id in (
      select id from public.cavistes where user_id = auth.uid()
    )
  );

-- wines : lecture publique pour le widget (via slug)
create policy "wines_public_read"
  on public.wines for select
  using (in_stock = true);     -- les vins hors stock sont masqués publiquement

-- conversations : insert/select public (widget client)
create policy "conversations_insert_public"
  on public.conversations for insert
  with check (true);

create policy "conversations_select_caviste"
  on public.conversations for select
  using (
    caviste_id in (
      select id from public.cavistes where user_id = auth.uid()
    )
  );

-- ratings : insert public, select caviste
create policy "ratings_insert_public"
  on public.wine_ratings for insert
  with check (true);

create policy "ratings_select_caviste"
  on public.wine_ratings for select
  using (
    caviste_id in (
      select id from public.cavistes where user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────
--  FUNCTION: créer un caviste après signup
-- ─────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  base_slug text;
  final_slug text;
  counter   integer := 0;
begin
  -- Génère un slug à partir du nom si fourni, sinon de l'email
  base_slug := lower(
    regexp_replace(
      coalesce(
        new.raw_user_meta_data->>'shop_name',
        split_part(new.email, '@', 1)
      ),
      '[^a-z0-9]', '-', 'g'
    )
  );
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);

  final_slug := base_slug;
  -- Assure l'unicité du slug
  while exists (select 1 from public.cavistes where slug = final_slug) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  end loop;

  insert into public.cavistes (user_id, slug, name)
  values (
    new.id,
    final_slug,
    coalesce(new.raw_user_meta_data->>'shop_name', 'Ma Cave')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────
--  FUNCTION: stats dashboard
-- ─────────────────────────────────────────
create or replace function public.get_caviste_stats(p_caviste_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'total_wines',        (select count(*) from public.wines where caviste_id = p_caviste_id),
    'wines_in_stock',     (select count(*) from public.wines where caviste_id = p_caviste_id and in_stock = true),
    'total_conversations',(select count(*) from public.conversations where caviste_id = p_caviste_id),
    'conversations_today',(select count(*) from public.conversations where caviste_id = p_caviste_id and started_at >= current_date),
    'avg_rating',         (select round(avg(score)::numeric, 1) from public.wine_ratings where caviste_id = p_caviste_id),
    'top_wine',           (
      select jsonb_build_object('name', w.name, 'avg', round(avg(r.score)::numeric,1))
      from public.wine_ratings r
      join public.wines w on w.id = r.wine_id
      where r.caviste_id = p_caviste_id
      group by w.id, w.name
      order by avg(r.score) desc
      limit 1
    )
  ) into result;
  return result;
end;
$$;
