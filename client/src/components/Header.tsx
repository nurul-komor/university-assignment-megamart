import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { http } from "../api/http";
import { useAuth } from "../state/AuthContext";
import { useCart } from "../state/CartContext";
import type { Category } from "../types";

export function Header() {
  const { user, logout } = useAuth();
  const { itemCount, loadCart } = useCart();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (user) {
      loadCart().catch(() => null);
    }
  }, [user, loadCart]);

  useEffect(() => {
    http
      .get<{ categories: Category[] }>("/catalog/categories")
      .then((res) => setCategories(res.data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  return (
    <>
      <div className="hidden border-b bg-white md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-sm">
          <span className="font-medium text-emerald-600">HOT • Free Express Shipping</span>
          <div className="flex gap-4">
            {user ? (
              <button
                type="button"
                className="text-slate-600 hover:text-emerald-600"
                onClick={() => navigate("/track-order")}
              >
                Track your order
              </button>
            ) : (
              <button
                type="button"
                className="text-slate-600 hover:text-emerald-600"
                onClick={() => navigate("/login")}
              >
                Track your order
              </button>
            )}
            <span className="text-slate-600">Help</span>
            <span className="text-slate-600">EN</span>
          </div>
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="text-2xl font-bold text-emerald-600">
            BazaarMart
          </Link>
          <form
            className="flex-1 min-w-[220px]"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(query.trim() ? `/?q=${encodeURIComponent(query.trim())}` : "/");
            }}
          >
            <input
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 focus:border-emerald-400 focus:bg-white focus:outline-none"
              placeholder="Search for products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>
          <nav className="flex items-center gap-4 text-sm font-medium">
            {!user && <Link to="/login">Login</Link>}
            {!user && <Link to="/register">Register</Link>}
            {user && (
              <Link to="/checkout" className="relative rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">
                Cart
                {itemCount > 0 && (
                  <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] text-white">
                    {itemCount}
                  </span>
                )}
              </Link>
            )}
            {user?.role === "customer" && <Link to="/orders">My Orders</Link>}
            {user?.role === "customer" && <Link to="/dashboard">Wallet</Link>}
            {user?.role === "admin" && <Link to="/admin/dashboard">Dashboard</Link>}
            {user?.role === "admin" && <Link to="/admin/orders">Orders</Link>}
            {user?.role === "admin" && <Link to="/admin/wallet-requests">Wallet Approvals</Link>}
            {user && (
              <button
                className="rounded-lg bg-slate-900 px-4 py-2 text-white"
                onClick={async () => {
                  await logout();
                  navigate("/login");
                }}
                type="button"
              >
                Logout
              </button>
            )}
          </nav>
        </div>
        <div className="border-t bg-white">
          <div className="mx-auto flex max-w-6xl gap-2 overflow-auto px-4 py-3 text-sm">
            {categories.map((item) => (
              <button
                key={item.slug}
                type="button"
                className="whitespace-nowrap rounded-full border border-slate-200 px-3 py-1.5 text-slate-600 hover:border-emerald-300 hover:text-emerald-600"
                onClick={() => navigate(`/?category=${encodeURIComponent(item.slug)}`)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>
    </>
  );
}
