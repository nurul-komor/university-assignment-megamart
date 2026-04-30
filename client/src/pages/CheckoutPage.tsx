import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../api/http";
import { SmartImage } from "../components/SmartImage";
import { useCart } from "../state/CartContext";
import type { Wallet } from "../types";

export function CheckoutPage() {
  const { cart, total, loading, loadCart, updateItem, removeItem, clearCart } = useCart();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "cod">("cod");
  const [wallet, setWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    loadCart();
    http
      .get<{ wallet: Wallet }>("/wallet")
      .then((res) => setWallet(res.data.wallet))
      .catch(() => setWallet(null));
  }, []);

  const canUseWallet = Boolean(wallet && wallet.balance >= total);

  return (
    <main className="mx-auto max-w-5xl p-4 md:p-8">
      <h1 className="text-3xl font-semibold mb-6">Payment page</h1>
      <div className="grid md:grid-cols-4 gap-3 mb-6 text-sm">
        {["Cart", "Addresses", "Payment", "Confirm"].map((step, idx) => (
          <div key={step} className={`rounded-xl p-3 border ${idx < 2 ? "bg-emerald-50 border-emerald-200" : idx === 2 ? "bg-sky-50 border-sky-300" : "bg-slate-50"}`}>
            {step}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-white p-5 space-y-3">
        {!cart.items.length && (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <p className="text-slate-600">Your cart is empty.</p>
            <Link to="/" className="mt-3 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              Continue Shopping
            </Link>
          </div>
        )}
        {cart.items.map((item) => (
          <div key={item.productId._id} className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
            <div className="flex items-center gap-3">
              <SmartImage
                src={item.productId.imageUrl}
                alt={item.productId.title}
                className="h-14 w-14 rounded-lg"
                fallbackSrc="https://via.placeholder.com/120x120?text=No+Image"
              />
              <div>
                <p className="font-semibold">{item.productId.title}</p>
                <p className="text-slate-500">${item.productId.price.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                className="w-20 rounded-lg border px-2 py-1"
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => updateItem(item.productId._id, Number(e.target.value))}
              />
              <button className="rounded-lg border px-3 py-1 hover:bg-slate-100" onClick={() => removeItem(item.productId._id)} type="button">
                Remove
              </button>
            </div>
          </div>
        ))}
        <div className="pt-2 flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <div className="rounded-xl border p-3">
          <p className="mb-2 text-sm font-medium text-slate-700">Payment Method</p>
          <div className="flex gap-3">
            <button
              className={`rounded-lg border px-3 py-1.5 text-sm ${paymentMethod === "cod" ? "border-slate-900 bg-slate-900 text-white" : ""}`}
              onClick={() => setPaymentMethod("cod")}
              type="button"
            >
              Cash on Delivery
            </button>
            <button
              className={`rounded-lg border px-3 py-1.5 text-sm ${paymentMethod === "wallet" ? "border-slate-900 bg-slate-900 text-white" : ""}`}
              onClick={() => setPaymentMethod("wallet")}
              type="button"
            >
              Wallet
            </button>
          </div>
          <p className="mt-2 text-sm text-slate-600">Wallet Balance: ${wallet?.balance?.toFixed(2) ?? "0.00"}</p>
          {paymentMethod === "wallet" && !canUseWallet && (
            <p className="mt-2 text-sm text-rose-600">Insufficient wallet balance. Add money from your dashboard first.</p>
          )}
        </div>
        <button
          className="w-full rounded-xl bg-slate-900 text-white py-3 font-semibold disabled:bg-slate-300"
          type="button"
          disabled={!cart.items.length || loading || processing || (paymentMethod === "wallet" && !canUseWallet)}
          onClick={async () => {
            try {
              setProcessing(true);
              setError("");
              await http.post("/orders/checkout", { paymentMethod });
              await clearCart();
              if (paymentMethod === "wallet") {
                const walletRes = await http.get<{ wallet: Wallet }>("/wallet");
                setWallet(walletRes.data.wallet);
              }
              setMessage("Order confirmed successfully");
            } catch (checkoutError: any) {
              setError(checkoutError?.response?.data?.message || "Checkout failed. Please try again.");
            } finally {
              setProcessing(false);
            }
          }}
        >
          {processing ? "Processing..." : paymentMethod === "wallet" ? "Pay with wallet" : "Place COD order"}
        </button>
        {message && <p className="text-emerald-600">{message}</p>}
        {error && <p className="text-rose-600">{error}</p>}
      </div>
    </main>
  );
}
