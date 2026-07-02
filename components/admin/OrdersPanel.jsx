"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const STATUS_LABEL = {
  pending: "待處理",
  preparing: "製作中",
  completed: "已完成",
  cancelled: "已取消",
};

const STATUS_FLOW = ["pending", "preparing", "completed"];
const PAYMENT_LABEL = { cash: "現金", transfer: "現場轉帳" };
const ORDER_TYPE_LABEL = {
  dine_in: "內用",
  takeout_wait: "外帶・現場等",
  takeout_later: "外帶・稍後取",
};

function formatOrderTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const orderDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const timeStr = date.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" });

  if (orderDay.getTime() === today.getTime()) return `今天 ${timeStr}`;
  if (orderDay.getTime() === yesterday.getTime()) return `昨天 ${timeStr}`;
  return date.toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" }) + ` ${timeStr}`;
}

function playNotifySound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    gain.gain.value = 0.18;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
    osc.stop(ctx.currentTime + 0.45);
  } catch { /* 靜默忽略 */ }
}

export default function OrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [flashId, setFlashId] = useState(null);

  async function fetchOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*, order_item_options(*))")
      .order("created_at", { ascending: false });
    if (!error) setOrders(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          playNotifySound();
          setFlashId(payload.new.id);
          setTimeout(fetchOrders, 700);
          setTimeout(() => setFlashId(null), 5000);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function updateStatus(orderId, status) {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    await supabase.from("orders").update({ status }).eq("id", orderId);
  }

  const filtered = orders.filter((o) => (filter === "all" ? true : o.status === filter));

  if (loading) return <p className="text-ink/50">載入訂單中…</p>;

  return (
    <div>
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {["pending", "preparing", "completed", "cancelled", "all"].map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-sm border shrink-0 ${
              filter === key ? "bg-ink text-cream border-ink" : "border-line text-ink/60"
            }`}
          >
            {key === "all" ? "全部" : STATUS_LABEL[key]}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-ink/40 text-sm py-10 text-center">目前沒有符合條件的訂單</p>
      )}

      <div className="space-y-3">
        {filtered.map((order) => (
          <div
            key={order.id}
            className={`border rounded-card p-4 bg-white transition ${
              flashId === order.id ? "border-clay ring-2 ring-clay/40" : "border-line"
            }`}
          >
            {/* 頂部：姓名、電話、時間、金額 */}
            <div className="flex justify-between items-start mb-1">
              <div>
                <p className="font-semibold text-ink">
                  {order.customer_name} · {order.customer_phone}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <span className="text-xs bg-line text-ink/70 px-2 py-0.5 rounded-full">
                    {formatOrderTime(order.created_at)}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    order.order_type === "dine_in"
                      ? "bg-saffron/20 text-saffron"
                      : "bg-leaf/20 text-leaf"
                  }`}>
                    {ORDER_TYPE_LABEL[order.order_type] || order.order_type}
                    {order.order_type === "dine_in" && order.table_number
                      ? `・${order.table_number}`
                      : ""}
                  </span>
                  <span className="text-xs text-ink/40">
                    {PAYMENT_LABEL[order.payment_method]}
                  </span>
                </div>
              </div>
              <span className="text-sm font-semibold text-clay shrink-0 ml-2">
                NT$ {Number(order.total_price).toFixed(0)}
              </span>
            </div>

            {/* 餐點明細 */}
            <div className="border-t border-line pt-2 mt-2 space-y-1.5">
              {(order.order_items || []).map((item) => (
                <div key={item.id} className="text-sm">
                  <p className="text-ink">{item.dish_name} × {item.quantity}</p>
                  {item.order_item_options?.length > 0 && (
                    <p className="text-ink/50 text-xs">
                      {item.order_item_options.map((o) => o.choice_label).join("、")}
                    </p>
                  )}
                  {item.note && <p className="text-ink/50 text-xs">備註：{item.note}</p>}
                </div>
              ))}
            </div>

            {/* IP 位置 */}
            {order.customer_ip && (
              <p className="text-xs text-ink/30 mt-2">IP：{order.customer_ip}</p>
            )}

            {/* 狀態控制 */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-line flex-wrap">
              <span className="text-xs text-ink/50 mr-1">狀態</span>
              {order.status === "cancelled" ? (
                <span className="text-sm text-ink/40">已取消</span>
              ) : (
                STATUS_FLOW.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(order.id, s)}
                    className={`px-3 py-1 rounded-full text-xs border ${
                      order.status === s
                        ? "bg-leaf text-cream border-leaf"
                        : "border-line text-ink/60"
                    }`}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))
              )}
              {order.status !== "cancelled" && order.status !== "completed" && (
                <button
                  onClick={() => updateStatus(order.id, "cancelled")}
                  className="px-3 py-1 rounded-full text-xs border border-line text-clay/80 ml-auto"
                >
                  取消訂單
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
