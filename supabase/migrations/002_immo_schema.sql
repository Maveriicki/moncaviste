-- ============================================================
--  Module Immobilier — Schéma
--  Chaque agence est un tenant isolé.
--  Chaque bien possède un token public servi par un QR code :
--  le client scanne → il voit les photos et l'annonce.
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────
--  TABLE: agences  (tenants immobiliers)
-- ─────────────────────────────────────────
create table if not exists public.agences (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade not null unique,
  slug          text unique not null,
  name          text not null,
  logo_url      text,
  primary_color text default '#123B5C',
  address       text,
  phone         text,
  email         text,
  website       text,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─────────────────────────────────────────
--  TABLE: biens  (annonces)
-- ─────────────────────────────────────────
create table if not exists public.biens (
  id              uuid primary key default uuid_generate_v4(),
  agence_id       uuid references public.agences(id) on delete cascade not null,
  reference       text not null,                       -- ex: "VM-2026-014"
  public_token    text not null unique
                  default encode(gen_random_bytes(12), 'hex'),  -- cible du QR code
  title           text not null,
  kind            text not null default 'maison'
                  check (kind in ('maison','appartement','terrain','local','immeuble','parking')),
  transaction     text not null default 'vente'
                  check (transaction in ('vente','location')),
  status          text not null default 'disponible'
                  check (status in ('brouillon','disponible','sous_compromis','vendu','loue')),
  price           numeric(12,2) not null check (price >= 0),
  charges         numeric(10,2),                       -- charges / mois (location)
  fees            text,                                -- honoraires
  surface         numeric(8,2),                        -- surface habitable m²
  land_surface    numeric(10,2),                       -- terrain m²
  rooms           integer,                             -- pièces
  bedrooms        integer,
  bathrooms       integer,
  floor           integer,
  year_built      integer,
  dpe             text check (dpe in ('A','B','C','D','E','F','G')),
  ges             text check (ges in ('A','B','C','D','E','F','G')),
  city            text,
  postal_code     text,
  address         text,                                -- adresse exacte : jamais publique
  description     text,
  features        text[] default '{}',                 -- "Garage", "Jardin", ...
  contact_name    text,
  contact_phone   text,
  contact_email   text,
  is_published    boolean default true,                -- visible via le QR code
  scans_count     integer default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (agence_id, reference)
);

-- ─────────────────────────────────────────
--  TABLE: bien_photos
-- ─────────────────────────────────────────
create table if not exists public.bien_photos (
  id            uuid primary key default uuid_generate_v4(),
  bien_id       uuid references public.biens(id) on delete cascade not null,
  agence_id     uuid references public.agences(id) on delete cascade not null,
  url           text not null,
  storage_path  text,
  caption       text,
  position      integer default 0,
  created_at    timestamptz default now()
);

-- ─────────────────────────────────────────
--  TABLE: bien_scans  (statistiques QR code)
-- ─────────────────────────────────────────
create table if not exists public.bien_scans (
  id          uuid primary key default uuid_generate_v4(),
  bien_id     uuid references public.biens(id) on delete cascade not null,
  agence_id   uuid references public.agences(id) on delete cascade not null,
  source      text default 'qr',
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────
--  INDEXES
-- ─────────────────────────────────────────
create index if not exists idx_biens_agence    on public.biens(agence_id);
create index if not exists idx_biens_status    on public.biens(agence_id, status);
create index if not exists idx_biens_token     on public.biens(public_token);
create index if not exists idx_photos_bien     on public.bien_photos(bien_id, position);
create index if not exists idx_scans_bien      on public.bien_scans(bien_id, created_at desc);

-- ─────────────────────────────────────────
--  TRIGGERS: updated_at
-- ─────────────────────────────────────────
drop trigger if exists trg_agences_updated_at on public.agences;
create trigger trg_agences_updated_at
  before update on public.agences
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_biens_updated_at on public.biens;
create trigger trg_biens_updated_at
  before update on public.biens
  for each row execute function public.handle_updated_at();

-- ─────────────────────────────────────────
--  ROW LEVEL SECURITY
--  Rien n'est lisible publiquement en direct :
--  la page publique passe uniquement par get_bien_public().
-- ─────────────────────────────────────────
alter table public.agences     enable row level security;
alter table public.biens       enable row level security;
alter table public.bien_photos enable row level security;
alter table public.bien_scans  enable row level security;

drop policy if exists "agences_select_own" on public.agences;
create policy "agences_select_own"
  on public.agences for select
  using (auth.uid() = user_id);

drop policy if exists "agences_insert_own" on public.agences;
create policy "agences_insert_own"
  on public.agences for insert
  with check (auth.uid() = user_id);

drop policy if exists "agences_update_own" on public.agences;
create policy "agences_update_own"
  on public.agences for update
  using (auth.uid() = user_id);

drop policy if exists "biens_agence_all" on public.biens;
create policy "biens_agence_all"
  on public.biens for all
  using (
    agence_id in (select id from public.agences where user_id = auth.uid())
  )
  with check (
    agence_id in (select id from public.agences where user_id = auth.uid())
  );

drop policy if exists "photos_agence_all" on public.bien_photos;
create policy "photos_agence_all"
  on public.bien_photos for all
  using (
    agence_id in (select id from public.agences where user_id = auth.uid())
  )
  with check (
    agence_id in (select id from public.agences where user_id = auth.uid())
  );

drop policy if exists "scans_select_agence" on public.bien_scans;
create policy "scans_select_agence"
  on public.bien_scans for select
  using (
    agence_id in (select id from public.agences where user_id = auth.uid())
  );

-- ─────────────────────────────────────────
--  FUNCTION: annonce publique (scan du QR code)
--  Ne renvoie jamais l'adresse exacte ni les données internes.
-- ─────────────────────────────────────────
create or replace function public.get_bien_public(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bien   public.biens%rowtype;
  v_agence public.agences%rowtype;
  result   jsonb;
begin
  select * into v_bien
  from public.biens
  where public_token = p_token
    and is_published = true
    and status <> 'brouillon';

  if not found then
    return null;
  end if;

  select * into v_agence from public.agences where id = v_bien.agence_id;

  if v_agence.is_active is distinct from true then
    return null;
  end if;

  select jsonb_build_object(
    'bien', jsonb_build_object(
      'id',           v_bien.id,
      'reference',    v_bien.reference,
      'title',        v_bien.title,
      'kind',         v_bien.kind,
      'transaction',  v_bien.transaction,
      'status',       v_bien.status,
      'price',        v_bien.price,
      'charges',      v_bien.charges,
      'fees',         v_bien.fees,
      'surface',      v_bien.surface,
      'land_surface', v_bien.land_surface,
      'rooms',        v_bien.rooms,
      'bedrooms',     v_bien.bedrooms,
      'bathrooms',    v_bien.bathrooms,
      'floor',        v_bien.floor,
      'year_built',   v_bien.year_built,
      'dpe',          v_bien.dpe,
      'ges',          v_bien.ges,
      'city',         v_bien.city,
      'postal_code',  v_bien.postal_code,
      'description',  v_bien.description,
      'features',     to_jsonb(coalesce(v_bien.features, '{}')),
      'contact_name', coalesce(v_bien.contact_name, v_agence.name),
      'contact_phone',coalesce(v_bien.contact_phone, v_agence.phone),
      'contact_email',coalesce(v_bien.contact_email, v_agence.email)
    ),
    'agence', jsonb_build_object(
      'name',          v_agence.name,
      'logo_url',      v_agence.logo_url,
      'primary_color', v_agence.primary_color,
      'phone',         v_agence.phone,
      'email',         v_agence.email,
      'website',       v_agence.website
    ),
    'photos', coalesce((
      select jsonb_agg(
               jsonb_build_object('url', p.url, 'caption', p.caption)
               order by p.position, p.created_at
             )
      from public.bien_photos p
      where p.bien_id = v_bien.id
    ), '[]'::jsonb)
  ) into result;

  -- Compteur de scans (statistique agence)
  update public.biens
     set scans_count = coalesce(scans_count, 0) + 1
   where id = v_bien.id;

  insert into public.bien_scans (bien_id, agence_id) values (v_bien.id, v_bien.agence_id);

  return result;
end;
$$;

revoke all on function public.get_bien_public(text) from public;
grant execute on function public.get_bien_public(text) to anon, authenticated;

-- ─────────────────────────────────────────
--  FUNCTION: référence automatique (VM-2026-001)
-- ─────────────────────────────────────────
create or replace function public.next_bien_reference(p_agence_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year  text := to_char(now(), 'YYYY');
  v_count integer;
begin
  select count(*) + 1 into v_count
  from public.biens
  where agence_id = p_agence_id
    and created_at >= date_trunc('year', now());

  return 'REF-' || v_year || '-' || lpad(v_count::text, 3, '0');
end;
$$;

grant execute on function public.next_bien_reference(uuid) to authenticated;

-- ─────────────────────────────────────────
--  FUNCTION: stats dashboard agence
-- ─────────────────────────────────────────
create or replace function public.get_agence_stats(p_agence_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'total_biens',      (select count(*) from public.biens where agence_id = p_agence_id),
    'biens_publies',    (select count(*) from public.biens where agence_id = p_agence_id and is_published = true),
    'total_photos',     (select count(*) from public.bien_photos where agence_id = p_agence_id),
    'total_scans',      (select count(*) from public.bien_scans where agence_id = p_agence_id),
    'scans_7j',         (select count(*) from public.bien_scans where agence_id = p_agence_id and created_at >= now() - interval '7 days')
  ) into result;
  return result;
end;
$$;

grant execute on function public.get_agence_stats(uuid) to authenticated;
