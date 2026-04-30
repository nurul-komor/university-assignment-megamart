import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { http } from "../api/http";
import type { TrackingStep } from "../types";

interface TrackingResponse {
  order: {
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
  };
  tracking: TrackingStep[];
}

export function TrackOrderPage() {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TrackingResponse | null>(null);

  async function track() {
    if (!orderId.trim()) {
      setError("Please enter an order ID.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const { data } = await http.get<TrackingResponse>(`/orders/${orderId.trim()}/tracking`);
      setResult(data);
    } catch {
      setResult(null);
      setError("Order not found or you do not have permission.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const orderIdFromQuery = searchParams.get("orderId")?.trim() || "";
    if (!orderIdFromQuery) return;

    setOrderId(orderIdFromQuery);
    void (async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await http.get<TrackingResponse>(`/orders/${orderIdFromQuery}/tracking`);
        setResult(data);
      } catch {
        setResult(null);
        setError("Order not found or you do not have permission.");
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-4 text-3xl font-bold">Track Order</h1>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Enter order ID"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
          <button
            type="button"
            className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-300"
            onClick={track}
            disabled={loading}
          >
            {loading ? "Tracking..." : "Track"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      </div>

      {result && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Order ID</p>
              <p className="font-semibold">{result.order.id}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Status</p>
              <p className="font-semibold capitalize">{result.order.status.split("_").join(" ")}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total</p>
              <p className="font-semibold">${result.order.totalAmount.toFixed(2)}</p>
            </div>
          </div>

          <div className="space-y-3">
            {result.tracking.map((step) => (
              <div
                key={step.key}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                  step.current
                    ? "border-emerald-300 bg-emerald-50"
                    : step.done
                      ? "border-slate-200 bg-white"
                      : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                    step.current ? "bg-emerald-600" : step.done ? "bg-slate-700" : "bg-slate-300"
                  }`}
                />
                <span className="capitalize">{step.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
