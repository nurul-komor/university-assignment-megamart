import { useEffect, useState } from "react";
import { http } from "../api/http";
import type { Order, WalletRequest } from "../types";

function getCustomer(order: Order) {
  if (typeof order.userId === "string") return { name: "Unknown", email: "N/A" };
  return { name: order.userId.name, email: order.userId.email };
}

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [walletRequests, setWalletRequests] = useState<WalletRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAll() {
    setLoading(true);
    try {
      const [ordersRes, walletRequestsRes] = await Promise.all([
        http.get<{ orders: Order[] }>("/admin/orders"),
        http.get<{ requests: WalletRequest[] }>("/admin/wallet/requests?status=pending"),
      ]);
      setOrders(ordersRes.data.orders || []);
      setWalletRequests(walletRequestsRes.data.requests || []);
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
      <h1 className="mb-6 text-3xl font-bold">Admin Orders</h1>
      {loading && <p className="text-slate-500">Loading orders...</p>}
      {error && <p className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Pending Wallet Requests</h2>
        {!walletRequests.length && <p className="text-sm text-slate-500">No pending wallet requests.</p>}
        <div className="space-y-3">
          {walletRequests.map((request) => {
            const customer = typeof request.userId === "string" ? { name: "Unknown", email: "" } : request.userId;
            return (
              <div key={request._id} className="rounded-lg border p-3">
                <p className="font-medium">
                  {customer.name} ({customer.email})
                </p>
                <p className="text-sm text-slate-600">
                  {request.type} - ${request.amount.toFixed(2)}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-sm font-medium text-white"
                    type="button"
                    onClick={async () => {
                      await http.patch(`/admin/wallet/requests/${request._id}`, { action: "approve" });
                      await loadAll();
                    }}
                  >
                    Approve
                  </button>
                  <button
                    className="rounded-lg bg-rose-600 px-3 py-1 text-sm font-medium text-white"
                    type="button"
                    onClick={async () => {
                      await http.patch(`/admin/wallet/requests/${request._id}`, { action: "reject" });
                      await loadAll();
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
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
              <div className="mt-3 flex justify-end">
                <button
                  className="rounded-lg border border-rose-300 px-3 py-1 text-sm text-rose-700 disabled:opacity-50"
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
