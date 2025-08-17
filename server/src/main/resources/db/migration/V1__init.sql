create table if not exists demo_ping (
    id bigserial primary key,
    created_at timestamptz default now()
);