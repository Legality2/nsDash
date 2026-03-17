# Nexus Dashboard

Full-stack intelligence dashboard built with **Angular 21**, **Express.js**, and **MongoDB**.

---

## Tech Stack

| Layer     | Technology                                   |
|-----------|----------------------------------------------|
| Frontend  | Angular 21 (standalone components, signals)  |
| Backend   | Express.js 4 + Node.js                       |
| Database  | MongoDB 7 + Mongoose 8                       |
| Styling   | SCSS + Bootstrap Icons                       |
| Fonts     | DM Serif Display · DM Mono · Syne            |

---

## Project Structure

```
nexus-dashboard/
├── backend/
│   ├── server.js               # Express entry point
│   ├── seed.js                 # MongoDB seed script
│   ├── .env.example            # Environment variables template
│   ├── models/
│   │   ├── finance.model.js    # Portfolio, Ticker, Transaction schemas
│   │   ├── fashion.model.js    # Look, Brand, FashionStats schemas
│   │   └── music.model.js      # Track, Podcast, MusicStats schemas
│   └── routes/
│       ├── finance.routes.js   # /api/finance/*
│       ├── fashion.routes.js   # /api/fashion/*
│       ├── music.routes.js     # /api/music/*
│       └── stats.routes.js     # /api/stats/overview
│
└── frontend/
    ├── angular.json
    ├── proxy.conf.json         # Dev proxy → localhost:3000
    └── src/
        ├── main.ts
        ├── styles.scss         # Global design tokens + utilities
        └── app/
            ├── app.component.ts      # Shell layout
            ├── app.config.ts         # Providers (router, http, animations)
            ├── app.routes.ts         # Lazy-loaded routes
            ├── services/
            │   └── api.service.ts    # Typed HTTP client for all endpoints
            ├── layout/
            │   ├── sidebar/          # Fixed dark sidebar + mobile toggle
            │   └── topbar/           # Frosted glass top navbar
            ├── pages/
            │   ├── home/             # Overview + channel performance
            │   ├── finance/          # Watchlist, portfolio, transactions
            │   ├── fashion/          # Looks grid, brands, categories
            │   └── music/            # Tracks, now-playing, waveform
            └── shared/
                └── stat-card/        # Reusable stat card component
```

---

## Prerequisites

- **Node.js** ≥ 20
- **MongoDB** running locally on `mongodb://localhost:27017`  
  (or provide a `MONGODB_URI` in `.env`)
- **Angular CLI** ≥ 21:  `npm install -g @angular/cli`

---

## Quick Start

### 1 — Backend

```bash
cd backend
cp .env.example .env          # edit MONGODB_URI if needed
npm install
npm run seed                  # populate sample data
npm run dev                   # API starts on http://localhost:3000
```

### 2 — Frontend

```bash
cd frontend
npm install
npm start                     # opens http://localhost:4200
```

The Angular dev server proxies all `/api/*` requests to Express via `proxy.conf.json`.

---

## API Reference

### Stats
| Method | Endpoint              | Description                  |
|--------|-----------------------|------------------------------|
| GET    | `/api/stats/overview` | Home page summary cards      |

### Finance
| Method | Endpoint                         | Description               |
|--------|----------------------------------|---------------------------|
| GET    | `/api/finance/portfolio`         | Portfolio + market data   |
| GET    | `/api/finance/tickers`           | Watchlist tickers         |
| POST   | `/api/finance/tickers`           | Add ticker                |
| PATCH  | `/api/finance/tickers/:symbol`   | Update ticker price       |
| GET    | `/api/finance/transactions`      | Recent transactions       |
| POST   | `/api/finance/transactions`      | Record new transaction    |

### Fashion
| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| GET    | `/api/fashion/stats`            | Aggregate fashion stats  |
| GET    | `/api/fashion/looks`            | Featured looks           |
| POST   | `/api/fashion/looks`            | Add look                 |
| PATCH  | `/api/fashion/looks/:id/save`   | Toggle saved state       |
| GET    | `/api/fashion/brands`           | Trending brands          |

### Music
| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| GET    | `/api/music/stats`              | Streams, genres, player  |
| GET    | `/api/music/tracks`             | Chart tracks             |
| POST   | `/api/music/tracks`             | Add track                |
| PATCH  | `/api/music/stats/now-playing`  | Update now-playing state |
| GET    | `/api/music/podcasts`           | Podcast list             |

---

## Angular Architecture Highlights

- **Standalone components** — zero NgModules, tree-shakeable by default
- **Signals** (`signal()`, `signal.update()`) for reactive local state  
- **Lazy-loaded routes** — each page is a separate JS chunk  
- **`inject()` function** — functional dependency injection  
- **`@for` / `@if` control flow** — Angular 17+ template syntax  
- **SCSS with BEM** — encapsulated component styles + global design tokens  
- **Typed HTTP client** — fully typed `ApiService` with TypeScript interfaces  

---

## Production Build

```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run build
# Output in frontend/dist/nexus-dashboard-ui/
# Serve with any static file server (nginx, serve, etc.)
```

---

## Environment Variables

| Variable      | Default                                    | Description        |
|---------------|--------------------------------------------|--------------------|
| `PORT`        | `3000`                                     | Express port       |
| `MONGODB_URI` | `mongodb://localhost:27017/nexus_dashboard`| MongoDB connection |
| `NODE_ENV`    | `development`                              | Environment mode   |
