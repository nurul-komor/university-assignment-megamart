import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../api/http";
import type { Order } from "../types";

const ORDER_STATUSES = [
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

function formatOrderStatus(status: string) {
  return status.split("_").join(" ");
}

function getCustomer(order: Order) {
  if (typeof order.userId === "string") return { name: "Unknown", email: "N/A" };
  return { name: order.userId.name, email: order.userId.email };
}

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState("");

  async function loadAll() {
    setLoading(true);
    try {
      const ordersRes = await http.get<{ orders: Order[] }>("/admin/orders");
      const nextOrders = ordersRes.data.orders || [];
      setOrders(nextOrders);
      setStatusDrafts(
        nextOrders.reduce<Record<string, string>>((acc, order) => {
          acc[order._id] = order.status;
          return acc;
        }, {})
      );
      setError("");
    } catch {
      setError("Unable to load admin orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Admin Orders</h1>
        <Link
          to="/admin/wallet-requests"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Go to Wallet Approvals
        </Link>
      </div>
      {loading && <p className="text-slate-500">Loading orders...</p>}
      {error && <p className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {!loading && !orders.length && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No orders found.
        </div>
      )}
      <div className="space-y-4">
        {orders.map((order) => {
          const customer = getCustomer(order);
          return (
            <article key={order._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">Order ID: {order._id}</p>
                  <p className="text-sm text-slate-700">
                    Customer: {customer.name} ({customer.email})
                  </p>
                </div>
                <p className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase text-emerald-700">
                  {formatOrderStatus(order.status)}
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
              <div className="mt-3 flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <label className="text-sm font-medium text-slate-700" htmlFor={`order-status-${order._id}`}>
                    Update status
                  </label>
                  <select
                    id={`order-status-${order._id}`}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={statusDrafts[order._id] ?? order.status}
                    disabled={updatingOrderId === order._id}
                    onChange={(event) => {
                      setStatusDrafts((prev) => ({ ...prev, [order._id]: event.target.value }));
                    }}
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {formatOrderStatus(status)}
                      </option>
                    ))}
                  </select>
                  <button
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:bg-slate-400"
                    type="button"
                    disabled={
                      updatingOrderId === order._id || (statusDrafts[order._id] ?? order.status) === order.status
                    }
                    onClick={async () => {
                      try {
                        setUpdatingOrderId(order._id);
                        setUpdateError("");
                        await http.patch(`/admin/orders/${order._id}/status`, {
                          status: statusDrafts[order._id] ?? order.status,
                        });
                        await loadAll();
                      } catch {
                        setUpdateError("Failed to update order status. Please try again.");
                      } finally {
                        setUpdatingOrderId(null);
                      }
                    }}
                  >
                    {updatingOrderId === order._id ? "Updating..." : "Save Status"}
                  </button>
                </div>
                {updateError && <p className="text-right text-sm text-rose-600">{updateError}</p>}
                <button
                  className="ml-auto rounded-lg border border-rose-300 px-3 py-1 text-sm text-rose-700 disabled:opacity-50"
                  type="button"
                  disabled={order.status === "cancelled"}
                  onClick={async () => {
                    await http.patch(`/admin/orders/${order._id}/status`, { status: "cancelled" });
                    await loadAll();
                  }}
                >
                  Cancel & Refund
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
