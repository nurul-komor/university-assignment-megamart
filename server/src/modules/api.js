const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { z } = require("zod");
const { env } = require("../config/env");
const { AppError } = require("../shared/AppError");
const { User, Wallet, WalletTransaction, WalletRequest, Product, Cart, Order } = require("./models");
const { resetAndSeedDummyData } = require("../seed");

const router = express.Router();

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function setAuthCookie(res, token) {
  const isSecureOrigin = String(env.clientOrigin || "").startsWith("https://");
  res.cookie("token", token, {
    httpOnly: true,
    // Cross-site auth between different Vercel domains needs SameSite=None + Secure.
    sameSite: isSecureOrigin ? "none" : "lax",
    secure: isSecureOrigin || env.cookieSecure,
    maxAge: 24 * 60 * 60 * 1000,
  });
}

async function requireAuth(req, _res, next) {
  try {
    const token = req.cookies.token;
    if (!token) throw new AppError("Unauthorized", 401);
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub);
    if (!user) throw new AppError("Unauthorized", 401);
    req.user = user;
    next();
  } catch (_error) {
    next(new AppError("Unauthorized", 401));
  }
}

function requireRole(role) {
  return (req, _res, next) => {
    if (!req.user || req.user.role !== role) {
      return next(new AppError("Forbidden", 403));
    }
    return next();
  };
}

function normalizeMoney(amount) {
  return Number(amount.toFixed(2));
}

async function ensureWallet(userId, session = null) {
  const query = Wallet.findOne({ userId });
  if (session) query.session(session);
  let wallet = await query;
  if (!wallet) {
    wallet = await Wallet.create([{ userId, balance: 0, currency: "USD" }], { session }).then((docs) => docs[0]);
  }
  return wallet;
}

async function createWalletTransaction(payload, session) {
  return WalletTransaction.create([payload], { session }).then((docs) => docs[0]);
}

async function creditWallet({ userId, amount, type, referenceType, referenceId, meta = {} }, session) {
  if (amount <= 0) throw new AppError("Amount must be greater than zero", 400);
  const wallet = await ensureWallet(userId, session);
  wallet.balance = normalizeMoney(wallet.balance + amount);
  await wallet.save({ session });
  const transaction = await createWalletTransaction(
    {
      walletId: wallet._id,
      userId,
      type,
      direction: "credit",
      amount: normalizeMoney(amount),
      status: "completed",
      referenceType,
      referenceId: referenceId || null,
      meta,
    },
    session
  );
  return { wallet, transaction };
}

async function debitWallet({ userId, amount, type, referenceType, referenceId, meta = {} }, session) {
  if (amount <= 0) throw new AppError("Amount must be greater than zero", 400);
  const wallet = await ensureWallet(userId, session);
  if (wallet.balance < amount) throw new AppError("Insufficient wallet balance", 400);
  wallet.balance = normalizeMoney(wallet.balance - amount);
  await wallet.save({ session });
  const transaction = await createWalletTransaction(
    {
      walletId: wallet._id,
      userId,
      type,
      direction: "debit",
      amount: normalizeMoney(amount),
      status: "completed",
      referenceType,
      referenceId: referenceId || null,
      meta,
    },
    session
  );
  return { wallet, transaction };
}

function buildTrackingTimeline(status) {
  const normalizedStatus = String(status || "confirmed").toLowerCase();
  const orderedSteps = ["confirmed", "packed", "shipped", "out_for_delivery", "delivered"];
  const cancelled = normalizedStatus === "cancelled";
  const currentIndex = orderedSteps.indexOf(normalizedStatus);

  if (cancelled) {
    return [
      { key: "confirmed", label: "Order confirmed", done: true },
      { key: "cancelled", label: "Order cancelled", done: true, current: true },
    ];
  }

  return orderedSteps.map((step, index) => ({
    key: step,
    label: step.replaceAll("_", " "),
    done: currentIndex >= index || currentIndex === -1,
    current: currentIndex === index || (currentIndex === -1 && step === "confirmed"),
  }));
}

router.post("/auth/register", async (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
      })
      .parse(req.body);
    const exists = await User.findOne({ email: body.email });
    if (exists) throw new AppError("Email already exists", 409);
    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await User.create({ ...body, passwordHash });
    const token = signToken(user);
    setAuthCookie(res, token);
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
});

router.post("/auth/login", async (req, res, next) => {
  try {
    const body = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
    const user = await User.findOne({ email: body.email });
    if (!user) throw new AppError("Invalid credentials", 401);
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw new AppError("Invalid credentials", 401);
    setAuthCookie(res, signToken(user));
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
});

router.post("/auth/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

router.get("/auth/me", requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

router.get("/catalog/products", async (_req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json({ products });
});

router.get("/catalog/categories", async (_req, res) => {
  const categories = await Product.aggregate([
    { $match: { category: { $type: "string", $ne: "" } } },
    {
      $group: {
        _id: { $toLower: "$category" },
        label: { $first: "$category" },
        count: { $sum: 1 },
      },
    },
    { $project: { _id: 0, slug: "$_id", label: 1, count: 1 } },
    { $sort: { label: 1 } },
  ]);

  res.json({ categories });
});

router.get("/catalog/products/:id", async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) throw new AppError("Product not found", 404);
    res.json({ product });
  } catch (error) {
    next(error);
  }
});

