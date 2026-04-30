import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-[#0f172a] text-slate-200">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-4">
        <div>
          <h3 className="text-xl font-bold text-emerald-400">BazaarMart</h3>
          <p className="mt-3 text-sm text-slate-300">
            Your modern grocery and essentials marketplace with fast delivery and quality products.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-100">Shop</h4>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <p>Groceries</p>
            <p>Bakery</p>
            <p>Dairy</p>
            <p>Beverages</p>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-100">Quick Links</h4>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <Link to="/">Home</Link>
            <br />
            <Link to="/checkout">Checkout</Link>
            <br />
            <Link to="/dashboard">Dashboard</Link>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-100">Support</h4>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <p>Email: support@megamart.com</p>
            <p>Phone: +880 1234-567890</p>
            <p>Address: Dhaka, Bangladesh</p>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-700 py-4 text-center text-sm text-slate-400">
        Copyright {new Date().getFullYear()} MegaMart. All rights reserved.
      </div>
    </footer>
  );
}
