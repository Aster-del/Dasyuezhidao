-- ============================================================
-- 點餐網站資料庫結構 (Supabase / PostgreSQL)
-- 使用方式：到 Supabase 後台 -> SQL Editor -> New query
--          把這整份檔案貼上，按 Run 即可一次建立完成
-- ============================================================

create extension if not exists "pgcrypto";

-- 如果之前曾經執行到一半失敗過，先清掉舊的資料表，確保可以重新乾淨執行一次
drop table if exists order_item_options cascade;
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists dish_option_groups cascade;
drop table if exists option_choices cascade;
drop table if exists option_groups cascade;
drop table if exists dishes cascade;
drop table if exists categories cascade;

-- ------------------------------------------------------------
-- 1. 分類
-- ------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. 菜色
--    dish_type 用來判斷是否要顯示「加飯」或「加麵」選項
-- ------------------------------------------------------------
create table dishes (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  description text default '',
  price numeric(10,2) not null default 0,
  dish_type text not null default 'other' check (dish_type in ('rice','noodle','other')),
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. 客製化選項群組
--    is_default = true  -> 所有菜色預設套用（除非該菜色有自訂群組）
--    applies_to_dish_type 為 NULL 表示不限菜色類型；
--    設 'rice' 只在飯類顯示（例如「加飯」）；'noodle' 只在麵類顯示（例如「加麵」）
--    input_type: single = 單選（如辣度）, multi = 多選（如加料）, text = 自由輸入文字（備註）
-- ------------------------------------------------------------
create table option_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  input_type text not null default 'single' check (input_type in ('single','multi','text')),
  is_default boolean not null default true,
  applies_to_dish_type text check (applies_to_dish_type in ('rice','noodle')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4. 選項群組底下的具體選項（例如辣度群組底下的「大辣/中辣/小辣」）
--    extra_price 給「加沙茶醬 +5元」這種要加價的選項用
-- ------------------------------------------------------------
create table option_choices (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references option_groups(id) on delete cascade,
  label text not null,
  extra_price numeric(10,2) not null default 0,
  sort_order int not null default 0
);

-- ------------------------------------------------------------
-- 5. 個別菜色「覆寫」客製化選項群組
--    如果某個菜色在這張表有資料，前端就只use這裡指定的群組（取代預設群組）
--    這是用來處理「少部分菜色客製化選項不同」的情況
-- ------------------------------------------------------------
create table dish_option_groups (
  dish_id uuid not null references dishes(id) on delete cascade,
  group_id uuid not null references option_groups(id) on delete cascade,
  primary key (dish_id, group_id)
);

-- ------------------------------------------------------------
-- 6. 訂單
-- ------------------------------------------------------------
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  payment_method text not null check (payment_method in ('cash','transfer')),
  status text not null default 'pending' check (status in ('pending','preparing','completed','cancelled')),
  total_price numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 7. 訂單內的每一項餐點（保留「下單當下」的名稱與價格快照，
--    這樣以後菜單異動也不會影響到歷史訂單的內容）
-- ------------------------------------------------------------
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  dish_id uuid references dishes(id) on delete set null,
  dish_name text not null,
  unit_price numeric(10,2) not null,
  quantity int not null default 1,
  note text default '',
  subtotal numeric(10,2) not null
);

-- ------------------------------------------------------------
-- 8. 每一項餐點選擇的客製化內容（同樣保留快照）
-- ------------------------------------------------------------
create table order_item_options (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references order_items(id) on delete cascade,
  group_name text not null,
  choice_label text not null,
  extra_price numeric(10,2) not null default 0
);

-- ============================================================
-- Row Level Security（權限規則）
-- 設計原則：
--  - 顧客（匿名 anon）：可以「讀」菜單、可以「新增」訂單，但不能讀取別人的訂單
--  - 店家（登入後的 authenticated 帳號）：可以讀寫所有資料
-- ============================================================

alter table categories enable row level security;
alter table dishes enable row level security;
alter table option_groups enable row level security;
alter table option_choices enable row level security;
alter table dish_option_groups enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_item_options enable row level security;

-- 菜單相關：任何人（含顧客）可讀，只有登入店家可寫
create policy "menu_read_all" on categories for select using (true);
create policy "menu_write_auth" on categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "dishes_read_all" on dishes for select using (true);
create policy "dishes_write_auth" on dishes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "option_groups_read_all" on option_groups for select using (true);
create policy "option_groups_write_auth" on option_groups for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "option_choices_read_all" on option_choices for select using (true);
create policy "option_choices_write_auth" on option_choices for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "dish_option_groups_read_all" on dish_option_groups for select using (true);
create policy "dish_option_groups_write_auth" on dish_option_groups for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 訂單：顧客（含匿名）可以新增訂單，但只有登入店家可以讀取/更新/刪除
create policy "orders_insert_anyone" on orders for insert with check (true);
create policy "orders_manage_auth" on orders for select using (auth.role() = 'authenticated');
create policy "orders_update_auth" on orders for update using (auth.role() = 'authenticated');
create policy "orders_delete_auth" on orders for delete using (auth.role() = 'authenticated');

create policy "order_items_insert_anyone" on order_items for insert with check (true);
create policy "order_items_read_auth" on order_items for select using (auth.role() = 'authenticated');

create policy "order_item_options_insert_anyone" on order_item_options for insert with check (true);
create policy "order_item_options_read_auth" on order_item_options for select using (auth.role() = 'authenticated');

-- ============================================================
-- 範例資料（你之後可以在「店家後台」自行修改/刪除/新增）
-- ============================================================

-- 分類
insert into categories (name, sort_order) values
  ('主食 - 飯類', 1),
  ('主食 - 麵類', 2),
  ('小菜', 3),
  ('飲料', 4);

-- 預設客製化選項群組（套用到大部分菜色）
insert into option_groups (name, input_type, is_default, applies_to_dish_type, sort_order) values
  ('口味調整', 'multi', true, null, 1),
  ('辣度',     'single', true, null, 2),
  ('加飯',     'single', true, 'rice', 3),
  ('加麵',     'single', true, 'noodle', 4),
  ('加料',     'multi', true, null, 5),
  ('其他備註', 'text',  true, null, 6);

-- 口味調整：少油 / 少鹽 / 加重口味
insert into option_choices (group_id, label, extra_price, sort_order)
select option_groups.id, v.label, 0, v.sort_order from option_groups, (values
  ('少油', 1), ('少鹽', 2), ('加重口味', 3)
) as v(label, sort_order)
where option_groups.name = '口味調整';

-- 辣度：不辣 / 小辣 / 中辣 / 大辣
insert into option_choices (group_id, label, extra_price, sort_order)
select option_groups.id, v.label, 0, v.sort_order from option_groups, (values
  ('不辣', 1), ('小辣', 2), ('中辣', 3), ('大辣', 4)
) as v(label, sort_order)
where option_groups.name = '辣度';

-- 加飯：不加 / 加飯
insert into option_choices (group_id, label, extra_price, sort_order)
select option_groups.id, v.label, 0, v.sort_order from option_groups, (values
  ('不加飯', 1), ('加飯', 2)
) as v(label, sort_order)
where option_groups.name = '加飯';

-- 加麵：不加 / 加麵
insert into option_choices (group_id, label, extra_price, sort_order)
select option_groups.id, v.label, 0, v.sort_order from option_groups, (values
  ('不加麵', 1), ('加麵', 2)
) as v(label, sort_order)
where option_groups.name = '加麵';

-- 加料：加沙茶醬 +5 / 加番茄醬 +5
insert into option_choices (group_id, label, extra_price, sort_order)
select option_groups.id, v.label, v.extra_price, v.sort_order from option_groups, (values
  ('加沙茶醬', 5, 1), ('加番茄醬', 5, 2)
) as v(label, extra_price, sort_order)
where option_groups.name = '加料';

-- 其他備註：文字輸入框沒有固定選項，但仍建立一個佔位選項供前端判斷有此群組
insert into option_choices (group_id, label, extra_price, sort_order)
select id, '', 0, 1 from option_groups where option_groups.name = '其他備註';

-- 範例菜色
insert into dishes (category_id, name, description, price, dish_type, sort_order)
select id, '招牌滷肉飯', '經典台式滷肉飯', 60, 'rice', 1 from categories where name = '主食 - 飯類';
insert into dishes (category_id, name, description, price, dish_type, sort_order)
select id, '雞腿飯', '香煎雞腿配白飯', 95, 'rice', 2 from categories where name = '主食 - 飯類';
insert into dishes (category_id, name, description, price, dish_type, sort_order)
select id, '牛肉炒麵', '嫩牛肉炒麵', 110, 'noodle', 1 from categories where name = '主食 - 麵類';
insert into dishes (category_id, name, description, price, dish_type, sort_order)
select id, '陽春麵', '簡單樸實的好味道', 50, 'noodle', 2 from categories where name = '主食 - 麵類';
insert into dishes (category_id, name, description, price, dish_type, sort_order)
select id, '燙青菜', '時令青菜', 35, 'other', 1 from categories where name = '小菜';
insert into dishes (category_id, name, description, price, dish_type, sort_order)
select id, '紅茶', '冰/熱皆可', 25, 'other', 1 from categories where name = '飲料';
