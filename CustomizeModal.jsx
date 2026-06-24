"use client";

import { useMemo, useState } from "react";

// groupsForDish: [{ group: {id, name, input_type}, choices: [{id, label, extra_price}] }]
export default function CustomizeModal({ dish, groupsForDish, onClose, onConfirm }) {
  const [quantity, setQuantity] = useState(1);
  // selections: { [groupId]: choiceId (single) | choiceId[] (multi) | string (text) }
  const [selections, setSelections] = useState(() => {
    const init = {};
    groupsForDish.forEach(({ group, choices }) => {
      if (group.input_type === "multi") init[group.id] = [];
      else if (group.input_type === "text") init[group.id] = "";
      else init[group.id] = choices[0]?.id ?? null;
    });
    return init;
  });

  const extraPerUnit = useMemo(() => {
    let sum = 0;
    groupsForDish.forEach(({ group, choices }) => {
      if (group.input_type === "single") {
        const choice = choices.find((c) => c.id === selections[group.id]);
        if (choice) sum += Number(choice.extra_price || 0);
      } else if (group.input_type === "multi") {
        (selections[group.id] || []).forEach((id) => {
          const choice = choices.find((c) => c.id === id);
          if (choice) sum += Number(choice.extra_price || 0);
        });
      }
    });
    return sum;
  }, [selections, groupsForDish]);

  const unitTotal = Number(dish.price) + extraPerUnit;
  const subtotal = unitTotal * quantity;

  function toggleMulti(groupId, choiceId) {
    setSelections((prev) => {
      const current = prev[groupId] || [];
      const next = current.includes(choiceId)
        ? current.filter((id) => id !== choiceId)
        : [...current, choiceId];
      return { ...prev, [groupId]: next };
    });
  }

  function setSingle(groupId, choiceId) {
    setSelections((prev) => ({ ...prev, [groupId]: choiceId }));
  }

  function setText(groupId, value) {
    setSelections((prev) => ({ ...prev, [groupId]: value }));
  }

  function handleConfirm() {
    const options = [];
    let note = "";

    groupsForDish.forEach(({ group, choices }) => {
      if (group.input_type === "single") {
        const choice = choices.find((c) => c.id === selections[group.id]);
        if (choice) {
          options.push({
            group_name: group.name,
            choice_label: choice.label,
            extra_price: Number(choice.extra_price || 0),
          });
        }
      } else if (group.input_type === "multi") {
        (selections[group.id] || []).forEach((id) => {
          const choice = choices.find((c) => c.id === id);
          if (choice) {
            options.push({
              group_name: group.name,
              choice_label: choice.label,
              extra_price: Number(choice.extra_price || 0),
            });
          }
        });
      } else if (group.input_type === "text") {
        const value = (selections[group.id] || "").trim();
        if (value) note = note ? `${note}；${value}` : value;
      }
    });

    onConfirm({
      tempId: crypto.randomUUID(),
      dish_id: dish.id,
      dish_name: dish.name,
      unit_price: Number(dish.price),
      quantity,
      note,
      options,
      subtotal: Math.round(subtotal * 100) / 100,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-card sm:rounded-card bg-cream shadow-xl">
        <div className="sticky top-0 bg-cream border-b border-line px-5 py-4 flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl text-ink">{dish.name}</h2>
            <p className="text-sm text-ink/60 mt-0.5">NT$ {dish.price}</p>
          </div>
          <button
            onClick={onClose}
            className="text-ink/50 hover:text-ink text-2xl leading-none px-2"
            aria-label="關閉"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {groupsForDish.map(({ group, choices }) => (
            <div key={group.id}>
              <p className="text-sm font-semibold text-ink mb-2">{group.name}</p>

              {group.input_type === "single" && (
                <div className="flex flex-wrap gap-2">
                  {choices.map((choice) => (
                    <button
                      key={choice.id}
                      onClick={() => setSingle(group.id, choice.id)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition ${
                        selections[group.id] === choice.id
                          ? "bg-clay text-cream border-clay"
                          : "border-line text-ink/70 hover:border-clay/50"
                      }`}
                    >
                      {choice.label}
                      {choice.extra_price > 0 ? ` +${choice.extra_price}` : ""}
                    </button>
                  ))}
                </div>
              )}

              {group.input_type === "multi" && (
                <div className="flex flex-wrap gap-2">
                  {choices.map((choice) => {
                    const checked = (selections[group.id] || []).includes(choice.id);
                    return (
                      <button
                        key={choice.id}
                        onClick={() => toggleMulti(group.id, choice.id)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition ${
                          checked
                            ? "bg-saffron text-ink border-saffron"
                            : "border-line text-ink/70 hover:border-saffron/60"
                        }`}
                      >
                        {choice.label}
                        {choice.extra_price > 0 ? ` +${choice.extra_price}元` : ""}
                      </button>
                    );
                  })}
                </div>
              )}

              {group.input_type === "text" && (
                <textarea
                  value={selections[group.id] || ""}
                  onChange={(e) => setText(group.id, e.target.value)}
                  placeholder="有什麼想跟店家說的嗎？（選填）"
                  rows={2}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-clay/40"
                />
              )}
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 bg-cream border-t border-line px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-9 h-9 rounded-full border border-line text-ink text-lg"
              aria-label="減少數量"
            >
              −
            </button>
            <span className="w-6 text-center font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-9 h-9 rounded-full border border-line text-ink text-lg"
              aria-label="增加數量"
            >
              +
            </button>
          </div>
          <button
            onClick={handleConfirm}
            className="flex-1 bg-clay text-cream rounded-full py-3 font-semibold"
          >
            加入購物車 · NT$ {subtotal.toFixed(0)}
          </button>
        </div>
      </div>
    </div>
  );
}
