import { useEffect, useState } from "react";
import { http } from "../api/http";
import { SmartImage } from "../components/SmartImage";
import type { Product } from "../types";

interface Metrics {
  users: number;
  products: number;
  orders: number;
  revenue: number;
}

export function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("1");
  const [category, setCategory] = useState("general");
  const [stock, setStock] = useState("1");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [metricsRes, productsRes] = await Promise.all([
        http.get<{ metrics: Metrics }>("/admin/dashboard"),
        http.get<{ products: Product[] }>("/catalog/products"),
      ]);
      setMetrics(metricsRes.data.metrics);
      setProducts(productsRes.data.products || []);
      setError("");
    } catch {
      setError("Unable to load dashboard data.");
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
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-100" type="button" onClick={() => load()}>
            Refresh
          </button>
        </div>
        {error && <p className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        {metrics && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Revenue" value={`$${metrics.revenue.toFixed(2)}`} />
            <StatCard label="Orders" value={`${metrics.orders}`} />
            <StatCard label="Products" value={`${metrics.products}`} />
            <StatCard label="Users" value={`${metrics.users}`} />
          </div>
        )}

        <div className="mb-6 rounded-2xl border bg-white p-5">
          <h2 className="mb-4 text-xl font-semibold">Add Product</h2>
          <form
            className="grid gap-3 md:grid-cols-6"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                setSubmitting(true);
                await http.post("/admin/products", {
                  title,
                  price: Number(price),
                  category,
                  stock: Number(stock),
                  imageUrl: imageUrl.trim(),
                });
                setTitle("");
                setImageUrl("");
                await load();
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <input className="rounded-lg border px-3 py-2" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input className="rounded-lg border px-3 py-2" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
            <input className="rounded-lg border px-3 py-2" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
            <input className="rounded-lg border px-3 py-2" placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} />
            <input className="rounded-lg border px-3 py-2" placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:bg-slate-300" type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create"}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <h2 className="mb-4 text-xl font-semibold">Products</h2>
          {loading && <div className="mb-3 text-sm text-slate-500">Loading data...</div>}
          <div className="space-y-3">
            {products.map((product) => (
              <div key={product._id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div className="flex items-center gap-3">
                  <SmartImage
                    src={product.imageUrl}
                    alt={product.title}
                    className="h-12 w-12 rounded-lg"
                    fallbackSrc="https://via.placeholder.com/120x120?text=No+Image"
                  />
                  <div>
                    <p className="font-semibold">{product.title}</p>
                    <p className="text-sm text-slate-500">
                      ${product.price} - {product.category}
                    </p>
                  </div>
                </div>
                <button
                  className="rounded-lg border border-rose-300 px-3 py-1 text-rose-600"
                  type="button"
                  onClick={async () => {
                    await http.delete(`/admin/products/${product._id}`);
                    await load();
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
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
