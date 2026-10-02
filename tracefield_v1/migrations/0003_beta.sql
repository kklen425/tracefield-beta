alter table tracefield_subscriptions drop constraint if exists tracefield_subscriptions_plan_check;
update tracefield_subscriptions set plan='plus' where plan in ('creator','studio');
alter table tracefield_subscriptions add constraint tracefield_subscriptions_plan_check check (plan in ('free','plus'));
create table if not exists tracefield_monthly_usage (
 user_id text not null references "user"("id") on delete cascade,
 period_start date not null,
 history_count integer not null default 0,
 receipt_count integer not null default 0,
 updated_at timestamptz not null default now(),
 primary key(user_id,period_start)
);
alter table tracefield_monthly_usage add column if not exists analysis_count integer not null default 0;
create table if not exists tracefield_analysis_jobs (
 id uuid primary key,
 user_id text not null references "user"("id") on delete cascade,
 period_start date not null,
 created_at timestamptz not null default now()
);
create table if not exists tracefield_stripe_events (
 id text primary key,
 processed_at timestamptz not null default now()
);
create or replace function tracefield_consume_analysis(p_user text,p_job uuid,p_limit integer)
returns integer language plpgsql as $$
declare period date := date_trunc('month',now() at time zone 'UTC')::date; used integer;
begin
 perform pg_advisory_xact_lock(hashtext(p_user));
 if exists(select 1 from tracefield_analysis_jobs where id=p_job and user_id=p_user) then
  select analysis_count into used from tracefield_monthly_usage where user_id=p_user and period_start=period;
  return coalesce(used,0);
 end if;
 insert into tracefield_monthly_usage(user_id,period_start) values(p_user,period) on conflict do nothing;
 update tracefield_monthly_usage set analysis_count=analysis_count+1,updated_at=now()
 where user_id=p_user and period_start=period and analysis_count<p_limit returning analysis_count into used;
 if used is null then raise exception 'MONTHLY_ANALYSIS_LIMIT_REACHED'; end if;
 insert into tracefield_analysis_jobs(id,user_id,period_start) values(p_job,p_user,period);
 return used;
end $$;
