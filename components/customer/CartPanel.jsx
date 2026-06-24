"use client";

export default function CartPanel({ items, onRemove, onClose, onCheckout }) {
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-card sm:rounded-card bg-cream shadow-xl flex flex-col">
        <div className="sticky top-0 bg-cream border-b border-line px-5 py-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">購物車</h2>
          <button onClick={onClose} className="text-ink/50 hover:text-ink text-2xl leading-none px-2">
            ×
          </button>
        </div>

        <div className="flex-1 px-5 py-4 space-y-3">
          {items.length === 0 && (
            <p className="text-ink/50 text-sm py-8 text-center">購物車是空的，先去挑選餐點吧</p>
          )}
          {items.map((item) => (
            <div key={item.tempId} className="border border-line rounded-lg p-3 bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-ink">
                    {item.dish_name} × {item.quantity}
                  </p>
                  {item.options.length > 0 && (
                    <p className="text-xs text-ink/60 mt-1">
                      {item.options.map((o) => o.choice_label).join("、")}
                    </p>
                  )}
                  {item.note && <p className="text-xs text-ink/50 mt-0.5">備註：{item.note}</p>}
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="font-semibold text-ink">NT$ {item.subtotal.toFixed(0)}</p>
                  <button
                    onClick={() => onRemove(item.tempId)}
                    className="text-xs text-clay/80 hover:text-clay mt-1"
                  >
                    移除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 bg-cream border-t border-line px-5 py-4 space-y-3">
          <div className="flex justify-between text-ink">
            <span>總計</span>
            <span className="font-display text-lg">NT$ {total.toFixed(0)}</span>
          </div>
          <button
            disabled={items.length === 0}
            onClick={onCheckout}
            className="w-full bg-clay text-cream rounded-full py-3 font-semibold disabled:opacity-40"
          >
            前往結帳
          </button>
        </div>
      </div>
    </div>
  );
}
