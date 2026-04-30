import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { http } from "../api/http";
import type { Cart } from "../types";

interface CartContextValue {
  cart: Cart;
  total: number;
  itemCount: number;
  loading: boolean;
  loadCart: () => Promise<void>;
  addItem: (productId: string) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>({ items: [] });
  const [loading, setLoading] = useState(false);

  const loadCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await http.get<{ cart: Cart }>("/cart");
      setCart(res.data.cart || { items: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async (productId: string) => {
    setLoading(true);
    try {
      await http.post("/cart/items", { productId, quantity: 1 });
      await loadCart();
    } finally {
      setLoading(false);
    }
  }, [loadCart]);

  const updateItem = useCallback(async (productId: string, quantity: number) => {
    setLoading(true);
    try {
      await http.patch(`/cart/items/${productId}`, { quantity });
      await loadCart();
    } finally {
      setLoading(false);
    }
  }, [loadCart]);

  const removeItem = useCallback(async (productId: string) => {
    setLoading(true);
    try {
      await http.delete(`/cart/items/${productId}`);
      await loadCart();
    } finally {
      setLoading(false);
    }
  }, [loadCart]);

  const clearCart = useCallback(async () => {
    setLoading(true);
    try {
      await http.delete("/cart");
      await loadCart();
    } finally {
      setLoading(false);
    }
  }, [loadCart]);

  const total = cart.items.reduce((sum, item) => sum + item.quantity * (item.productId?.price || 0), 0);
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  const value = useMemo(
    () => ({ cart, total, itemCount, loading, loadCart, addItem, updateItem, removeItem, clearCart }),
    [cart, total, itemCount, loading]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used within CartProvider");
  return value;
}
