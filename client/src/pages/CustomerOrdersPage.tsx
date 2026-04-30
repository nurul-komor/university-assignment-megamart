import { useEffect, useState } from "react";
import { http } from "../api/http";
import type { Order } from "../types";

export function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    http
      .get<{ orders: Order[] }>("/orders")
      .then((res) => {
        setOrders(res.data.orders || []);
        setError("");
      })
      .catch(() => setError("Unable to load your orders."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">My Orders</h1>
      {loading && <p className="text-slate-500">Loading orders...</p>}
      {error && <p className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {!loading && !orders.length && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No orders found yet.
        </div>
      )}
      <div className="space-y-4">
        {orders.map((order) => (
          <article key={order._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">Order ID: {order._id}</p>
              <p className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase text-emerald-700">
                {order.status}
              </p>
            </div>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={`${order._id}-${index}`} className="flex items-center justify-between text-sm">
                  <span>
                    {item.title} x {item.quantity}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t pt-3 text-right font-semibold">Total: ${order.totalAmount.toFixed(2)}</div>
          </article>
        ))}
      </div>
    </main>
  );
}
