"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function CheckoutModal({ items, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  async function handleSubmit() {
    if (!name.trim() || !phone.trim()) {
      setError("請填寫姓名與電話");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          payment_method: paymentMethod,
          total_price: total,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      for (const item of items) {
        const { data: orderItem, error: itemError } = await supabase
          .from("order_items")
          .insert({
            order_id: order.id,
            dish_id: item.dish_id,
            dish_name: item.dish_name,
            unit_price: item.unit_price,
            quantity: item.quantity,
            note: item.note || "",
            subtotal: item.subtotal,
          })
          .select()
          .single();

        if (itemError) throw itemError;

        if (item.options.length > 0) {
          const rows = item.options.map((o) => ({
            order_item_id: orderItem.id,
            group_name: o.group_name,
            choice_label: o.choice_label,
            extra_price: o.extra_price,
          }));
          const { error: optError } = await supabase.from("order_item_options").insert(rows);
          if (optError) throw optError;
        }
      }

      onSuccess(order);
    } catch (err) {
      console.error(err);
      setError("送出失敗，請檢查網路連線後再試一次");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full sm:max-w-md rounded-t-card sm:rounded-card bg-cream shadow-xl">
        <div className="border-b border-line px-5 py-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">結帳資訊</h2>
          <button onClick={onClose} className="text-ink/50 hover:text-ink text-2xl leading-none px-2">
            ×
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-sm font-semibold text-ink mb-1 block">姓名</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-clay/40"
              placeholder="您的姓名"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink mb-1 block">電話</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-clay/40"
              placeholder="0912345678"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink mb-2 block">付款方式（現場付款）</label>
            <div className="flex gap-2">
              <button
                onClick={() => setPaymentMethod("cash")}
                className={`flex-1 py-2 rounded-full border text-sm ${
                  paymentMethod === "cash"
                    ? "bg-leaf text-cream border-leaf"
                    : "border-line text-ink/70"
                }`}
              >
                現金
              </button>
              <button
                onClick={() => setPaymentMethod("transfer")}
                className={`flex-1 py-2 rounded-full border text-sm ${
                  paymentMethod === "transfer"
                    ? "bg-leaf text-cream border-leaf"
                    : "border-line text-ink/70"
                }`}
              >
                現場轉帳
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-clay">{error}</p>}

          <div className="flex justify-between items-center pt-2 border-t border-line">
            <span className="text-ink/70">應付金額</span>
            <span className="font-display text-2xl text-ink">NT$ {total.toFixed(0)}</span>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-line">
          <button
            disabled={submitting}
            onClick={handleSubmit}
            className="w-full bg-clay text-cream rounded-full py-3 font-semibold disabled:opacity-50"
          >
            {submitting ? "送出中…" : "確認送出訂單"}
          </button>
        </div>
      </div>
    </div>
  );
}
