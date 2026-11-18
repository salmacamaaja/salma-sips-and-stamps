
create type public.app_role as enum ('admin', 'user');
create type public.menu_category as enum ('minuman', 'dessert', 'makanan');
create type public.order_type as enum ('dine_in', 'takeaway', 'delivery');
create type public.payment_method as enum ('qris', 'cash', 'transfer');
create type public.order_status as enum ('menunggu', 'diproses', 'siap', 'selesai', 'dibatalkan');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  address text not null default '',
  points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.profiles to authenticated;
grant update (full_name, phone, address, updated_at) on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- Roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users read own roles" on public.user_roles
  for select to authenticated using (user_id = auth.uid());
create policy "Admins read all roles" on public.user_roles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "Users read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "Admins read all profiles" on public.profiles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Users update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- New user trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Menu
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category public.menu_category not null,
  description text not null default '',
  price integer not null check (price >= 0),
  image_url text not null default '',
  toppings jsonb not null default '[]'::jsonb,
  is_best_seller boolean not null default false,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.menu_items to authenticated;
grant all on public.menu_items to service_role;
alter table public.menu_items enable row level security;

create policy "Signed-in users read menu" on public.menu_items
  for select to authenticated using (true);
create policy "Admins insert menu" on public.menu_items
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update menu" on public.menu_items
  for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete menu" on public.menu_items
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null default upper(substr(md5(random()::text), 1, 6)),
  user_id uuid not null,
  customer_name text not null default '',
  order_type public.order_type not null,
  payment_method public.payment_method not null,
  status public.order_status not null default 'menunggu',
  table_number text not null default '',
  address text not null default '',
  notes text not null default '',
  subtotal integer not null default 0,
  delivery_fee integer not null default 0,
  total integer not null default 0,
  points_earned integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_idx on public.orders(user_id, created_at desc);
grant select, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;

create policy "Users read own orders" on public.orders
  for select to authenticated using (user_id = auth.uid());
create policy "Admins read all orders" on public.orders
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update orders" on public.orders
  for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid,
  name text not null,
  image_url text not null default '',
  unit_price integer not null,
  quantity integer not null check (quantity > 0),
  toppings jsonb not null default '[]'::jsonb,
  line_total integer not null
);
create index order_items_order_idx on public.order_items(order_id);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;

