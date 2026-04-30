const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
  },
  { timestamps: true }
);

const walletSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    balance: { type: Number, required: true, default: 0, min: 0 },
    currency: { type: String, default: "USD" },
  },
  { timestamps: true }
);

const walletTransactionSchema = new mongoose.Schema(
  {
    walletId: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["deposit", "withdrawal", "order_debit", "order_refund", "adjustment"],
      required: true,
    },
    direction: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "completed" },
    referenceType: { type: String, default: "" },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index({ walletId: 1, createdAt: -1 });

const walletRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["deposit", "withdrawal"], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    proofUrl: { type: String, default: "" },
    note: { type: String, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

walletRequestSchema.index({ status: 1, createdAt: -1 });
walletRequestSchema.index({ userId: 1, createdAt: -1 });

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    category: { type: String, default: "general" },
    imageUrl: { type: String, default: "" },
    stock: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
  },
  { timestamps: true }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        title: String,
        price: Number,
        quantity: Number,
      },
    ],
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["card", "wallet", "cod"], default: "cod" },
    walletDebitTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WalletTransaction",
      default: null,
    },
    status: { type: String, default: "confirmed" },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Wallet = mongoose.model("Wallet", walletSchema);
const WalletTransaction = mongoose.model("WalletTransaction", walletTransactionSchema);
const WalletRequest = mongoose.model("WalletRequest", walletRequestSchema);
const Product = mongoose.model("Product", productSchema);
const Cart = mongoose.model("Cart", cartSchema);
const Order = mongoose.model("Order", orderSchema);

module.exports = { User, Wallet, WalletTransaction, WalletRequest, Product, Cart, Order };
