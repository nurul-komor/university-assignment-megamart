import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { http } from "../api/http";
import { SmartImage } from "../components/SmartImage";
import { useCart } from "../state/CartContext";
import { useAuth } from "../state/AuthContext";
import type { Category, Product } from "../types";
const SLIDES = [
  {
    title: "Fresh Grocery Deals",
    subtitle: "Daily Essentials Delivered Fast",
    description: "Save up to 40% on fruits, vegetables, dairy, and bakery picks.",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Kitchen & Home Must-Haves",
    subtitle: "Stylish And Practical Picks",
    description: "Upgrade your kitchen with curated essentials and smart storage.",
    image:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Coffee Time Premium",
    subtitle: "Brew Better Every Morning",
    description: "Shop rich beans and pantry favorites with exclusive combo offers.",
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=80",
  },
];

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [notice, setNotice] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const [page, setPage] = useState(1);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem, loading: cartLoading } = useCart();
  const ITEMS_PER_PAGE = 9;

  const query = searchParams.get("q")?.toLowerCase().trim() || "";
  const categoryQuery = searchParams.get("category")?.toLowerCase().trim() || "";

  useEffect(() => {
    setLoading(true);
    http
      .get<{ products: Product[] }>("/catalog/products")
      .then((res) => {
        setProducts(res.data.products || []);
        setError("");
      })
      .catch(() => setError("Unable to load products right now."))
      .finally(() => setLoading(false));

    http
      .get<{ categories: Category[] }>("/catalog/categories")
      .then((res) => setCategories(res.data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (categoryQuery) {
      setCategoryFilter(categoryQuery);
    }
  }, [categoryQuery]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => window.clearInterval(interval);
  }, []);

  const filteredProducts = useMemo(() => {
    const byCategory =
      categoryFilter === "all"
        ? products
        : products.filter((item) => item.category.toLowerCase() === categoryFilter.toLowerCase());

    const bySearch = query
      ? byCategory.filter((item) => {
          const haystack = `${item.title} ${item.description} ${item.category}`.toLowerCase();
          return haystack.includes(query);
        })
      : byCategory;

    const sorted = [...bySearch];
    if (sortBy === "price-asc") sorted.sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") sorted.sort((a, b) => b.price - a.price);
    if (sortBy === "name") sorted.sort((a, b) => a.title.localeCompare(b.title));
    return sorted;
  }, [products, categoryFilter, sortBy, query]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, page]);

  useEffect(() => {
    setPage(1);
  }, [query, categoryFilter, sortBy]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <section className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative h-[320px] w-full sm:h-[360px]">
          {SLIDES.map((slide, index) => (
            <div
              key={slide.title}
              className={`absolute inset-0 transition-opacity duration-700 ${
                activeSlide === index ? "opacity-100" : "opacity-0"
              }`}
            >
              <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/75 via-slate-900/40 to-transparent" />
              <div className="absolute left-6 top-1/2 max-w-xl -translate-y-1/2 text-white sm:left-10">
                <p className="text-sm uppercase tracking-widest text-emerald-200">{slide.subtitle}</p>
                <h1 className="mt-2 text-3xl font-bold sm:text-5xl">{slide.title}</h1>
                <p className="mt-3 text-sm text-slate-100 sm:text-base">{slide.description}</p>
                <button className="mt-5 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">
                  Shop now
                </button>
              </div>
            </div>
          ))}
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
            {SLIDES.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                className={`h-2.5 rounded-full transition-all ${activeSlide === index ? "w-8 bg-white" : "w-2.5 bg-white/60"}`}
                onClick={() => setActiveSlide(index)}
              />
            ))}
          </div>
          <button
            type="button"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-white"
            onClick={() => setActiveSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)}
          >
            Prev
          </button>
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-white"
            onClick={() => setActiveSlide((prev) => (prev + 1) % SLIDES.length)}
          >
            Next
          </button>
        </div>
      </section>

      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="flex w-max gap-2 pr-2">
            {["all", ...categories.map((item) => item.slug)].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`whitespace-nowrap rounded-full px-4 py-1 text-sm capitalize ${
                  categoryFilter === cat
                    ? "bg-emerald-600 text-white"
                    : "border border-emerald-100 bg-emerald-50 text-emerald-700"
                }`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat === "all" ? "all" : categories.find((item) => item.slug === cat)?.label || cat}
              </button>
            ))}
          </div>
        </div>
        <select
          className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="featured">Sort: Featured</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name">Name: A-Z</option>
        </select>
      </div>

      {query && (
        <p className="mb-4 text-sm text-slate-600">
          Showing results for <span className="font-semibold">"{query}"</span>
        </p>
      )}

      {notice && <p className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
      {error && <p className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">All Products</h2>
          <p className="text-sm text-slate-500">{filteredProducts.length} items</p>
        </div>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedProducts.map((product) => (
              <article
                key={product._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <SmartImage
                  src={product.imageUrl}
                  alt={product.title}
                  className="mb-3 h-44 rounded-xl"
                  fallbackSrc="https://via.placeholder.com/800x500?text=No+Image"
                />
                <p className="text-xs text-sky-600 uppercase">{product.category}</p>
                <h3 className="mt-1 text-xl font-semibold">{product.title}</h3>
                <p className="mt-2 min-h-12 text-slate-600">{product.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-slate-900">${product.price.toFixed(2)}</span>
                    <span className="ml-2 text-sm text-slate-400 line-through">
                      ${(product.price * 1.08).toFixed(2)}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={cartLoading}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:bg-slate-300"
                    onClick={async () => {
                      if (!user) {
                        navigate("/login");
                        return;
                      }
                      try {
                        await addItem(product._id);
                        setNotice(`${product.title} added to cart`);
                        setTimeout(() => setNotice(""), 2200);
                      } catch {
                        setError("Please login to add items to your cart.");
                      }
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              </article>
            ))}
            {!filteredProducts.length && (
              <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
                No products matched your current filters.
              </div>
            )}
          </div>
        )}
        {filteredProducts.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }).map((_, index) => {
              const pageNumber = index + 1;
              return (
                <button
                  key={pageNumber}
                  type="button"
                  className={`rounded-lg px-3 py-2 text-sm ${
                    pageNumber === page
                      ? "bg-emerald-600 text-white"
                      : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              );
            })}
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              disabled={page === totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