create policy "Users read own order items" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy "Admins read all order items" on public.order_items
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Place order (prices computed server-side)
create or replace function public.place_order(
  p_items jsonb,
  p_order_type public.order_type,
  p_payment_method public.payment_method,
  p_table_number text default '',
  p_address text default '',
  p_notes text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_order_id uuid;
  v_item jsonb;
  v_menu public.menu_items%rowtype;
  v_qty integer;
  v_topping_names jsonb;
  v_selected jsonb;
  v_topping_total integer;
  v_unit integer;
  v_subtotal integer := 0;
  v_fee integer := 0;
  v_name text;
begin
  if v_uid is null then
    raise exception 'Silakan masuk terlebih dahulu';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang kosong';
  end if;
  if p_order_type = 'delivery' and coalesce(trim(p_address), '') = '' then
    raise exception 'Alamat pengiriman wajib diisi';
  end if;

  select full_name into v_name from public.profiles where id = v_uid;
  if p_order_type = 'delivery' then v_fee := 10000; end if;

  insert into public.orders (user_id, customer_name, order_type, payment_method, table_number, address, notes)
  values (v_uid, coalesce(v_name, ''), p_order_type, p_payment_method,
          left(coalesce(p_table_number, ''), 20), left(coalesce(p_address, ''), 500), left(coalesce(p_notes, ''), 500))
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_menu from public.menu_items
      where id = (v_item ->> 'menu_item_id')::uuid and is_available = true;
    if not found then
      raise exception 'Menu tidak tersedia';
    end if;
    v_qty := greatest(1, least(50, coalesce((v_item ->> 'quantity')::integer, 1)));
    v_topping_names := coalesce(v_item -> 'toppings', '[]'::jsonb);

    select coalesce(jsonb_agg(t), '[]'::jsonb), coalesce(sum((t ->> 'price')::integer), 0)
      into v_selected, v_topping_total
      from jsonb_array_elements(v_menu.toppings) t
      where v_topping_names ? (t ->> 'name');

    v_unit := v_menu.price + v_topping_total;
    v_subtotal := v_subtotal + v_unit * v_qty;

    insert into public.order_items (order_id, menu_item_id, name, image_url, unit_price, quantity, toppings, line_total)
    values (v_order_id, v_menu.id, v_menu.name, v_menu.image_url, v_unit, v_qty, v_selected, v_unit * v_qty);
  end loop;

  update public.orders
    set subtotal = v_subtotal, delivery_fee = v_fee, total = v_subtotal + v_fee
    where id = v_order_id;

  return v_order_id;
end;
$$;
revoke all on function public.place_order(jsonb, public.order_type, public.payment_method, text, text, text) from public, anon;
grant execute on function public.place_order(jsonb, public.order_type, public.payment_method, text, text, text) to authenticated;

-- Award points when an order is completed: 1 point per Rp10.000
create or replace function public.award_order_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  if new.status = 'selesai' and old.status <> 'selesai' and old.points_earned = 0 then
    new.points_earned := floor(new.total / 10000);
    update public.profiles set points = points + new.points_earned where id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger orders_award_points
  before update on public.orders
  for each row execute function public.award_order_points();

-- Storage policies for menu photos
create policy "Public read menu images" on storage.objects
  for select using (bucket_id = 'menu-images');
create policy "Admins upload menu images" on storage.objects
  for insert to authenticated with check (bucket_id = 'menu-images' and public.has_role(auth.uid(), 'admin'));
create policy "Admins update menu images" on storage.objects
  for update to authenticated using (bucket_id = 'menu-images' and public.has_role(auth.uid(), 'admin'));
create policy "Admins delete menu images" on storage.objects
  for delete to authenticated using (bucket_id = 'menu-images' and public.has_role(auth.uid(), 'admin'));

-- Seed menu
insert into public.menu_items (name, category, description, price, image_url, toppings, is_best_seller) values
('Es Kopi Susu Gula Aren', 'minuman', 'Espresso house blend, susu segar, dan gula aren asli yang legit. Disajikan dingin dengan es batu kristal.', 28000, '/images/menu/es-kopi-susu-gula-aren.jpg', '[{"name":"Extra Shot Espresso","price":6000},{"name":"Oat Milk","price":8000},{"name":"Less Sugar","price":0}]', true),
('Matcha Latte', 'minuman', 'Matcha premium dari Uji, Jepang, berpadu dengan susu lembut. Earthy, creamy, dan menenangkan.', 32000, '/images/menu/matcha-latte.jpg', '[{"name":"Oat Milk","price":8000},{"name":"Whipped Cream","price":5000},{"name":"Boba","price":5000}]', false),
('Caramel Macchiato', 'minuman', 'Lapisan susu, espresso, dan saus karamel buatan sendiri. Manis yang elegan di setiap tegukan.', 35000, '/images/menu/caramel-macchiato.jpg', '[{"name":"Extra Shot Espresso","price":6000},{"name":"Extra Caramel","price":4000},{"name":"Whipped Cream","price":5000}]', true),
('Teh Melati', 'minuman', 'Teh melati wangi diseduh perlahan, disajikan hangat atau dingin. Ringan dan menyegarkan.', 18000, '/images/menu/teh-melati.jpg', '[{"name":"Madu","price":4000},{"name":"Lemon","price":3000},{"name":"Less Sugar","price":0}]', false),
('Jus Alpukat', 'minuman', 'Alpukat mentega pilihan diblender halus dengan susu, disiram kental manis coklat.', 25000, '/images/menu/jus-alpukat.jpg', '[{"name":"Saus Coklat","price":4000},{"name":"Es Krim Vanilla","price":8000}]', false),
('Croissant Coklat', 'dessert', 'Croissant mentega berlapis renyah dengan isian coklat Belgia yang lumer.', 27000, '/images/menu/croissant-coklat.jpg', '[{"name":"Dihangatkan","price":0},{"name":"Almond Slice","price":6000}]', false),
('Tiramisu Slice', 'dessert', 'Ladyfinger berendam espresso, krim mascarpone lembut, dan taburan bubuk kakao.', 38000, '/images/menu/tiramisu-slice.jpg', '[{"name":"Es Krim Vanilla","price":8000},{"name":"Extra Kakao","price":3000}]', true),
('Brownies Lumer', 'dessert', 'Brownies coklat pekat yang dipanggang sempurna dengan bagian tengah yang lumer.', 30000, '/images/menu/brownies-lumer.jpg', '[{"name":"Es Krim Vanilla","price":8000},{"name":"Saus Coklat","price":4000}]', false),
('Cheesecake Bakar', 'dessert', 'Basque burnt cheesecake dengan permukaan karamel dan tekstur creamy di dalam.', 36000, '/images/menu/cheesecake-bakar.jpg', '[{"name":"Saus Berry","price":5000},{"name":"Es Krim Vanilla","price":8000}]', false),
('Pudding Mangga', 'dessert', 'Pudding lembut dari mangga harum manis dengan saus vla susu yang segar.', 22000, '/images/menu/pudding-mangga.jpg', '[{"name":"Extra Vla","price":3000},{"name":"Potongan Mangga","price":5000}]', false),
('Nasi Goreng Spesial', 'makanan', 'Nasi goreng bumbu rempah dengan telur, ayam suwir, udang, acar, dan kerupuk.', 42000, '/images/menu/nasi-goreng-spesial.jpg', '[{"name":"Telur Mata Sapi","price":5000},{"name":"Extra Udang","price":10000},{"name":"Extra Pedas","price":0}]', true),
('Mie Goreng Jawa', 'makanan', 'Mie goreng ala Jawa dengan kecap manis, sayuran, ayam, dan telur orak-arik.', 38000, '/images/menu/mie-goreng-jawa.jpg', '[{"name":"Telur Mata Sapi","price":5000},{"name":"Extra Ayam","price":10000},{"name":"Kerupuk","price":3000}]', false),
('Ayam Geprek Sambal Matah', 'makanan', 'Ayam goreng renyah digeprek, disajikan dengan sambal matah segar khas Bali dan nasi hangat.', 40000, '/images/menu/ayam-geprek-sambal-matah.jpg', '[{"name":"Extra Sambal Matah","price":4000},{"name":"Tambah Nasi","price":6000},{"name":"Tahu Tempe","price":5000}]', true),
('Soto Banjar', 'makanan', 'Kuah bening rempah khas Kalimantan dengan ayam suwir, telur, perkedel, dan ketupat.', 35000, '/images/menu/soto-banjar.jpg', '[{"name":"Extra Perkedel","price":4000},{"name":"Ganti Nasi","price":0},{"name":"Extra Ayam","price":10000}]', false),
('Rice Bowl Chicken Teriyaki', 'makanan', 'Ayam teriyaki glossy di atas nasi pulen, dengan telur onsen dan wijen sangrai.', 45000, '/images/menu/rice-bowl-chicken-teriyaki.jpg', '[{"name":"Telur Onsen","price":6000},{"name":"Extra Ayam","price":12000},{"name":"Mayo Pedas","price":3000}]', false);
