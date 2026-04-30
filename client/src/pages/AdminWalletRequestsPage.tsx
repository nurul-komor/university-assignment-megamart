import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../api/http";
import type { WalletRequest } from "../types";

type RequestStatusFilter = "pending" | "approved" | "rejected";

export function AdminWalletRequestsPage() {
  const [requests, setRequests] = useState<WalletRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<RequestStatusFilter>("pending");

  async function loadRequests(nextFilter: RequestStatusFilter = filter) {
    setLoading(true);
    try {
      const response = await http.get<{ requests: WalletRequest[] }>(`/admin/wallet/requests?status=${nextFilter}`);
      setRequests(response.data.requests || []);
      setError("");
    } catch {
      setError("Unable to load wallet requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests(filter);
  }, [filter]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Wallet Approvals</h1>
        <Link
          to="/admin/orders"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Go to Order Management
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        {(["pending", "approved", "rejected"] as RequestStatusFilter[]).map((status) => (
          <button
            key={status}
            type="button"
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
              filter === status ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"
            }`}
            onClick={() => setFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {loading && <p className="text-slate-500">Loading wallet requests...</p>}
      {error && <p className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      {!loading && !requests.length && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No {filter} wallet requests.
        </div>
      )}

      <div className="space-y-3">
        {requests.map((request) => {
          const customer = typeof request.userId === "string" ? { name: "Unknown", email: "" } : request.userId;
          return (
            <article key={request._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="font-semibold">
                {customer.name} ({customer.email})
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Type: {request.type} - Amount: ${request.amount.toFixed(2)}
              </p>
              {request.note && <p className="mt-1 text-sm text-slate-600">Customer Note: {request.note}</p>}
              {request.adminNote && <p className="mt-1 text-sm text-slate-600">Admin Note: {request.adminNote}</p>}

              {request.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-sm font-medium text-white"
                    type="button"
                    onClick={async () => {
                      await http.patch(`/admin/wallet/requests/${request._id}`, { action: "approve" });
                      await loadRequests(filter);
                    }}
                  >
                    Approve
                  </button>
                  <button
                    className="rounded-lg bg-rose-600 px-3 py-1 text-sm font-medium text-white"
                    type="button"
                    onClick={async () => {
                      await http.patch(`/admin/wallet/requests/${request._id}`, { action: "reject" });
                      await loadRequests(filter);
                    }}
                  >
                    Reject
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}