router.get("/cart", requireAuth, async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id }).populate("items.productId");
  res.json({ cart: cart || { userId: req.user._id, items: [] } });
});

router.post("/cart/items", requireAuth, async (req, res, next) => {
  try {
    const body = z.object({ productId: z.string(), quantity: z.number().int().min(1) }).parse(req.body);
    const product = await Product.findById(body.productId);
    if (!product) throw new AppError("Product not found", 404);
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) cart = await Cart.create({ userId: req.user._id, items: [] });
    const index = cart.items.findIndex((item) => item.productId.toString() === body.productId);
    if (index >= 0) cart.items[index].quantity += body.quantity;
    else cart.items.push({ productId: body.productId, quantity: body.quantity });
    await cart.save();
    res.status(201).json({ message: "Item added" });
  } catch (error) {
    next(error);
  }
});

router.patch("/cart/items/:productId", requireAuth, async (req, res, next) => {
  try {
    const body = z.object({ quantity: z.number().int().min(1) }).parse(req.body);
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) throw new AppError("Cart not found", 404);
    const item = cart.items.find((entry) => entry.productId.toString() === req.params.productId);
    if (!item) throw new AppError("Cart item not found", 404);
    item.quantity = body.quantity;
    await cart.save();
    res.json({ message: "Cart updated" });
  } catch (error) {
    next(error);
  }
});

router.delete("/cart/items/:productId", requireAuth, async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) throw new AppError("Cart not found", 404);
    cart.items = cart.items.filter((entry) => entry.productId.toString() !== req.params.productId);
    await cart.save();
    res.json({ message: "Item removed" });
  } catch (error) {
    next(error);
  }
});

router.delete("/cart", requireAuth, async (req, res) => {
  await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [] }, { upsert: true });
  res.json({ message: "Cart cleared" });
});

router.post("/orders/checkout", requireAuth, async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const body = z.object({ paymentMethod: z.enum(["card", "wallet"]).default("card") }).parse(req.body);
    let createdOrder;

    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ userId: req.user._id }).populate("items.productId").session(session);
      if (!cart || cart.items.length === 0) throw new AppError("Cart is empty", 400);

      const items = cart.items.map((entry) => ({
        productId: entry.productId._id,
        title: entry.productId.title,
        price: entry.productId.price,
        quantity: entry.quantity,
      }));
      const totalAmount = normalizeMoney(items.reduce((sum, item) => sum + item.price * item.quantity, 0));

      let walletDebitTransactionId = null;
      if (body.paymentMethod === "wallet") {
        const { transaction } = await debitWallet(
          {
            userId: req.user._id,
            amount: totalAmount,
            type: "order_debit",
            referenceType: "order",
            meta: { source: "checkout" },
          },
          session
        );
        walletDebitTransactionId = transaction._id;
      }

      const order = await Order.create(
        [
          {
            userId: req.user._id,
            items,
            totalAmount,
            paymentMethod: body.paymentMethod,
            walletDebitTransactionId,
          },
        ],
        { session }
      ).then((docs) => docs[0]);

      if (walletDebitTransactionId) {
        await WalletTransaction.findByIdAndUpdate(
          walletDebitTransactionId,
          { referenceId: order._id },
          { session }
        );
      }

      cart.items = [];
      await cart.save({ session });
      createdOrder = order;
    });

    res.status(201).json({ order: createdOrder });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
});

router.get("/orders", requireAuth, async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ orders });
});

router.get("/orders/:orderId/tracking", requireAuth, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) throw new AppError("Order not found", 404);

    const isOwner = order.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) throw new AppError("Forbidden", 403);

    res.json({
      order: {
        id: order._id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
      },
      tracking: buildTrackingTimeline(order.status),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/wallet", requireAuth, async (req, res) => {
  const wallet = await ensureWallet(req.user._id);
  const [pendingRequests, totalTransactions] = await Promise.all([
    WalletRequest.countDocuments({ userId: req.user._id, status: "pending" }),
    WalletTransaction.countDocuments({ userId: req.user._id }),
  ]);
  res.json({
    wallet: {
      id: wallet._id,
      balance: wallet.balance,
      currency: wallet.currency,
    },
    summary: {
      pendingRequests,
      totalTransactions,
    },
  });
});

