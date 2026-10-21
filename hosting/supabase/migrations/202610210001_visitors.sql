create table if not exists public.homepage_visitors (
    id uuid primary key check (
        id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ),
    country text not null check (country ~ '^[A-Z]{2}$' and country <> 'XX'),
    first_seen timestamptz not null default now()
);

alter table public.homepage_visitors enable row level security;
revoke all on public.homepage_visitors from public, anon, authenticated;
grant select, insert, update on public.homepage_visitors to service_role;

create or replace function public.homepage_record_visitor(p_id uuid, p_country text)
returns void language sql security invoker set search_path = '' as $$
    insert into public.homepage_visitors (id, country) values (p_id, p_country)
    on conflict (id) do update set country = excluded.country
    where homepage_visitors.country = 'ZZ' and excluded.country <> 'ZZ';
$$;

create or replace function public.homepage_visitor_country(p_id uuid)
returns text language sql stable security invoker set search_path = '' as $$
    select country from public.homepage_visitors where id = p_id;
$$;

create or replace function public.homepage_visitor_totals()
returns jsonb language sql stable security invoker set search_path = '' as $$
    with regions as (
        select country, count(*) as visitors, min(first_seen) as since
        from public.homepage_visitors group by country
    )
    select jsonb_build_object(
        'total', coalesce(sum(visitors), 0),
        'since', min(since),
        'countries', coalesce(jsonb_agg(
            jsonb_build_object('country', country, 'visitors', visitors)
            order by visitors desc, country asc
        ), '[]'::jsonb)
    ) from regions;
$$;

revoke all on function public.homepage_record_visitor(uuid, text) from public, anon, authenticated;
revoke all on function public.homepage_visitor_country(uuid) from public, anon, authenticated;
revoke all on function public.homepage_visitor_totals() from public, anon, authenticated;
grant execute on function public.homepage_record_visitor(uuid, text) to service_role;
grant execute on function public.homepage_visitor_country(uuid) to service_role;
grant execute on function public.homepage_visitor_totals() to service_role;
