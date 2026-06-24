"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("帳號或密碼錯誤");
      return;
    }
    router.push("/admin/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-white border border-line rounded-card p-6">
        <h1 className="font-display text-2xl text-ink mb-1">店家後台</h1>
        <p className="text-ink/50 text-sm mb-6">請登入以管理菜單與訂單</p>

        <label className="text-sm font-semibold text-ink mb-1 block">帳號（Email）</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          className="w-full rounded-lg border border-line px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-clay/40"
          required
        />

        <label className="text-sm font-semibold text-ink mb-1 block">密碼</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          className="w-full rounded-lg border border-line px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-clay/40"
          required
        />

        {error && <p className="text-sm text-clay mb-4">{error}</p>}

        <button
          disabled={loading}
          className="w-full bg-ink text-cream rounded-full py-3 font-semibold disabled:opacity-50"
        >
          {loading ? "登入中…" : "登入"}
        </button>
      </form>
    </div>
  );
}
