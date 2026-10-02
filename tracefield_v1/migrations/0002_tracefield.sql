create table if not exists tracefield_subscriptions (
  user_id text primary key references "user" ("id") on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'creator', 'studio')),
  status text not null default 'inactive',
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_price_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists tracefield_subscriptions_customer_idx
  on tracefield_subscriptions (stripe_customer_id);

create table if not exists tracefield_scan_history (
  id text primary key,
  user_id text not null references "user" ("id") on delete cascade,
  file_name text not null,
  file_sha256 text not null,
  mime text not null,
  verdict text not null,
  primary_source text,
  evidence_json text not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists tracefield_scan_history_user_idx
  on tracefield_scan_history (user_id, created_at desc);

create table if not exists tracefield_verified_reports (
  id text primary key,
  user_id text not null references "user" ("id") on delete cascade,
  file_name text not null,
  file_sha256 text not null,
  mime text not null,
  verdict text not null,
  primary_source text,
  evidence_json text not null default '[]',
  integrity_sha256 text not null,
  created_at timestamptz not null default now()
);

create index if not exists tracefield_verified_reports_user_idx
  on tracefield_verified_reports (user_id, created_at desc);
