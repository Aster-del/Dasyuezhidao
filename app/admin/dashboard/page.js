"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import OrdersPanel from "../../../components/admin/OrdersPanel";
import MenuPanel from "../../../components/admin/MenuPanel";
import OptionGroupsPanel from "../../../components/admin/OptionGroupsPanel";

const TABS = [
  { key: "orders", label: "訂單管理" },
  { key: "menu", label: "菜單管理" },
  { key: "options", label: "客製化選項" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [tab, setTab] = useState("orders");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/admin");
      } else {
        setCheckingAuth(false);
      }
    });
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/admin");
  }

  if (checkingAuth) {
    return <div className="min-h-screen flex items-center justify-center text-ink/50">確認登入狀態…</div>;
  }

  return (
    <div className="min-h-screen">
      <header className="bg-ink text-cream px-5 py-4 flex items-center justify-between">
        <h1 className="font-display text-xl">店家後台</h1>
        <button onClick={handleLogout} className="text-sm text-cream/70 hover:text-cream">
          登出
        </button>
      </header>

      <nav className="bg-cream border-b border-line px-4 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-semibold border-b-2 shrink-0 ${
              tab === t.key ? "border-clay text-ink" : "border-transparent text-ink/40"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="px-4 py-5">
        {tab === "orders" && <OrdersPanel />}
        {tab === "menu" && <MenuPanel />}
        {tab === "options" && <OptionGroupsPanel />}
      </main>
    </div>
  );
}
