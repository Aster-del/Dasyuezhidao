"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import CustomizeModal from "../components/customer/CustomizeModal";
import CartPanel from "../components/customer/CartPanel";
import CheckoutModal from "../components/customer/CheckoutModal";

export default function CustomerPage() {
  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [optionGroups, setOptionGroups] = useState([]);
  const [optionChoices, setOptionChoices] = useState([]);
  const [dishOptionGroups, setDishOptionGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [customizingDish, setCustomizingDish] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  useEffect(() => {
    async function load() {
      const [c, d, og, oc, dog] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("dishes").select("*").eq("is_available", true).order("sort_order"),
        supabase.from("option_groups").select("*").order("sort_order"),
        supabase.from("option_choices").select("*").order("sort_order"),
        supabase.from("dish_option_groups").select("*"),
      ]);
      setCategories(c.data || []);
      setDishes(d.data || []);
      setOptionGroups(og.data || []);
      setOptionChoices(oc.data || []);
      setDishOptionGroups(dog.data || []);
      if (c.data && c.data.length > 0) setActiveCategoryId(c.data[0].id);
      setLoading(false);
    }
    load();
  }, []);

  function groupsForDish(dish) {
    const overrideIds = dishOptionGroups
      .filter((row) => row.dish_id === dish.id)
      .map((row) => row.group_id);

    const groupIds =
      overrideIds.length > 0
        ? overrideIds
        : optionGroups
            .filter(
              (g) =>
                g.is_default &&
                (!g.applies_to_dish_type || g.applies_to_dish_type === dish.dish_type)
            )
            .map((g) => g.id);

    return groupIds
      .map((id) => optionGroups.find((g) => g.id === id))
      .filter(Boolean)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((group) => ({
        group,
        choices: optionChoices
          .filter((c) => c.group_id === group.id && c.label !== "")
          .sort((a, b) => a.sort_order - b.sort_order),
      }));
  }

  const dishesInCategory = useMemo(
    () => dishes.filter((d) => d.category_id === activeCategoryId),
    [dishes, activeCategoryId]
  );

  function addToCart(item) {
    setCart((prev) => [...prev, item]);
    setCustomizingDish(null);
  }

  function removeFromCart(tempId) {
    setCart((prev) => prev.filter((i) => i.tempId !== tempId));
  }

  function handleOrderSuccess(order) {
    setCompletedOrder(order);
    setCart([]);
    setShowCheckout(false);
    setShowCart(false);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-ink/50">載入菜單中…</div>;
  }

  if (completedOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <h1 className="font-display text-3xl text-ink mb-2">訂單已送出</h1>
          <p className="text-ink/60 mb-6">
            請至現場以{completedOrder.payment_method === "cash" ? "現金" : "轉帳"}付款，店家準備好餐點後會通知您。
          </p>
          <button
            onClick={() => setCompletedOrder(null)}
            className="bg-clay text-cream rounded-full px-6 py-3 font-semibold"
          >
            再點一份
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-ink text-cream px-5 py-6">
        <h1 className="font-display text-2xl">今日菜單</h1>
        <p className="text-cream/60 text-sm mt-1">點選餐點即可客製化內容</p>
      </header>

      <nav className="sticky top-0 z-30 bg-cream border-b border-line overflow-x-auto whitespace-nowrap px-4 py-3 flex gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategoryId(cat.id)}
            className={`px-4 py-1.5 rounded-full text-sm shrink-0 border ${
              activeCategoryId === cat.id
                ? "bg-ink text-cream border-ink"
                : "border-line text-ink/70"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </nav>

      <main className="px-4 py-4 grid gap-3 sm:grid-cols-2">
        {dishesInCategory.length === 0 && (
          <p className="text-ink/40 text-sm col-span-full text-center py-10">這個分類目前沒有餐點</p>
        )}
        {dishesInCategory.map((dish) => (
          <button
            key={dish.id}
            onClick={() => setCustomizingDish(dish)}
            className="text-left bg-white border border-line rounded-card p-4 hover:border-clay/50 transition"
          >
            <p className="font-semibold text-ink">{dish.name}</p>
            {dish.description && <p className="text-sm text-ink/50 mt-1">{dish.description}</p>}
            <p className="text-clay font-display mt-2">NT$ {dish.price}</p>
          </button>
        ))}
      </main>

      {cart.length > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-5 left-4 right-4 bg-clay text-cream rounded-full py-3.5 font-semibold shadow-lg flex items-center justify-center gap-2"
        >
          查看購物車（{cart.length}）· NT$ {cart.reduce((s, i) => s + i.subtotal, 0).toFixed(0)}
        </button>
      )}

      {customizingDish && (
        <CustomizeModal
          dish={customizingDish}
          groupsForDish={groupsForDish(customizingDish)}
          onClose={() => setCustomizingDish(null)}
          onConfirm={addToCart}
        />
      )}

      {showCart && (
        <CartPanel
          items={cart}
          onRemove={removeFromCart}
          onClose={() => setShowCart(false)}
          onCheckout={() => {
            setShowCart(false);
            setShowCheckout(true);
          }}
        />
      )}

      {showCheckout && (
        <CheckoutModal
          items={cart}
          onClose={() => setShowCheckout(false)}
          onSuccess={handleOrderSuccess}
        />
      )}
    </div>
  );
}