router.get("/wallet/transactions", requireAuth, async (req, res, next) => {
  try {
    const query = z
      .object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
      })
      .parse(req.query);
    const skip = (query.page - 1) * query.limit;
    const [transactions, total] = await Promise.all([
      WalletTransaction.find({ userId: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
      WalletTransaction.countDocuments({ userId: req.user._id }),
    ]);
    res.json({
      transactions,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/wallet/requests", requireAuth, async (req, res, next) => {
  try {
    const body = z
      .object({
        type: z.enum(["deposit", "withdrawal"]),
        amount: z.number().positive(),
        proofUrl: z.string().optional().default(""),
        note: z.string().optional().default(""),
      })
      .parse(req.body);
    const request = await WalletRequest.create({
      userId: req.user._id,
      type: body.type,
      amount: normalizeMoney(body.amount),
      proofUrl: body.proofUrl.trim(),
      note: body.note.trim(),
    });
    res.status(201).json({ request });
  } catch (error) {
    next(error);
  }
});

router.get("/wallet/requests", requireAuth, async (req, res) => {
  const requests = await WalletRequest.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ requests });
});

router.get("/admin/orders", requireAuth, requireRole("admin"), async (_req, res) => {
  const orders = await Order.find()
    .populate("userId", "name email role")
    .sort({ createdAt: -1 });
  res.json({ orders });
});

router.patch("/admin/orders/:id/status", requireAuth, requireRole("admin"), async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const body = z
      .object({
        status: z.enum(["confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"]),
      })
      .parse(req.body);

    let updatedOrder = null;
    await session.withTransaction(async () => {
      const order = await Order.findById(req.params.id).session(session);
      if (!order) throw new AppError("Order not found", 404);
      if (order.status === "cancelled") throw new AppError("Order already cancelled", 400);

      if (body.status === "cancelled" && order.paymentMethod === "wallet") {
        await creditWallet(
          {
            userId: order.userId,
            amount: order.totalAmount,
            type: "order_refund",
            referenceType: "order",
            referenceId: order._id,
            meta: { reason: "order_cancelled" },
          },
          session
        );
      }

      order.status = body.status;
      await order.save({ session });
      updatedOrder = order;
    });

    res.json({ order: updatedOrder });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
});

router.get("/admin/wallet/requests", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const query = z
      .object({
        status: z.enum(["pending", "approved", "rejected"]).optional(),
      })
      .parse(req.query);
    const filter = query.status ? { status: query.status } : {};
    const requests = await WalletRequest.find(filter).populate("userId", "name email").sort({ createdAt: -1 });
    res.json({ requests });
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/wallet/requests/:requestId", requireAuth, requireRole("admin"), async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const body = z
      .object({
        action: z.enum(["approve", "reject"]),
        adminNote: z.string().optional().default(""),
      })
      .parse(req.body);

    let updatedRequest;
    await session.withTransaction(async () => {
      const walletRequest = await WalletRequest.findById(req.params.requestId).session(session);
      if (!walletRequest) throw new AppError("Wallet request not found", 404);
      if (walletRequest.status !== "pending") throw new AppError("Wallet request already processed", 400);

      if (body.action === "approve") {
        if (walletRequest.type === "deposit") {
          await creditWallet(
            {
              userId: walletRequest.userId,
              amount: walletRequest.amount,
              type: "deposit",
              referenceType: "wallet_request",
              referenceId: walletRequest._id,
              meta: { approvedBy: req.user._id.toString() },
            },
            session
          );
        } else {
          await debitWallet(
            {
              userId: walletRequest.userId,
              amount: walletRequest.amount,
              type: "withdrawal",
              referenceType: "wallet_request",
              referenceId: walletRequest._id,
              meta: { approvedBy: req.user._id.toString() },
            },
            session
          );
        }
        walletRequest.status = "approved";
      } else {
        walletRequest.status = "rejected";
      }

      walletRequest.reviewedBy = req.user._id;
      walletRequest.reviewedAt = new Date();
      walletRequest.adminNote = body.adminNote.trim();
      await walletRequest.save({ session });
      updatedRequest = walletRequest;
    });

    res.json({ request: updatedRequest });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
});

router.get("/admin/dashboard", requireAuth, requireRole("admin"), async (_req, res) => {
  const [users, products, orders] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Order.find(),
  ]);
  const revenue = orders.reduce((sum, item) => sum + item.totalAmount, 0);
  res.json({
    metrics: {
      users,
      products,
      orders: orders.length,
      revenue,
    },
  });
});

router.post("/admin/products", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const body = z
      .object({
        title: z.string().min(2),
        description: z.string().optional().default(""),
        price: z.number().positive(),
        category: z.string().optional().default("general"),
        imageUrl: z.string().optional().default(""),
        stock: z.number().int().min(0).optional().default(0),
      })
      .parse(req.body);
    const product = await Product.create(body);
    res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/products/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const body = z
      .object({
        title: z.string().min(2).optional(),
        description: z.string().optional(),
        price: z.number().positive().optional(),
        category: z.string().optional(),
        imageUrl: z.string().optional(),
        stock: z.number().int().min(0).optional(),
      })
      .parse(req.body);
    const product = await Product.findByIdAndUpdate(req.params.id, body, { new: true });
    if (!product) throw new AppError("Product not found", 404);
    res.json({ product });
  } catch (error) {
    next(error);
  }
});

router.delete("/admin/products/:id", requireAuth, requireRole("admin"), async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Product removed" });
});

router.get("/admin/refresh-dummy-data", async (_req, res, next) => {
  try {
    await resetAndSeedDummyData();
    res.json({
      message: "Database refreshed and dummy data uploaded.",
      adminCredentials: {
        email: "admin@gmail.com",
        password: "password",
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = { apiRouter: router };
