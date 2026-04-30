const { Product, User, Wallet, WalletTransaction, WalletRequest, Cart, Order } = require("./modules/models");
const bcrypt = require("bcryptjs");

const CATEGORY_POOL = [
  "fruits",
  "vegetables",
  "dairy",
  "bakery",
  "beverages",
  "snacks",
  "grocery",
  "seafood",
  "meat",
  "household",
];

const IMAGE_POOL = [
  "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1584473457409-cef8d3d6fdfd?auto=format&fit=crop&w=900&q=80",
];

function createDummyProducts() {
  const items = [];
  for (let i = 0; i < 30; i += 1) {
    const category = CATEGORY_POOL[i % CATEGORY_POOL.length];
    const price = Number((2.5 + (i % 10) * 1.35 + i * 0.15).toFixed(2));
    items.push({
      title: `${category.charAt(0).toUpperCase() + category.slice(1)} Item ${i + 1}`,
      description: `Fresh ${category} product number ${i + 1} from MegaMart seed data.`,
      price,
      category,
      stock: 15 + (i % 12) * 4,
      imageUrl: IMAGE_POOL[i % IMAGE_POOL.length],
    });
  }
  return items;
}

async function createUsers() {
  const [adminPasswordHash, customerPasswordHash] = await Promise.all([
    bcrypt.hash("password", 10),
    bcrypt.hash("password", 10),
  ]);

  const [adminUser, customerUser] = await User.create([
    {
      name: "System Admin",
      email: "admin@gmail.com",
      passwordHash: adminPasswordHash,
      role: "admin",
    },
    {
      name: "Demo Customer",
      email: "customer@gmail.com",
      passwordHash: customerPasswordHash,
      role: "customer",
    },
  ]);

  return { adminUser, customerUser };
}

async function createOrdersForCustomer(customerUser, products) {
  const firstOrderItems = [
    { productId: products[0]._id, title: products[0].title, price: products[0].price, quantity: 2 },
    { productId: products[1]._id, title: products[1].title, price: products[1].price, quantity: 1 },
  ];
  const secondOrderItems = [
    { productId: products[2]._id, title: products[2].title, price: products[2].price, quantity: 3 },
    { productId: products[3]._id, title: products[3].title, price: products[3].price, quantity: 2 },
  ];

  return Order.create([
    {
      userId: customerUser._id,
      items: firstOrderItems,
      totalAmount: firstOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      paymentMethod: "card",
      status: "confirmed",
    },
    {
      userId: customerUser._id,
      items: secondOrderItems,
      totalAmount: secondOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      paymentMethod: "card",
      status: "confirmed",
    },
  ]);
}

async function seedWalletData(customerUser, createdOrders) {
  const wallet = await Wallet.create({
    userId: customerUser._id,
    balance: 220,
    currency: "USD",
  });

  await WalletTransaction.create([
    {
      walletId: wallet._id,
      userId: customerUser._id,
      type: "deposit",
      direction: "credit",
      amount: 300,
      status: "completed",
      referenceType: "seed",
      meta: { source: "seed_data" },
    },
    {
      walletId: wallet._id,
      userId: customerUser._id,
      type: "order_debit",
      direction: "debit",
      amount: 80,
      status: "completed",
      referenceType: "order",
      referenceId: createdOrders[0]._id,
      meta: { source: "seed_data" },
    },
  ]);

  await WalletRequest.create([
    {
      userId: customerUser._id,
      type: "deposit",
      amount: 120,
      status: "pending",
      note: "Need to top up for weekend shopping",
      proofUrl: "https://example.com/proof/deposit-1",
    },
    {
      userId: customerUser._id,
      type: "withdrawal",
      amount: 40,
      status: "rejected",
      note: "Transfer back to card",
      adminNote: "Please verify account details",
      reviewedAt: new Date(),
    },
  ]);
}

async function seedIfEmpty() {
  const [productCount, userCount, orderCount] = await Promise.all([
    Product.countDocuments(),
    User.countDocuments(),
    Order.countDocuments(),
  ]);

  if (productCount === 0 && userCount === 0 && orderCount === 0) {
    await resetAndSeedDummyData();
  }
}

async function resetAndSeedDummyData() {
  await Promise.all([
    WalletTransaction.deleteMany({}),
    WalletRequest.deleteMany({}),
    Wallet.deleteMany({}),
    Order.deleteMany({}),
    Cart.deleteMany({}),
    Product.deleteMany({}),
    User.deleteMany({}),
  ]);

  const products = await Product.insertMany(createDummyProducts());
  const { customerUser } = await createUsers();
  const createdOrders = await createOrdersForCustomer(customerUser, products);
  await seedWalletData(customerUser, createdOrders);
}

module.exports = { seedIfEmpty, resetAndSeedDummyData };
