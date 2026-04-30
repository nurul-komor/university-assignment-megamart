# MegaMart MERN Migration

This project has been migrated from static HTML/CSS/JS into a full MERN stack:

- `client`: React (Vite) frontend
- `server`: Express + MongoDB backend
- Authentication: JWT in HTTP-only cookies
- Role support: `customer` and `admin`

## Local development

### 1) Server

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

### 2) Client

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

## Default seeded admin

- Email: `admin@megamart.com`
- Password: `Admin123!`

## API overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/catalog/products`
- `GET /api/catalog/products/:id`
- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:productId`
- `DELETE /api/cart/items/:productId`
- `DELETE /api/cart`
- `POST /api/orders/checkout`
- `GET /api/orders`
- `GET /api/admin/dashboard`
- `POST /api/admin/products`
- `PATCH /api/admin/products/:id`
- `DELETE /api/admin/products/:id`

## Vercel deployment notes

### Client

- Deploy `client` as a Vercel project.
- Set `VITE_API_URL` to your deployed backend URL with `/api`.

### Server

- Deploy `server` as a separate Vercel project.
- Uses `server/vercel.json` and `api/index.js`.
- Required env vars:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN`
  - `CLIENT_ORIGIN`
  - `COOKIE_SECURE=true`
