import { useEffect, useState } from "react";
import { http } from "../api/http";
import type { Wallet, WalletRequest, WalletSummary, WalletTransaction } from "../types";

export function DashboardPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [requests, setRequests] = useState<WalletRequest[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [type, setType] = useState<"deposit" | "withdrawal">("deposit");
  const [amount, setAmount] = useState("50");
  const [note, setNote] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [walletRes, requestsRes, transactionsRes] = await Promise.all([
        http.get<{ wallet: Wallet; summary: WalletSummary }>("/wallet"),
        http.get<{ requests: WalletRequest[] }>("/wallet/requests"),
        http.get<{ transactions: WalletTransaction[] }>("/wallet/transactions"),
      ]);
      setWallet(walletRes.data.wallet);
      setSummary(walletRes.data.summary);
      setRequests(requestsRes.data.requests || []);
      setTransactions(transactionsRes.data.transactions || []);
      setError("");
    } catch {
      setError("Unable to load wallet dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Wallet Dashboard</h1>
          <button className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-100" type="button" onClick={() => load()}>
            Refresh
          </button>
        </div>
        {error && <p className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        {message && <p className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}

        {wallet && summary && (
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <StatCard label="Wallet Balance" value={`$${wallet.balance.toFixed(2)} ${wallet.currency}`} />
            <StatCard label="Pending Requests" value={`${summary.pendingRequests}`} />
            <StatCard label="Transactions" value={`${summary.totalTransactions}`} />
          </div>
        )}

        <section className="mb-6 rounded-2xl border bg-white p-5">
          <h2 className="mb-4 text-xl font-semibold">Create Wallet Request</h2>
          <form
            className="grid gap-3 md:grid-cols-5"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                setSubmitting(true);
                setError("");
                setMessage("");
                await http.post("/wallet/requests", {
                  type,
                  amount: Number(amount),
                  note: note.trim(),
                  proofUrl: proofUrl.trim(),
                });
                setMessage(`Your ${type} request has been submitted for admin approval.`);
                setNote("");
                setProofUrl("");
                await load();
              } catch {
                setError("Unable to submit wallet request.");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <select className="rounded-lg border px-3 py-2" value={type} onChange={(e) => setType(e.target.value as "deposit" | "withdrawal")}>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
            </select>
            <input className="rounded-lg border px-3 py-2" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
            <input className="rounded-lg border px-3 py-2" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" />
            <input className="rounded-lg border px-3 py-2" value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} placeholder="Proof URL (optional)" />
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:bg-slate-300" disabled={submitting || loading} type="submit">
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </form>
        </section>

        <section className="mb-6 rounded-2xl border bg-white p-5">
          <h2 className="mb-4 text-xl font-semibold">My Requests</h2>
          {!requests.length && <p className="text-sm text-slate-500">No wallet requests yet.</p>}
          <div className="space-y-3">
            {requests.map((request) => (
              <div key={request._id} className="rounded-lg border p-3">
                <p className="font-medium">
                  {request.type} - ${request.amount.toFixed(2)}
                </p>
                <p className="text-sm text-slate-600">Status: {request.status}</p>
                {request.note && <p className="text-sm text-slate-600">Note: {request.note}</p>}
                {request.adminNote && <p className="text-sm text-slate-600">Admin Note: {request.adminNote}</p>}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5">
          <h2 className="mb-4 text-xl font-semibold">Transaction History</h2>
          {!transactions.length && <p className="text-sm text-slate-500">No transactions yet.</p>}
          <div className="space-y-3">
            {transactions.map((item) => (
              <div key={item._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                <div>
                  <p className="font-medium">{item.type.replace(/_/g, " ")}</p>
                  <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <p className={item.direction === "credit" ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>
                  {item.direction === "credit" ? "+" : "-"}${item.amount.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
