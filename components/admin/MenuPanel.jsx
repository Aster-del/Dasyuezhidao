"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const DISH_TYPE_LABEL = { rice: "飯類", noodle: "麵類", other: "其他" };

export default function MenuPanel() {
  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [optionGroups, setOptionGroups] = useState([]);
  const [dishOptionGroups, setDishOptionGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  const [editingDishId, setEditingDishId] = useState(null);
  const [dishForm, setDishForm] = useState(null);
  const [addingForCategory, setAddingForCategory] = useState(null);

  async function loadAll() {
    const [c, d, og, dog] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("dishes").select("*").order("sort_order"),
      supabase.from("option_groups").select("*").order("sort_order"),
      supabase.from("dish_option_groups").select("*"),
    ]);
    setCategories(c.data || []);
    setDishes(d.data || []);
    setOptionGroups(og.data || []);
    setDishOptionGroups(dog.data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  // ---------- 分類 ----------
  async function addCategory() {
    if (!newCategoryName.trim()) return;
    await supabase
      .from("categories")
      .insert({ name: newCategoryName.trim(), sort_order: categories.length + 1 });
    setNewCategoryName("");
    loadAll();
  }

  async function saveCategory(id) {
    await supabase.from("categories").update({ name: editingCategoryName.trim() }).eq("id", id);
    setEditingCategoryId(null);
    loadAll();
  }

  async function deleteCategory(id) {
    if (!confirm("刪除分類會連同底下所有菜色一起刪除，確定嗎？")) return;
    await supabase.from("categories").delete().eq("id", id);
    loadAll();
  }

  // ---------- 菜色 ----------
  function startAddDish(categoryId) {
    setAddingForCategory(categoryId);
    setDishForm({
      name: "",
      description: "",
      price: "",
      dish_type: "other",
      is_available: true,
      category_id: categoryId,
      useDefaultOptions: true,
      selectedGroupIds: [],
    });
  }

  function startEditDish(dish) {
    const overrideIds = dishOptionGroups
      .filter((row) => row.dish_id === dish.id)
      .map((row) => row.group_id);
    setEditingDishId(dish.id);
    setAddingForCategory(null);
    setDishForm({
      name: dish.name,
      description: dish.description || "",
      price: dish.price,
      dish_type: dish.dish_type,
      is_available: dish.is_available,
      category_id: dish.category_id,
      useDefaultOptions: overrideIds.length === 0,
      selectedGroupIds: overrideIds,
    });
  }

  function cancelDishForm() {
    setEditingDishId(null);
    setAddingForCategory(null);
    setDishForm(null);
  }

  async function saveDish() {
    const payload = {
      name: dishForm.name.trim(),
      description: dishForm.description.trim(),
      price: Number(dishForm.price) || 0,
      dish_type: dishForm.dish_type,
      is_available: dishForm.is_available,
      category_id: dishForm.category_id,
    };
    if (!payload.name) return;

    let dishId = editingDishId;
    if (editingDishId) {
      await supabase.from("dishes").update(payload).eq("id", editingDishId);
    } else {
      const { data } = await supabase
        .from("dishes")
        .insert({ ...payload, sort_order: dishes.length + 1 })
        .select()
        .single();
      dishId = data?.id;
    }

    if (dishId) {
      await supabase.from("dish_option_groups").delete().eq("dish_id", dishId);
      if (!dishForm.useDefaultOptions && dishForm.selectedGroupIds.length > 0) {
        await supabase
          .from("dish_option_groups")
          .insert(dishForm.selectedGroupIds.map((groupId) => ({ dish_id: dishId, group_id: groupId })));
      }
    }

    cancelDishForm();
    loadAll();
  }

  async function deleteDish(id) {
    if (!confirm("確定要刪除這個菜色嗎？")) return;
    await supabase.from("dishes").delete().eq("id", id);
    loadAll();
  }

  async function toggleAvailable(dish) {
    await supabase.from("dishes").update({ is_available: !dish.is_available }).eq("id", dish.id);
    loadAll();
  }

  function toggleGroupSelection(groupId) {
    setDishForm((prev) => {
      const has = prev.selectedGroupIds.includes(groupId);
      return {
        ...prev,
        selectedGroupIds: has
          ? prev.selectedGroupIds.filter((id) => id !== groupId)
          : [...prev.selectedGroupIds, groupId],
      };
    });
  }

  if (loading) return <p className="text-ink/50">載入中…</p>;

  return (
    <div className="space-y-8">
      {/* 分類管理 */}
      <section>
        <h2 className="font-display text-lg text-ink mb-3">分類</h2>
        <div className="space-y-2 mb-3">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2 bg-white border border-line rounded-lg px-3 py-2">
              {editingCategoryId === cat.id ? (
                <>
                  <input
                    value={editingCategoryName}
                    onChange={(e) => setEditingCategoryName(e.target.value)}
                    className="flex-1 border border-line rounded px-2 py-1 text-sm"
                  />
                  <button onClick={() => saveCategory(cat.id)} className="text-sm text-leaf font-semibold">
                    儲存
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-ink">{cat.name}</span>
                  <button
                    onClick={() => {
                      setEditingCategoryId(cat.id);
                      setEditingCategoryName(cat.name);
                    }}
                    className="text-sm text-ink/50"
                  >
                    編輯
                  </button>
                  <button onClick={() => deleteCategory(cat.id)} className="text-sm text-clay/80">
                    刪除
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="新增分類名稱"
            className="flex-1 border border-line rounded-lg px-3 py-2 text-sm bg-white"
          />
          <button onClick={addCategory} className="bg-ink text-cream rounded-lg px-4 text-sm font-semibold">
            新增
          </button>
        </div>
      </section>

      {/* 菜色管理 */}
      <section>
        <h2 className="font-display text-lg text-ink mb-3">菜色</h2>
        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat.id}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-ink/70 text-sm">{cat.name}</h3>
                <button
                  onClick={() => startAddDish(cat.id)}
                  className="text-sm text-clay font-semibold"
                >
                  ＋ 新增菜色
                </button>
              </div>

              <div className="space-y-2">
                {dishes
                  .filter((d) => d.category_id === cat.id)
                  .map((dish) => (
                    <div key={dish.id} className="bg-white border border-line rounded-lg p-3">
                      {editingDishId === dish.id ? (
                        <DishForm
                          form={dishForm}
                          setForm={setDishForm}
                          optionGroups={optionGroups}
                          toggleGroupSelection={toggleGroupSelection}
                          onSave={saveDish}
                          onCancel={cancelDishForm}
                        />
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className={`font-semibold ${dish.is_available ? "text-ink" : "text-ink/40 line-through"}`}>
                              {dish.name}{" "}
                              <span className="text-xs font-normal text-ink/40">
                                ({DISH_TYPE_LABEL[dish.dish_type]})
                              </span>
                            </p>
                            <p className="text-sm text-clay">NT$ {dish.price}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <button onClick={() => toggleAvailable(dish)} className="text-xs text-ink/50">
                              {dish.is_available ? "下架" : "上架"}
                            </button>
                            <button onClick={() => startEditDish(dish)} className="text-xs text-ink/50">
                              編輯
                            </button>
                            <button onClick={() => deleteDish(dish.id)} className="text-xs text-clay/80">
                              刪除
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                {addingForCategory === cat.id && (
                  <div className="bg-white border border-line rounded-lg p-3">
                    <DishForm
                      form={dishForm}
                      setForm={setDishForm}
                      optionGroups={optionGroups}
                      toggleGroupSelection={toggleGroupSelection}
                      onSave={saveDish}
                      onCancel={cancelDishForm}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function DishForm({ form, setForm, optionGroups, toggleGroupSelection, onSave, onCancel }) {
  if (!form) return null;
  return (
    <div className="space-y-3">
      <input
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="菜色名稱"
        className="w-full border border-line rounded px-2 py-1.5 text-sm"
      />
      <input
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="描述（選填）"
        className="w-full border border-line rounded px-2 py-1.5 text-sm"
      />
      <div className="flex gap-2">
        <input
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          type="number"
          placeholder="價格"
          className="flex-1 border border-line rounded px-2 py-1.5 text-sm"
        />
        <select
          value={form.dish_type}
          onChange={(e) => setForm({ ...form, dish_type: e.target.value })}
          className="flex-1 border border-line rounded px-2 py-1.5 text-sm"
        >
          <option value="other">其他</option>
          <option value="rice">飯類（可加飯）</option>
          <option value="noodle">麵類（可加麵）</option>
        </select>
      </div>

      <div className="border-t border-line pt-2">
        <label className="text-xs font-semibold text-ink/60 mb-1 block">客製化選項</label>
        <div className="flex gap-3 mb-2">
          <button
            type="button"
            onClick={() => setForm({ ...form, useDefaultOptions: true })}
            className={`text-xs px-2 py-1 rounded-full border ${
              form.useDefaultOptions ? "bg-ink text-cream border-ink" : "border-line text-ink/60"
            }`}
          >
            使用預設選項
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, useDefaultOptions: false })}
            className={`text-xs px-2 py-1 rounded-full border ${
              !form.useDefaultOptions ? "bg-ink text-cream border-ink" : "border-line text-ink/60"
            }`}
          >
            自訂這個菜色的選項
          </button>
        </div>
        {!form.useDefaultOptions && (
          <div className="flex flex-wrap gap-2">
            {optionGroups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGroupSelection(g.id)}
                className={`text-xs px-2 py-1 rounded-full border ${
                  form.selectedGroupIds.includes(g.id)
                    ? "bg-saffron text-ink border-saffron"
                    : "border-line text-ink/60"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onSave} className="bg-leaf text-cream rounded-full px-4 py-1.5 text-sm font-semibold">
          儲存
        </button>
        <button onClick={onCancel} className="text-sm text-ink/50">
          取消
        </button>
      </div>
    </div>
  );
}
