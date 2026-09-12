-- À exécuter une fois dans Supabase : Project → SQL Editor → New query → Run.

create table if not exists mesures (
  id bigint generated always as identity primary key,
  source text not null,
  indicateur text not null,
  valeur double precision,
  unite text,
  capture_le timestamptz not null default now()
);

create index if not exists mesures_indicateur_capture_idx
  on mesures (indicateur, capture_le);

-- Cette table n'est écrite/lue que depuis le backend Next.js (via la clé
-- service_role, jamais exposée au navigateur), donc aucune policy RLS
-- côté client n'est nécessaire pour cette version.

-- Historique des alertes envoyées — sert uniquement à éviter de renotifier
-- la même alerte à chaque régénération horaire tant qu'elle reste active.
create table if not exists alertes (
  id bigint generated always as identity primary key,
  cle text not null,
  niveau text not null,
  message text not null,
  envoye_le timestamptz not null default now()
);

create index if not exists alertes_cle_envoye_idx
  on alertes (cle, envoye_le desc);
