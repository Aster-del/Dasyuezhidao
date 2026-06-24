"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const TYPE_LABEL = { single: "單選", multi: "多選", text: "文字輸入" };
const DISH_TYPE_LABEL = { null: "不限菜色", rice: "限飯類", noodle: "限麵類" };

export default function OptionGroupsPanel() {
  const [groups, setGroups] = useState([]);
  const [choices, setChoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newGroup, setNewGroup] = useState({
    name: "",
    input_type: "single",
    is_default: true,
    applies_to_dish_type: "",
  });

  const [newChoiceDraft, setNewChoiceDraft] = useState({});

  async function loadAll() {
    const [g, c] = await Promise.all([
      supabase.from("option_groups").select("*").order("sort_order"),
      supabase.from("option_choices").select("*").order("sort_order"),
    ]);
    setGroups(g.data || []);
    setChoices(c.data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function addGroup() {
    if (!newGroup.name.trim()) return;
    await supabase.from("option_groups").insert({
      name: newGroup.name.trim(),
      input_type: newGroup.input_type,
      is_default: newGroup.is_default,
      applies_to_dish_type: newGroup.applies_to_dish_type || null,
      sort_order: groups.length + 1,
    });
    setNewGroup({ name: "", input_type: "single", is_default: true, applies_to_dish_type: "" });
    loadAll();
  }

  async function deleteGroup(id) {
    if (!confirm("刪除這個選項群組會連同底下的選項一起刪除，確定嗎？")) return;
    await supabase.from("option_groups").delete().eq("id", id);
    loadAll();
  }

  async function toggleDefault(group) {
    await supabase.from("option_groups").update({ is_default: !group.is_default }).eq("id", group.id);
    loadAll();
  }

  async function addChoice(groupId) {
    const draft = newChoiceDraft[groupId];
    if (!draft || !draft.label?.trim()) return;
    await supabase.from("option_choices").insert({
      group_id: groupId,
      label: draft.label.trim(),
      extra_price: Number(draft.extra_price) || 0,
      sort_order: choices.filter((c) => c.group_id === groupId).length + 1,
    });
    setNewChoiceDraft((prev) => ({ ...prev, [groupId]: { label: "", extra_price: "" } }));
    loadAll();
  }

  async function deleteChoice(id) {
    await supabase.from("option_choices").delete().eq("id", id);
    loadAll();
  }

  if (loading) return <p className="text-ink/50">載入中…</p>;

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink/60">
        「預設套用」的群組會自動出現在所有菜色上；如果某個菜色需要不同的客製化選項，可以到「菜單管理」中針對那個菜色選擇自訂選項。
      </p>

      {groups.map((group) => (
        <div key={group.id} className="bg-white border border-line rounded-card p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-semibold text-ink">{group.name}</p>
              <p className="text-xs text-ink/50 mt-0.5">
                {TYPE_LABEL[group.input_type]} ·{" "}
                {group.applies_to_dish_type ? DISH_TYPE_LABEL[group.applies_to_dish_type] : "不限菜色"}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => toggleDefault(group)}
                className={`text-xs px-2 py-1 rounded-full border ${
                  group.is_default ? "bg-leaf text-cream border-leaf" : "border-line text-ink/50"
                }`}
              >
                {group.is_default ? "預設套用中" : "未預設套用"}
              </button>
              <button onClick={() => deleteGroup(group.id)} className="text-xs text-clay/80">
                刪除群組
              </button>
            </div>
          </div>

          {group.input_type === "text" ? (
            <p className="text-xs text-ink/40">文字輸入類型沒有固定選項，顧客可以自由輸入備註內容。</p>
          ) : (
            <div className="space-y-1.5">
              {choices
                .filter((c) => c.group_id === group.id && c.label !== "")
                .map((choice) => (
                  <div key={choice.id} className="flex items-center justify-between text-sm border-t border-line pt-1.5">
                    <span className="text-ink">
                      {choice.label}
                      {choice.extra_price > 0 ? ` (+${choice.extra_price}元)` : ""}
                    </span>
                    <button onClick={() => deleteChoice(choice.id)} className="text-xs text-clay/80">
                      刪除
                    </button>
                  </div>
                ))}

              <div className="flex gap-2 pt-2">
                <input
                  value={newChoiceDraft[group.id]?.label || ""}
                  onChange={(e) =>
                    setNewChoiceDraft((prev) => ({
                      ...prev,
                      [group.id]: { ...prev[group.id], label: e.target.value },
                    }))
                  }
                  placeholder="選項名稱"
                  className="flex-1 border border-line rounded px-2 py-1 text-sm"
                />
                <input
                  value={newChoiceDraft[group.id]?.extra_price || ""}
                  onChange={(e) =>
                    setNewChoiceDraft((prev) => ({
                      ...prev,
                      [group.id]: { ...prev[group.id], extra_price: e.target.value },
                    }))
                  }
                  type="number"
                  placeholder="加價"
                  className="w-20 border border-line rounded px-2 py-1 text-sm"
                />
                <button
                  onClick={() => addChoice(group.id)}
                  className="bg-ink text-cream rounded px-3 text-sm shrink-0"
                >
                  新增
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="bg-white border border-line rounded-card p-4">
        <p className="font-semibold text-ink mb-3">新增客製化選項群組</p>
        <div className="space-y-2">
          <input
            value={newGroup.name}
            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            placeholder="群組名稱，例如：甜度"
            className="w-full border border-line rounded px-2 py-1.5 text-sm"
          />
          <div className="flex gap-2">
            <select
              value={newGroup.input_type}
              onChange={(e) => setNewGroup({ ...newGroup, input_type: e.target.value })}
              className="flex-1 border border-line rounded px-2 py-1.5 text-sm"
            >
              <option value="single">單選</option>
              <option value="multi">多選</option>
              <option value="text">文字輸入</option>
            </select>
            <select
              value={newGroup.applies_to_dish_type}
              onChange={(e) => setNewGroup({ ...newGroup, applies_to_dish_type: e.target.value })}
              className="flex-1 border border-line rounded px-2 py-1.5 text-sm"
            >
              <option value="">不限菜色</option>
              <option value="rice">限飯類</option>
              <option value="noodle">限麵類</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={newGroup.is_default}
              onChange={(e) => setNewGroup({ ...newGroup, is_default: e.target.checked })}
            />
            預設套用到所有符合條件的菜色
          </label>
          <button onClick={addGroup} className="bg-clay text-cream rounded-full px-4 py-1.5 text-sm font-semibold">
            新增群組
          </button>
        </div>
      </div>
    </div>
  );
}
