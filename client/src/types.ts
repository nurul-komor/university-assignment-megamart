export interface User {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
}

export interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
}

export interface CartItem {
  productId: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
}

export interface Category {
  slug: string;
  label: string;
  count: number;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  userId:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        role: "customer" | "admin";
      };
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  walletDebitTransactionId?: string | null;
  status: string;
  createdAt: string;
}

export interface TrackingStep {
  key: string;
  label: string;
  done: boolean;
  current?: boolean;
}

export interface Wallet {
  id: string;
  balance: number;
  currency: string;
}

export interface WalletSummary {
  pendingRequests: number;
  totalTransactions: number;
}

export interface WalletRequest {
  _id: string;
  userId:
    | string
    | {
        _id: string;
        name: string;
        email: string;
      };
  type: "deposit" | "withdrawal";
  amount: number;
  status: "pending" | "approved" | "rejected";
  note: string;
  proofUrl: string;
  adminNote?: string;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface WalletTransaction {
  _id: string;
  walletId: string;
  userId: string;
  type: "deposit" | "withdrawal" | "order_debit" | "order_refund" | "adjustment";
  direction: "credit" | "debit";
  amount: number;
  status: "pending" | "completed" | "failed";
  referenceType: string;
  referenceId?: string | null;
  createdAt: string;
}
