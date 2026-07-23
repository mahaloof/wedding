create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  razorpay_order_id text unique not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount = 100),
  currency text not null check (currency = 'INR'),
  status text not null default 'created' check (status in ('created', 'paid')),
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  razorpay_payment_id text unique not null,
  razorpay_order_id text unique not null references public.payment_orders(razorpay_order_id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount = 100),
  currency text not null check (currency = 'INR'),
  status text not null default 'verified' check (status in ('verified', 'published')),
  invitation_slug text unique,
  created_at timestamptz not null default now()
);

alter table public.payment_orders enable row level security;
alter table public.payments enable row level security;
