-- ============================================================
-- QUÉ CHIMBA — Esquema de Supabase
-- Pégalo completo en Supabase → SQL Editor → Run
-- ============================================================

-- ---------- Tablas ----------
create table public.products (
  id          bigint generated always as identity primary key,
  cat         text not null,
  name        text not null,
  description text not null default '',
  price       numeric(8,2) not null check (price >= 0),
  opts        jsonb,                       -- {"label":"Tamaño","values":{"Clásica":4.75,...}}
  img         text,
  available   boolean not null default true,
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create sequence public.order_seq;

create table public.orders (
  id            bigint generated always as identity primary key,
  code          text not null unique,
  mode          text not null check (mode in ('local','domicilio')),
  customer_name text not null,
  customer_tel  text not null default '',
  customer_addr text not null default '',
  items         jsonb not null,            -- [{"name","qty","price"}]
  subtotal      numeric(8,2) not null,
  delivery      numeric(8,2) not null,
  total         numeric(8,2) not null,
  status        text not null default 'Pendiente'
                check (status in ('Pendiente','Preparando','Listo','Entregado')),
  created_at    timestamptz not null default now()
);

-- ---------- ¿El usuario actual es admin? ----------
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

-- ---------- Seguridad (RLS) ----------
alter table public.products enable row level security;
alter table public.orders   enable row level security;
alter table public.admins   enable row level security;

-- Productos: todos leen el menú; solo admin escribe
create policy "menu publico"   on public.products for select using (true);
create policy "admin inserta"  on public.products for insert to authenticated with check (public.is_admin());
create policy "admin edita"    on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin elimina"  on public.products for delete to authenticated using (public.is_admin());

-- Pedidos: nadie inserta directo (se usa create_order); solo admin lee y actualiza
create policy "admin ve pedidos"        on public.orders for select to authenticated using (public.is_admin());
create policy "admin actualiza pedidos" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Admins: cada usuario solo puede ver su propia fila (para saber si es admin)
create policy "ver mi fila" on public.admins for select to authenticated using (user_id = auth.uid());

-- ---------- Crear pedido (el servidor calcula los precios) ----------
create or replace function public.create_order(
  p_mode text, p_name text, p_tel text, p_addr text, p_items jsonb
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  it jsonb; prod public.products; unit numeric; qty int; variant text;
  v_items jsonb := '[]'::jsonb; v_sub numeric := 0; v_del numeric := 0;
  v_name text := left(trim(coalesce(p_name,'')), 100);
  v_tel  text := left(trim(coalesce(p_tel,'')), 30);
  v_addr text := left(trim(coalesce(p_addr,'')), 300);
  v_code text; v_created timestamptz;
begin
  if p_mode not in ('local','domicilio') then
    raise exception 'Modo de pedido inválido';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'Pedido vacío o inválido';
  end if;

  if p_mode = 'domicilio' then
    if v_name = '' or v_tel = '' or v_addr = '' then
      raise exception 'Faltan datos de entrega';
    end if;
    v_del := 1.50;                         -- costo de domicilio
  else
    v_name := 'Cliente del local'; v_tel := ''; v_addr := '';
  end if;

  for it in select value from jsonb_array_elements(p_items) loop
    qty := (it->>'qty')::int;
    if qty is null or qty < 1 or qty > 50 then
      raise exception 'Cantidad inválida';
    end if;

    select * into prod from public.products
     where id = (it->>'id')::bigint and available;
    if not found then
      raise exception 'Producto no disponible';
    end if;

    variant := coalesce(it->>'variant', '');
    if variant <> '' and prod.opts is not null then
      unit := (prod.opts->'values'->>variant)::numeric;
      if unit is null then raise exception 'Variante inválida'; end if;
    else
      unit := prod.price; variant := '';
    end if;

    v_items := v_items || jsonb_build_object(
      'name',  prod.name || case when variant <> '' then ' (' || variant || ')' else '' end,
      'qty',   qty,
      'price', unit);
    v_sub := v_sub + unit * qty;
  end loop;

  v_code := 'QC-' || (1000 + nextval('public.order_seq'));

  insert into public.orders (code, mode, customer_name, customer_tel, customer_addr, items, subtotal, delivery, total)
  values (v_code, p_mode, v_name, v_tel, v_addr, v_items, v_sub, v_del, v_sub + v_del)
  returning created_at into v_created;

  return jsonb_build_object('code', v_code, 'total', v_sub + v_del, 'created_at', v_created);
end;
$$;

grant execute on function public.create_order(text, text, text, text, jsonb) to anon, authenticated;

-- ---------- Tiempo real ----------
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.products;

-- ---------- Menú inicial ----------
insert into public.products (cat, name, description, price, opts, img, sort) values
  ('Smash Burgers', 'Consentida', 'Pan de papa, carne smash, salsa relish, cheddar, salsa ahumada, pepinillos.', 4.75, '{"label":"Tamaño","values":{"Clásica":4.75,"Especial":5.75,"Doble":7}}'::jsonb, 'https://kimi-web-img.kimi.ai/img/basilandbubbly.com/071f62bed40973ad9c2c0dfd22a111813b0ab467.jpg', 1),
  ('Smash Burgers', 'Bendita BBQ', 'Pan de papa, carne smash, salsa BBQ, tocino crispy, cheddar, cebolla caramelizada.', 6.5, '{"label":"Tamaño","values":{"Clásica":6.5,"Doble":7.75}}'::jsonb, 'https://kimi-web-img.kimi.ai/img/northeastnosh.com/00c947f48ddd3c0d2ab7de49cc362e63103dd0a7.jpg', 2),
  ('Smash Burgers', 'Criolla', 'Pan brioche, carne smash, cebolla crispy, doble cheddar, pico de gallo, guacamole.', 6.25, '{"label":"Tamaño","values":{"Clásica":6.25,"Doble":7.5}}'::jsonb, 'https://kimi-web-img.kimi.ai/img/basilandbubbly.com/071f62bed40973ad9c2c0dfd22a111813b0ab467.jpg', 3),
  ('Smash Burgers', 'Melosa', 'Doble carne smash, cheddar, tocino, cebolla caramelizada, salsa de tocino con piña.', 8, null, 'https://kimi-web-img.kimi.ai/img/northeastnosh.com/00c947f48ddd3c0d2ab7de49cc362e63103dd0a7.jpg', 4),
  ('Smash Burgers', 'Coqueta', 'Salsa ranch, carne smash, doble cheddar, aros de cebolla crispy, mermelada de tocino.', 6.75, null, 'https://kimi-web-img.kimi.ai/img/basilandbubbly.com/071f62bed40973ad9c2c0dfd22a111813b0ab467.jpg', 5),
  ('Papas', 'Solterona', 'Papas fritas, chorizo, huevos de codorniz, cheddar, salsas de la casa.', 3.5, null, 'https://kimi-web-img.kimi.ai/img/www.lovebakesgoodcakes.com/fd9c40ad152facd3bed99159c27b20cc2bf8c79f.jpg', 6),
  ('Papas', 'Parchadita', 'Papas, pollo panko crispy, chorizo, huevos de codorniz, cheddar, salsas de la casa.', 7, null, 'https://kimi-web-img.kimi.ai/img/plowingthroughlife.com/265549d2a5669d84a5c895d95127fef0a9219e5e.jpg', 7),
  ('Papas', 'Que Pecado', 'Chorizo, pollo, cerdo y res en salsa BBQ, queso derretido, tocino, jamón, huevos de codorniz.', 10, null, 'https://kimi-web-img.kimi.ai/img/plowingthroughlife.com/265549d2a5669d84a5c895d95127fef0a9219e5e.jpg', 8),
  ('Papas', 'Papas Cheddar & Tocino', 'Papas fritas con extra queso cheddar y tocino crispy.', 3.5, null, 'https://kimi-web-img.kimi.ai/img/www.allrecipes.com/65edbc6a7e33ef258451d916127b4ad02e2ff3cb.jpg', 9),
  ('Hot Dogs', 'El Chiro', 'Pan de papa, chorizo, cebolla, papitas trituradas.', 3, null, 'https://kimi-web-img.kimi.ai/img/www.mycolombianrecipes.com/77af35b9101e05c0c211aa977fcaee281bf831a5.jpg', 10),
  ('Hot Dogs', 'Piñita Paisa', 'Pan mozzarella, chorizo, cheddar, tocino crispy, salsa de piña con tocino, huevo de codorniz.', 4, null, 'https://kimi-web-img.kimi.ai/img/www.mycolombianrecipes.com/19c6facd414deea343b3972b1336a63f0618caa0.jpg', 11),
  ('Bebidas', 'Gaseosa', 'Coca-Cola, Sprite, Fanta… bien frías.', 0.75, null, 'https://kimi-web-img.kimi.ai/img/www.allrecipes.com/65edbc6a7e33ef258451d916127b4ad02e2ff3cb.jpg', 12),
  ('Bebidas', 'Fuze Tea', 'Té frío sabor durazno o limón.', 0.75, null, 'https://kimi-web-img.kimi.ai/img/www.allrecipes.com/65edbc6a7e33ef258451d916127b4ad02e2ff3cb.jpg', 13),
  ('Bebidas', 'Guitig', 'Agua mineral con gas.', 0.75, null, 'https://kimi-web-img.kimi.ai/img/www.allrecipes.com/65edbc6a7e33ef258451d916127b4ad02e2ff3cb.jpg', 14),
  ('Bebidas', 'Agua', 'Agua pura.', 0.75, null, 'https://kimi-web-img.kimi.ai/img/www.allrecipes.com/65edbc6a7e33ef258451d916127b4ad02e2ff3cb.jpg', 15),
  ('Bebidas', 'Horchata', 'Bebida natural de la casa.', 0.75, null, 'https://kimi-web-img.kimi.ai/img/www.allrecipes.com/65edbc6a7e33ef258451d916127b4ad02e2ff3cb.jpg', 16),
  ('Bebidas', 'Jamaica', 'Bebida natural de la casa.', 0.75, null, 'https://kimi-web-img.kimi.ai/img/www.allrecipes.com/65edbc6a7e33ef258451d916127b4ad02e2ff3cb.jpg', 17),
  ('Extras', 'Honey Mustard', 'Salsa extra.', 0.35, null, 'https://kimi-web-img.kimi.ai/img/www.allrecipes.com/65edbc6a7e33ef258451d916127b4ad02e2ff3cb.jpg', 18),
  ('Extras', 'Leña Ahumada', 'Salsa extra.', 0.4, null, 'https://kimi-web-img.kimi.ai/img/www.allrecipes.com/65edbc6a7e33ef258451d916127b4ad02e2ff3cb.jpg', 19),
  ('Extras', 'Big Taste (picante)', 'Salsa extra picante.', 0.4, null, 'https://kimi-web-img.kimi.ai/img/www.allrecipes.com/65edbc6a7e33ef258451d916127b4ad02e2ff3cb.jpg', 20),
  ('Extras', 'Salsa Piña', 'Salsa extra.', 0.5, null, 'https://kimi-web-img.kimi.ai/img/www.allrecipes.com/65edbc6a7e33ef258451d916127b4ad02e2ff3cb.jpg', 21),
  ('Extras', 'Salsa Cheddar', 'Salsa extra.', 0.5, null, 'https://kimi-web-img.kimi.ai/img/www.allrecipes.com/65edbc6a7e33ef258451d916127b4ad02e2ff3cb.jpg', 22),
  ('Extras', 'Pepinillos', 'Porción extra.', 0.5, null, 'https://kimi-web-img.kimi.ai/img/www.allrecipes.com/65edbc6a7e33ef258451d916127b4ad02e2ff3cb.jpg', 23),
  ('Extras', 'Tocino', 'Porción extra.', 1, null, 'https://kimi-web-img.kimi.ai/img/www.allrecipes.com/65edbc6a7e33ef258451d916127b4ad02e2ff3cb.jpg', 24),
  ('Extras', 'Queso', 'Porción extra.', 0.5, null, 'https://kimi-web-img.kimi.ai/img/www.allrecipes.com/65edbc6a7e33ef258451d916127b4ad02e2ff3cb.jpg', 25),
  ('Extras', 'Cambio de pan', 'Pan brioche o mozzarella.', 0.5, null, 'https://kimi-web-img.kimi.ai/img/www.allrecipes.com/65edbc6a7e33ef258451d916127b4ad02e2ff3cb.jpg', 26);
